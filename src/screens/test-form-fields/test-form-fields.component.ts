import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  ButtonComponent,
  COMBO_DATA_PROVIDER,
  ComboComponent,
  ComboType,
  CoreViewComponent,
  CuitMaskComponent,
  DateFormFieldComponent,
  DecimalFormFieldComponent,
  FormFieldComponent,
  MultipleComboComponent,
  NumberFormFieldComponent,
  TextareaFormFieldComponent,
  ViajeMaskComponent,
} from 'lib-components';
import { MockComboDataProvider } from './services/mock-combo.service';

interface FieldInfo {
  key: string;
  selector: string;
}

@Component({
  selector: 'app-test-form-fields',
  templateUrl: './test-form-fields.component.html',
  styleUrl: './test-form-fields.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CoreViewComponent,
    ButtonComponent,
    FormFieldComponent,
    NumberFormFieldComponent,
    DecimalFormFieldComponent,
    TextareaFormFieldComponent,
    DateFormFieldComponent,
    ComboComponent,
    MultipleComboComponent,
    ViajeMaskComponent,
    CuitMaskComponent,
  ],
  providers: [
    MockComboDataProvider,
    { provide: COMBO_DATA_PROVIDER, useExisting: MockComboDataProvider },
  ],
})
export class TestFormFieldsComponent {
  readonly mockProvider = inject(MockComboDataProvider);

  /** Data para los combos que trabajan en modo local (isLocal = true) */
  readonly monedas: ComboType[] = [
    { numero: 'ARS', descripcion: 'Peso argentino' },
    { numero: 'USD', descripcion: 'Dólar estadounidense' },
    { numero: 'EUR', descripcion: 'Euro' },
    { numero: 'BRL', descripcion: 'Real brasileño' },
  ];

  readonly tags: ComboType[] = [
    { numero: 1, descripcion: 'Urgente' },
    { numero: 2, descripcion: 'Facturado' },
    { numero: 3, descripcion: 'Con demora' },
    { numero: 4, descripcion: 'Revisar' },
    { numero: 5, descripcion: 'Cerrado' },
  ];

  readonly form = new FormGroup({
    texto: new FormControl<string | null>(null),
    email: new FormControl<string | null>(null),
    numero: new FormControl<number | null>(null),
    decimal: new FormControl<number | null>(null),
    decimal4: new FormControl<number | null>(null),
    textarea: new FormControl<string | null>(null),
    fecha: new FormControl<Date | null>(null),
    comboLocal: new FormControl<string | number | null>(null),
    comboRemoto: new FormControl<string | number | null>(null),
    comboDependiente: new FormControl<string | number | null>(null),
    comboEstado: new FormControl<string | number | null>(null),
    multipleLocal: new FormControl<(string | number)[]>([]),
    multipleRemoto: new FormControl<(string | number)[]>([]),
    viaje: new FormControl<string | null>(null),
    cuit: new FormControl<string | null>(null),
  });

  /** Se aplican / sacan con el toggle de validaciones */
  private readonly validators: Record<string, ValidatorFn[]> = {
    texto: [Validators.required, Validators.minLength(3), Validators.maxLength(20)],
    email: [Validators.required, Validators.email],
    numero: [Validators.required, Validators.min(10), Validators.max(100000)],
    decimal: [Validators.required],
    decimal4: [Validators.required],
    textarea: [Validators.required, Validators.maxLength(50)],
    fecha: [Validators.required],
    comboLocal: [Validators.required],
    comboRemoto: [Validators.required],
    comboDependiente: [Validators.required],
    comboEstado: [Validators.required],
    multipleLocal: [Validators.required],
    multipleRemoto: [Validators.required],
    viaje: [Validators.required],
    cuit: [Validators.required, Validators.minLength(11)],
  };

  readonly fields: FieldInfo[] = [
    { key: 'texto', selector: 'app-form-field' },
    { key: 'email', selector: 'app-form-field' },
    { key: 'numero', selector: 'app-number-form-field' },
    { key: 'decimal', selector: 'app-decimal-form-field' },
    { key: 'decimal4', selector: 'app-decimal-form-field' },
    { key: 'textarea', selector: 'app-textarea-form-field' },
    { key: 'fecha', selector: 'app-date-form-field' },
    { key: 'comboLocal', selector: 'app-combo' },
    { key: 'comboRemoto', selector: 'app-combo' },
    { key: 'comboDependiente', selector: 'app-combo' },
    { key: 'comboEstado', selector: 'app-combo' },
    { key: 'multipleLocal', selector: 'app-multiple-combo' },
    { key: 'multipleRemoto', selector: 'app-multiple-combo' },
    { key: 'viaje', selector: 'app-viaje-mask' },
    { key: 'cuit', selector: 'app-cuit-mask' },
  ];

  readonly = false;
  validando = true;

  /**
   * extraParams del combo dependiente. Es un campo y no un getter a propósito:
   * el combo recarga la data en ngOnChanges, así que la referencia sólo tiene
   * que cambiar cuando cambia de verdad la provincia.
   */
  paramsDependiente: { padre: string | number } | null = null;

