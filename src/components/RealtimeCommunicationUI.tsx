import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    Minimize2,
    Maximize2,
    Mic,
    MicOff,
    Phone,
    PhoneOff,
    Video,
    VideoOff,
    Phone as CallIcon,
} from 'lucide-react';

interface RealtimeCommunicationUIProps {
    callId: string | null;
    remoteUser: { id: string; name: string } | null;
    remoteStream: MediaStream | null;
    localStream: MediaStream | null;
    status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'busy' | 'no_answer';
    callType: 'audio' | 'video';
    isAudio: boolean;
    isVideo: boolean;
    callDuration: number;
    isConnected: boolean;
    error: string | null;
    incomingCall: { callId: string; fromUser: { id: string; name: string }; callType: 'audio' | 'video' } | null;
    onStartVideoCall: (receiverId: string, receiverName: string) => void;
    onStartAudioCall: (receiverId: string, receiverName: string) => void;
    onAcceptCall: (callType: 'audio' | 'video') => void;
    onDeclineCall: () => void;
    onEndCall: () => void;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
}

const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const getStatusMessage = (status: string, duration: number): string => {
    switch (status) {
        case 'calling':
            return 'Calling...';
        case 'ringing':
            return 'Ringing...';
        case 'connected':
            return formatDuration(duration);
        case 'ended':
            return 'Call ended';
        case 'declined':
            return 'Call declined';
        case 'busy':
            return 'User is busy';
        case 'no_answer':
            return 'No answer';
        default:
            return 'Idle';
    }
};

const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (!parts.length) return '?';
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
    return initials.join('') || '?';
};

