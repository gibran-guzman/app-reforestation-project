export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'technician';
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'technician';
  created_at?: string;
}

export interface LoginResponse {
  message: string;
  data: {
    session: Session;
    user: User;
  };
}
