import api from './api';
import { fetchCurrentUser } from './user';

// Helper to get current user ID from API
// Note: For better performance, use useAuth() hook in components instead
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const user = await fetchCurrentUser();
    return user.id;
  } catch (error) {
    return null;
  }
};

// Type definitions for Group APIs
export interface CreateGroupRequest {
  name: string;
  owner_id: string;
  user_ids: string[];
  is_open?: boolean;
}

export interface CreateGroupResponse {
  id?: string;
  group_id?: string;
  name: string;
  description?: string;
  avatar?: string;
  owner_id: string;
  member_ids?: string[];
  members?: Array<{
    id: string;
    name: string;
    email: string;
    isOnline?: boolean;
  }>;
  is_open: boolean;
  created_at?: string;
}

export interface GetGroupDetailsResponse {
  id?: string;
  group_id?: string;
  name: string;
  group_name?: string;
  description?: string;
  avatar?: string;
  owner_id?: string;
  admin_ids?: string[];
  member_ids?: string[];
  members?: Array<{
    id: string;
    name: string;
    email: string;
    isOnline?: boolean;
    role?: string;
  }>;
  is_open: boolean;
  created_at?: string;
}

export interface AddMembersRequest {
  user_id: string;
  group_id: string;
  'user_ids to add': string[];
}

export interface AddMembersResponse {
  message?: string;
  added_members?: string[];
}

export interface RemoveMemberRequest {
  user_id: string;
  group_id: string;
  'user_id to remove': string;
}

export interface RemoveMemberResponse {
  message?: string;
  removed_user_id?: string;
}

export interface UpdateMemberRoleRequest {
  user_id: string;
  group_id: string;
  target_user_id: string;
  role: string;
}

export interface UpdateMemberRoleResponse {
  message?: string;
  user_id?: string;
  role?: string;
}

export interface GroupListItem {
  id?: string;
  group_id?: string;
  name: string;
  description?: string;
  avatar?: string;
  owner_id?: string;
  admin_ids?: string[];
  member_ids?: string[];
  members?: Array<{
    id: string;
    name: string;
    email: string;
    isOnline?: boolean;
  }>;
  last_message?: {
    id: string;
    content: string;
    timestamp: string;
    sender_id: string;
  };
  unread_count?: number;
  is_open: boolean;
  created_at?: string;
}

export interface GetGroupsListResponse {
  groups?: GroupListItem[];
}

// Group API functions
export const groupApi = {
  /**
   * Get list of groups for the current user
   * @param userId - Current user ID (not used, but kept for compatibility)
   * @returns List of groups
   */
  getGroupsList: async (userId: string): Promise<GroupListItem[]> => {
    try {
      console.log("Fetching groups from /groups/my-groups");
      const response = await api.get<GetGroupsListResponse | GroupListItem[]>('/groups/my-groups');
      console.log("Groups API response:", response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        // If response is directly an array
        const groups = response.data as GroupListItem[];
        console.log(`Found ${groups.length} groups`);
        return groups;
      } else if (response.data && typeof response.data === 'object') {
        // If response is an object with groups property
        const data = response.data as GetGroupsListResponse;
        if (Array.isArray(data.groups)) {
          console.log(`Found ${data.groups.length} groups in response object`);
          return data.groups;
        }
        // Sometimes the response might have a different structure
        if (Array.isArray((data as any).data)) {
          console.log(`Found ${(data as any).data.length} groups in data property`);
          return (data as any).data;
        }
      }
      
      console.warn("Unexpected response format:", response.data);
      return [];
    } catch (error: any) {
      console.error("Error fetching groups list:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      throw error;
    }
  },
  /**
   * Create a new group
   * @param data - Group creation data
   * @returns Created group information
   */
  createGroup: async (data: CreateGroupRequest): Promise<CreateGroupResponse> => {
    // Ensure user_ids is always an array with at least the owner
    const userIds = Array.isArray(data.user_ids) && data.user_ids.length > 0
      ? data.user_ids
      : [data.owner_id];
    
    // Remove duplicates and ensure owner is included
    const uniqueUserIds = Array.from(new Set([data.owner_id, ...userIds]));
    
    const payload = {
      name: data.name.trim(),
      owner_id: data.owner_id,
      user_ids: uniqueUserIds,
      is_open: data.is_open ?? false,
    };
    
    console.log("Sending create group request to /groups/create:", payload);
    
    try {
      const response = await api.post<CreateGroupResponse>('/groups/create', payload);
      console.log("Create group response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Create group API error:", error);
      console.error("Request payload was:", payload);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  /**
   * Get group details by user ID and group ID
   * @param userId - Current user ID
   * @param groupId - Group ID to fetch details for
   * @returns Group details
   */
  getGroupDetails: async (userId: string, groupId: string): Promise<GetGroupDetailsResponse> => {
    console.log(`Fetching group details: /groups/groupdetail/${userId}/${groupId}`);
    try {
      const response = await api.get<GetGroupDetailsResponse>(`/groups/groupdetail/${userId}/${groupId}`);
      console.log("Group details response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching group details:", error);
      console.error("Request URL:", `/groups/groupdetail/${userId}/${groupId}`);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  /**
   * Add members to a group
   * @param data - Member addition data
   * @returns Response with added members information
   */
  addMembers: async (data: AddMembersRequest): Promise<AddMembersResponse> => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      'user_ids to add': data['user_ids to add'],
    };
    
    console.log("Adding members to group:", payload);
    try {
      const response = await api.post<AddMembersResponse>('/groups/members/add', payload);
      console.log("Add members response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error adding members:", error);
      console.error("Request payload:", payload);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  /**
   * Remove a member from a group
   * @param data - Member removal data
   * @returns Response with removal confirmation
   */
  removeMember: async (data: RemoveMemberRequest): Promise<RemoveMemberResponse> => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      'user_id to remove': data['user_id to remove'],
    };
    
    console.log("Removing member from group:", payload);
    try {
      const response = await api.post<RemoveMemberResponse>('/groups/members/remove', payload);
      console.log("Remove member response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error removing member:", error);
      console.error("Request payload:", payload);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  /**
   * Update a member's role in a group
   * @param data - Role update data
   * @returns Response with updated role information
   */
  updateMemberRole: async (data: UpdateMemberRoleRequest): Promise<UpdateMemberRoleResponse> => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      target_user_id: data.target_user_id,
      role: data.role,
    };
    
    console.log("Updating member role:", payload);
    try {
      const response = await api.put<UpdateMemberRoleResponse>('/groups/members/role', payload);
      console.log("Update member role response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error updating member role:", error);
      console.error("Request payload:", payload);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },
};

