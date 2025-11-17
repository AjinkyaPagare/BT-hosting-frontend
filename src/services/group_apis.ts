import api from "./api";
import type { Group, GroupMember } from "@/types";

/* ---------------------- Request & Response Types ---------------------- */

export interface CreateGroupRequest {
  name: string;
  owner_id: string;
  user_ids: string[];
  is_open?: boolean;
}

export interface AddMembersRequest {
  user_id: string;
  group_id: string;
  user_ids: string[]; // simplified key
}

export interface RemoveMemberRequest {
  user_id: string;
  group_id: string;
  target_user_id: string; // simplified key
}

export interface UpdateMemberRoleRequest {
  user_id: string;
  group_id: string;
  target_user_id: string;
  role: string;
}

export interface LeaveGroupRequest {
  user_id: string;
  group_id: string;
}

export interface DeleteGroupRequest {
  group_id: string;
  requested_by: string;
  reason: string;
}

/* ---------------------- Raw Backend Response Types ---------------------- */

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

/* ---------------------- Member Normalizer ---------------------- */

const normalizeMember = (m: RawGroupMember): GroupMember => {
  const uid = m.user_id ?? m.id ?? "";

  return {
    id: uid,
    userId: uid,
    name: m.name ?? "Unknown User",
    email: m.email ?? undefined,
    avatar: m.avatar ?? undefined,
    role: m.role ?? "member",
    joinedAt: m.joined_at ?? new Date().toISOString(),
    isOnline: Boolean(m.isOnline ?? m.is_online),
    status: m.status ?? null,
  };
};

/* ---------------------- Group Normalizer ---------------------- */

const normalizeGroup = (g: RawGroupResponse): Group => {
  const groupId = g.id ?? g.group_id ?? "";
  const ownerId = g.owner_id ?? "";

  const rawMembers = Array.isArray(g.members) ? g.members : [];
  const normalizedMembers = rawMembers.map(normalizeMember);

  // ensure owner exists
  if (ownerId && !normalizedMembers.find((m) => m.userId === ownerId)) {
    normalizedMembers.push({
      id: ownerId,
      userId: ownerId,
      name: "Group Owner",
      role: "owner",
      joinedAt: new Date().toISOString(),
      isOnline: false,
    });
  }

  // fix member roles
  const finalMembers = normalizedMembers.map((m) =>
    m.userId === ownerId ? { ...m, role: "owner" } : m
  );

  // final memberIds
  const memberIds =
    g.member_ids ??
    finalMembers.map((m) => m.userId);

  // admin set
  const derivedAdmins = finalMembers
    .filter((m) => m.role === "owner" || m.role === "admin")
    .map((m) => m.userId);

  const adminIds = Array.from(
    new Set([...(g.admin_ids ?? []), ...derivedAdmins, ownerId])
  );

  return {
    id: groupId,
    name: g.name ?? "Unnamed Group",
    avatar: g.avatar ?? undefined,
    ownerId,
    isOpen: Boolean(g.is_open),
    adminIds,
    memberIds,
    members: finalMembers,
    lastMessage: undefined,
    unreadCount: g.unread_count ?? 0,
    createdAt: g.created_at ?? new Date().toISOString(),
    updatedAt: g.updated_at ?? g.created_at ?? new Date().toISOString(),
  };
};

const ensureArray = (payload: unknown): RawGroupResponse[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const env = payload as RawGroupsListEnvelope;
    return env.groups ?? env.data ?? [];
  }
  return [];
};

/* ---------------------- Public groupApi ---------------------- */

export const groupApi = {
  /** Fetch groups for logged-in user */
  getGroupsList: async (): Promise<Group[]> => {
    try {
      const res = await api.get("/groups/my-groups");
      const rawGroups = ensureArray(res.data);
      return rawGroups.map(normalizeGroup);
    } catch (err: any) {
      console.error("❌ Error loading groups:", err.response?.data);
      throw err;
    }
  },

  /** Create a new group */
  createGroup: async (data: CreateGroupRequest): Promise<Group> => {
    const users = [...new Set([data.owner_id, ...data.user_ids])];

    const payload = {
      name: data.name.trim(),
      owner_id: data.owner_id,
      user_ids: users,
      is_open: Boolean(data.is_open),
    };

    try {
      const res = await api.post("/groups/create", payload);
      return normalizeGroup(res.data);
    } catch (err: any) {
      console.error("❌ Create group error:", err.response?.data);
      throw err;
    }
  },

  /** Get details of a single group */
  getGroupDetails: async (userId: string, groupId: string): Promise<Group> => {
    try {
      const res = await api.get(`/groups/groupdetail/${userId}/${groupId}`);
      return normalizeGroup(res.data);
    } catch (err: any) {
      console.error("❌ Group details error:", err.response?.data);
      throw err;
    }
  },

  /** Add members */
  addMembers: async (data: AddMembersRequest) => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      "user_ids to add": data.user_ids, // backend expects exact key
    };

    try {
      const res = await api.post("/groups/members/add", payload);
      return res.data;
    } catch (err: any) {
      console.error("❌ Add members error:", err.response?.data);
      throw err;
    }
  },

  /** Remove member */
  removeMember: async (data: RemoveMemberRequest) => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      "user_id to remove": data.target_user_id,
    };

    try {
      const res = await api.post("/groups/members/remove", payload);
      return res.data;
    } catch (err: any) {
      console.error("❌ Remove member error:", err.response?.data);
      throw err;
    }
  },

  /** Leave group */
  leaveGroup: async (data: LeaveGroupRequest) => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      "user_id to remove": data.user_id,
    };

    try {
      const res = await api.post("/groups/members/remove", payload);
      return res.data;
    } catch (err: any) {
      console.error("❌ Leave group error:", err.response?.data);
      throw err;
    }
  },

  /** Update member role */
  updateMemberRole: async (data: UpdateMemberRoleRequest) => {
    const payload = {
      user_id: data.user_id,
      group_id: data.group_id,
      target_user_id: data.target_user_id,
      role: data.role,
    };

    try {
      const res = await api.put("/groups/members/role", payload);
      return res.data;
    } catch (err: any) {
      console.error("❌ Update role error:", err.response?.data);
      throw err;
    }
  },

  /** Delete group */
  deleteGroup: async (data: DeleteGroupRequest) => {
    const payload = {
      reason: data.reason,
      requested_by: data.requested_by,
      target_group_id: data.group_id,
    };

    try {
      const res = await api.delete(`/admin/groups/${data.group_id}/delete`, {
        data: payload,
      });
      return res.data;
    } catch (err: any) {
      console.error("❌ Delete group error:", err.response?.data);
      throw err;
    }
  },
};
