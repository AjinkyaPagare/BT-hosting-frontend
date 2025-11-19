/**
 * Integration Service
 * Manages backend-frontend communication for friends, calls, and real-time features
 */

import api, { friendsApi, videoCallsApi, BASE_URL, tokenStorage, ACCESS_TOKEN_KEY } from './api';

export interface Friend {
    friend_id: string;
    name: string;
    email: string;
    status: 'online' | 'offline' | 'busy';
    last_seen?: string;
    avatar?: string;
}

export interface FriendRequest {
    id: string;
    requester_id: string;
    requester_name: string;
    requester_email: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
    created_at: string;
    updated_at?: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'online' | 'offline' | 'busy';
}

/**
 * Integration Service - Main API communication hub
 */
export const integrationService = {
    /**
     * Initialize connection and fetch user data
     */
    async initializeUser(): Promise<UserProfile | null> {
        try {
            const token = tokenStorage.get(ACCESS_TOKEN_KEY);
            if (!token) {
                console.error('No authentication token found');
                return null;
            }

            // Fetch current user profile
            const response = await api.get('/users/me');
            return response.data as UserProfile;
        } catch (error) {
            console.error('Failed to initialize user:', error);
            return null;
        }
    },

    /**
     * Friends Management
     */
    friends: {
        /**
         * Get all friends for current user
         */
        async getList(): Promise<Friend[]> {
            try {
                const response = await friendsApi.getFriendsList();
                return response.data as Friend[];
            } catch (error) {
                console.error('Failed to load friends list:', error);
                return [];
            }
        },

        /**
         * Get pending friend requests
         */
        async getPendingRequests(): Promise<FriendRequest[]> {
            try {
                const response = await friendsApi.getPendingRequests();
                return response.data as FriendRequest[];
            } catch (error) {
                console.error('Failed to load pending requests:', error);
                return [];
            }
        },

        /**
         * Get sent friend requests
         */
        async getSentRequests(): Promise<FriendRequest[]> {
            try {
                const response = await friendsApi.getSentRequests();
                return response.data as FriendRequest[];
            } catch (error) {
                console.error('Failed to load sent requests:', error);
                return [];
            }
        },

        /**
         * Send friend request to another user
         */
        async sendRequest(userId: string): Promise<boolean> {
            try {
                await friendsApi.sendRequest(userId);
                console.log(`Friend request sent to ${userId}`);
                return true;
            } catch (error) {
                console.error('Failed to send friend request:', error);
                return false;
            }
        },

        /**
         * Accept friend request
         */
        async acceptRequest(requestId: string): Promise<boolean> {
            try {
                await friendsApi.acceptRequest(requestId);
                console.log(`Friend request ${requestId} accepted`);
                return true;
            } catch (error) {
                console.error('Failed to accept friend request:', error);
                return false;
            }
        },

        /**
         * Reject friend request
         */
        async rejectRequest(requestId: string): Promise<boolean> {
            try {
                await friendsApi.rejectRequest(requestId);
                console.log(`Friend request ${requestId} rejected`);
                return true;
            } catch (error) {
                console.error('Failed to reject friend request:', error);
                return false;
            }
        },

        /**
         * Block user
         */
        async blockUser(userId: string): Promise<boolean> {
            try {
                await friendsApi.blockUser(userId);
                console.log(`User ${userId} blocked`);
                return true;
            } catch (error) {
                console.error('Failed to block user:', error);
                return false;
            }
        },

        /**
         * Get blocked users list
         */
        async getBlockedList(): Promise<Friend[]> {
            try {
                const response = await friendsApi.getBlockedList();
                return response.data as Friend[];
            } catch (error) {
                console.error('Failed to load blocked list:', error);
                return [];
            }
        },
    },

    /**
     * Video Calls Management
     */
    calls: {
        /**
         * Get call history
         */
        async getHistory(limit: number = 50, offset: number = 0): Promise<any[]> {
            try {
                const response = await videoCallsApi.getCallHistory({ limit, offset });
                return response.data as any[];
            } catch (error) {
                console.error('Failed to load call history:', error);
                return [];
            }
        },

        /**
         * Get call details
         */
        async getDetails(callId: string): Promise<any | null> {
            try {
                const response = await videoCallsApi.getCallDetails(callId);
                return response.data;
            } catch (error) {
                console.error('Failed to load call details:', error);
                return null;
            }
        },

        /**
         * Record WebRTC call statistics
         */
        async recordStats(callId: string, stats: any): Promise<boolean> {
            try {
                await videoCallsApi.recordCallStats(callId, stats);
                return true;
            } catch (error) {
                console.error('Failed to record call stats:', error);
                return false;
            }
        },
    },

    /**
     * WebSocket Connection Management
     */
    websocket: {
        /**
         * Get WebSocket URL for communication
         */
        getWebSocketUrl(userId: string): string {
            const token = tokenStorage.get(ACCESS_TOKEN_KEY);
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

            // Extract host from BASE_URL
            const baseUrl = new URL(BASE_URL, window.location.origin);
            const { host } = baseUrl;

            return `${wsProtocol}//${host}/ws/video-call/communication?token=${token}&user_id=${userId}`;
        },

        /**
         * Get friend notifications WebSocket URL
         */
        getFriendNotificationsUrl(userId: string): string {
            const token = tokenStorage.get(ACCESS_TOKEN_KEY);
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

            // Extract host from BASE_URL
            const baseUrl = new URL(BASE_URL, window.location.origin);
            const { host } = baseUrl;

            return `${wsProtocol}//${host}/ws/friend-notifications?token=${token}&user_id=${userId}`;
        },
    },

    /**
     * Utility: Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = tokenStorage.get(ACCESS_TOKEN_KEY);
        return !!token;
    },

    /**
     * Utility: Get current auth token
     */
    getAuthToken(): string | null {
        return tokenStorage.get(ACCESS_TOKEN_KEY);
    },
};

export default integrationService;
