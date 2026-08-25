import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DoCheck,
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
import {
  MatDatepickerInput,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IMaskModule } from 'angular-imask';
import { BehaviorSubject, distinctUntilChanged, Subscription } from 'rxjs';

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
    IMaskModule,
  ],
})
export class DateFormFieldComponent
  implements ControlValueAccessor, AfterViewInit, DoCheck, OnDestroy
{
  @ViewChild(MatDatepickerInput, { static: true })
  datepickerInput!: MatDatepickerInput<Date>;

  @ViewChild(MatInput, { static: true })
  matInput!: MatInput;

  @Input({ required: true }) label!: string;
  @Input() readonly = false;

  value: Date | null = null;
  disabled = false;

  /**
   * El input no tiene su propio formControl, así que Material nunca lo marca
   * en error por las suyas. Con este matcher le decimos cuándo está en error
   * mirando el control del CVA.
   */
  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.showError,
  };

  private onChange: (value: Date | null) => void = () => {};
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
    // Si el valor llegó por writeValue antes de que existiera el datepicker,
    // recién acá lo podemos mostrar.
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

  writeValue(value: Date | null): void {
    this.value = value ?? null;
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

  onDateChange(date: Date | null): void {
    this.value = date;
    this.onChange(date);
    this.onTouched();
  }

  onBlur(): void {
    this.onTouched();
  }

  clear(): void {
    this.value = null;
    this.pintarValor(null);
    this.onChange(null);
    this.onTouched();
  }

  /** El texto del input lo escribe el propio MatDatepickerInput al setearle el value. */
  private pintarValor(value: Date | null): void {
    if (!this.datepickerInput) return;

    this.datepickerInput.value = value;
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
    if (errors['matDatepickerParse']) return `Fecha inválida`;
    if (errors['matDatepickerMin']) return `La fecha es muy antigua`;
    if (errors['matDatepickerMax']) return `La fecha es muy futura`;
    if (errors['max']) return `Máximo ${errors['max'].max}`;
    if (errors['min']) return `Mínimo ${errors['min'].min}`;

    return 'Valor inválido';
  }
}
