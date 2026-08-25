
import { Observable, of } from 'rxjs';
import { BaseGridService } from './base-grid.service';
import { InternalItem } from '../types/type';
import { GridState, PagedResult } from 'lib-servicios';

export abstract class LocalGridService<T extends Record<string, any>>
  extends BaseGridService<T>
{
  protected items: InternalItem<T>[] = [];

  constructor(initialData: InternalItem<T>[] = []) {
    super();
    this.items = [...initialData];
  }

  protected wrap(data: T): InternalItem<T> {
    return { __uuid: crypto.randomUUID(), data };
  }

  protected unwrap(items: InternalItem<T>[]): T[] {
    return items.map((i) => i.data);
  }

  override getData(state: GridState): Observable<PagedResult<T>> {
    let data = [...this.items];

    // FILTROS
    if (state.filters) {
      Object.entries(state.filters).forEach(([key, value]) => {
        if (!value) return;

        data = data.filter(({ data }) => {
          const v = data[key];
          return v
            ?.toString()
            .toLowerCase()
            .includes(value.toString().toLowerCase());
        });
      });
    }

    // SORT
    if (state.sort) {
      const { field, direction } = state.sort;

      data.sort((a, b) => {
        const av = a.data[field];
        const bv = b.data[field];

        if (av === bv) return 0;
        const res = av > bv ? 1 : -1;
        return direction === 'asc' ? res : -res;
      });
    }

    const total = data.length;

    // TOTALES: sobre todo lo filtrado, antes de paginar
    const totals = this.totales(data);

    // PAGINADO
    const start = (state.page - 1) * state.pageSize;
    const page = data.slice(start, start + state.pageSize);

    return of({
      items: this.unwrap(page),
      total,
      totals,
    });
  }

  /**
   * Suma todas las claves numéricas del dataset filtrado. La grilla se queda
   * sólo con las columnas que pidieron total, así que sumar de más no molesta
   * y evita que el servicio tenga que conocer la config de la grilla.
   */
  protected totales(items: InternalItem<T>[]): Record<string, number> {
    const totales: Record<string, number> = {};

    for (const { data } of items) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'number' || isNaN(value)) continue;

        totales[key] = (totales[key] ?? 0) + value;
      }
    }

    return totales;
  }

  // CRUD SEGURO

  add(item: T) {
    this.items.unshift(this.wrap(item));
    this.search();
  }

  remove(item: T) {
    const id = this.findId(item);
    this.items = this.items.filter((i) => i.__uuid !== id);
    this.search();
  }

  update(item: T) {
    const id = this.findId(item);
    this.items = this.items.map((i) =>
      i.__uuid === id ? { ...i, data: item } : i,
    );
    this.search();
  }

  setAll(data: T[]) {
    this.items = data.map((d) => this.wrap(d));
    this.search();
  }

  clear() {
    this.items = [];
    this.search();
  }

  private findId(item: T): string {
    const found = this.items.find((i) => i.data === item);
    if (!found) throw new Error('Item no encontrado en LocalGridService');
    return found.__uuid;
  }
}
