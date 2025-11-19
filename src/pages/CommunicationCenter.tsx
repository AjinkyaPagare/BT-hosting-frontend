import React, { useState, useEffect } from 'react';
import { useFriendNotifications } from '@/hooks/useFriendNotifications';
import { useRealtimeCommunication } from '@/hooks/useRealtimeCommunication';
import { RealtimeCommunicationUI } from '@/components/RealtimeCommunicationUI';
import FriendsManager from '@/components/FriendsManager';
import { Phone, Users } from 'lucide-react';

/**
 * Main integration example showing how to use video calls and friend requests together
 */
export const CommunicationCenter: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    // Get auth data from localStorage
    React.useEffect(() => {
        const authToken = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (authToken) setToken(authToken);
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {
                console.error('Failed to parse user:', e);
            }
        }
    }, []);

    const notifications = useFriendNotifications(token || '');

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
    } = useRealtimeCommunication(token || '', user?.id || '', user?.name || '');

    /**
     * Initiate a video call with a friend
     */
    const handleInitiateCall = async (receiverId: string, receiverName: string) => {
        try {
            await startCall(receiverId, receiverName, 'video');
        } catch (error) {
            console.error('Failed to initiate call:', error);
            alert('Failed to start call. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <h1 className="text-3xl font-bold text-white">Communication Center</h1>
                    <p className="text-slate-400 mt-2">Video calls and friends management</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Incoming Call Overlay */}
                {incomingCall && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Incoming Call</h3>
                            <p className="text-gray-600 mb-6">{incomingCall.fromUser.name} is calling...</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => acceptCall(incomingCall.callType)}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={declineCall}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {status !== 'idle' && callId ? (
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
                ) : (
                    // Friends and Navigation
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Navigation Panel */}
                        <div className="lg:col-span-1">
                            <nav className="bg-slate-700 rounded-lg p-6 space-y-4 h-fit sticky top-8">
                                <h2 className="text-xl font-bold text-white mb-4">Menu</h2>

                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-blue-600 text-white"
                                >
                                    <Users size={20} />
                                    Friends & Requests
                                </button>

                                <div className="pt-4 border-t border-slate-600">
                                    <p className="text-sm text-slate-400 mb-2">Connection Status</p>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-3 h-3 rounded-full ${notifications.isConnected ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                        />
                                        <span className="text-sm text-slate-300">
                                            {notifications.isConnected
                                                ? 'Connected'
                                                : 'Disconnected'}
                                        </span>
                                    </div>
                                </div>

                                {/* Notification Badge */}
                                {(notifications.pendingRequests.length > 0 ||
                                    notifications.notifications.length > 0) && (
                                        <div className="pt-4 border-t border-slate-600">
                                            <p className="text-sm text-slate-400 mb-2">Notifications</p>
                                            <div className="bg-red-600/20 border border-red-600/50 rounded px-3 py-2">
                                                <p className="text-red-200 text-sm font-semibold">
                                                    {notifications.pendingRequests.length +
                                                        notifications.notifications.length}{' '}
                                                    new
                                                </p>
                                            </div>
                                        </div>
                                    )}
                            </nav>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3">
                            <div className="space-y-8">
                                <FriendsManager token={token || ''} currentUserId={user?.id || ''} />

                                {/* Quick Call Panel */}
                                {notifications.friends.length > 0 && (
                                    <div className="bg-slate-700 rounded-lg p-8">
                                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                            <Phone size={24} />
                                            Start a Call
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {notifications.friends.map((friend) => (
                                                <div
                                                    key={friend.id}
                                                    className="flex items-center justify-between p-4 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
                                                >
                                                    <div>
                                                        <h4 className="font-semibold text-white">
                                                            {friend.requester_name || friend.receiver_name}
                                                        </h4>
                                                        <p className="text-sm text-slate-300">
                                                            {friend.requester_email || friend.receiver_email}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            handleInitiateCall(
                                                                friend.requester_id || friend.receiver_id,
                                                                friend.requester_name || friend.receiver_name || 'User'
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        Call
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CommunicationCenter;

/**
 * Usage in App.tsx:
 * 
 * import { CommunicationCenter } from '@/pages/CommunicationCenter';
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/communication" element={<CommunicationCenter />} />
 *     </Routes>
 *   );
 * }
 */
