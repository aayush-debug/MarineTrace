import { request } from './client';
import type {
  AuthResponse,
  DockerTelemetry,
  LoginCredentials,
  LoginLog,
  RegisterData,
  User,
} from '../types/auth';

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(token: string): Promise<User> {
  return request<User>('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getLoginLogs(limit = 50): Promise<LoginLog[]> {
  return request<LoginLog[]>(`/api/auth/logs?limit=${limit}`, {
    method: 'GET',
  });
}

export async function getDockerTelemetry(): Promise<DockerTelemetry> {
  return request<DockerTelemetry>('/api/auth/docker-telemetry', {
    method: 'GET',
  });
}

export async function getOperators(): Promise<User[]> {
  return request<User[]>('/api/auth/users', {
    method: 'GET',
  });
}

export async function clearLoginLogs(): Promise<{ status: string; count: number }> {
  return request<{ status: string; count: number }>('/api/auth/logs', {
    method: 'DELETE',
  });
}

export async function logoutUser(): Promise<{ status: string; ip: string }> {
  return request<{ status: string; ip: string }>('/api/auth/logout', {
    method: 'POST',
  });
}
