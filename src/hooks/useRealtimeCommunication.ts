import { useEffect, useRef, useState, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { integrationService } from '../services/integrationService';
import { videoCallsApi } from '../services/api';

type CallType = 'audio' | 'video';
type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'busy' | 'no_answer';

interface CallState {
    callId: string | null;
    callType: CallType;
    status: CallStatus;
    remoteStream: MediaStream | null;
    localStream: MediaStream | null;
    isAudio: boolean;
    isVideo: boolean;
    remoteUser: { id: string; name: string } | null;
    callDuration: number;
    isInitiator: boolean;
}

interface IceCandidate {
    candidate: string;
    sdpMLineIndex: number;
    sdpMid: string;
}

export const useRealtimeCommunication = (
    token: string | null,
    userId: string | null,
    currentUserName: string | null
) => {
    const wsRef = useRef<WebSocket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [callState, setCallState] = useState<CallState>({
        callId: null,
        callType: 'video',
        status: 'idle',
        remoteStream: null,
        localStream: null,
        isAudio: true,
        isVideo: true,
        remoteUser: null,
        callDuration: 0,
        isInitiator: false,
    });

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [incomingCall, setIncomingCall] = useState<{
        callId: string;
        fromUser: { id: string; name: string };
        callType: CallType;
    } | null>(null);

    const callStateRef = useRef(callState);

    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    const handleMediaAccessError = useCallback((err: unknown) => {
        let errorMsg = 'Failed to access camera or microphone';

        if (err instanceof DOMException) {
            if (
                err.name === 'NotAllowedError' ||
                err.name === 'PermissionDeniedError' ||
                err.name === 'SecurityError'
            ) {
                errorMsg = 'Camera/Mic access was blocked. Please allow permissions and try again.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMsg = 'No camera or microphone detected. Connect a device and retry.';
            }
        } else if (err instanceof Error) {
            errorMsg = err.message;
        }

        setError(errorMsg);
        console.error('Media access error:', err);
        setCallState((prev) => ({
            ...prev,
            localStream: null,
            isAudio: false,
            isVideo: false,
        }));
    }, []);

    // Initialize peer connection
    const initializePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: ['stun:stun.l.google.com:19302'] },
                { urls: ['stun:stun1.l.google.com:19302'] },
                { urls: ['stun:stun2.l.google.com:19302'] },
                { urls: ['stun:stun3.l.google.com:19302'] },
                { urls: ['stun:stun4.l.google.com:19302'] },
            ],
        });

        // Handle remote track
        peerConnection.ontrack = (event) => {
            console.log('✅ Received remote track:', event.track.kind);
            setCallState((prev) => ({
                ...prev,
                remoteStream: event.streams[0],
            }));
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const activeCallId = callStateRef.current.callId;
                if (!activeCallId) {
                    console.warn('Skipping ICE candidate send: missing call ID');
                    return;
                }

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                        JSON.stringify({
                            type: 'ice_candidate',
                            payload: {
                                call_id: activeCallId,
                                candidate: event.candidate.candidate,
                                sdpMLineIndex: event.candidate.sdpMLineIndex,
                                sdpMid: event.candidate.sdpMid,
                            },
                        })
                    );
                }
            }
        };

        // Handle connection state
        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
                endCall();
            }
        };

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    }, []);

    // Start local media
    const startLocalMedia = useCallback(
        async (audioOnly: boolean = false) => {
            const requestStream = async (constraints: MediaStreamConstraints) => {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                setCallState((prev) => ({
                    ...prev,
                    localStream: stream,
                    isAudio: constraints.audio ? true : prev.isAudio,
                    isVideo: !!constraints.video && typeof constraints.video !== 'boolean',
                }));

                if (peerConnectionRef.current) {
                    stream.getTracks().forEach((track) => {
                        peerConnectionRef.current!.addTrack(track, stream);
                    });
                }

                return stream;
            };

            try {
                const videoConstraints: MediaStreamConstraints = audioOnly
                    ? { audio: true, video: false }
                    : { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } };

                return await requestStream(videoConstraints);
            } catch (err) {
                const domError = err as DOMException;
                const blockedByPermissions =
                    domError instanceof DOMException &&
                    (domError.name === 'NotAllowedError' || domError.name === 'SecurityError');

                if (!audioOnly && blockedByPermissions) {
                    console.warn('Video permissions denied. Falling back to audio-only call.');
                    try {
                        const fallbackStream = await requestStream({ audio: true, video: false });
                        setError('Camera access blocked. Continuing with audio-only.');
                        setCallState((prev) => ({
                            ...prev,
                            isVideo: false,
                        }));
                        return fallbackStream;
                    } catch (fallbackErr) {
                        handleMediaAccessError(fallbackErr);
                        throw fallbackErr;
                    }
                }

                handleMediaAccessError(err);
                throw err;
            }
        },
        [handleMediaAccessError]
    );

    // Create offer
    const createOffer = useCallback(async () => {
        try {
            const pc = peerConnectionRef.current;
            if (!pc) throw new Error('Peer connection not initialized');

            const activeCallId = callStateRef.current.callId;
            if (!activeCallId) {
                throw new Error('Missing call ID for offer');
            }

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        type: 'offer',
                        payload: { call_id: activeCallId, sdp: offer.sdp, type: offer.type },
                    })
                );
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to create offer';
            setError(errorMsg);
        }
    }, []);

    // Create answer
    const createAnswer = useCallback(async (offerSdp: string) => {
        try {
            const pc = peerConnectionRef.current;
            if (!pc) throw new Error('Peer connection not initialized');

            const activeCallId = callStateRef.current.callId;
            if (!activeCallId) {
                throw new Error('Missing call ID for answer');
            }

            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerSdp }));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        type: 'answer',
                        payload: { call_id: activeCallId, sdp: answer.sdp, type: answer.type },
                    })
                );
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to create answer';
            setError(errorMsg);
        }
    }, []);

    // Handle remote answer
    const handleRemoteAnswer = useCallback(async (answerSdp: string) => {
        try {
            const pc = peerConnectionRef.current;
            if (!pc) throw new Error('Peer connection not initialized');

            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
        } catch (err) {
            console.error('Handle answer error:', err);
        }
    }, []);

    // Handle ICE candidate
    const handleIceCandidate = useCallback(async (candidate: IceCandidate) => {
        try {
            const pc = peerConnectionRef.current;
            if (!pc) throw new Error('Peer connection not initialized');

            await pc.addIceCandidate(
                new RTCIceCandidate({
                    candidate: candidate.candidate,
                    sdpMLineIndex: candidate.sdpMLineIndex,
                    sdpMid: candidate.sdpMid,
                })
            );
        } catch (err) {
            console.error('ICE candidate error:', err);
        }
    }, []);

    // Connect WebSocket
    useEffect(() => {
        if (!token || !userId) {
            console.warn('Token or userId not available, skipping WebSocket connection');
            setError('Missing authentication credentials');
            return;
        }

        const wsUrl = integrationService.websocket.getWebSocketUrl(userId);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('✅ Communication WebSocket connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'incoming_call':
                    setIncomingCall({
                        callId: message.payload.call_id,
                        fromUser: {
                            id: message.payload.caller_id,
                            name: message.payload.caller_name,
                        },
                        callType: message.payload.call_type,
                    });
                    break;

                case 'call_ringing':
                    setCallState((prev) => ({
                        ...prev,
                        status: 'ringing',
                        callId: message.payload?.call_id ?? prev.callId,
                    }));
                    break;

                case 'call_accepted':
                    setCallState((prev) => ({
                        ...prev,
                        status: 'connected',
                        callId: message.payload?.call_id ?? prev.callId,
                    }));
                    if (!peerConnectionRef.current) {
                        initializePeerConnection();
                    }
                    if (!callStateRef.current.localStream) {
                        startLocalMedia(callStateRef.current.callType === 'audio').catch(handleMediaAccessError);
                    }
                    break;

                case 'participants_ready':
                    setCallState((prev) => ({
                        ...prev,
                        status: 'connected',
                        callId: message.payload?.call_id ?? prev.callId,
                    }));
                    if (callStateRef.current.isInitiator) {
                        console.log('Participants ready; initiating offer');
                        createOffer();
                    } else {
                        console.log('Participants ready; waiting for offer');
                    }
                    break;

                case 'offer':
                    if (!message.payload?.call_id || message.payload.call_id !== callStateRef.current.callId) {
                        console.warn('Ignoring offer for non-active call', message.payload?.call_id);
                        break;
                    }
                    createAnswer(message.payload.sdp);
                    break;

                case 'answer':
                    if (!message.payload?.call_id || message.payload.call_id !== callStateRef.current.callId) {
                        console.warn('Ignoring answer for non-active call', message.payload?.call_id);
                        break;
                    }
                    handleRemoteAnswer(message.payload.sdp);
                    break;

                case 'ice_candidate':
                    if (!message.payload?.call_id || message.payload.call_id !== callStateRef.current.callId) {
                        console.warn('Ignoring ICE for non-active call', message.payload?.call_id);
                        break;
                    }
                    handleIceCandidate(message.payload);
                    break;

                case 'call_ended':
                    endCall();
                    break;

                case 'call_declined':
                    setCallState((prev) => {
                        prev.localStream?.getTracks().forEach((track) => track.stop());
                        return {
                            ...prev,
                            status: 'declined',
                            callId: null,
                            localStream: null,
                            remoteStream: null,
                            callDuration: 0,
                            isInitiator: false,
                        };
                    });
                    setTimeout(() =>
                        setCallState((prev) => ({
                            ...prev,
                            status: prev.status === 'declined' ? 'idle' : prev.status,
                        })), 1500);
                    break;

                case 'call_busy':
                    setCallState((prev) => ({ ...prev, status: 'busy' }));
                    setTimeout(() => setCallState((prev) => ({ ...prev, status: 'idle' })), 2000);
                    break;

                case 'no_answer':
                    setCallState((prev) => ({ ...prev, status: 'no_answer' }));
                    setTimeout(() => setCallState((prev) => ({ ...prev, status: 'idle' })), 2000);
                    break;
            }
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError('WebSocket connection error');
        };

        ws.onclose = () => {
            console.log('🔴 WebSocket closed');
            setIsConnected(false);
        };

        wsRef.current = ws;

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [token, userId]);

    // Start call
    const startCall = useCallback(
        async (receiverId: string, receiverName: string, callType: CallType = 'video') => {
            let newCallId: string | null = null;

            const cleanup = () => {
                peerConnectionRef.current?.close();
                peerConnectionRef.current = null;

                setCallState((prev) => {
                    prev.localStream?.getTracks().forEach((track) => track.stop());
                    return {
                        ...prev,
                        status: 'idle',
                        callId: null,
                        localStream: null,
                        remoteStream: null,
                        callDuration: 0,
                        isInitiator: false,
                    };
                });
            };

            try {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                    throw new Error('WebSocket is not connected');
                }

                const response = await videoCallsApi.initiateCall({
                    receiver_id: receiverId,
                    call_type: callType,
                });

                newCallId = response.data.id;

                setCallState((prev) => ({
                    ...prev,
                    callId: newCallId,
                    callType,
                    status: 'calling',
                    remoteUser: { id: receiverId, name: receiverName },
                    isInitiator: true,
                }));

                initializePeerConnection();

                wsRef.current.send(
                    JSON.stringify({
                        type: 'initiate_call',
                        payload: {
                            call_id: newCallId,
                            receiver_id: receiverId,
                            receiver_name: receiverName,
                            caller_name: currentUserName || 'User',
                            call_type: callType,
                        },
                    })
                );

                try {
                    await startLocalMedia(callType === 'audio');
                } catch (mediaErr) {
                    console.warn('Local media setup failed, continuing without local stream.', mediaErr);
                }
            } catch (err) {
                const axiosError = err as AxiosError | undefined;
                const statusCode = axiosError?.response?.status;
                const responseData = axiosError?.response?.data;
                const detailPayload =
                    typeof responseData === 'object' && responseData !== null
                        ? (('detail' in responseData ? (responseData as any).detail : responseData) as
                              | { call_id?: string; message?: string; status?: string }
                              | undefined)
                        : undefined;

                if (statusCode === 409) {
                    const message =
                        detailPayload?.message ??
                        'An active call already exists between you and this user. We will close it and you can try again.';
                    setError(message);

                    if (detailPayload?.call_id) {
                        videoCallsApi.endCall(detailPayload.call_id).catch(() => undefined);
                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(
                                JSON.stringify({
                                    type: 'end_call',
                                    payload: { call_id: detailPayload.call_id },
                                })
                            );
                        }
                    }
                } else if (statusCode === 404) {
                    setError('The participant is no longer available for calls.');
                } else if (err instanceof DOMException) {
                    // Already handled inside startLocalMedia
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Failed to start call');
                }

                if (newCallId) {
                    videoCallsApi.endCall(newCallId).catch(() => undefined);
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(
                            JSON.stringify({
                                type: 'end_call',
                                payload: { call_id: newCallId },
                            })
                        );
                    }
                }

                cleanup();
            }
        },
        [initializePeerConnection, startLocalMedia, currentUserName]
    );

    // Accept call
    const acceptCall = useCallback(
        async (callType?: CallType) => {
            if (!incomingCall) return;

            const callId = incomingCall.callId;
            const resolvedCallType = callType ?? incomingCall.callType;

            const cleanup = () => {
                peerConnectionRef.current?.close();
                peerConnectionRef.current = null;

                setCallState((prev) => {
                    prev.localStream?.getTracks().forEach((track) => track.stop());
                    return {
                        ...prev,
                        status: 'idle',
                        callId: null,
                        localStream: null,
                        remoteStream: null,
                        callDuration: 0,
                    };
                });
            };

            let canProceed = false;
            let detailMessage: string | undefined;

            try {
                await videoCallsApi.acceptCall(callId);
                canProceed = true;
            } catch (err) {
                const axiosError = err as AxiosError | undefined;
                const statusCode = axiosError?.response?.status;
                const responseData = axiosError?.response?.data;
                const detailPayload =
                    typeof responseData === 'object' && responseData !== null
                        ? (('detail' in responseData ? (responseData as any).detail : responseData) as
                              | { call_id?: string; message?: string; status?: string }
                              | string
                              | undefined)
                        : undefined;

                detailMessage =
                    typeof detailPayload === 'string'
                        ? detailPayload
                        : detailPayload?.message ?? detailPayload?.status ?? undefined;

                const alreadyAccepted =
                    statusCode === 409 &&
                    typeof detailMessage === 'string' &&
                    detailMessage.toLowerCase().includes('status: callstatus.accepted');

                if (alreadyAccepted) {
                    canProceed = true;
                } else {
                    if (statusCode === 409) {
                        setError(detailMessage ?? 'This call is no longer available to accept.');
                    } else if (statusCode === 404) {
                        setError('Call not found or already ended.');
                    } else if (err instanceof DOMException) {
                        // Already handled by startLocalMedia
                    } else if (err instanceof Error) {
                        setError(err.message);
                    } else {
                        setError('Failed to accept call');
                    }

                    const targetCallId =
                        (typeof detailPayload === 'object' && detailPayload && 'call_id' in detailPayload
                            ? (detailPayload as { call_id?: string }).call_id
                            : undefined) ?? callId;

                    videoCallsApi.endCall(targetCallId).catch(() => undefined);
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(
                            JSON.stringify({
                                type: 'end_call',
                                payload: { call_id: targetCallId },
                            })
                        );
                    }

                    setIncomingCall(null);
                    cleanup();
                    return;
                }
            }

            if (!canProceed) {
                return;
            }

            setCallState((prev) => ({
                ...prev,
                callId,
                callType: resolvedCallType,
                status: 'connected',
                remoteUser: incomingCall.fromUser,
                isInitiator: false,
            }));

            initializePeerConnection();

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        type: 'accept_call',
                        payload: {
                            call_id: callId,
                            call_type: resolvedCallType,
                        },
                    })
                );
            }

            try {
                await startLocalMedia(resolvedCallType === 'audio');
            } catch (mediaErr) {
                console.warn('Local media setup failed during acceptCall, continuing without local stream.', mediaErr);
            }

            setIncomingCall(null);
        },
        [incomingCall, initializePeerConnection, startLocalMedia]
    );

    // Decline call
    const declineCall = useCallback(async () => {
        if (!incomingCall) {
            return;
        }

        const { callId } = incomingCall;

        try {
            await videoCallsApi.declineCall(callId);
        } catch (err) {
            console.error('Failed to decline call via API:', err);
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: 'decline_call',
                    payload: { call_id: callId },
                })
            );
        }

        setIncomingCall(null);
        setCallState((prev) => ({
            ...prev,
            status: 'declined',
            callId: prev.callId === callId ? null : prev.callId,
        }));
        setTimeout(() => {
            setCallState((prev) => ({
                ...prev,
                status: prev.status === 'declined' ? 'idle' : prev.status,
            }));
        }, 1500);
    }, [incomingCall]);

    // End call
    const performCleanup = useCallback((finalStatus: CallStatus = 'ended') => {
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        setCallState((prev) => {
            prev.localStream?.getTracks().forEach((track) => track.stop());
            return {
                ...prev,
                status: finalStatus,
                callId: null,
                localStream: null,
                remoteStream: null,
                callDuration: 0,
                isInitiator: false,
            };
        });

        setIncomingCall(null);
    }, []);

    const endCall = useCallback(
        (overrideCallId?: string, finalStatus: CallStatus = 'ended') => {
            const currentCallId = overrideCallId ?? callStateRef.current.callId ?? callState.callId;

            if (currentCallId) {
                videoCallsApi.endCall(currentCallId).catch((err) => {
                    console.error('Failed to end call via API:', err);
                });

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                        JSON.stringify({
                            type: 'end_call',
                            payload: { call_id: currentCallId },
                        })
                    );
                }
            }

            performCleanup(finalStatus);
        },
        [performCleanup, callState.callId]
    );

    // Toggle audio
    const toggleAudio = useCallback(() => {
        callState.localStream?.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setCallState((prev) => ({ ...prev, isAudio: !prev.isAudio }));
    }, [callState.localStream]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        callState.localStream?.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setCallState((prev) => ({ ...prev, isVideo: !prev.isVideo }));
    }, [callState.localStream]);

    // Call duration timer
    useEffect(() => {
        if (callState.status === 'connected') {
            durationIntervalRef.current = setInterval(() => {
                setCallState((prev) => ({
                    ...prev,
                    callDuration: prev.callDuration + 1,
                }));
            }, 1000);
        } else if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
        };
    }, [callState.status]);

    return {
        ...callState,
        isConnected,
        error,
        incomingCall,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleAudio,
        toggleVideo,
    };
};
