import { TemplateRef } from "@angular/core";
import { IconKey } from "../../types/icons";

export interface GridConfig<T> {
  columns: GridColumn<T>[];
  menuActions?: GridMenuAction<T>[];
  toolBarActions?: GridToolBarAction<T>[];
  selectableSettings?: SelectebleSettings<T>;
  isEditable?: boolean;
  /** Filas colapsables. Si no se pasa, la grilla no muestra la columna de expandir. */
  expandable?: ExpandableSettings<T>;
  /**
   * Identidad estable de la fila. La usan el trackBy, el cache de edición y el
   * estado de expandidas. Sin esto la grilla cae al índice, y entonces las
   * filas abiertas se cierran al cambiar de página.
   */
  rowKey?: (row: T) => string;
}

export type GridColumnType = 'text' | 'numeric' | 'date' | 'template' | 'group';

export type GridColumnFormat =
  | '{0:0}'
  | '{0:1}'
  | '{0:2}'
  | 'cuit'
  | 'ddMMyyyy hh:MM:ss'
  | 'ddMMyyyy hh:MM'
  | 'ddMMyyyy'
  | 'ddMMyy'
  | 'ddMM';

/** Operación con la que se calcula el total de una columna */
export type GridSummaryType = 'sum' | 'avg' | 'count' | 'min' | 'max';

/** `true` equivale a 'sum'. La función recibe las filas y devuelve el total. */
export type GridSummary<T> = boolean | GridSummaryType | ((rows: T[]) => number);

export class GridColumn<T> {
  key: keyof T;
  title: string;
  type: GridColumnType;
  format?: GridColumnFormat;
  filter?: boolean = false;
  hidden?: boolean = false;
  sortable?: boolean = true;
  editable?: boolean = false;
  template?: TemplateRef<any>;
  editTemplate?: TemplateRef<any>;

  /**
   * Columnas hijas cuando type es 'group'. Arma un header de dos filas: el
   * título del grupo arriba y las hijas abajo. Sólo un nivel de anidamiento;
   * filtro, orden, edición y totales siguen trabajando sobre las hijas.
   *
   * La key del grupo no se usa para nada (no hay dato que mostrar): poné la de
   * cualquiera de las hijas.
   */
  group?: GridColumn<T>[];

  /** Muestra el total de la columna en el pie de la grilla */
  summarize?: GridSummary<T>;
}

export interface ExpandableSettings<T> {
  /** Contenido de la fila expandida. Recibe { $implicit: row, row } */
  template: TemplateRef<any>;
  /** Qué filas se pueden abrir. Si no se pasa, todas. Siempre arrancan cerradas. */
  esExpandible?: (row: T) => boolean;
}

export class GridMenuAction<T> {
  key: string;
  label: string;
  icon?: IconKey;

  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;

  onClick: (row: T) => void;
}

export class GridToolBarAction<T> {
  key: string;
  label: string;
  icon?: IconKey;
  type: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' = 'primary';
  hidden?: boolean;
  disabledOnEmptyRows?: boolean = false
  disabled?: (rows: T[]) => boolean;
  onClick: (rows: T[]) => void;
  position?: 'left' | 'right';
}

export class SelectebleSettings<T>{
  type: 'multiple' | 'single' = 'single'
  selectable: boolean = true;
  esSelectable?: (row: T) => boolean
}
