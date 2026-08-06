import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  forwardRef,
  Input,
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
import { MatNativeDateModule } from '@angular/material/core';
import {
  MatDatepickerInput,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IMaskModule } from 'angular-imask';

@Component({
  standalone: true,
  selector: 'app-date-form-field',
  templateUrl: './date-form-field.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFormFieldComponent),
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
export class DateFormFieldComponent implements ControlValueAccessor {
  @ViewChild(MatDatepickerInput) datepickerInput!: MatDatepickerInput<Date>;

  @Input({ required: true }) label!: string;
  @Input() readonly = false;

  value: Date | null = null;
  disabled = this.readonly;

  onChange = (_: Date | null) => {};
  onTouched = () => {};

  constructor(@Self() @Optional() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: Date | null): void {
    this.value = value;

    // sincroniza el input real del datepicker
    if (this.datepickerInput) {
      this.datepickerInput.value = value;
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

  onDateChange(date: Date | null): void {
    this.value = date;
    this.onChange(date);
  }

  clear(): void {
    this.value = null;
    this.datepickerInput.value = null;
    this.onChange(null);
    this.onTouched();
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
