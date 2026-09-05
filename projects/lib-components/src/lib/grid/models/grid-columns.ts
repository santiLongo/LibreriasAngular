import { GridColumn, GridSummary } from './model';

/** Una celda del <thead>: puede ser el título de un grupo o una columna hoja */
export interface GridHeaderCell<T> {
  column: GridColumn<T>;
  colspan: number;
  rowspan: number;
  isGroup: boolean;
}

/**
 * Resuelve todo lo que la grilla necesita saber de las columnas: los defaults,
 * qué se dibuja en el <thead> (con grupos de un nivel) y los totales del pie.
 *
 * Las columnas ocultas se descartan acá en vez de esconderse con [hidden],
 * para que los colspan / rowspan del header y del pie no queden descuadrados.
 */
export class GridColumns<T> {
  /** Columnas de datos, en el orden en que se dibujan las celdas de cada fila */
  readonly leafColumns: GridColumn<T>[] = [];

  /** Filas del <thead>: una sola si no hay grupos, dos si los hay */
  readonly headerRows: GridHeaderCell<T>[][] = [];

  /** true si al menos una columna pide total */
  readonly hasSummary: boolean;

  /**
   * Ancho vigente de cada hoja: el de la config o el que dejó el usuario al
   * arrastrar. Va por clave y no en la columna para no pisar lo que configuró
   * quien usa la grilla.
   */
  private readonly anchos = new Map<string, string>();

  constructor(columns: GridColumn<T>[] = []) {
    const visibles = columns.map((column) => normalizar(column)).filter(esVisible);
    const hayGrupos = visibles.some(esGrupo);

    const filaGrupos: GridHeaderCell<T>[] = [];
    const filaHijas: GridHeaderCell<T>[] = [];

    for (const column of visibles) {
      if (!esGrupo(column)) {
        // Sin grupos alcanza una fila; con grupos, las sueltas ocupan las dos
        filaGrupos.push({ column, colspan: 1, rowspan: hayGrupos ? 2 : 1, isGroup: false });
        this.leafColumns.push(column);
        continue;
      }

      const hijas = (column.group ?? []).filter(esVisible);
      filaGrupos.push({ column, colspan: hijas.length, rowspan: 1, isGroup: true });

      for (const hija of hijas) {
        filaHijas.push({ column: hija, colspan: 1, rowspan: 1, isGroup: false });
        this.leafColumns.push(hija);
      }
    }

    this.headerRows = hayGrupos ? [filaGrupos, filaHijas] : [filaGrupos];
    this.hasSummary = this.leafColumns.some((column) => !!column.summarize);

    for (const hoja of this.leafColumns) {
      const ancho = medidaCss(hoja.width);
      if (ancho) this.anchos.set(String(hoja.key), ancho);
    }
  }

  /** Cuántas filas ocupa el header: 1, o 2 si hay grupos. Es el rowspan de las columnas de sistema. */
  get headerDepth(): number {
    return this.headerRows.length;
  }

  /** true si alguna columna tiene ancho, sea de la config o de un arrastre */
  get hasWidths(): boolean {
    return this.anchos.size > 0;
  }

  /** Guarda el ancho que dejó el usuario al soltar el borde del header */
  setWidth(column: GridColumn<T>, px: number): void {
    this.anchos.set(String(column.key), `${Math.round(px)}px`);
  }

  widthOf(column: GridColumn<T>): string | null {
    return this.anchos.get(String(column.key)) ?? null;
  }

  /**
   * Anchos para el <colgroup> de la tabla, en el orden en que se dibujan las
   * celdas: primero las columnas de sistema y después las hojas.
   *
   * Va por acá y no por el nzWidth de cada <th> porque ng-zorro sólo mira los
   * th de la primera fila del header: con grupos, las hijas nunca llegarían.
   */
  widthConfig(anchosDeSistema: (string | null)[] = []): (string | null)[] {
    return [
      ...anchosDeSistema,
      ...this.leafColumns.map((column) => this.widthOf(column)),
    ];
  }

  /**
   * Totales por columna.
   *
   * `delServicio` son los totales del dataset completo (los manda el back o
   * los calcula el servicio local) y son sumas, así que sólo se usan para las
   * columnas que suman. El resto se calcula sobre las filas visibles.
   */
  totales(
    rows: T[],
    delServicio: Record<string, number> | null,
    totalFilas: number,
  ): Record<string, number> {
    const totales: Record<string, number> = {};

    for (const column of this.leafColumns) {
      if (!column.summarize) continue;

      const key = String(column.key);
      const delBack = delServicio?.[key];

      if (esSuma(column.summarize) && delBack != null) {
        totales[key] = delBack;
      } else if (column.summarize === 'count') {
        // El total de filas ya viene del servicio: sirve igual paginando
        totales[key] = totalFilas;
      } else {
        totales[key] = calcular(column.summarize, column.key, rows);
      }
    }

    return totales;
  }
}

function calcular<T>(summarize: GridSummary<T>, key: keyof T, rows: T[]): number {
  if (typeof summarize === 'function') return summarize(rows);
  if (summarize === 'count') return rows.length;

  const valores = rows
    .map((row) => Number(row[key]))
    .filter((valor) => !isNaN(valor));

  if (!valores.length) return 0;

  switch (summarize) {
    case 'avg':
      return valores.reduce(sumar, 0) / valores.length;
    case 'min':
      return valores.reduce((menor, valor) => (valor < menor ? valor : menor));
    case 'max':
      return valores.reduce((mayor, valor) => (valor > mayor ? valor : mayor));
    default:
      return valores.reduce(sumar, 0);
  }
}

function sumar(acumulado: number, valor: number): number {
  return acumulado + valor;
}

/** Un número es px; un string ya viene con unidad */
export function medidaCss(valor?: number | string | null): string | null {
  if (valor == null) return null;

  return typeof valor === 'number' ? `${valor}px` : valor;
}

function esSuma<T>(summarize: GridSummary<T>): boolean {
  return summarize === true || summarize === 'sum';
}

function esGrupo<T>(column: GridColumn<T>): boolean {
  return column.type === 'group';
}

/** Un grupo se ve mientras le quede alguna hija visible */
function esVisible<T>(column: GridColumn<T>): boolean {
  if (column.hidden) return false;
  if (!esGrupo(column)) return true;

  return (column.group ?? []).some((hija) => !hija.hidden);
}

function normalizar<T>(column: GridColumn<T>): GridColumn<T> {
  const normalizada: GridColumn<T> = {
    ...column,
    sortable: column.sortable ?? true,
    filter: column.filter ?? false,
    hidden: column.hidden ?? false,
    editable: column.editable ?? false,
  };

  if (!esGrupo(normalizada)) return normalizada;

  // El título de un grupo no ordena ni filtra: eso lo hacen las hijas
  return {
    ...normalizada,
    sortable: false,
    filter: false,
    group: (column.group ?? []).map((hija) => normalizar(hija)),
  };
}
