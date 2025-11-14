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
