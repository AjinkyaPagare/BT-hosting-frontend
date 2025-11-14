import apiClient from './api';
 
export interface Iteration {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
 
export interface CreateIterationPayload {
  name: string;
  description?: string;
  [key: string]: any;
}
 
export interface UpdateIterationPayload {
  name?: string;
  description?: string;
  status?: string;
  [key: string]: any;
}
 
export interface PaginationParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}
 
export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: any;
}
 
export const fetchIterations = async (
  params: PaginationParams & { search?: string } = {}
): Promise<PaginatedResponse<Iteration>> => {
  const response = await apiClient.get('/iterations', { params });
  return response.data as PaginatedResponse<Iteration>;
};
 
export const getIteration = async (id: string): Promise<Iteration> => {
  const response = await apiClient.get(`/iterations/${id}`);
  return response.data as Iteration;
};
 
export const createIteration = async (
  payload: CreateIterationPayload
): Promise<Iteration> => {
  const response = await apiClient.post('/iterations', payload);
  return response.data as Iteration;
};
 
export const updateIteration = async (
  id: string,
  payload: UpdateIterationPayload
): Promise<Iteration> => {
  const response = await apiClient.patch(`/iterations/${id}`, payload);
  return response.data as Iteration;
};
 
export const deleteIteration = async (id: string): Promise<{ success: boolean } | Iteration> => {
  const response = await apiClient.delete(`/iterations/${id}`);
  return response.data as { success: boolean } | Iteration;
};
 
export const searchIterations = async (
  query: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<Iteration>> => {
  const response = await apiClient.get('/iterations/search', {
    params: { q: query, ...params },
  });
  return response.data as PaginatedResponse<Iteration>;
};
 
 