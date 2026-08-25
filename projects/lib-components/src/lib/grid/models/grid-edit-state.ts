import { EditableGridService } from '../services/editable-grid.service';

export interface GridEditEntry<T> {
  edit: boolean;
  data: T;
}

/**
 * Edición inline: mantiene una copia editable de cada fila y sincroniza con el
 * servicio recién al guardar, así cancelar deja la fila como estaba.
 */
export class GridEditState<T extends Record<string, any>> {
  cache: Record<string, GridEditEntry<T>> = {};
  editandoKey?: string;

  /** Fila recién agregada que hay que abrir en edición apenas llegue la data */
  private esperandoNueva = false;

  constructor(
    private readonly service: EditableGridService<T>,
    private readonly rowKey: (row: T, index: number) => string,
  ) {}

  /** Reconstruye el cache cuando cambia la data, conservando lo que se estaba editando */
  sincronizar(data: T[]): void {
    const nuevo: Record<string, GridEditEntry<T>> = {};

    data.forEach((row, index) => {
      const key = this.rowKey(row, index);
      nuevo[key] = this.cache[key] ?? this.nuevaEntrada(row);
    });

    this.cache = nuevo;

    if (this.esperandoNueva && data.length) {
      this.esperandoNueva = false;
      this.iniciar(data[0], 0);
    }
  }

  entrada(row: T, index: number): GridEditEntry<T> {
    const key = this.rowKey(row, index);

    return (this.cache[key] ??= this.nuevaEntrada(row));
  }

  editando(row: T, index: number): boolean {
    return this.entrada(row, index).edit;
  }

  iniciar(row: T, index: number): void {
    const entrada = this.entrada(row, index);

    entrada.edit = true;
    entrada.data = structuredClone(row);
    this.editandoKey = this.rowKey(row, index);
  }

  cancelar(row: T, index: number): void {
    const entrada = this.entrada(row, index);

    entrada.edit = false;
    entrada.data = structuredClone(row);
    this.editandoKey = undefined;
  }

  guardar(row: T, index: number): void {
    const entrada = this.entrada(row, index);

    entrada.edit = false;
    this.editandoKey = undefined;

    // El servicio local busca la fila por referencia: hay que mutarla, no reemplazarla
    Object.assign(row, entrada.data);
    this.service.update(row);
  }

  eliminar(row: T): void {
    this.service.remove(row);
  }

  /**
   * Agrega una fila vacía y la deja en edición. La marca se consume en el
   * sincronizar() que dispara el add(), sin setTimeout: la app corre zoneless
   * y un timer no dispararía el change detection.
   */
  agregar(): void {
    this.esperandoNueva = true;
    this.service.add({} as T);
  }

  private nuevaEntrada(row: T): GridEditEntry<T> {
    return { edit: false, data: structuredClone(row) };
  }
}
