import api from "./api";
 
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  status?: string | null;
}
 
export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  const { data } = await api.get<CurrentUser>("/users/me");
  return data;
};
 
export interface PublicUserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  status?: string | null;
}
 
export const fetchUserById = async (userId: string): Promise<PublicUserProfile> => {
  const { data } = await api.get<PublicUserProfile>(`/users/${encodeURIComponent(userId)}`);
  return data;
};
 
 