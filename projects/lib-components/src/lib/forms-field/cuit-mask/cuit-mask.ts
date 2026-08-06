import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  Optional,
  Self,
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  ReactiveFormsModule,
  NgControl,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IMaskDirective, IMaskModule } from 'angular-imask';

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
export class CuitMaskComponent implements ControlValueAccessor {
  @ViewChild(IMaskDirective, { static: true }) imask!: IMaskDirective<any>;
  @Input({ required: true }) label!: string;
  @Input() readonly = false;

  @ViewChild('input', { static: true })
  inputRef!: ElementRef<HTMLInputElement>;

  value: string | null = null;
  disabled = false;

  mask = {
    mask: '00-00000000-0',
    lazy: false,
  };

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(@Self() @Optional() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: string | number | null): void {
    if (value === null || value === undefined) {
      this.value = null;
      if (this.imask) this.imask.maskValue = '';
      return;
    }

    const str = String(value);

    this.value = str;

    if (this.imask) {
      this.imask.maskValue = str;
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

  onAccept(masked: string) {
    if (!masked) {
      this.value = null;
      this.onChange(null);
      this.control?.setErrors(null);
      return;
    }

    const limpio = masked.replace(/\D/g, '');

    this.value = masked;

    // const numero = limpio ? Number(limpio) : null;
    // this.onChange(numero);
    this.onChange(limpio || null);

    if (limpio.length === 11) {
      const valido = this.validarCUIT(limpio);

      if (!valido) {
        this.control?.setErrors({ cuitInvalido: true });
      } else {
        const errors = this.control?.errors;
        if (errors) {
          delete errors['cuitInvalido'];
          if (Object.keys(errors).length === 0) {
            this.control.setErrors(null);
          } else {
            this.control.setErrors(errors);
          }
        }
      }
    }
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
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;

    return 'Valor inválido';
  }
}
