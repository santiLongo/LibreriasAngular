# Spec · `app-overlay-spinner` + grilla scrolleable

Fecha: 2026-09-04 (actualizada 2026-09-05)
Estado: implementado (a revisar)

Dos cosas independientes que van juntas en el mismo cambio:

1. Un componente nuevo `app-overlay-spinner` en `lib-components`.
2. Que la grilla pueda scrollear con el header fijo, configurado desde `GridConfig`.

---

## 1. `app-overlay-spinner`

### Qué se pidió

Un componente nuevo, standalone, que reciba un `text` por input y muestre tres
puntitos animados. Tiene que quedar exportado para poder usarlo desde otro
proyecto.

### Qué ya había

`app-global-spinner` (`lib/spinner/global-spinner.ts`). Es distinto: se prende
solo, escuchando `LoadingService` de `lib-servicios` (`loading$` / `message$`).
No recibe nada por input y no se puede usar suelto para un bloque puntual.

El nuevo no toca ese: convive al lado, en la misma carpeta `lib/spinner/`.

### Decisiones

| Punto | Decisión |
|---|---|
| Ubicación | `projects/lib-components/src/lib/spinner/overlay-spinner.{ts,html,css}` |
| Selector | `app-overlay-spinner` |
| Clase | `OverlaySpinnerComponent` |
| Standalone | Sí |
| Export | Se agrega a `lib/spinner/index.ts`, que ya está en `public-api.ts` |
| Archivos | `.html` + `.css` separados, como `button` / `grid` (el `global-spinner` los tiene inline, pero es la excepción) |
| Inputs | `@Input()` clásico, como el resto de la librería (no signals) |

### API

```ts
@Input() text = 'Cargando';
```

Nada más. **La visibilidad la maneja quien lo usa**, con un `@if`:

```html
@if (guardando) {
  <app-overlay-spinner text="Guardando el viaje" />
}
```

Es a propósito: no hay `visible` / `show` input ni servicio atrás. Si preferís
que se prenda solo con un input booleano o enganchado a un `HttpRef`, decime y
lo agrego — es una línea.

### Cómo se ve

- Overlay `position: fixed` sobre toda la pantalla, fondo translúcido, `z-index`
  arriba de todo (mismo criterio que `global-spinner`).
- Adentro, una caja blanca centrada con:
  - el anillo que gira (es un *spinner*, el nombre lo pide),
  - el `text`,
  - los tres puntitos animados pegados al texto, rebotando en secuencia
    (0s / 0.16s / 0.32s de delay).

Si los tres puntitos tenían que **reemplazar** al anillo en vez de acompañarlo,
avisame y saco el anillo.

### Accesibilidad

`role="alert"` + `aria-live="assertive"` + `aria-busy="true"` en el overlay, y
los puntitos con `aria-hidden` para que el lector de pantalla lea el texto y no
"punto punto punto". Los puntitos respetan `prefers-reduced-motion`.

---

## 2. Grilla scrolleable con header fijo

### Qué se pidió

Que la grilla pueda scrollear quedando los headers fijos, revisando primero si
no existía ya en la configuración del componente.

### Qué ya había

**No existía.** Se revisó `GridConfig`, `GridComponent` y `grid.html`:

- `GridConfig` tiene `columns`, `menuActions`, `toolBarActions`,
  `selectableSettings`, `isEditable`, `expandable`, `rowKey` y
  `resizableColumns`. Ninguna opción de scroll.
- El `<nz-table>` de `grid.html` tenía un `style="... overflow-y: auto ..."`
  suelto, que no hace nada útil: sin alto máximo nunca hay overflow, y aunque lo
  hubiera scrollearía la tabla entera, header incluido.

### Hallazgo aparte (importante)

El commit `0d9f810` ("Subo esto para el ancho de las columnas") agregó al
`grid.ts` y a `GridColumns` toda la lógica de anchos — `widthConfig`,
`tableLayout`, `onResize`, `puedeResize`, `ANCHOS_SISTEMA`, `ANCHO_MINIMO` —
pero **no tocó `grid.html`**. En el template no hay `[nzWidthConfig]`, no hay
`[nzTableLayout]` y no hay ningún `nz-resizable`. O sea: hoy los `width` de las
columnas y `resizableColumns` no hacen nada, es código muerto.

Esto no es un detalle suelto, choca de frente con el scroll (ver abajo), así que
el cambio incluye la parte que el scroll necesita:

- ✅ **Se agrega** `[nzWidthConfig]="widthConfig"` y `[nzTableLayout]="tableLayout"`
  al `<nz-table>`. Sin esto el header fijo no alinea con el cuerpo.
