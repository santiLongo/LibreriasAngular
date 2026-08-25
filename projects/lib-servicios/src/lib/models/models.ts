export interface PagedResult<T> {
  items: T[];
  total: number;
  /**
   * Totales por columna del dataset completo, no de la página. Se interpretan
   * como sumas: los usa la grilla en las columnas marcadas con summarize.
   */
  totals?: Record<string, number>;
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