  constructor() {
    this.aplicarValidaciones();

    // El combo dependiente se recarga solo cuando cambia la provincia
    this.form.controls.comboRemoto.valueChanges.subscribe((padre) => {
      this.paramsDependiente = padre == null ? null : { padre };
      this.form.controls.comboDependiente.setValue(null);
    });
  }

  toggleReadonly() {
    this.readonly = !this.readonly;
  }

  toggleDisabled() {
    if (this.form.disabled) {
      this.form.enable();
    } else {
      this.form.disable();
    }
  }

  toggleValidaciones() {
    this.validando = !this.validando;
    this.aplicarValidaciones();
  }

  private aplicarValidaciones() {
    for (const field of this.fields) {
      const control = this.form.get(field.key);
      if (!control) continue;

      control.setValidators(this.validando ? (this.validators[field.key] ?? []) : []);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  cargarValores() {
    this.form.patchValue({
      texto: 'Texto de prueba',
      email: 'santiago@mail.com',
      numero: 1234567,
      decimal: 1234.56,
      decimal4: 0.1234,
      textarea: 'Una observación cargada por código para probar el writeValue.',
      fecha: new Date(),
      comboLocal: 'USD',
      comboRemoto: 2,
      comboEstado: 'A',
      multipleLocal: [1, 3],
      multipleRemoto: [1, 4],
      viaje: 'V-00012345',
      cuit: '20304050607',
    });

    // El dependiente se setea después para que el combo alcance a cargar la data del padre
    setTimeout(() => this.form.controls.comboDependiente.setValue(202), 600);
  }

  limpiar() {
    this.form.reset({ multipleLocal: [], multipleRemoto: [] });
  }

  // ── Patch manual ──────────────────────────────────────────

  /** JSON editable que se aplica con patchValue */
  patchJson = '{\n  "texto": "Hola",\n  "numero": 5000,\n  "fecha": "2026-08-24"\n}';
  patchError: string | null = null;

  /** Patch de un solo control */
  campoElegido = 'texto';
  valorElegido = '';

  /** Carga el valor actual del form en el editor para editarlo y volver a aplicarlo */
  traerValorActual() {
    this.patchJson = JSON.stringify(this.form.getRawValue(), null, 2);
    this.patchError = null;
  }

  /** patchValue con el JSON del editor. Las claves que no existen las ignora Angular. */
  aplicarPatch() {
    const parsed = this.parseJson(this.patchJson);
    if (parsed === undefined) return;

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      this.patchError = 'El JSON tiene que ser un objeto { control: valor }';
      return;
    }

    this.form.patchValue(this.revivir(parsed));
    this.patchError = null;
  }

  /** Igual que aplicarPatch pero pisando todo el form (reset con valor) */
  aplicarReset() {
    const parsed = this.parseJson(this.patchJson);
    if (parsed === undefined) return;

    this.form.reset({ multipleLocal: [], multipleRemoto: [] });
    this.form.patchValue(this.revivir(parsed));
    this.patchError = null;
  }

  /** patchValue de un único control, para probar el writeValue de un componente puntual */
  aplicarPatchCampo() {
    const value = this.parseValor(this.valorElegido);
    this.form.patchValue({ [this.campoElegido]: value });
    this.patchError = null;
  }

  private parseJson(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch (e: any) {
      this.patchError = `JSON inválido: ${e.message}`;
      return undefined;
    }
  }

  /** El input de un solo campo acepta JSON (5, "abc", [1,2], null) o texto plano */
  private parseValor(raw: string): any {
    const trimmed = raw.trim();
    if (trimmed === '') return null;

    try {
      return this.revivirValor(JSON.parse(trimmed));
    } catch {
      return this.revivirValor(trimmed);
    }
  }

  private revivir(obj: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = this.revivirValor(value);
    }
    return out;
  }

  /** El JSON no tiene fechas: convertimos los strings con pinta de fecha a Date */
  private revivirValor(value: any): any {
    if (typeof value !== 'string') return value;

    // Fecha sola (2026-08-24): la armamos local para que no se corra un día por UTC
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (soloFecha) {
      return new Date(+soloFecha[1], +soloFecha[2] - 1, +soloFecha[3]);
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      const fecha = new Date(value);
      if (!isNaN(fecha.getTime())) return fecha;
    }

    return value;
  }

  marcarTouched() {
    this.form.markAllAsTouched();
  }

  loguear() {
    console.log('valor', this.form.value);
    console.log('raw', this.form.getRawValue());
    console.log('status', this.form.status);
    console.log('errores', this.errores());
  }

  errores(): Record<string, any> {
    const out: Record<string, any> = {};
    for (const field of this.fields) {
      const errors = this.form.get(field.key)?.errors;
      if (errors) out[field.key] = errors;
    }
    return out;
  }

  estado(key: string) {
    const control = this.form.get(key);
    if (!control) return null;

    return {
      value: control.value,
      valid: control.valid,
      touched: control.touched,
      dirty: control.dirty,
      disabled: control.disabled,
    };
  }

  tipoDe(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'Date';
    return typeof value;
  }
}
