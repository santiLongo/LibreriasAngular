import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IMaskModule } from 'angular-imask';
import IMask, { InputMask } from 'imask';

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
    IMaskModule
  ],
})
export class ViajeMaskComponent implements ControlValueAccessor, AfterViewInit {
  @Input({ required: true }) label!: string;
  @Input() readonly = false;

  @ViewChild('input', { static: true })
  inputRef!: ElementRef<HTMLInputElement>;

  value: string | null = null;
  disabled = false;

  private maskRef!: InputMask<any>;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(@Self() @Optional() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.maskRef = IMask(this.inputRef.nativeElement, {
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
      });

      this.maskRef.on('accept', () => {
        const val = this.maskRef.value || null;
        this.value = val;
        this.onChange(val);
      });

      this.maskRef.on('blur', () => this.onTouched());
    });
  }

  writeValue(value: string | null): void {
    this.value = value;
    if (this.maskRef) this.maskRef.value = value ?? '';
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
    if (this.maskRef) this.maskRef.updateOptions({ lazy: isDisabled });
  }

  clear() {
    this.value = null;
    this.maskRef.value = '';
    this.onChange(null);
    this.onTouched();
    queueMicrotask(() => this.inputRef.nativeElement.focus());
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
