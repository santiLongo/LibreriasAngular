import { TemplateRef } from "@angular/core";
import { IconKey } from "../../types/icons";

export interface GridConfig<T> {
  columns: GridColumn<T>[];
  menuActions?: GridMenuAction<T>[];
  toolBarActions?: GridToolBarAction<T>[];
  selectableSettings?: SelectebleSettings<T>;
  isEditable?: boolean;
}

export class GridColumn<T> {
  key: keyof T;
  title: string;
  type: 'text' | 'numeric' | 'date' | 'template';
  format?:
    | '{0:0}'
    | '{0:1}'
    | '{0:2}'
    | 'cuit'
    | 'ddMMyyyy hh:MM:ss'
    | 'ddMMyyyy hh:MM'
    | 'ddMMyyyy'
    | 'ddMMyy'
    | 'ddMM';
  filter?: boolean = false;
  hidden?: boolean = false;
  sortable?: boolean = true;
  editable?: boolean = false;
  template?: TemplateRef<any>;
  editTemplate?: TemplateRef<any>;
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

