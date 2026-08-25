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
  OnInit,
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
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, distinctUntilChanged, Observable, of, Subscription, take } from 'rxjs';
import {
  COMBO_DATA_PROVIDER,
  IComboDataProvider,
} from '../combo/services/combo-http.service';
import { ComboType } from './models/combo-type';

/** Teclas que dejamos pasar al mat-select para poder navegar desde el buscador */
const TECLAS_NAVEGACION = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'];

@Component({
  standalone: true,
  selector: 'app-multiple-combo',
  templateUrl: './multiple-combo.html',
  viewProviders: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultipleComboComponent),
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
  ],
})
export class MultipleComboComponent
  implements
    ControlValueAccessor,
    OnInit,
    OnChanges,
    AfterViewInit,
    DoCheck,
    OnDestroy
{
  @ViewChild(MatSelect) matSelect!: MatSelect;
  @ViewChild('buscador') buscadorRef?: ElementRef<HTMLInputElement>;

  /** Sólo existe cuando el combo está en readonly */
  @ViewChild('readonlyInput', { read: MatInput }) readonlyInput?: MatInput;

  @Input({ required: true }) label!: string;
  @Input() type = '';
  @Input() isLocal = false;
  @Input() data: ComboType[] = [];
  @Input() readonly = false;
  @Input() extraParams: any;

  value: (string | number)[] = [];
  disabled = false;

  items: ComboType[] = [];

  /** Texto del buscador que está adentro del panel */
  search = '';

  cargando = false;

  /**
   * Ni el mat-select ni el input tienen su propio formControl, así que Material
   * nunca los marca en error por las suyas. Con este matcher le decimos cuándo
   * están en error mirando el control del CVA.
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

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const cambio =
      (changes['extraParams'] && !changes['extraParams'].firstChange) ||
      (changes['type'] && !changes['type'].firstChange);

    if (cambio) {
      this.cargarDatos();
    }
  }

  ngAfterViewInit(): void {
    const control = this.ngControl?.control;
    if (control) {
      this.subscriptions.add(
        control.statusChanges.subscribe(() => this.refreshErrorState()),
      );
      this.subscriptions.add(
        this.touched$.subscribe(() => {
          this.refreshErrorState();
        }),
      );
      this.refreshErrorState();
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

  private refreshErrorState(): void {
    this.matSelect?.updateErrorState();
    this.readonlyInput?.updateErrorState();
  }

  /** La data se guarda en un array: si no, cada tecla del buscador re-dispara la request */
  private cargarDatos(): void {
    const obs: Observable<ComboType[]> = this.isLocal
      ? of(this.data)
      : this.dataProvider.getDataCombo(this.type, this.extraParams);

    this.cargando = true;

    obs.pipe(take(1)).subscribe((items) => {
      this.items = items ?? [];
      this.cargando = false;
      this.changeDetectorRef.markForCheck();
    });
  }

  writeValue(value: any): void {
    this.value = value ?? [];

    queueMicrotask(() => {
      this.matSelect?.writeValue(this.value);
    });
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

  onSelectionChange(value: any): void {
    this.value = value ?? [];
    this.onChange(this.value);
    this.onTouched();

    // después de elegir, el foco vuelve al panel: se lo devolvemos al buscador
    // para poder seguir filtrando sin tener que clickearlo
    if (this.matSelect?.panelOpen) {
      this.enfocarBuscador();
    }
  }

  onPanelToggle(abierto: boolean): void {
    if (abierto) {
      // que se pueda tipear apenas se abre
      this.enfocarBuscador();
      return;
    }

    this.onTouched();
    this.limpiarBusqueda();
  }

  /** El input vive en el panel, que se crea y se destruye en cada apertura. */
  private enfocarBuscador(): void {
    setTimeout(() => this.buscadorRef?.nativeElement.focus());
  }

  onSearchChange(value: string): void {
    this.search = value;
  }

  /**
   * Las letras se quedan en el buscador (si no, el typeahead del mat-select
   * mueve la selección), pero las flechas y el enter siguen navegando.
   */
  onBuscadorKeydown(event: KeyboardEvent): void {
    if (!TECLAS_NAVEGACION.includes(event.key)) {
      event.stopPropagation();
    }
  }

  coincide(item: ComboType): boolean {
    const busqueda = this.normalizar(this.search);
    if (!busqueda) return true;

    return this.normalizar(item.descripcion).includes(busqueda);
  }

  clear(): void {
    this.onSelectionChange([]);
    this.matSelect?.writeValue([]);
    this.limpiarBusqueda();
  }

  private limpiarBusqueda(): void {
    if (!this.search) return;

    this.search = '';
    this.changeDetectorRef.markForCheck();
  }

  compareByNumero = (a: any, b: any): boolean => a === b;

  /** Sin mayúsculas ni acentos, para que "cordoba" encuentre "Córdoba" */
  private normalizar(texto: string): string {
    return (texto ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  get hayResultados(): boolean {
    return this.items.some((item) => this.coincide(item));
  }

  get descripcionSeleccionada(): string {
    if (!this.value?.length) return '';

    return this.items
      .filter((x) => this.value.includes(x.numero))
      .map((x) => x.descripcion)
      .join(', ');
  }

  get hasValue(): boolean {
    return this.value.length > 0;
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
