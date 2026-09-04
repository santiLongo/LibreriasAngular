import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzTableModule, NzTableSortOrder } from 'ng-zorro-antd/table';
import {
  GridColumn,
  GridConfig,
  GridMenuAction,
  GridToolBarAction,
} from './models/model';
import { GridColumns } from './models/grid-columns';
import { GridSelection } from './models/grid-selection';
import { GridExpand } from './models/grid-expand';
import { GridEditState } from './models/grid-edit-state';
import { Subject, takeUntil } from 'rxjs';
import { BaseGridService } from './services/base-grid.service';
import { DynamicFormatPipe } from './pipes/dynamic-format.pipe';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../button/button';
import { MatMenuModule } from '@angular/material/menu';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { EditableGridService } from './services/editable-grid.service'
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { FormFieldComponent } from '../forms-field';
import { ICONS } from '../types/icons';
import { HttpRef } from 'lib-servicios';

/**
 * Anchos de las columnas que agrega la grilla. Con layout fijo el ancho sale
 * del <colgroup>, así que el CSS de estas columnas no alcanza.
 */
const ANCHOS_SISTEMA = {
  expand: '48px',
  seleccion: '48px',
  edicion: '150px',
  acciones: '64px',
};

/** Lo mínimo que puede quedar una columna al arrastrarla */
const ANCHO_MINIMO = 60;

