import api from "./api";

export interface Profile {
  id: number;
  user_id: string;
  name: string;
  email: string;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface ProfileUpdatePayload {
  name?: string;
  email?: string;
  bio?: string | null;
  avatar_url?: string | null;
}

export const getProfile = async (): Promise<Profile> => {
  const { data } = await api.get<Profile>("/profile");
  return data;
};

export const updateProfile = async (payload: ProfileUpdatePayload): Promise<Profile> => {
  const { data } = await api.put<Profile>("/profile", payload);
  return data;
};
