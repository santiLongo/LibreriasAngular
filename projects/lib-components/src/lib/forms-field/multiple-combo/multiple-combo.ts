import {
  Component,
  Input,
  forwardRef,
  OnInit,
  ViewChild,
  SimpleChanges,
  OnChanges,
  Optional,
  Self,
  Inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { map, Observable, of } from 'rxjs';
import { ComboType } from './models/combo-type';
import { COMBO_DATA_PROVIDER, IComboDataProvider } from '../combo/services/combo-http.service';
import { CommonModule } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { IMaskModule } from 'angular-imask';

@Component({
  standalone: true,
  selector: 'app-multiple-combo',
  templateUrl: './multiple-combo.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultipleComboComponent),
      multi: true,
    },
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatNativeDateModule,
    MatDatepickerModule,
    IMaskModule
  ],
})
export class MultipleComboComponent
  implements ControlValueAccessor, OnInit, OnChanges
{
  @ViewChild(MatSelect) matSelect!: MatSelect;
  @Input({ required: true }) label!: string;
  @Input() type = '';
  @Input() isLocal = false;
  @Input() data: ComboType[] = [];
  @Input() readonly = false;
  @Input() extraParams: any;

  data$!: Observable<ComboType[]>;

  value: (string | number)[] = [];
  disabled = this.readonly;

  search = '';
  filteredData$!: Observable<ComboType[]>;

  private pendingValue: any[] = [];

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(
    @Inject(COMBO_DATA_PROVIDER) private dataProvider: IComboDataProvider,
    @Self() @Optional() public ngControl: NgControl,
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.loadData();

    this.filteredData$ = this.data$.pipe(
      map((items) =>
        items.filter((x) =>
          x.descripcion.toLowerCase().includes(this.search.toLowerCase()),
        ),
      ),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['extraParams'] && !changes['extraParams'].firstChange) {
      this.loadData();
    }

    if (changes['type'] && !changes['type'].firstChange) {
      this.loadData();
    }
  }

  private loadData() {
    this.data$ = this.isLocal
      ? of(this.data)
      : this.dataProvider.getDataCombo(this.type, this.extraParams);
  }

  writeValue(value: any): void {
    this.value = value ?? [];

    queueMicrotask(() => {
      if (this.matSelect) {
        this.matSelect.writeValue(this.value);
      }
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectionChange(value: any): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  clear(): void {
    this.onSelectionChange([]);
  }

  trackByNumero = (_: number, item: ComboType) => item.numero;

  compareByNumero = (a: any, b: any): boolean => a === b;

  onSearchChange(value: string) {
    this.search = value;
    this.filteredData$ = this.data$.pipe(
      map((items) =>
        items.filter((x) =>
          x.descripcion.toLowerCase().includes(value.toLowerCase()),
        ),
      ),
    );
  }

  getDescripcion(items: ComboType[] | null): string {
    if (!items || !this.value?.length) return '';

    const seleccionados = items.filter((x) => this.value.includes(x.numero));

    return seleccionados.map((x) => x.descripcion).join(', ');
  }

  get control() {
    return this.ngControl?.control as FormControl;
  }

  get showError(): boolean {
    return !!this.control && this.control.invalid && this.control.touched;
  }

  get errorMessage(): string | null {
    const errors = this.control?.errors;
    if (!errors) return null;

    if (errors['required']) return `${this.label} es obligatorio`;
    if (errors['email']) return `Formato inválido`;
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['max'])
      return `Máximo ${errors['max'].requiredLength}`;
    if (errors['min'])
      return `Mínimo ${errors['min'].requiredLength}`;


    return 'Valor inválido';
  }
}
