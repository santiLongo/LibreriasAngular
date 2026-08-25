import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DoCheck,
  forwardRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { IMaskModule } from 'angular-imask';
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import {
  COMBO_DATA_PROVIDER,
  IComboDataProvider,
} from '../combo/services/combo-http.service';
import { ComboType } from './models/combo-type';

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
    IMaskModule,
  ],
})
export class MultipleComboComponent
  implements
    ControlValueAccessor,
    OnInit,
    OnChanges,
    AfterViewInit,
    DoCheck,
    OnDestroy
{
  @ViewChild(MatSelect) matSelect!: MatSelect;

  /** Sólo existe cuando el combo está en readonly */
  @ViewChild('readonlyInput', { read: MatInput }) readonlyInput?: MatInput;

  @Input({ required: true }) label!: string;
  @Input() type = '';
  @Input() isLocal = false;
  @Input() data: ComboType[] = [];
  @Input() readonly = false;
  @Input() extraParams: any;

  data$!: Observable<ComboType[]>;

  value: (string | number)[] = [];
  disabled = false;

  search = '';
  filteredData$!: Observable<ComboType[]>;

  /**
   * Ni el mat-select ni el input tienen su propio formControl, así que Material
   * nunca los marca en error por las suyas. Con este matcher le decimos cuándo
   * están en error mirando el control del CVA.
   */
  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.showError,
  };

  private onChange = (_: any) => {};
  private onTouched = () => {};

  private subscriptions = new Subscription();

  private readonly touchedSubject = new BehaviorSubject<boolean>(false);

  readonly touched$ = this.touchedSubject.asObservable().pipe(distinctUntilChanged());

  constructor(
    @Inject(COMBO_DATA_PROVIDER) private dataProvider: IComboDataProvider,
    private changeDetectorRef: ChangeDetectorRef,
    @Self() @Optional() public ngControl: NgControl,
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.loadData();
    this.aplicarFiltro(this.search);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['extraParams'] && !changes['extraParams'].firstChange) {
      this.loadData();
      this.aplicarFiltro(this.search);
    }

    if (changes['type'] && !changes['type'].firstChange) {
      this.loadData();
      this.aplicarFiltro(this.search);
    }
  }

  ngAfterViewInit(): void {
    const control = this.ngControl?.control;
    if (control) {
      this.subscriptions.add(
        control.statusChanges.subscribe(() => this.refreshErrorState()),
      );
      this.subscriptions.add(
        this.touched$.subscribe(() => {
          this.refreshErrorState();
        }),
      );
      this.refreshErrorState();
    }

    this.changeDetectorRef.detectChanges();
  }

  ngDoCheck(): void {
    const touched = !!this.ngControl?.control?.touched;

    if (touched !== this.touchedSubject.value) {
      this.touchedSubject.next(touched);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private refreshErrorState(): void {
    this.matSelect?.updateErrorState();
    this.readonlyInput?.updateErrorState();
  }

  private loadData() {
    this.data$ = this.isLocal
      ? of(this.data)
      : this.dataProvider.getDataCombo(this.type, this.extraParams);
  }

  writeValue(value: any): void {
    this.value = value ?? [];

    queueMicrotask(() => {
      this.matSelect?.writeValue(this.value);
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
    this.value = value ?? [];
    this.onChange(this.value);
    this.onTouched();
  }

  clear(): void {
    this.onSelectionChange([]);
    this.matSelect?.writeValue([]);
  }

  trackByNumero = (_: number, item: ComboType) => item.numero;

  compareByNumero = (a: any, b: any): boolean => a === b;

  onSearchChange(value: string) {
    this.search = value;
    this.aplicarFiltro(value);
  }

  private aplicarFiltro(search: string) {
    this.filteredData$ = this.data$.pipe(
      map((items) =>
        items.filter((x) =>
          x.descripcion.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    );
  }

  getDescripcion(items: ComboType[] | null): string {
    if (!items || !this.value?.length) return '';

    const seleccionados = items.filter((x) => this.value.includes(x.numero));

    return seleccionados.map((x) => x.descripcion).join(', ');
  }

  get hasValue(): boolean {
    return this.value.length > 0;
  }

  get control(): FormControl | null {
    return (this.ngControl?.control as FormControl) ?? null;
  }

  get showError(): boolean {
    const control = this.control;
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  get errorMessage(): string | null {
    const errors = this.control?.errors;
    if (!errors) return null;

    if (errors['required']) return `${this.label} es obligatorio`;
    if (errors['max']) return `Máximo ${errors['max'].max}`;
    if (errors['min']) return `Mínimo ${errors['min'].min}`;

    return 'Valor inválido';
  }
}
