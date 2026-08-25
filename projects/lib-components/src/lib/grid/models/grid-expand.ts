import { ExpandableSettings } from './model';

/**
 * Filas abiertas de la grilla.
 *
 * Guarda claves y no referencias: así, cuando la config trae rowKey, una fila
 * abierta sigue abierta aunque el servicio devuelva objetos nuevos.
 */
export class GridExpand<T> {
  private readonly abiertas = new Set<string>();

  constructor(private readonly settings?: ExpandableSettings<T>) {}

  get activo(): boolean {
    return !!this.settings;
  }

  get template() {
    return this.settings?.template;
  }

  /** Qué filas muestran el chevron */
  esExpandible(row: T): boolean {
    if (!this.settings) return false;
    if (!this.settings.esExpandible) return true;

    return this.settings.esExpandible(row);
  }

  esta(key: string): boolean {
    return this.abiertas.has(key);
  }

  toggle(key: string, abierta: boolean): void {
    if (abierta) this.abiertas.add(key);
    else this.abiertas.delete(key);
  }

  limpiar(): void {
    this.abiertas.clear();
  }
}