@Component({
  standalone: true,
  selector: 'app-grid',
  styleUrl: './grid.css',
  templateUrl: './grid.html',
  imports: [
    NzTableModule,
    DynamicFormatPipe,
    NzDropDownModule,
    NzIconModule,
    NzButtonModule,
    NzMenuModule,
    NzPaginationModule,
    NzResizableModule,
    MatIconModule,
    ButtonComponent,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule,
    NzFloatButtonModule,
    NgTemplateOutlet,
    FormFieldComponent,
    CommonModule
],
})
export class GridComponent<T extends Record<string, any>>
  implements OnInit, OnDestroy
{
  @Input({ required: true }) dataService!: BaseGridService<T>;
  @Input({ required: true }) config!: GridConfig<T>;
  @Input() hiddenRefresh = false;
  @Input() isLocal = false;
  @Input() ref: HttpRef;

  @Input() selectedRows: T[] = [];
  @Output() selectedRowsChange = new EventEmitter<T[]>();

  data: T[] = [];
  total = 0;

  /** Columnas, header y totales */
  columns!: GridColumns<T>;
  /** Filas tildadas */
  selection!: GridSelection<T>;
  /** Filas abiertas */
  expand!: GridExpand<T>;
  /** Sólo cuando la config es editable y el servicio lo soporta */
  edit?: GridEditState<T>;

  menuActions: GridMenuAction<T>[] = [];
  toolbarButtons: GridToolBarAction<T>[] = [];

  ICONS = ICONS;
  ANCHO_MINIMO = ANCHO_MINIMO;
  activeFilterColumn?: string;
  searchValue = new FormControl('');
  filterVisible: Record<string, boolean> = {};

  /**
   * Anchos del <colgroup>. Es un campo y no un getter porque nzWidthConfig es
   * un @Input: un array nuevo en cada ciclo dispararía una remedición sin fin.
   */
  widthConfig: (string | null)[] = [];

  private editableService?: EditableGridService<T>;
  private totalesServicio: Record<string, number> | null = null;
  private totales: Record<string, number> = {};

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.columns = new GridColumns(this.config.columns);
    this.menuActions = this.config.menuActions ?? [];
    this.toolbarButtons = this.config.toolBarActions ?? [];
    this.selection = new GridSelection(this.config.selectableSettings);
    this.expand = new GridExpand(this.config.expandable);

    if (this.config.isEditable && this.isEditableService(this.dataService)) {
      this.editableService = this.dataService;
      this.edit = new GridEditState(this.dataService, this.rowKey);
    }

    if (!this.ref) {
      this.ref = this.dataService.ref;
    }

    this.actualizarWidthConfig();

    this.dataService.data$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.onData(data));

    this.dataService.total$
      .pipe(takeUntil(this.destroy$))
      .subscribe((total) => {
        this.total = total;
        this.recalcularTotales();
      });

    this.dataService.totals$
      .pipe(takeUntil(this.destroy$))
      .subscribe((totales) => {
        this.totalesServicio = totales;
        this.recalcularTotales();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private onData(data: T[]): void {
    this.data = data;
    this.edit?.sincronizar(data);

    // Sin rowKey la clave es el índice, y al paginar apuntaría a otra fila
    if (!this.config.rowKey) this.expand.limpiar();

    this.selection.limpiar();
    this.emitirSeleccion();
    this.recalcularTotales();
  }

  onPageSizeChange() {
    this.dataService.search();
  }

  /**
   * Identidad de la fila para el trackBy, el cache de edición y el expand.
   * Usa, en ese orden: la config, el servicio editable y el índice.
   */
  rowKey = (row: T, index: number): string => {
    if (this.config.rowKey) return this.config.rowKey(row);

    if (this.editableService) {
      try {
        return this.editableService.getRowKey(row);
      } catch {
        return String(index);
      }
    }

    return String(index);
  };

  // Toolbar

  get leftButtons() {
    return this.toolbarButtons.filter((action) => action.position !== 'right');
  }

  get rightButtons() {
    return this.toolbarButtons.filter((action) => action.position === 'right');
  }

  /** Columnas que la grilla agrega antes de las de datos (check, expand, edición, acciones) */
  get systemColumns(): number {
    let cantidad = 0;

    if (this.expand.activo) cantidad++;
    if (this.selection.activa) cantidad++;
    if (this.edit) cantidad++;
    if (this.menuActions.length > 0) cantidad++;

    return cantidad;
  }

  // Anchos

  get resizable(): boolean {
    return !!this.config.resizableColumns;
  }

  /** Una columna se puede arrastrar si la grilla lo permite y la columna no lo bloqueó */
  puedeResize(column: GridColumn<T>): boolean {
    return this.resizable && column.resizable !== false;
  }

  /**
   * Con anchos fijos la tabla tiene que ir en layout fijo: si no, el navegador
   * reparte a su criterio y el arrastre no se nota.
   */
  get tableLayout(): 'auto' | 'fixed' {
    return this.resizable || this.columns.hasWidths ? 'fixed' : 'auto';
  }

  onResize(column: GridColumn<T>, { width }: NzResizeEvent) {
    if (!width) return;

    this.columns.setWidth(column, width);
    this.actualizarWidthConfig();
  }

  private actualizarWidthConfig() {
    // Vacío deja que la tabla se siga midiendo sola, como antes de los anchos
    this.widthConfig =
      this.resizable || this.columns.hasWidths
        ? this.columns.widthConfig(this.anchosDeSistema())
        : [];
  }

  /** En el mismo orden en que el template dibuja las columnas de sistema */
  private anchosDeSistema(): (string | null)[] {
    const anchos: (string | null)[] = [];

    if (this.expand.activo) anchos.push(ANCHOS_SISTEMA.expand);
    if (this.selection.activa) anchos.push(ANCHOS_SISTEMA.seleccion);
    if (this.edit) anchos.push(ANCHOS_SISTEMA.edicion);
    if (this.menuActions.length > 0) anchos.push(ANCHOS_SISTEMA.acciones);

    return anchos;
  }

  // Selección

  onRowChecked(row: T, checked: boolean) {
    this.selection.toggle(row, checked, this.data);
    this.emitirSeleccion();
  }

  onAllChecked(checked: boolean) {
    this.selection.toggleTodas(checked, this.data);
    this.emitirSeleccion();
  }

  private emitirSeleccion() {
    this.selectedRows = this.selection.rows;
    this.selectedRowsChange.emit(this.selectedRows);
  }

  // Expandir

  onExpandChange(row: T, index: number, abierta: boolean) {
    this.expand.toggle(this.rowKey(row, index), abierta);
  }

  estaExpandida(row: T, index: number): boolean {
    return this.expand.esta(this.rowKey(row, index));
  }

  // Filtros y ordenamiento

  hasFilter(key: keyof T): boolean {
    return !!this.dataService.state.filters?.[key as string];
  }

  onFilterVisibleChange(visible: boolean, column: GridColumn<T>) {
    if (!visible) return;

    this.activeFilterColumn = column.key.toString();
    this.searchValue.setValue(
      this.dataService.state.filters?.[column.key as string] ?? ''
    );
  }

  applyFilter(field: string) {
    this.dataService.setFilter(field, this.searchValue.getRawValue());
    this.filterVisible[field] = false;
  }

  resetFilter(field: string) {
    this.dataService.setFilter(field, null);
    this.filterVisible[field] = false;
    this.searchValue.reset();
  }

  getSortOrder(key: keyof T): NzTableSortOrder {
    const sort = this.dataService.state.sort;
    if (!sort || sort.field !== key) return null;

    return sort.direction === 'asc' ? 'ascend' : 'descend';
  }

  onSort(key: keyof T, order: NzTableSortOrder) {
    if (!order) {
      this.dataService.setSort(key as string, null);
      return;
    }

    const direction = order === 'ascend' ? 'asc' : 'desc';
    this.dataService.setSort(key as string, direction);
  }

  // Totales

  /** Total ya calculado de la columna, o null si no está sumarizada */
  totalDe(column: GridColumn<T>): number | null {
    return this.totales[String(column.key)] ?? null;
  }

  private recalcularTotales() {
    if (!this.columns?.hasSummary) return;

    this.totales = this.columns.totales(
      this.data,
      this.totalesServicio,
      this.total,
    );
  }

  private isEditableService(svc: any): svc is EditableGridService<T> {
    return svc && typeof svc.getRowKey === 'function' && typeof svc.update === 'function';
  }
}