export const RealtimeCommunicationUI: React.FC<RealtimeCommunicationUIProps> = ({
    callId,
    remoteUser,
    remoteStream,
    localStream,
    status,
    callType,
    isAudio,
    isVideo,
    callDuration,
    isConnected,
    error,
    incomingCall,
    onStartVideoCall,
    onStartAudioCall,
    onAcceptCall,
    onDeclineCall,
    onEndCall,
    onToggleAudio,
    onToggleVideo,
}) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [isFloating, setIsFloating] = useState(false);
    const [showLocalPreview, setShowLocalPreview] = useState(true);

    const statusMessage = useMemo(
        () => getStatusMessage(status, callDuration),
        [status, callDuration]
    );
    const remoteInitials = useMemo(() => getInitials(remoteUser?.name), [remoteUser?.name]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (status === 'idle') {
            setIsFloating(false);
        }
    }, [status]);

    // Incoming call modal
    if (incomingCall) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur">
                <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-[0_25px_50px_-12px_rgb(15,23,42,0.7)]">
                    <div className="absolute -top-14 left-1/2 w-28 -translate-x-1/2 transform rounded-full border border-blue-400/50 bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-xl">
                        <div className="flex h-24 items-center justify-center rounded-full bg-black/20 text-3xl font-semibold">
                            {getInitials(incomingCall.fromUser.name)}
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-sm uppercase tracking-[0.35em] text-blue-300">Incoming call</p>
                        <h3 className="mt-4 text-3xl font-semibold tracking-tight">
                            {incomingCall.fromUser.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-300">
                            {incomingCall.callType === 'video' ? 'Video call' : 'Audio call'} · Secure connection
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button
                            onClick={() => onAcceptCall(incomingCall.callType)}
                            className="group flex h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-1 hover:bg-emerald-500"
                        >
                            <Phone size={22} className="transition group-hover:rotate-12" />
                            Accept
                        </button>
                        <button
                            onClick={onDeclineCall}
                            className="group flex h-16 items-center justify-center gap-2 rounded-2xl bg-rose-500/90 font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-1 hover:bg-rose-500"
                        >
                            <PhoneOff size={22} className="transition group-hover:-rotate-12" />
                            Decline
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Active call view
    if (status !== 'idle' && callId) {
        if (isFloating) {
            return (
                <div className="fixed bottom-6 right-6 z-50 flex w-[280px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 shadow-[0_20px_45px_-15px_rgb(15,23,42,0.7)]">
                    <div className="flex items-center justify-between bg-slate-800/90 px-4 py-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">On call</p>
                            <p className="text-sm font-semibold text-white">{remoteUser?.name ?? 'Unknown user'}</p>
                        </div>
                        <button
                            onClick={() => setIsFloating(false)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700/70 text-slate-200 transition hover:bg-slate-600"
                            title="Expand call window"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>

                    {callType === 'video' ? (
                        <div className="relative h-40 bg-black">
                            {remoteStream ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold">
                                        {remoteInitials}
                                    </div>
                                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                        {statusMessage}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100">
                            <CallIcon size={32} />
                            <span className="text-sm font-medium text-slate-300">{statusMessage}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                        <button
                            onClick={onToggleAudio}
                            className={`flex h-11 items-center justify-center rounded-xl transition ${isAudio ? 'bg-emerald-500/90 text-white hover:bg-emerald-500' : 'bg-rose-500/90 text-white hover:bg-rose-500'}`}
                        >
                            {isAudio ? <Mic size={18} /> : <MicOff size={18} />}
                        </button>
                        {callType === 'video' && (
                            <button
                                onClick={() => setShowLocalPreview((prev) => !prev)}
                                className="flex h-11 items-center justify-center rounded-xl bg-slate-700/80 text-slate-200 transition hover:bg-slate-600"
                                title={showLocalPreview ? 'Hide self view' : 'Show self view'}
                            >
                                <Video size={18} />
                            </button>
                        )}
                        <button
                            onClick={onEndCall}
                            className="col-span-1 flex h-11 items-center justify-center rounded-xl bg-rose-500 text-white transition hover:bg-rose-600"
                        >
                            <PhoneOff size={18} />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-slate-950 text-white">
                <div className="relative flex flex-1 flex-col">
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-semibold">
                                {callType === 'video' ? <Video size={22} /> : remoteInitials}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Currently talking to</p>
                                <h2 className="text-xl font-semibold">{remoteUser?.name ?? 'Unknown user'}</h2>
                                <p className="text-sm text-slate-400">{statusMessage}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {error && (
                                <div className="flex items-center gap-2 rounded-xl border border-rose-500/70 bg-rose-500/10 px-3 py-2 text-rose-200">
                                    <AlertCircle size={16} />
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}
                            <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${isConnected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-200'}`}>
                                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {isConnected ? 'Live' : 'Reconnecting...'}
                            </span>
                            <button
                                onClick={() => setIsFloating(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/70 text-slate-200 transition hover:bg-slate-700"
                                title="Minimize call"
                            >
                                <Minimize2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex flex-1 flex-col gap-6 overflow-hidden p-6">
                        {callType === 'video' ? (
                            <>
                                <div className="relative flex h-full flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-black shadow-[0_45px_100px_-40px_rgb(14,116,144,0.55)]">
                                    {remoteStream ? (
                                        <video
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-3xl font-semibold">
                                                {remoteInitials}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-semibold text-white">{remoteUser?.name}</p>
                                                <p className="text-sm text-slate-400">{status === 'calling' ? 'Waiting for them to answer…' : 'Connecting...'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {showLocalPreview && (
                                        <div className="absolute bottom-6 right-6 w-60 overflow-hidden rounded-2xl border border-slate-700 bg-black/70 shadow-[0_20px_50px_-20px_rgb(15,23,42,0.7)]">
                                            {localStream ? (
                                                <video
                                                    ref={localVideoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="h-40 w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-40 items-center justify-center bg-slate-900 text-sm text-slate-400">
                                                    Preparing camera…
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between bg-black/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                                                <span>You</span>
                                                <button
                                                    onClick={() => setShowLocalPreview(false)}
                                                    className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400 hover:text-slate-100"
                                                >
                                                    Hide
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                                <div className="absolute inset-0 opacity-40">
                                    <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/30 blur-3xl" />
                                    <div className="absolute -bottom-32 right-1/2 h-64 w-64 translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
                                </div>
                                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-4xl font-semibold text-white shadow-[0_20px_50px_-20px_rgb(59,130,246,0.7)]">
                                    {remoteInitials}
                                </div>
                                <h3 className="relative mt-6 text-3xl font-semibold">{remoteUser?.name}</h3>
                                <p className="relative text-lg text-slate-300">{statusMessage}</p>
                                {status === 'connected' && (
                                    <div className="relative mt-10 flex items-center gap-10 text-slate-300">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs uppercase tracking-[0.3em]">Mic</span>
                                            <div className={`mt-3 flex h-12 w-12 items-center justify-center rounded-full ${isAudio ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}>
                                                {isAudio ? <Mic size={22} /> : <MicOff size={22} />}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs uppercase tracking-[0.3em]">Mode</span>
                                            <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700/60">
                                                <CallIcon size={22} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-shrink-0 items-center justify-center gap-5 border-t border-slate-800 bg-slate-900/70 px-8 py-6 backdrop-blur">
                        <button
                            onClick={onToggleAudio}
                            className={`group flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition hover:-translate-y-1 ${isAudio ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40' : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/40'}`}
                            title={isAudio ? 'Mute microphone' : 'Unmute microphone'}
                        >
                            {isAudio ? <Mic size={26} /> : <MicOff size={26} />}
                        </button>
                        {callType === 'video' && (
                            <button
                                onClick={onToggleVideo}
                                className={`group flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition hover:-translate-y-1 ${isVideo ? 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/40' : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/40'}`}
                                title={isVideo ? 'Turn camera off' : 'Turn camera on'}
                            >
                                {isVideo ? <Video size={26} /> : <VideoOff size={26} />}
                            </button>
                        )}
                        {callType === 'video' && !showLocalPreview && (
                            <button
                                onClick={() => setShowLocalPreview(true)}
                                className="group flex h-16 w-16 items-center justify-center rounded-full bg-slate-700 text-slate-200 shadow-lg shadow-slate-800/40 transition hover:-translate-y-1 hover:bg-slate-600"
                                title="Show self view"
                            >
                                <Video size={24} />
                            </button>
                        )}
                        <button
                            onClick={onEndCall}
                            className="group flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/40 transition hover:-translate-y-1 hover:bg-rose-400"
                            title="End call"
                        >
                            <PhoneOff size={28} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Idle state (should show contacts/friends to call)
    return null;
};

export default RealtimeCommunicationUI;
