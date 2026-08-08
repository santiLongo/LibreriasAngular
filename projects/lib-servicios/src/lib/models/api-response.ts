export interface ApiResponse<T> {
  data: T;
  ok: boolean;
  hayErrores: boolean;
  error: string | null;
  errores: string[];
  isSessionAlive: boolean;
}

export interface HttpRef {
  loading: boolean
}