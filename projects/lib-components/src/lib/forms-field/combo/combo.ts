import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  forwardRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Self,
  SimpleChanges,
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
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { BehaviorSubject, distinctUntilChanged, Observable, of, Subscription, take } from 'rxjs';
import { ComboType } from './models/combo-type';
import {
  COMBO_DATA_PROVIDER,
  IComboDataProvider,
} from './services/combo-http.service';

@Component({
  standalone: true,
  selector: 'app-combo',
  templateUrl: './combo.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboComponent),
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
    MatAutocompleteModule,
  ],
})
export class ComboComponent
  implements ControlValueAccessor, OnChanges, AfterViewInit, DoCheck, OnDestroy
{
  @ViewChild('input') inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) trigger?: MatAutocompleteTrigger;

  /** Es el input editable o el de readonly, según la rama del template */
  @ViewChild(MatInput) matInput?: MatInput;

  @Input({ required: true }) label!: string;
  @Input() type = '';
  @Input() isLocal = false;
  @Input() data: ComboType[] = [];
  @Input() readonly = false;
  @Input() extraParams: any;

  /** numero de la opción elegida */
  value: string | number | null = null;
  disabled = false;

  /** Lo que se ve en el input: siempre la descripción de la opción elegida */
  texto = '';

  items: ComboType[] = [];
  filtrados: ComboType[] = [];

  loaded = false;
  loading = false;

  /**
   * Ni el input tiene su propio formControl, así que Material nunca lo marca
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
    @Inject(COMBO_DATA_PROVIDER) private dataProvider: IComboDataProvider,
    private changeDetectorRef: ChangeDetectorRef,
    @Self() @Optional() public ngControl: NgControl,
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const cambio =
      (changes['extraParams'] && !changes['extraParams'].firstChange) ||
      (changes['type'] && !changes['type'].firstChange);

    if (!cambio) return;

    const yaEstabaCargado = this.loaded;

    this.items = [];
    this.filtrados = [];
    this.texto = '';
    this.loaded = false;
    this.loading = false;

    // si el usuario ya lo había abierto, recargamos para que no quede vacío
    if (yaEstabaCargado) {
      this.asegurarDatos(false);
    }
  }

  ngAfterViewInit(): void {
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

  writeValue(value: any): void {
    this.value = value ?? null;

    // si viene valor y todavía no cargaste datos, cargalos para poder mostrar
    // la descripción
    if (this.value != null && !this.loaded && !this.loading) {
      this.asegurarDatos(false);
      return;
    }

    this.texto = this.descripcionDe(this.value);
    this.changeDetectorRef.markForCheck();
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

  /** Click en cualquier parte del campo */
  handleClick(): void {
    if (this.readonly || this.disabled) return;

    this.asegurarDatos(true);
  }

  onFocus(): void {
    // al entrar mostramos la lista completa, no filtrada por el texto que quedó
    this.filtrados = this.items;
    this.asegurarDatos(true);
  }

  /** Tipear sólo filtra: el valor cambia únicamente al elegir una opción */
  onInput(texto: string): void {
    this.texto = texto;
    this.filtrar(texto);
  }

  onOptionSelected(numero: string | number): void {
    this.value = numero;
    this.texto = this.descripcionDe(numero);
    this.filtrados = this.items;

    this.onChange(this.value);
    this.onTouched();
  }

  /**
   * No se puede quedar con texto libre: al salir se restaura la descripción de
   * la opción elegida (o vacío si no hay ninguna).
   */
  onBlur(): void {
    this.onTouched();

    this.texto = this.descripcionDe(this.value);
    this.filtrados = this.items;
    this.changeDetectorRef.markForCheck();
  }

  clear(): void {
    this.value = null;
    this.texto = '';
    this.filtrados = this.items;

    this.onChange(null);
    this.onTouched();

    queueMicrotask(() => this.inputRef?.nativeElement.focus());
  }

  private asegurarDatos(abrirPanel: boolean): void {
    if (this.loading) return;

    if (this.loaded) {
      if (abrirPanel) this.trigger?.openPanel();
      return;
    }

    this.loading = true;

    const obs: Observable<ComboType[]> = this.isLocal
      ? of(this.data)
      : this.dataProvider.getDataCombo(this.type, this.extraParams);

    obs.pipe(take(1)).subscribe((items) => {
      this.items = items ?? [];
      this.filtrados = this.items;
      this.loaded = true;
      this.loading = false;

      if (abrirPanel) {
        // el panel tiene que tener las opciones renderizadas antes de abrirse
        this.changeDetectorRef.detectChanges();
        this.trigger?.openPanel();
      } else {
        this.texto = this.descripcionDe(this.value);
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  private filtrar(texto: string): void {
    const busqueda = this.normalizar(texto);

    this.filtrados = busqueda
      ? this.items.filter((x) => this.normalizar(x.descripcion).includes(busqueda))
      : this.items;
  }

  /**
   * Sin esto, al elegir una opción el trigger del autocomplete escribe el
   * `numero` crudo adentro del input en vez de la descripción.
   */
  mostrarDescripcion = (numero: string | number | null): string =>
    this.descripcionDe(numero);

  private descripcionDe(numero: string | number | null): string {
    if (numero === null) return '';

    return this.items.find((x) => x.numero === numero)?.descripcion ?? '';
  }

  /** Sin mayúsculas ni acentos, para que "cordoba" encuentre "Córdoba" */
  private normalizar(texto: string): string {
    return (texto ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== '';
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
