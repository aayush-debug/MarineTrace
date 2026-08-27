export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  agency: string;
  created_at: string;
  last_login?: string | null;
}

export interface LoginCredentials {
  email_or_username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  full_name: string;
  password: string;
  role: string;
  agency: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginLog {
  id: string;
  user_id?: string | null;
  email: string;
  username?: string | null;
  full_name?: string | null;
  role?: string | null;
  agency?: string | null;
  status: 'success' | 'failed';
  ip_address: string;
  user_agent: string;
  container_id: string;
  container_hostname: string;
  timestamp: string;
  details?: string | null;
}

export interface DockerTelemetry {
  container_id: string;
  container_name: string;
  hostname: string;
  os_platform: string;
  python_version: string;
  db_path: string;
  database_size_bytes: number;
  total_logins_recorded: number;
  active_operators_count: number;
  uptime_seconds: number;
  server_time_utc: string;
  is_dockerized: boolean;
}