- ⛔ **No se agrega** el `nz-resizable` en los `<th>` (arrastrar el borde del
  header). Es una feature distinta, con su propio markup y sus propios bugs; si
  la querés ahora la hago en otro paso.

### Cómo funciona el header fijo en ng-zorro

`nz-table` tiene `nzScroll: { x?: string, y?: string }`. Con `y` seteado deja de
renderizar una sola tabla y arma tres: header, cuerpo y pie, cada una en su
`<div>`. El cuerpo scrollea con `max-height: y` y el header queda quieto arriba,
sincronizando el scroll horizontal con el del cuerpo.

Al partirse en tres tablas, las tres pasan a `table-layout: fixed` y las columnas
se alinean **sólo** por el `<colgroup>`, que sale de `nzWidthConfig` combinado
con los anchos que ng-zorro mide solo.

### Por qué se desfasaban las columnas

`NzThMeasureDirective` (selector: `th`) declara `colspan` y `rowspan` como
**inputs propios** y es ella la que escribe el atributo en el DOM. El template
de la grilla usaba `[attr.colspan]` / `[attr.rowspan]`: eso pone el atributo pero
deja los inputs de la directiva en `null`. Con eso ng-zorro cuenta mal:

- `setListOfMeasureColumn()` arma la fila de medición
  (`tr[nz-table-measure-row]`, que vive en el `<tbody>`) expandiendo los
  `colspan` de la **primera fila del header**. Sin ver los colspan, con headers
  agrupados salían **14 celdas en vez de 16**.
- `listOfListOfThWidthPx$` usa lo medido **sólo si la cantidad coincide** con la
  del `widthConfig`. Como 14 ≠ 16, descartaba todo lo medido y devolvía un
  `<colgroup>` con los 16 anchos en `null`.
- Con `table-layout: fixed` y el colgroup sin anchos, cada tabla saca las medidas
  de **su propia primera fila**: la del header son los `<th>` (con el CSS de
  48px / 64px / 150px de las columnas de sistema), la del cuerpo es la fila de
  medición, 14 celdas vacías sin ancho. Dos repartos distintos sobre el mismo
  ancho total → header y cuerpo desalineados.

**El arreglo** es pasar por los inputs de la directiva (`[colspan]` /
`[rowspan]`) en vez de `[attr.*]`. El HTML renderizado es el mismo — los escribe
la directiva — pero ahora ng-zorro cuenta bien las columnas, la fila de medición
tiene la cantidad correcta de celdas y el colgroup queda con anchos reales,
idéntico para las tres tablas.

De yapa arregla `columnCount$`, que es el `colspan` que la grilla le pone al
`<td>` de las filas expandidas: con grupos también estaba corto.

### Por qué el `widthConfig` va completo

Aunque ninguna columna tenga `width` configurado, con scroll la grilla manda un
`widthConfig` de largo completo (columnas de sistema + hojas) con `null` donde no
hay ancho. Es lo que hace que los largos coincidan y que lo medido se use. Los
`null` se completan con lo que mide ng-zorro; las columnas de sistema van con los
px fijos de `ANCHOS_SISTEMA`.

### Por qué los totales van siempre fijos

En el modo con scroll, ng-zorro dibuja el `<tfoot>` **únicamente** si está fijado
(`nzFixed`): mirá el template de `NzTableInnerScrollComponent`, la tabla del
cuerpo recibe `contentTemplate` pero no `tfootTemplate`. O sea que con scroll y
sin `nzFixed` la fila de totales **desaparece**. Por eso no es una opción: si hay
scroll, `summaryFixed` devuelve `'bottom'` y listo.

### API nueva

En `models/model.ts`:

```ts
/**
 * Con esto la tabla se parte en header, cuerpo y pie: scrollea sólo el cuerpo y
 * el header queda fijo arriba.
 */
export interface GridScrollSettings {
  /**
   * Alto máximo del cuerpo, y lo único que hay para configurar. Un número se
   * toma como px, o cualquier medida CSS ('50vh', '30rem').
   *
   * El horizontal va solo: la tabla ocupa como mínimo el ancho del contenedor
   * y la barra aparece únicamente si las columnas no entran.
   *
   * Si la grilla tiene totales, la fila de totales queda fija abajo.
   */
  y?: number | string;
}
```

Y en `GridConfig<T>`:

```ts
/** Si no se pasa, la grilla crece con las filas y no scrollea (como hasta ahora) */
scroll?: GridScrollSettings;
```

Uso:

```ts
config: GridConfig<Viaje> = {
  columns: [...],
  scroll: { y: 400 },
};
```

