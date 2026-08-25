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
import { IMaskDirective, IMaskModule } from 'angular-imask';
import { BehaviorSubject, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-cuit-mask',
  templateUrl: './cuit-mask.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CuitMaskComponent),
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
export class CuitMaskComponent
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

  /** El valor del control son los 11 dígitos, sin guiones. */
  value: string | null = null;
  disabled = false;

  readonly maskOptions: any = {
    mask: '00-00000000-0',
    lazy: false,
  };

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

  ngDoCheck(): void {
    const touched = !!this.ngControl?.control?.touched;

    if (touched !== this.touchedSubject.value) {
      this.touchedSubject.next(touched);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  writeValue(value: string | number | null): void {
    this.value = this.normalizar(value);
    this.updateMaskValue(this.value);
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

  /** Con [unmask]="true" el evento trae sólo los dígitos: "20304050607" */
  onAccept(digits: string | null): void {
    this.value = this.normalizar(digits);
    this.onChange(this.value);
    this.revisarCuit();
  }

  onBlur(): void {
    this.onTouched();
  }

  clear(): void {
    this.value = null;
    this.updateMaskValue(null);
    this.onChange(null);
    this.onTouched();
    this.revisarCuit();
    queueMicrotask(() => this.inputRef?.nativeElement.focus());
  }

  /**
   * Le pasamos los dígitos y la máscara se encarga de los guiones.
   * Como escribimos el mismo formato que devuelve, no se dispara el accept.
   */
  private updateMaskValue(value: string | null): void {
    this.imask?.writeValue(value ?? '');
  }

  private normalizar(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) return null;

    const digits = String(value).replace(/\D/g, '');
    return digits ? digits : null;
  }

  /**
   * Agrega o saca el error `cuitInvalido` sin pisar el resto de los errores
   * del control (required, minlength, etc).
   */
  private revisarCuit(): void {
    const control = this.control;
    if (!control) return;

    const invalido =
      !!this.value && this.value.length === 11 && !this.validarCUIT(this.value);

    const errors = { ...(control.errors ?? {}) };
    const teniaError = !!errors['cuitInvalido'];

    if (invalido === teniaError) return;

    if (invalido) {
      errors['cuitInvalido'] = true;
    } else {
      delete errors['cuitInvalido'];
    }

    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private validarCUIT(cuit: string): boolean {
    if (cuit.length !== 11) return false;

    // const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    // const nums = cuit.split('').map(Number);

    // const total = mult.reduce((acc, m, i) => acc + m * nums[i], 0);
    // const mod = 11 - (total % 11);

    // const digito = mod === 11 ? 0 : mod === 10 ? 9 : mod;
    // return digito === nums[10];
    return true;
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
    if (errors['cuitInvalido']) return `El CUIT no es válido`;
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;

    return 'Valor inválido';
  }
}
