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
import IMask from 'imask';
import { BehaviorSubject, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-viaje-mask',
  templateUrl: './viaje-mask.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ViajeMaskComponent),
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
export class ViajeMaskComponent
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

  value: string | null = null;
  disabled = false;

  /** V- fijo y hasta 8 dígitos. Con lazy: false el prefijo se ve siempre. */
  readonly maskOptions: any = {
    mask: 'V-{NNNNNNNN}',
    lazy: false,
    overwrite: true,
    blocks: {
      NNNNNNNN: {
        mask: IMask.MaskedNumber,
        scale: 0,
        min: 0,
        max: 99999999,
      },
    },
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

  writeValue(value: string | null): void {
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

  /** El evento trae el valor con máscara: "V-00012345" */
  onAccept(masked: string | null): void {
    this.value = this.normalizar(masked);
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  clear(): void {
    this.value = null;
    this.updateMaskValue(null);
    this.onChange(null);
    this.onTouched();
    queueMicrotask(() => this.inputRef?.nativeElement.focus());
  }

  private updateMaskValue(value: string | null): void {
    this.imask?.writeValue(value ?? '');
  }

  /** Con lazy: false el input nunca está vacío ("V-"), así que sin dígitos es null. */
  private normalizar(value: string | null | undefined): string | null {
    if (!value) return null;

    const digits = value.replace(/\D/g, '');
    return digits ? value : null;
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
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['max']) return `Máximo ${errors['max'].max}`;
    if (errors['min']) return `Mínimo ${errors['min'].min}`;

    return 'Valor inválido';
  }
}