**Un solo parámetro a propósito.** El scroll horizontal no se configura: cuando
hay alto, la grilla manda internamente `x: 'auto'`, que le pone a la tabla
`width: auto; min-width: 100%`. Ocupa todo el contenedor y saca la barra sólo si
las columnas no entran. Y `x` va únicamente junto con `y`: si se prendiera solo,
**toda** grilla entraría en el modo con scroll de ng-zorro y cambiaría cómo
renderiza aunque nadie haya pedido scroll.

### Qué cambia en el componente

`grid.ts`:

- Campo `scroll: { x: string | null; y: string | null }`, armado una sola vez en
  `ngOnInit`: `{ x: 'auto', y: alto }` si hay alto, `{ x: null, y: null }` si no.
  **Campo y no getter**, por lo mismo que `widthConfig`: `nzScroll` es un
  `@Input` y un objeto nuevo en cada ciclo de detección dispararía una remedición
  infinita.
- `get scrollActivo()` — hay scroll si quedó `x` o `y`.
- `get summaryFixed()` — `'bottom'` siempre que haya scroll (ver arriba: es la
  única forma de que los totales se dibujen).
- `actualizarWidthConfig()` arma el `widthConfig` completo también cuando el
  scroll está prendido.
- La medida se normaliza con un helper `medidaCss()` (número → px, string tal
  cual), exportado desde `grid-columns.ts` y reusado por los anchos de columna,
  que hacían lo mismo por su cuenta.

`grid.html`:

- Los `<th>` del header pasan de `[attr.colspan]` / `[attr.rowspan]` a
  `[colspan]` / `[rowspan]` — **este es el arreglo del desfase**.
- `[nzScroll]="scroll"`, `[nzWidthConfig]="widthConfig"`, `[nzTableLayout]="tableLayout"`.
- `<tfoot nzSummary [nzFixed]="summaryFixed">`.
- Se saca el `style` inline del `<nz-table>` (el `overflow-y: auto` que no hacía
  nada) y pasa a una clase en `grid.css`.

### Qué NO cambia

- Sin `config.scroll`, la grilla renderiza exactamente igual que antes: mismo
  `nz-table-inner-default`, `widthConfig` vacío, sin header fijo.
- La paginación, el toolbar y el footer con el refresh siguen afuera del área que
  scrollea (los dibuja `nzTitle` / `nzFooter`, no la tabla).

### Cosas a mirar cuando lo pruebes

1. Header fijo con `scroll: { y: 300 }` y suficientes filas.
2. Lo mismo con `agrupar: ON`: el header de dos filas tiene que quedar fijo
   completo y **las columnas alineadas con el cuerpo** — es el caso que se
   desfasaba.
3. Con `totales: ON`: la fila de Totales tiene que verse, abajo y quieta.
4. Achicar la ventana hasta que las columnas no entren: tiene que aparecer la
   barra horizontal sola y el header acompañar el desplazamiento.
5. Filas expandibles adentro del scroll: el `<td>` de la fila abierta tiene que
   ocupar todo el ancho (con grupos antes quedaba corto).
6. Que sin `scroll` no se haya movido nada.

---

## Archivos tocados

```
docs/spec-overlay-spinner-y-grid-scroll.md      (nuevo, este archivo)

projects/lib-components/src/lib/spinner/overlay-spinner.ts     (nuevo)
projects/lib-components/src/lib/spinner/overlay-spinner.html   (nuevo)
projects/lib-components/src/lib/spinner/overlay-spinner.css    (nuevo)
projects/lib-components/src/lib/spinner/index.ts               (export)

projects/lib-components/src/lib/grid/models/model.ts           (GridScrollSettings + GridConfig.scroll)
projects/lib-components/src/lib/grid/models/grid-columns.ts     (medidaCss exportado)
projects/lib-components/src/lib/grid/grid.ts                    (scroll, summaryFixed, widthConfig)
projects/lib-components/src/lib/grid/grid.html                  (nzScroll, nzWidthConfig, nzTableLayout, nzFixed)
projects/lib-components/src/lib/grid/grid.css                   (clase del host de la tabla)

src/screens/test-grid/*                                         (toggles para probarlo)
```

## Pendientes / a decidir

- [ ] ¿El `overlay-spinner` lleva anillo + puntitos, o sólo los puntitos?
- [ ] ¿Le agrego un input de visibilidad (`visible`) o queda con `@if` afuera?
- [ ] Los handles de resize (`nz-resizable`) del commit `0d9f810` siguen sin
      estar en el template. ¿Los cableo?
- [ ] Subir la versión de `lib-components` (hoy `21.0.10`) cuando esto se publique.
