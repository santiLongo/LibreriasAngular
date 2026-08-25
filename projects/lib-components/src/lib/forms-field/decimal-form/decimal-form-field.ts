import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  forwardRef,
  Input,
  OnDestroy,
  Optional,
  Self,
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
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { IMaskDirective, IMaskModule } from 'angular-imask';
import { BehaviorSubject, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-decimal-form-field',
  templateUrl: './decimal-form-field.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DecimalFormFieldComponent),
      multi: true,
    },
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    IMaskModule,
  ],
})
export class DecimalFormFieldComponent
  implements ControlValueAccessor, AfterViewInit, DoCheck, OnDestroy
{
  @ViewChild('input', { static: true })
  inputRef!: ElementRef<HTMLInputElement>;

  @ViewChild(IMaskDirective, { static: true })
  imask!: IMaskDirective<any>;

  @ViewChild(MatInput, { static: true })
  matInput!: MatInput;

  @Input({ required: true }) label!: string;
  @Input() readonly = false;

  private _decimals = 2;

  /** Cantidad de decimales que acepta la máscara. */
  @Input()
  set decimals(value: number | null | undefined) {
    this._decimals = value ?? 2;
    this.setMaskOptions();
  }
  get decimals(): number {
    return this._decimals;
  }

  private _allowNegative = false;

  /** Si es false la máscara no deja escribir el signo menos. */
  @Input()
  set allowNegative(value: boolean) {
    this._allowNegative = value;
    this.setMaskOptions();
  }
  get allowNegative(): boolean {
    return this._allowNegative;
  }

  value: number | null = null;
  disabled = false;

  maskOptions: any;

  /**
   * El input no tiene su propio formControl, así que Material nunca lo marca
   * en error por las suyas. Con este matcher le decimos cuándo está en error
   * mirando el control del CVA.
   */
  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.showError,
  };

  private onChange: (value: number | null) => void = () => {};
  private onTouched = () => {};

  private subscriptions = new Subscription();

  constructor(
    @Optional() @Self() public ngControl: NgControl,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Las opciones tienen que estar listas antes del primer render, si no
    // el input arranca sin máscara.
    this.setMaskOptions();
  }

  ngAfterViewInit(): void {
    // Si el valor llegó por writeValue antes de que existiera la máscara,
    // recién acá lo podemos mostrar formateado.
    this.updateMaskValue(this.value);

    const control = this.ngControl?.control;
    if (control) {
      this.subscriptions.add(
        control.statusChanges.subscribe(() => this.matInput?.updateErrorState()),
      );
      this.subscriptions.add(
        this.touched$.subscribe(() => {
          this.matInput?.updateErrorState();
        }),
      );
      this.matInput?.updateErrorState();
    }

    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private readonly touchedSubject = new BehaviorSubject<boolean>(false);

  readonly touched$ = this.touchedSubject.asObservable().pipe(distinctUntilChanged());

  ngDoCheck(): void {
    const touched = !!this.ngControl?.control?.touched;

    if (touched !== this.touchedSubject.value) {
      this.touchedSubject.next(touched);
    }
  }

  private setMaskOptions(): void {
    this.maskOptions = {
      mask: Number,
      scale: this.decimals,
      signed: this.allowNegative,
      thousandsSeparator: '.',
      radix: ',',
      mapToRadix: ['.'],
      padFractionalZeros: true,
      normalizeZeros: false,
    };

    this.imask?.maskRef?.updateOptions(this.maskOptions);
  }

  writeValue(value: number | string | null): void {
    this.value = this.normalizar(value);
    this.updateMaskValue(this.value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Con [unmask]="true" el evento trae el valor sin formato: "1234.56" */
  onAccept(masked: string | null): void {
    this.value = this.normalizar(masked);
    this.onChange(this.value);
  }

  handleBlur(): void {
    this.onTouched();

    if (this.readonly) return;

    // Reescribimos para que se apliquen los ceros de relleno ("12," → "12,00")
    this.updateMaskValue(this.value);
  }

  clear(): void {
    this.value = null;
    this.updateMaskValue(null);
    this.onChange(null);
    this.onTouched();
    queueMicrotask(() => this.inputRef?.nativeElement.focus());
  }

  /**
   * Le pasamos el número como string con punto decimal: la máscara lo mapea
   * al radix y le pone los separadores de miles.
   */
  private updateMaskValue(value: number | null): void {
    this.imask?.writeValue(value === null ? '' : String(value));
  }

  private normalizar(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  get hasValue(): boolean {
    return this.value !== null;
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
