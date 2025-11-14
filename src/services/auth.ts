import api from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload extends LoginPayload {
  name: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface SignupResponse {
  message: string;
  user_id: string;
}

export type RefreshResponse = LoginResponse;

export const loginUser = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/login", payload);
  return data;
};

export const signupUser = async (payload: SignupPayload): Promise<SignupResponse> => {
  const { data } = await api.post<SignupResponse>("/signup", payload);
  return data;
};

export const refreshAuthTokens = async (refreshToken: string): Promise<RefreshResponse> => {
  const { data } = await api.post<RefreshResponse>("/refresh", { refresh_token: refreshToken });
  return data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/logout");
};
