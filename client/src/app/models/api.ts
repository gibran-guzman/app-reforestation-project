export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: PaginationMeta;
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

export type LoginResponse = ApiResponse<{ session: Session; user: User }>;
