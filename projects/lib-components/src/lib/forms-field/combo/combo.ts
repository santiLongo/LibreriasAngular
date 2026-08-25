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
  Observable,
  of,
  Subscription,
  take,
} from 'rxjs';
import { ComboType } from './models/combo-type';
import {
  COMBO_DATA_PROVIDER,
  IComboDataProvider,
} from './services/combo-http.service';

@Component({
  standalone: true,
  selector: 'app-combo',
  templateUrl: './combo.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboComponent),
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
export class ComboComponent
  implements ControlValueAccessor, OnChanges, AfterViewInit, DoCheck, OnDestroy
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

  value: string | number | null = null;
  disabled = false;

  loaded = false;
  private loading = false;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['extraParams'] && !changes['extraParams'].firstChange) {
      this.loaded = false;
      this.loadData();
    }

    if (changes['type'] && !changes['type'].firstChange) {
      this.loaded = false;
      this.loadData();
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
    this.value = value ?? null;

    // 🔥 si viene valor y todavía no cargaste datos, cargalos
    if (this.value != null && !this.loaded && !this.loading) {
      this.loading = true;

      const obs = this.isLocal
        ? of(this.data)
        : this.dataProvider.getDataCombo(this.type, this.extraParams);

      obs.pipe(take(1)).subscribe((data) => {
        this.data$ = of(data);
        this.loaded = true;
        this.loading = false;

        // esperar render para que mat-select tome el valor
        queueMicrotask(() => {
          this.matSelect?.writeValue(this.value);
        });
      });

      return;
    }

    // caso normal
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
    this.value = value ?? null;
    this.onChange(this.value);
    this.onTouched();
  }

  handleClick() {
    if (this.loaded || this.loading) return;

    this.loading = true;

    const obs = this.isLocal
      ? of(this.data)
      : this.dataProvider.getDataCombo(this.type, this.extraParams);

    obs.subscribe((data) => {
      this.data$ = of(data);
      this.loaded = true;
      this.loading = false;

      // MatSelect no abre si la lista de opciones está vacía, así que primero
      // renderizamos las mat-option y recién ahí lo abrimos.
      // (No sirve esperar a zone.onStable: la app es zoneless y nunca emite.)
      this.changeDetectorRef.detectChanges();

      // en readonly no hay mat-select
      if (!this.matSelect?.panelOpen) {
        this.matSelect?.open();
      }
    });
  }

  clear(): void {
    this.onSelectionChange(null);
    this.matSelect?.writeValue(null);
  }

  trackByNumero = (_: number, item: ComboType) => item.numero;

  compareByNumero = (a: any, b: any): boolean => {
    return a === b;
  };

  getDescripcion(items: ComboType[] | null): string {
    if (!items) return '';

    const found = items.find((x) => x.numero === this.value);
    return found?.descripcion ?? '';
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== '';
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
