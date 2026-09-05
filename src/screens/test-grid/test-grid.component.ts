import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import {
  ButtonComponent,
  COMBO_DATA_PROVIDER,
  ComboComponent,
  ComboType,
  CoreViewComponent,
  DecimalFormFieldComponent,
  GridColumn,
  GridComponent,
  GridConfig,
  GridMenuAction,
  GridScrollSettings,
  GridToolBarAction,
  NumberFormFieldComponent,
} from 'lib-components';
import { ESTADOS, EstadoViaje, generarViajes, Viaje } from './data/viajes.data';
import { ViajesGridService } from './services/viajes-grid.service';
import { ViajesEditableGridService } from './services/viajes-editable-grid.service';

/**
 * Los combos de la pantalla son locales ([isLocal]="true"), pero el
 * ComboComponent igual pide el provider por DI: le damos uno vacío para no
 * depender del back.
 */
const COMBO_LOCAL_PROVIDER = { getDataCombo: () => of<ComboType[]>([]) };

type Seleccion = 'ninguna' | 'single' | 'multiple';

/** Todas las opciones menos la selección, que no es un toggle */
type OpcionBool = Exclude<keyof Opciones, 'seleccion'>;

interface Opciones {
  seleccion: Seleccion;
  soloFinalizadas: boolean;
  filtros: boolean;
  sort: boolean;
  menu: boolean;
  toolbar: boolean;
  ocultarDestino: boolean;
  hiddenRefresh: boolean;
  demora: boolean;
  agrupar: boolean;
  expandible: boolean;
  totales: boolean;
  scroll: boolean;
}

@Component({
  selector: 'app-test-grid',
  templateUrl: './test-grid.component.html',
  styleUrl: './test-grid.component.css',
  imports: [
    CommonModule,
    FormsModule,
    CoreViewComponent,
    ButtonComponent,
    GridComponent,
    ComboComponent,
    NumberFormFieldComponent,
    DecimalFormFieldComponent,
  ],
  providers: [
    ViajesGridService,
    ViajesEditableGridService,
    { provide: COMBO_DATA_PROVIDER, useValue: COMBO_LOCAL_PROVIDER },
  ],
})
export class TestGridComponent implements OnInit {
  readonly service = inject(ViajesGridService);
  readonly editableService = inject(ViajesEditableGridService);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Los templates tienen que estar resueltos antes de armar la config, porque
   * GridComponent lee las columnas una sola vez en su ngOnInit.
   */
  @ViewChild('estadoTpl', { static: true }) estadoTpl!: TemplateRef<any>;
  @ViewChild('facturadoTpl', { static: true }) facturadoTpl!: TemplateRef<any>;
  @ViewChild('rutaTpl', { static: true }) rutaTpl!: TemplateRef<any>;
  @ViewChild('detalleTpl', { static: true }) detalleTpl!: TemplateRef<any>;
  @ViewChild('estadoEditTpl', { static: true }) estadoEditTpl!: TemplateRef<any>;
  @ViewChild('kmEditTpl', { static: true }) kmEditTpl!: TemplateRef<any>;
  @ViewChild('importeEditTpl', { static: true }) importeEditTpl!: TemplateRef<any>;

  config!: GridConfig<Viaje>;
  editableConfig!: GridConfig<Viaje>;

  /**
   * La grilla arma columnas / acciones / selección en el ngOnInit, así que
   * cada vez que cambia una opción la desmontamos y la volvemos a montar.
   */
  gridVisible = false;

  seleccionadas: Viaje[] = [];
  seleccionadasEditable: Viaje[] = [];

  /** Lo que el servicio publica por totals$: es de todo el dataset filtrado, no de la página */
  totalesServicio: Record<string, number> | null = null;

  eventos: string[] = [];

  readonly estadosCombo: ComboType[] = ESTADOS.map((e) => ({
    numero: e,
    descripcion: e,
  }));

  readonly opciones: Opciones = {
    seleccion: 'multiple',
    soloFinalizadas: false,
    filtros: true,
    sort: true,
    menu: true,
    toolbar: true,
    ocultarDestino: false,
    hiddenRefresh: false,
    demora: false,
    agrupar: false,
    expandible: false,
    totales: false,
    scroll: true,
  };

  ngOnInit(): void {
    this.service.setAll(generarViajes(47));
    this.editableService.setAll(generarViajes(6, 21));

    this.config = this.buildConfig();
    this.editableConfig = this.buildEditableConfig();
    this.gridVisible = true;

    // La app es zoneless: lo que cambia fuera de un evento (la respuesta con
    // demora, el loading del ref) hay que marcarlo a mano.
    this.service.data$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

    this.service.totals$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((totales) => (this.totalesServicio = totales));
  }

  /** Los totales que publica el servicio, sólo de las columnas que interesan acá */
  get totalesVisibles(): [string, number][] {
    if (!this.totalesServicio) return [];

    return Object.entries(this.totalesServicio).filter(([key]) =>
      ['kilometros', 'importe'].includes(key),
    );
  }

