import { CommonModule } from '@angular/common';
import {
  Component,
  forwardRef,
  Input,
  ViewChild,
  ElementRef,
  Optional,
  Self,
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  FormsModule,
  ReactiveFormsModule,
  NgControl,
  FormControl,
} from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IMaskModule } from 'angular-imask';

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
    IMaskModule
  ],
})
export class NumberFormFieldComponent implements ControlValueAccessor {
  @Input({ required: true }) label!: string;
  @Input() readonly = false;

  @ViewChild('input', { static: true })
  inputRef!: ElementRef<HTMLInputElement>;

  value: number | null = null;
  disabled = false;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(@Self() @Optional() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: number | null): void {
    this.value = value;

    if (value === null) {
      this.inputRef.nativeElement.value = '';
    } else {
      this.inputRef.nativeElement.value = this.format(value);
    }
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

    if (!digits) {
      this.value = null;
      this.onChange(null);
      this.inputRef.nativeElement.value = '';
      return;
    }

    const parsed = Number(digits);

    this.value = parsed;
    this.onChange(parsed);

    this.inputRef.nativeElement.value = this.format(parsed);
  }

  onBlur(): void {
    this.onTouched();
  }

  clear(): void {
    this.value = null;
    this.onChange(null);
    this.onTouched();
    queueMicrotask(() => this.inputRef?.nativeElement.focus());
  }

  private format(value: number): string {
    return value.toLocaleString('es-AR');
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
      return `Máximo ${errors['max'].max}`;
    if (errors['min'])
      return `Mínimo ${errors['min'].min}`;

    return 'Valor inválido';
  }
}
