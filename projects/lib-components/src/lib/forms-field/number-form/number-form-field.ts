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
import { ErrorStateMatcher, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IMaskModule } from 'angular-imask';
import { BehaviorSubject, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-number-form-field',
  templateUrl: './number-form-field.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberFormFieldComponent),
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
export class NumberFormFieldComponent
  implements ControlValueAccessor, AfterViewInit, DoCheck, OnDestroy
{
  @ViewChild('input', { static: true })
  inputRef!: ElementRef<HTMLInputElement>;

  @ViewChild(MatInput, { static: true })
  matInput!: MatInput;

  @Input({ required: true }) label!: string;
  @Input() readonly = false;

  value: number | null = null;
  disabled = false;

  /**
   * El input no tiene su propio formControl, así que Material nunca lo marca
   * en error por las suyas. Con este matcher le decimos cuándo está en error
   * mirando el control del CVA.
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
    @Self() @Optional() public ngControl: NgControl,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngAfterViewInit(): void {
    // Si el valor llegó por writeValue antes de que existiera el input,
    // recién acá lo podemos mostrar formateado.
    this.pintarValor(this.value);

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

  ngDoCheck(): void {
    const touched = !!this.ngControl?.control?.touched;

    if (touched !== this.touchedSubject.value) {
      this.touchedSubject.next(touched);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  writeValue(value: number | null): void {
    this.value = this.normalizar(value);
    this.pintarValor(this.value);
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

  onInput(raw: string): void {
    const digits = raw.replace(/\D/g, '');

    this.value = digits ? Number(digits) : null;
    this.onChange(this.value);

    this.pintarValor(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  clear(): void {
    this.value = null;
    this.pintarValor(null);
    this.onChange(null);
    this.onTouched();
    queueMicrotask(() => this.inputRef?.nativeElement.focus());
  }

  /**
   * El valor del input lo manejamos a mano (no por binding) porque lo que se
   * muestra es el número formateado y no el valor crudo del control.
   */
  private pintarValor(value: number | null): void {
    const input = this.inputRef?.nativeElement;
    if (!input) return;

    input.value = value === null ? '' : this.format(value);
  }

  private format(value: number): string {
    return value.toLocaleString('es-AR');
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
    if (errors['email']) return `Formato inválido`;
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['max']) return `Máximo ${errors['max'].max}`;
    if (errors['min']) return `Mínimo ${errors['min'].min}`;

    return 'Valor inválido';
  }
}