  // ── Opciones ────────────────────────────────────────────

  setSeleccion(seleccion: Seleccion) {
    this.opciones.seleccion = seleccion;
    this.remontarGrid();
  }

  toggle(key: OpcionBool) {
    this.opciones[key] = !this.opciones[key];

    if (key === 'demora') {
      this.service.demoraMs = this.opciones.demora ? 800 : 0;
      this.service.search();
      return;
    }

    // hiddenRefresh es un @Input, no hace falta rearmar la config
    if (key === 'hiddenRefresh') return;

    this.remontarGrid();
  }

  /** Destruye y vuelve a crear la grilla para que vuelva a leer la config */
  private remontarGrid() {
    this.gridVisible = false;

    setTimeout(() => {
      this.config = this.buildConfig();
      this.gridVisible = true;
      this.cdr.markForCheck();
    });
  }

  // ── Data ────────────────────────────────────────────────

  recargar() {
    this.service.setAll(generarViajes(47));
    this.log('setAll(47) → data regenerada');
  }

  agregarFila() {
    const [nuevo] = generarViajes(1, Date.now() % 100000);
    this.service.add({ ...nuevo, numero: `V-NEW-${this.service.state.page}` });
    this.log(`add() → ${nuevo.chofer}`);
  }

  vaciar() {
    this.service.clear();
    this.log('clear() → sin data');
  }

  resetEstado() {
    this.service.state.page = 1;
    this.service.state.pageSize = 10;
    this.service.state.sort = undefined;
    this.service.state.filters = {};
    this.service.search();
    this.log('state reseteado');
  }

  // ── Config de la grilla ─────────────────────────────────

  private buildConfig(): GridConfig<Viaje> {
    return {
      columns: this.buildColumns(),
      menuActions: this.opciones.menu ? this.buildMenuActions() : [],
      toolBarActions: this.opciones.toolbar ? this.buildToolbarActions() : [],
      // Con rowKey estable, las filas abiertas siguen abiertas al paginar
      rowKey: (row) => String(row.id),
      expandable: this.opciones.expandible
        ? {
            template: this.detalleTpl,
            esExpandible: (row) => row.estado !== 'CANCELADO',
          }
        : undefined,
      selectableSettings: {
        type: this.opciones.seleccion === 'multiple' ? 'multiple' : 'single',
        selectable: this.opciones.seleccion !== 'ninguna',
        esSelectable: this.opciones.soloFinalizadas
          ? (row: Viaje) => row.estado === 'FINALIZADO'
          : undefined,
      },
      scroll: this.buildScroll(),
    };
  }

  /** Sin el toggle no va scroll y la grilla queda como antes */
  private buildScroll(): GridScrollSettings | undefined {
    return this.opciones.scroll ? { y: 300 } : undefined;
  }

  private buildColumns(): GridColumn<Viaje>[] {
    const { filtros, sort, ocultarDestino, agrupar, totales } = this.opciones;

    // Las mismas columnas sueltas o metidas en grupos, según el toggle
    const origen: GridColumn<Viaje> = {
      key: 'origen',
      title: 'Origen',
      type: 'text',
      filter: filtros,
      sortable: sort,
    };

    const destino: GridColumn<Viaje> = {
      key: 'destino',
      title: 'Destino',
      type: 'text',
      filter: filtros,
      sortable: sort,
      hidden: ocultarDestino,
    };

    const kilometros: GridColumn<Viaje> = {
      key: 'kilometros',
      title: 'Km',
      type: 'numeric',
      format: '{0:0}',
      sortable: sort,
      summarize: totales,
    };

    const importe: GridColumn<Viaje> = {
      key: 'importe',
      title: 'Importe',
      type: 'numeric',
      format: '{0:2}',
      sortable: sort,
      summarize: totales ? 'sum' : false,
    };

    const recorrido: GridColumn<Viaje>[] = agrupar
      ? [{ key: 'origen', title: 'Recorrido', type: 'group', group: [origen, destino] }]
      : [origen, destino];

    const importes: GridColumn<Viaje>[] = agrupar
      ? [{ key: 'importe', title: 'Importes', type: 'group', group: [kilometros, importe] }]
      : [kilometros, importe];

    return [
      {
        key: 'numero',
        title: 'Nro',
        type: 'text',
        filter: filtros,
        sortable: sort,
        summarize: totales ? 'count' : false,
      },
      { key: 'chofer', title: 'Chofer', type: 'text', filter: filtros, sortable: sort },
      { key: 'patente', title: 'Patente', type: 'text', filter: filtros, sortable: sort },
      ...recorrido,
      ...importes,
      { key: 'cuit', title: 'CUIT', type: 'numeric', format: 'cuit', sortable: false },
      { key: 'fecha', title: 'Fecha', type: 'date', format: 'ddMMyyyy', sortable: sort },
      {
        key: 'salida',
        title: 'Salida',
        type: 'date',
        format: 'ddMMyyyy hh:MM',
        sortable: sort,
      },
      {
        key: 'estado',
        title: 'Estado',
        type: 'template',
        template: this.estadoTpl,
        filter: filtros,
        sortable: sort,
      },
      {
        key: 'facturado',
        title: 'Facturado',
        type: 'template',
        template: this.facturadoTpl,
        sortable: false,
      },
      {
        key: 'id',
        title: 'Ruta',
        type: 'template',
        template: this.rutaTpl,
        sortable: false,
      },
    ];
  }

