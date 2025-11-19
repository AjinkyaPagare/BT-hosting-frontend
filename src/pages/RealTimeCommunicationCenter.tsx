import React, { useState, useEffect } from 'react';
import { useRealtimeCommunication } from '../hooks/useRealtimeCommunication';
import { useFriendNotifications } from '../hooks/useFriendNotifications';
import { integrationService } from '../services/integrationService';
import { RealtimeCommunicationUI } from '../components/RealtimeCommunicationUI';
import { Phone, Video, Users, MessageCircle, AlertCircle } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    status?: 'online' | 'offline' | 'busy';
}

interface Friend {
    friend_id: string;
    name: string;
    email: string;
    status?: 'online' | 'offline' | 'busy';
}

export const RealTimeCommunicationCenter: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    // Get token and user from localStorage/context
    useEffect(() => {
        try {
            const authToken = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!authToken) {
                setAuthError('No authentication token found. Please login first.');
                setLoading(false);
                return;
            }

            setToken(authToken);

            if (userStr) { 
                try {
                    const user = JSON.parse(userStr);
                    setCurrentUser(user);
                } catch (e) {
                    console.error('Failed to parse user:', e);
                    setAuthError('Failed to parse user information.');
                }
            } else {
                setAuthError('User information not found.');
            }
        } catch (e) {
            console.error('Auth setup error:', e);
            setAuthError('Authentication setup failed.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch friends list
    useEffect(() => {
        if (token && currentUser) {
            loadFriends();
        }
    }, [token, currentUser]);

    const loadFriends = async () => {
        try {
            const friendsList = await integrationService.friends.getList();
            setFriends(friendsList);
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    };

    const {
        callId,
        status,
        remoteUser,
        localStream,
        remoteStream,
        callType,
        isAudio,
        isVideo,
        callDuration,
        isConnected,
        error,
        incomingCall,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleAudio,
        toggleVideo,
    } = useRealtimeCommunication(
        token || '',
        currentUser?.id || '',
        currentUser?.name || ''
    );

    const notifications = useFriendNotifications(token || '');

    // Show call UI if in active call
    if (status !== 'idle' && callId) {
        return (
            <RealtimeCommunicationUI
                callId={callId}
                remoteUser={remoteUser}
                remoteStream={remoteStream}
                localStream={localStream}
                status={status}
                callType={callType}
                isAudio={isAudio}
                isVideo={isVideo}
                callDuration={callDuration}
                isConnected={isConnected}
                error={error}
                incomingCall={incomingCall}
                onStartVideoCall={() => { }}
                onStartAudioCall={() => { }}
                onAcceptCall={acceptCall}
                onDeclineCall={declineCall}
                onEndCall={endCall}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 animate-spin" />
                    <p className="text-white text-lg">Loading communication center...</p>
                </div>
            </div>
        );
    }

    if (authError || !token || !currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center bg-red-600/20 border border-red-600 rounded-lg p-8 max-w-md">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h1>
                    <p className="text-white mb-6">{authError || 'Authentication failed. Please login again.'}</p>
                    <a href="/login" className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="bg-gray-800/50 backdrop-blur border-b border-gray-700 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                                <Phone className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Communication Center</h1>
                                <p className="text-sm text-gray-400">Real-time video & audio calls</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                />
                                <span className="text-sm text-gray-300">
                                    {isConnected ? 'Connected' : 'Connecting...'}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-semibold">{currentUser?.name}</p>
                                <p className="text-xs text-gray-400">{currentUser?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar - Friends List */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 sticky top-24">
                            <div className="flex items-center gap-2 mb-6">
                                <Users size={24} className="text-blue-500" />
                                <h2 className="text-xl font-bold text-white">Friends</h2>
                                {notifications.pendingRequests.length > 0 && (
                                    <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-2 py-1">
                                        {notifications.pendingRequests.length}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {friends.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No friends yet</p>
                                ) : (
                                    friends.map((friend) => (
                                        <div
                                            key={friend.friend_id}
                                            className={`p-4 rounded-lg cursor-pointer transition-all ${selectedFriend?.friend_id === friend.friend_id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                                                }`}
                                            onClick={() => setSelectedFriend(friend)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{friend.name}</p>
                                                    <p className="text-xs opacity-75 truncate">{friend.email}</p>
                                                </div>
                                                <div className={`w-3 h-3 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                                                    }`} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pending Requests */}
                            {notifications.pendingRequests.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-600">
                                    <h3 className="text-sm font-bold text-white mb-4">Friend Requests</h3>
                                    <div className="space-y-2">
                                        {notifications.pendingRequests.slice(0, 3).map((req) => (
                                            <div key={req.id} className="bg-yellow-600/20 border border-yellow-600/50 rounded p-3">
                                                <p className="text-sm font-semibold text-white">{req.requester_name}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <button className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                                                        Accept
                                                    </button>
                                                    <button className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {selectedFriend ? (
                            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-8">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-2">{selectedFriend.name}</h2>
                                        <p className="text-gray-400">{selectedFriend.email}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <div className={`w-3 h-3 rounded-full ${selectedFriend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                                                }`} />
                                            <span className="text-sm text-gray-400">
                                                {selectedFriend.status === 'online' ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Video Call Button */}
                                    <button
                                        onClick={() => startCall(selectedFriend.friend_id, selectedFriend.name, 'video')}
                                        disabled={status !== 'idle'}
                                        className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                                    >
                                        <Video size={24} />
                                        Start Video Call
                                    </button>

                                    {/* Audio Call Button */}
                                    <button
                                        onClick={() => startCall(selectedFriend.friend_id, selectedFriend.name, 'audio')}
                                        disabled={status !== 'idle'}
                                        className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                                    >
                                        <Phone size={24} />
                                        Start Audio Call
                                    </button>

                                    {/* Message Button */}
                                    <button
                                        className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all transform hover:scale-105 col-span-2"
                                    >
                                        <MessageCircle size={24} />
                                        Send Message
                                    </button>
                                </div>

                                {/* Call Status */}
                                {status !== 'idle' && (
                                    <div className="mt-8 p-4 bg-blue-600/20 border border-blue-600/50 rounded-lg">
                                        <p className="text-blue-200">
                                            {status === 'calling' && 'Calling...'}
                                            {status === 'connected' && `In ${callType} call (${Math.floor(callDuration / 60)}m ${callDuration % 60}s)`}
                                            {status === 'ringing' && 'Incoming call...'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-12 text-center">
                                <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No Friend Selected</h3>
                                <p className="text-gray-400">Select a friend from the list to start a call or send a message</p>
                            </div>
                        )}

                        {/* Call Status Info */}
                        {incomingCall && status === 'idle' && (
                            <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-6">
                                <p className="text-white font-semibold mb-4">
                                    Incoming {incomingCall.callType} call from {incomingCall.fromUser.name}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => acceptCall(incomingCall.callType)}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={declineCall}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RealTimeCommunicationCenter;
