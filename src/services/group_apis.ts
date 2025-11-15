import api from "./api";
import type { Group, GroupMember } from "@/types";

export interface CreateGroupRequest {
  name: string;
  owner_id: string;
  user_ids: string[];
  is_open?: boolean;
}

export interface AddMembersRequest {
  user_id: string;
  group_id: string;
  "user_ids to add": string[];
}

export interface AddMembersResponse {
  message?: string;
  added_members?: string[];
}

export interface RemoveMemberRequest {
  user_id: string;
  group_id: string;
  "user_id to remove": string;
}

export interface RemoveMemberResponse {
  message?: string;
  removed_user_id?: string;
}

export interface LeaveGroupRequest {
  user_id: string;
  group_id: string;
}

export interface LeaveGroupResponse {
  message?: string;
}

export interface DeleteGroupRequest {
  group_id: string;
  requested_by: string;
  reason: string;
}

export interface DeleteGroupResponse {
  status?: string;
  action?: string;
  target?: {
    type?: string;
    id?: string;
  };
  detail?: {
    success?: boolean;
    message?: string;
    group_id?: string;
  };
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

interface RawGroupMember {
  id?: string | null;
  user_id?: string | null;
  role?: string | null;
  joined_at?: string | null;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  avatar?: string | null;
  is_online?: boolean | null;
  isOnline?: boolean | null;
}

interface RawGroupResponse {
  id?: string | null;
  group_id?: string | null;
  name?: string | null;
  description?: string | null;
  avatar?: string | null;
  owner_id?: string | null;
  is_open?: boolean | null;
  admin_ids?: string[] | null;
  member_ids?: string[] | null;
  members?: RawGroupMember[] | null;
  unread_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface RawGroupsListEnvelope {
  groups?: RawGroupResponse[];
  data?: RawGroupResponse[];
}

const normalizeMember = (member: RawGroupMember): GroupMember => {
  const resolvedUserId = member.user_id ?? member.id ?? "";
  const role = member.role ?? "member";

  return {
    id: resolvedUserId,
    userId: resolvedUserId,
    name: member.name ?? "Unknown user",
    email: member.email ?? undefined,
    avatar: member.avatar ?? undefined,
    role,
    joinedAt: member.joined_at ?? new Date().toISOString(),
    isOnline: Boolean(member.isOnline ?? member.is_online),
    status: member.status ?? null,
  };
};

const normalizeGroup = (group: RawGroupResponse): Group => {
  const safeOwnerId = group.owner_id ?? "";
  const normalizedMembers = (group.members ?? []).map(normalizeMember);
  const membersById = new Map(normalizedMembers.map((member) => [member.userId, member]));

  if (!membersById.has(safeOwnerId) && safeOwnerId) {
    membersById.set(safeOwnerId, {
      id: safeOwnerId,
      userId: safeOwnerId,
      name: "Group Owner",
      role: "owner",
      joinedAt: new Date().toISOString(),
      isOnline: false,
    });
  }

  const members = Array.from(membersById.values()).map((member) => {
    if (member.userId === safeOwnerId) {
      return { ...member, role: "owner" };
    }
    return { ...member, role: member.role ?? "member" };
  });

  const memberIds = Array.from(new Set(group.member_ids ?? members.map((member) => member.userId)));
  if (safeOwnerId && !memberIds.includes(safeOwnerId)) {
    memberIds.unshift(safeOwnerId);
  }

  const derivedAdminIds = members
    .filter((member) => member.role === "owner" || member.role === "admin")
    .map((member) => member.userId);
  const adminIdsSet = new Set<string>([...derivedAdminIds, ...(group.admin_ids ?? [])]);
  if (safeOwnerId) {
    adminIdsSet.add(safeOwnerId);
  }

  return {
    id: group.id ?? group.group_id ?? "",
    name: group.name ?? "Unnamed Group",
    avatar: group.avatar ?? undefined,
    ownerId: safeOwnerId,
    isOpen: Boolean(group.is_open),
    adminIds: Array.from(adminIdsSet),
    memberIds,
    members,
    lastMessage: undefined,
    unreadCount: group.unread_count ?? 0,
    createdAt: group.created_at ?? new Date().toISOString(),
    updatedAt: group.updated_at ?? group.created_at ?? new Date().toISOString(),
  };
};

const ensureGroup = (raw: RawGroupResponse): Group => normalizeGroup(raw);

const coerceGroupsArray = (payload: unknown): RawGroupResponse[] => {
  if (Array.isArray(payload)) {
    return payload as RawGroupResponse[];
  }
  if (payload && typeof payload === "object") {
    const envelope = payload as RawGroupsListEnvelope;
    if (Array.isArray(envelope.groups)) {
      return envelope.groups;
    }
    if (Array.isArray(envelope.data)) {
      return envelope.data;
    }
  }
  return [];
};

export const groupApi = {
  /**
   * Fetch groups for the authenticated user.
   */
  getGroupsList: async (_userId: string): Promise<Group[]> => {
    try {
      console.log("Fetching groups from /groups/my-groups");
      const response = await api.get<RawGroupsListEnvelope | RawGroupResponse[]>("/groups/my-groups");
      const rawGroups = coerceGroupsArray(response.data);
      console.log(`Received ${rawGroups.length} groups`);
      return rawGroups.map(ensureGroup);
    } catch (error: any) {
      console.error("Error fetching groups list:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      throw error;
    }
  },

  /**
   * Create a new group and return the normalized representation.
   */
  createGroup: async (data: CreateGroupRequest): Promise<Group> => {
    const userIds = Array.isArray(data.user_ids) && data.user_ids.length > 0 ? data.user_ids : [data.owner_id];
    const uniqueUserIds = Array.from(new Set([data.owner_id, ...userIds]));

    const payload = {
      name: data.name.trim(),
      owner_id: data.owner_id,
      user_ids: uniqueUserIds,
      is_open: data.is_open ?? false,
    };

    console.log("Sending create group request:", payload);

    try {
      const response = await api.post<RawGroupResponse>("/groups/create", payload);
      console.log("Create group response:", response.data);
      return ensureGroup(response.data);
    } catch (error: any) {
      console.error("Create group API error:", error);
      console.error("Request payload was:", payload);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  /**
   * Retrieve group details for a specific group.
   */
  getGroupDetails: async (userId: string, groupId: string): Promise<Group> => {
    console.log(`Fetching group details: /groups/groupdetail/${userId}/${groupId}`);
    try {
      const response = await api.get<RawGroupResponse>(`/groups/groupdetail/${userId}/${groupId}`);
      console.log("Group details response:", response.data);
      return ensureGroup(response.data);
    } catch (error: any) {
      console.error("Error fetching group details:", error);
      console.error("Request URL:", `/groups/groupdetail/${userId}/${groupId}`);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  /**
   * Add members to a group.
   */
  addMembers: async (data: AddMembersRequest): Promise<AddMembersResponse> => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      "user_ids to add": data["user_ids to add"],
    };

    console.log("Adding members to group:", payload);
    try {
      const response = await api.post<AddMembersResponse>("/groups/members/add", payload);
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
   * Remove a member from a group.
   */
  removeMember: async (data: RemoveMemberRequest): Promise<RemoveMemberResponse> => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      "user_id to remove": data["user_id to remove"],
    };

    console.log("Removing member from group:", payload);
    try {
      const response = await api.post<RemoveMemberResponse>("/groups/members/remove", payload);
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
   * Update a member's role within a group.
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
      const response = await api.put<UpdateMemberRoleResponse>("/groups/members/role", payload);
      console.log("Update member role response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error updating member role:", error);
      console.error("Request payload:", payload);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  leaveGroup: async (data: LeaveGroupRequest): Promise<LeaveGroupResponse> => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      "user_id to remove": data.user_id,
    };

    try {
      const response = await api.post<LeaveGroupResponse>("/groups/members/remove", payload);
      return response.data;
    } catch (error: any) {
      console.error("Error leaving group:", error);
      console.error("Request payload:", payload);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },

  deleteGroup: async (data: DeleteGroupRequest): Promise<DeleteGroupResponse> => {
    const { group_id, requested_by, reason } = data;
    const payload = {
      reason,
      requested_by,
      target_group_id: group_id,
    };

    try {
      const response = await api.delete<DeleteGroupResponse>(`/admin/groups/${group_id}/delete`, {
        data: payload,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error deleting group:", error);
      console.error("Request payload:", payload);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  },
};