  private buildMenuActions(): GridMenuAction<Viaje>[] {
    return [
      {
        key: 'ver',
        label: 'Ver detalle',
        icon: 'view',
        onClick: (row) => this.log(`menu ver → ${row.numero}`),
      },
      {
        key: 'facturar',
        label: 'Facturar',
        icon: 'dolar',
        hidden: (row) => row.facturado || row.estado !== 'FINALIZADO',
        onClick: (row) => {
          // update() busca la fila por referencia, así que hay que mutarla
          row.facturado = true;
          this.service.update(row);
          this.log(`menu facturar → ${row.numero}`);
        },
      },
      {
        key: 'cancelar',
        label: 'Cancelar viaje',
        icon: 'close',
        disabled: (row) => row.estado === 'FINALIZADO',
        onClick: (row) => {
          row.estado = 'CANCELADO';
          this.service.update(row);
          this.log(`menu cancelar → ${row.numero}`);
        },
      },
      {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'delete',
        onClick: (row) => {
          this.service.remove(row);
          this.log(`menu eliminar → ${row.numero}`);
        },
      },
    ];
  }

  private buildToolbarActions(): GridToolBarAction<Viaje>[] {
    return [
      {
        key: 'nuevo',
        label: 'Nuevo',
        icon: 'add',
        type: 'primary',
        onClick: () => this.agregarFila(),
      },
      {
        key: 'editar',
        label: 'Editar',
        icon: 'edit',
        type: 'secondary',
        disabledOnEmptyRows: true,
        onClick: (rows) => this.log(`toolbar editar → ${rows.length} fila(s)`),
      },
      {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'delete',
        type: 'danger',
        disabled: (rows) => rows.length === 0,
        onClick: (rows) => {
          rows.forEach((row) => this.service.remove(row));
          this.log(`toolbar eliminar → ${rows.length} fila(s)`);
        },
      },
      {
        key: 'exportar',
        label: 'Exportar',
        icon: 'download',
        type: 'light',
        position: 'right',
        onClick: (rows) => this.log(`toolbar exportar → ${rows.length} seleccionada(s)`),
      },
    ];
  }

  // ── Config de la grilla editable ────────────────────────

  private buildEditableConfig(): GridConfig<Viaje> {
    return {
      isEditable: true,
      columns: [
        { key: 'numero', title: 'Nro', type: 'text', editable: true, filter: true },
        { key: 'chofer', title: 'Chofer', type: 'text', editable: true, filter: true },
        {
          key: 'kilometros',
          title: 'Km',
          type: 'numeric',
          format: '{0:0}',
          editable: true,
          editTemplate: this.kmEditTpl,
        },
        {
          key: 'importe',
          title: 'Importe',
          type: 'numeric',
          format: '{0:2}',
          editable: true,
          editTemplate: this.importeEditTpl,
        },
        {
          key: 'estado',
          title: 'Estado',
          type: 'template',
          template: this.estadoTpl,
          editable: true,
          editTemplate: this.estadoEditTpl,
        },
        { key: 'fecha', title: 'Fecha', type: 'date', format: 'ddMMyyyy' },
      ],
      selectableSettings: { type: 'multiple', selectable: true },
      toolBarActions: [
        {
          key: 'log',
          label: 'Log data',
          icon: 'info',
          type: 'info',
          onClick: () => this.log('editable → ver consola'),
        },
      ],
    };
  }

  // ── Estado / eventos ────────────────────────────────────

  log(mensaje: string) {
    const hora = new Date().toLocaleTimeString('es-AR');
    this.eventos.unshift(`${hora} · ${mensaje}`);
    this.eventos = this.eventos.slice(0, 25);
  }

  limpiarEventos() {
    this.eventos = [];
  }

  loguearEnConsola() {
    console.log('state', this.service.state);
    console.log('seleccionadas', this.seleccionadas);
    console.log('editable', this.seleccionadasEditable);
  }

  onSeleccionChange(rows: Viaje[]) {
    this.seleccionadas = rows;
  }

  get filtrosActivos(): [string, any][] {
    return Object.entries(this.service.state.filters ?? {});
  }

  claseEstado(estado: EstadoViaje | undefined): string {
    switch (estado) {
      case 'FINALIZADO':
        return 'chip chip-ok';
      case 'EN_CURSO':
        return 'chip chip-info';
      case 'CANCELADO':
        return 'chip chip-error';
      default:
        return 'chip chip-warn';
    }
  }
}
