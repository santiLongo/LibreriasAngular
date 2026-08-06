export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface GridState {
  page: number;
  pageSize: number;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };

  filters?: Record<string, any>;
}