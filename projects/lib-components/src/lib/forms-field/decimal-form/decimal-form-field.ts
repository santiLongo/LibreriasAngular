import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnInit,
  Optional,
  Self,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  ReactiveFormsModule,
  NgControl,
  FormControl,
} from '@angular/forms';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { InputMask, InputMaskElement } from 'imask';
import { IMaskModule, IMaskPipe } from 'angular-imask';

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
export class DecimalFormFieldComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  @ViewChild('input', { static: true })
  inputRef!: ElementRef<HTMLInputElement>;

  @Input({ required: true }) label!: string;
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() decimals = 2;

  @Input() value: number | null = null;

  private maskRef: any;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  maskOptions: any;

  constructor(@Optional() @Self() public ngControl: NgControl) {
  if (this.ngControl) {
    this.ngControl.valueAccessor = this;
  }
}

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.maskOptions = {
      mask: Number,
      scale: this.decimals,
      signed: false,
      thousandsSeparator: '.',
      radix: ',',
      mapToRadix: ['.'],
      normalizeZeros: true,
    };
  }

  onAccept(e: string) {
    const raw = e as string; // tu valor actual

    const normalized = raw
      .replace(/\./g, '') // sacar miles
      .replace(',', '.'); // decimal a punto

    const value = Number(normalized);

    this.value = value;
    this.onChange(value);
  }

  writeValue(value: number | null): void {
    this.value = value;

    // setear valor en IMask
    const input = this.inputRef?.nativeElement;
    if (!input) return;

    if (value == null) {
      input.value = '';
      return;
    }

    // formatear manualmente para IMask
    const formatted = value.toFixed(this.decimals).replace('.', ',');

    input.value = formatted;
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  clear() {
    this.value = null;
    this.onChange(null);

    const el = this.inputRef.nativeElement as any;
    if (el?.maskRef) {
      el.maskRef.value = '';
    }
  }

  handleBlur() {
    this.onTouched();
  }

  get control(): FormControl | null {
    return this.ngControl.control as FormControl | null;
  }

  get showError(): boolean {
    // return !!this.control && this.control.invalid && this.control.touched;
    const c = this.control;
    return !!c && c.invalid && (c.touched || c.dirty);
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
