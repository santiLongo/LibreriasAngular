import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzTableModule, NzTableSortOrder } from 'ng-zorro-antd/table';
import {
  GridColumn,
  GridConfig,
  GridMenuAction,
  GridToolBarAction,
  SelectebleSettings,
} from './models/model';
import { Subject, takeUntil } from 'rxjs';
import { BaseGridService } from './services/base-grid.service';
import { DynamicFormatPipe } from './pipes/dynamic-format.pipe';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMenuModule } from 'ng-zorro-antd/menu';
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
  @Input() ref: HttpRef

  data: T[] = [];
  columns: GridColumn<T>[] = [];
  menuActions: GridMenuAction<T>[] = [];
  toolbarButtons: GridToolBarAction<T>[] = [];
  selectableSettings?: SelectebleSettings<T>;
  checked = false;
  indeterminate = false;
  total = 10;
  ICONS = ICONS;
  activeFilterColumn?: string;
  searchValue = new FormControl('');
  filterVisible: Record<string, boolean> = {};
  editableService?: EditableGridService<T>;

  @Input() selectedRows: T[] = [];
  @Output() selectedRowsChange = new EventEmitter<T[]>();
  private selectedSet = new Set<T>();

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.columns = this.buildConfgColumns(this.config.columns);
    this.menuActions = this.config.menuActions ?? [];
    this.toolbarButtons = this.config.toolBarActions ?? [];
    this.selectableSettings = this.config.selectableSettings ?? this.defaultSelectable();

    if (this.config.isEditable && this.isEditableService(this.dataService)) {
      this.editableService = this.dataService;
    }

    if(!this.ref){
      this.ref = this.dataService.ref;
    }

    this.dataService.data$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.data = data;
      this.buildEditCache();
      this.resetSelectionStatus();
    });

    this.dataService.total$
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => (this.total = t));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageSizeChange() {
    this.dataService.search();
  }

  //Defaluts

  private buildConfgColumns<T>(columns: GridColumn<T>[]): GridColumn<T>[] {
    return columns.map(value => {
      return {
        ...value,
        sortable: value.sortable ?? true,
        filter: value.filter ?? false,
        hidden: value.hidden ?? false
      }});
  }

  private defaultSelectable<T>(): SelectebleSettings<T> {
      return {
      type: "single",
      selectable: true
    }
  }

  //Metodos para seleccionar

  isChecked(row: T): boolean {
    return this.selectedSet.has(row);
  }

  onRowChecked(row: T, checked: boolean) {
    if (!this.selectableSettings?.selectable) return;

    if (this.selectableSettings.type === 'single') {
      if (checked) {
        this.selectedSet.clear();
        this.selectedSet.add(row);
      } else {
        this.selectedSet.delete(row);
      }
    } else {
      checked ? this.selectedSet.add(row) : this.selectedSet.delete(row);
    }

    this.refreshSelectionStatus();
  }

  onAllChecked(checked: boolean) {
    if (!this.selectableSettings?.selectable) return;

    const selectableRows = this.data.filter((r) => this.isRowSelectable(r));

    if (this.selectableSettings.type === 'single') {
      this.selectedSet.clear();
    } else {
      selectableRows.forEach((row) => {
        checked ? this.selectedSet.add(row) : this.selectedSet.delete(row);
      });
    }

    this.refreshSelectionStatus();
  }

  private refreshSelectionStatus() {
    const pageData = this.data;

    const selectedOnPage = pageData.filter((r) =>
      this.selectedSet.has(r),
    ).length;

    this.checked = selectedOnPage > 0 && selectedOnPage === pageData.length;
    this.indeterminate = selectedOnPage > 0 && selectedOnPage < pageData.length;

    this.selectedRows = Array.from(this.selectedSet);
    this.selectedRowsChange.emit(this.selectedRows);
  }

  private resetSelectionStatus(): void {
    this.selectedSet.clear();
    this.selectedRows = [];
    this.checked = false;
    this.indeterminate = false;
    this.selectedRowsChange.emit(this.selectedRows);
  }


  public isRowSelectable(row: T): boolean {
    if (!this.selectableSettings?.selectable) return false;
    if (!this.selectableSettings.esSelectable) return true;
    return this.selectableSettings.esSelectable(row);
  }

  get leftButtons() {
    return this.config.toolBarActions?.filter(a => a.position !== 'right') ?? [];
  }

  get rightButtons() {
    return this.config.toolBarActions?.filter(a => a.position === 'right') ?? [];
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

  // Para editable
  trackRow = (index: number, row: T): string => {
    if (!this.editableService) return String(index);
    try {
      return this.editableService.getRowKey(row);
    } catch {
      return String(index);
    }
  };


  private isEditableService(svc: any): svc is EditableGridService<T> {
    return svc && typeof svc.getRowKey === 'function' && typeof svc.update === 'function';
  }

  editCache: Record<string, { edit: boolean; data: T }> = {};
  editingId?: string;

  private buildEditCache() {
    if (!this.editableService) return;

    const newCache: typeof this.editCache = {};

    for (const row of this.data) {
      const key = this.editableService.getRowKey(row);

      newCache[key] = this.editCache[key] ?? {
        edit: false,
        data: structuredClone(row),
      };
    }

    this.editCache = newCache;
  }

  startEdit(row: T) {
    if (!this.editableService) return;
    const key = this.editableService.getRowKey(row);
    this.editingId = key;
    this.editCache[key].edit = true;
  }

  cancelEdit(row: T) {
    if (!this.editableService) return;

    const key = this.editableService.getRowKey(row);
    this.editCache[key].edit = false;
    this.editCache[key].data = structuredClone(row);
    this.editingId = undefined;
  }

  addRow() {
    if (!this.editableService) return;

    const newRow = {} as T;

    this.editableService.add(newRow);

     // esperar microtask para que data$ actualice
    setTimeout(() => {
      const added = this.data[0]; // porque usás unshift
      this.startEdit(added);
    });
  }

  saveEdit(row: T) {
    if (!this.editableService) return;

    const key = this.editableService.getRowKey(row);
    const edited = this.editCache[key].data;

    this.editCache[key].edit = false;
    this.editingId = undefined;

    Object.assign(row, edited);
    this.editableService.update(row);
  }

  removeEdit(row: T) {
    if (!this.editableService) return;

    const key = this.editableService.getRowKey(row);
    const edited = this.editCache[key].data;

    Object.assign(row, edited);
    this.editableService.remove(row);
  }
}
