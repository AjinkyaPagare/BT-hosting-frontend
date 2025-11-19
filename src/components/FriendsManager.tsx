import React, { useEffect, useState } from 'react';
import { useFriendNotifications, FriendRequest } from '../hooks/useFriendNotifications';
import { friendsApi } from '../services/api';
import { UserPlus, UserCheck, UserX, Shield } from 'lucide-react';

interface FriendsManagerProps {
  token: string;
  currentUserId: string;
}

export const FriendsManager: React.FC<FriendsManagerProps> = ({ token, currentUserId }) => {
  const {
    isConnected,
    pendingRequests,
    sentRequests,
    friends,
    blockedUsers,
    notifications,
    setPendingRequests,
    setSentRequests,
    setFriends,
    setBlockedUsers,
  } = useFriendNotifications(token);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'friends' | 'blocked'>('pending');

  // Load initial data
  useEffect(() => {
    loadFriendData();
  }, []);

  const loadFriendData = async () => {
    try {
      setLoading(true);
      const [pending, sent, friendsList, blocked] = await Promise.all([
        friendsApi.getPendingRequests(),
        friendsApi.getSentRequests(),
        friendsApi.getFriendsList(),
        friendsApi.getBlockedList(),
      ]);

      setPendingRequests(pending.data);
      setSentRequests(sent.data);
      setFriends(friendsList.data);
      setBlockedUsers(blocked.data);
    } catch (err) {
      console.error('Failed to load friend data:', err);
      setError('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await friendsApi.acceptRequest(requestId);
      await loadFriendData();
    } catch (err) {
      console.error('Failed to accept request:', err);
      setError('Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await friendsApi.rejectRequest(requestId);
      await loadFriendData();
    } catch (err) {
      console.error('Failed to reject request:', err);
      setError('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (requestId: string) => {
    try {
      setLoading(true);
      await friendsApi.blockUser(requestId);
      await loadFriendData();
    } catch (err) {
      console.error('Failed to block user:', err);
      setError('Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  const renderPendingRequests = () => (
    <div className="space-y-4">
      {pendingRequests.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No pending requests</p>
      ) : (
        pendingRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{request.requester_name}</h4>
              <p className="text-sm text-gray-600">{request.requester_email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAcceptRequest(request.id)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <UserCheck size={18} />
                Accept
              </button>
              <button
                onClick={() => handleRejectRequest(request.id)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <UserX size={18} />
                Reject
              </button>
              <button
                onClick={() => handleBlockUser(request.id)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <Shield size={18} />
                Block
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSentRequests = () => (
    <div className="space-y-4">
      {sentRequests.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No sent requests</p>
      ) : (
        sentRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{request.receiver_name}</h4>
              <p className="text-sm text-gray-600">{request.receiver_email}</p>
            </div>
            <div className="flex items-center gap-2 text-yellow-700">
              <UserPlus size={18} />
              <span>Pending</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderFriends = () => (
    <div className="space-y-4">
      {friends.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No friends yet</p>
      ) : (
        friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">
                {friend.requester_name || friend.receiver_name}
              </h4>
              <p className="text-sm text-gray-600">
                {friend.requester_email || friend.receiver_email}
              </p>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <UserCheck size={18} />
              <span>Friends</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderBlockedUsers = () => (
    <div className="space-y-4">
      {blockedUsers.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No blocked users</p>
      ) : (
        blockedUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{user.requester_name}</h4>
              <p className="text-sm text-gray-600">{user.requester_email}</p>
            </div>
            <div className="flex items-center gap-2 text-red-700">
              <Shield size={18} />
              <span>Blocked</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Friends</h2>

      {/* Connection Status */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected to notifications' : 'Disconnected'}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          You have {notifications.length} new notification(s)
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['pending', 'sent', 'friends', 'blocked'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && pendingRequests.length > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-1">
                {pendingRequests.length}
              </span>
            )}
            {tab === 'sent' && sentRequests.length > 0 && (
              <span className="ml-2 bg-yellow-600 text-white text-xs rounded-full px-2 py-1">
                {sentRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        {activeTab === 'pending' && renderPendingRequests()}
        {activeTab === 'sent' && renderSentRequests()}
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'blocked' && renderBlockedUsers()}
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadFriendData}
        disabled={loading}
        className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
};

export default FriendsManager;
