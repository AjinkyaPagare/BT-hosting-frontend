import api from './api';

// Helper to get current user ID
export const getCurrentUserId = (): string | null => {
  return localStorage.getItem('userId');
};

// Group API functions
export const groupApi = {
  // Create a new group
  createGroup: async (data: {
    name: string;
    owner_id: string;
    user_ids: string[];
    is_open?: boolean;
  }) => {
    const response = await api.post('/groups/create', {
      name: data.name,
      owner_id: data.owner_id,
      user_ids: data.user_ids,
      is_open: data.is_open ?? false,
    });
    return response.data;
  },

  // Get group details
  getGroupDetails: async (userId: string, groupId: string) => {
    const response = await api.get(`/groups/groupdetail/${userId}/${groupId}`);
    return response.data;
  },

  // Add members to a group
  addMembers: async (data: {
    user_id: string;
    group_id: string;
    'user_ids to add': string[];
  }) => {
    const response = await api.post('/groups/members/add', {
      user_id: data.user_id,
      group_id: data.group_id,
      'user_ids to add': data['user_ids to add'],
    });
    return response.data;
  },

  // Remove a member from a group
  removeMember: async (data: {
    user_id: string;
    group_id: string;
    'user_id to remove': string;
  }) => {
    const response = await api.post('/groups/members/remove', {
      user_id: data.user_id,
      group_id: data.group_id,
      'user_id to remove': data['user_id to remove'],
    });
    return response.data;
  },
};

