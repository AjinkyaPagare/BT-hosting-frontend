import { useEffect, useRef, useState, useCallback } from 'react';

export interface FriendRequest {
    id: string;
    requester_id: string;
    requester_name: string;
    requester_email: string;
    receiver_id: string;
    receiver_name: string;
    receiver_email: string;
    status: 'pending' | 'accepted' | 'blocked';
    created_at: string;
    updated_at: string;
}

export interface FriendNotification {
    type: 'friend_request_received' | 'friend_request_accepted' | 'friend_blocked';
    payload: {
        request_id?: string;
        requester_id?: string;
        requester_name?: string;
        requester_email?: string;
        acceptor_id?: string;
        acceptor_name?: string;
        blocked_user_id?: string;
        blocker_name?: string;
        created_at?: string;
        accepted_at?: string;
    };
}

interface IncomingCall {
    call_id: string;
    caller_id: string;
    caller_name: string;
}

interface UseNotificationsState {
    pendingRequests: FriendRequest[];
    sentRequests: FriendRequest[];
    friends: FriendRequest[];
    blockedUsers: FriendRequest[];
    notifications: FriendNotification[];
    incomingCall: IncomingCall | null;
}

export const useFriendNotifications = (token: string) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [state, setState] = useState<UseNotificationsState>({
        pendingRequests: [],
        sentRequests: [],
        friends: [],
        blockedUsers: [],
        notifications: [],
        incomingCall: null,
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/friends-notifications?token=${token}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('✅ Friend notifications WebSocket connected');
            setIsConnected(true);
            // Send initial ping to confirm connection
            ws.send(JSON.stringify({ type: 'ping' }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('📩 Friend notification:', message);

            switch (message.type) {
                case 'connection_ack':
                    console.log('Friend notifications connected');
                    break;

                case 'pong':
                    // Keep-alive response
                    break;

                case 'friend_request_received':
                    setState((prev) => ({
                        ...prev,
                        notifications: [...prev.notifications, message],
                        pendingRequests: [
                            ...prev.pendingRequests,
                            {
                                id: message.payload.request_id,
                                requester_id: message.payload.requester_id,
                                requester_name: message.payload.requester_name,
                                requester_email: message.payload.requester_email || '',
                                receiver_id: '',
                                receiver_name: '',
                                receiver_email: '',
                                status: 'pending',
                                created_at: message.payload.created_at,
                                updated_at: message.payload.created_at,
                            },
                        ],
                    }));
                    break;

                case 'friend_request_accepted':
                    setState((prev) => ({
                        ...prev,
                        notifications: [...prev.notifications, message],
                        sentRequests: prev.sentRequests.filter(
                            (req) => req.id !== message.payload.request_id
                        ),
                        friends: [
                            ...prev.friends,
                            {
                                id: message.payload.request_id,
                                requester_id: '',
                                requester_name: '',
                                requester_email: '',
                                receiver_id: message.payload.acceptor_id,
                                receiver_name: message.payload.acceptor_name,
                                receiver_email: '',
                                status: 'accepted',
                                created_at: '',
                                updated_at: message.payload.accepted_at,
                            },
                        ],
                    }));
                    break;

                case 'friend_blocked':
                    setState((prev) => ({
                        ...prev,
                        notifications: [...prev.notifications, message],
                        blockedUsers: [
                            ...prev.blockedUsers,
                            {
                                id: '',
                                requester_id: message.payload.blocked_user_id,
                                requester_name: message.payload.blocker_name,
                                requester_email: '',
                                receiver_id: '',
                                receiver_name: '',
                                receiver_email: '',
                                status: 'blocked',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            },
                        ],
                    }));
                    break;

                case 'incoming_call':
                    setState((prev) => ({
                        ...prev,
                        incomingCall: message.payload,
                    }));
                    break;

                case 'call_cancelled':
                    setState((prev) => ({
                        ...prev,
                        incomingCall: null,
                    }));
                    break;
            }
        };

        ws.onerror = (err) => {
            console.error('Friend notifications WebSocket error:', err);
            setError('WebSocket connection error');
        };

        ws.onclose = () => {
            console.log('🔴 Friend notifications WebSocket closed');
            setIsConnected(false);
        };

        wsRef.current = ws;

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [token]);

    const addNotification = useCallback((notification: FriendNotification) => {
        setState((prev) => ({
            ...prev,
            notifications: [...prev.notifications, notification],
        }));
    }, []);

    const clearNotifications = useCallback(() => {
        setState((prev) => ({
            ...prev,
            notifications: [],
        }));
    }, []);

    const setPendingRequests = useCallback((requests: FriendRequest[]) => {
        setState((prev) => ({
            ...prev,
            pendingRequests: requests,
        }));
    }, []);

    const setSentRequests = useCallback((requests: FriendRequest[]) => {
        setState((prev) => ({
            ...prev,
            sentRequests: requests,
        }));
    }, []);

    const setFriends = useCallback((friends: FriendRequest[]) => {
        setState((prev) => ({
            ...prev,
            friends,
        }));
    }, []);

    const setBlockedUsers = useCallback((users: FriendRequest[]) => {
        setState((prev) => ({
            ...prev,
            blockedUsers: users,
        }));
    }, []);

    return {
        isConnected,
        error,
        ...state,
        addNotification,
        clearNotifications,
        setPendingRequests,
        setSentRequests,
        setFriends,
        setBlockedUsers,
    };
};
