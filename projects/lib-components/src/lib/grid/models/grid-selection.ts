import { SelectebleSettings } from './model';

/**
 * Filas tildadas de la grilla y estado del check del header.
 *
 * Trabaja con la referencia de la fila (no con una clave) porque es lo que
 * después se emite por selectedRowsChange: quien consume la grilla espera
 * recibir los mismos objetos que le pasó al servicio.
 */
export class GridSelection<T> {
  readonly settings: SelectebleSettings<T>;

  checked = false;
  indeterminate = false;

  private readonly seleccionadas = new Set<T>();

  constructor(settings?: SelectebleSettings<T>) {
    this.settings = settings ?? { type: 'single', selectable: true };
  }

  get rows(): T[] {
    return Array.from(this.seleccionadas);
  }

  get activa(): boolean {
    return this.settings.selectable;
  }

  get esMultiple(): boolean {
    return this.settings.type === 'multiple';
  }

  esSeleccionable(row: T): boolean {
    if (!this.activa) return false;
    if (!this.settings.esSelectable) return true;

    return this.settings.esSelectable(row);
  }

  esta(row: T): boolean {
    return this.seleccionadas.has(row);
  }

  toggle(row: T, checked: boolean, data: T[]): void {
    if (!this.activa) return;

    if (!this.esMultiple) {
      this.seleccionadas.clear();
      if (checked) this.seleccionadas.add(row);
    } else if (checked) {
      this.seleccionadas.add(row);
    } else {
      this.seleccionadas.delete(row);
    }

    this.refrescar(data);
  }

  toggleTodas(checked: boolean, data: T[]): void {
    if (!this.activa) return;

    if (!this.esMultiple) {
      this.seleccionadas.clear();
    } else {
      for (const row of data) {
        if (!this.esSeleccionable(row)) continue;

        if (checked) this.seleccionadas.add(row);
        else this.seleccionadas.delete(row);
      }
    }

    this.refrescar(data);
  }

  limpiar(): void {
    this.seleccionadas.clear();
    this.checked = false;
    this.indeterminate = false;
  }

  /** Recalcula el check del header contra las filas que se están viendo */
  refrescar(data: T[]): void {
    const enPagina = data.filter((row) => this.seleccionadas.has(row)).length;

    this.checked = enPagina > 0 && enPagina === data.length;
    this.indeterminate = enPagina > 0 && enPagina < data.length;
  }
}
