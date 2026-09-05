import { Component, Input } from '@angular/core';

/**
 * Overlay de carga para un bloque puntual: se tapa la pantalla, se muestra el
 * texto que le pasen y tres puntitos animados al lado.
 *
 * A diferencia de app-global-spinner, este no escucha a nadie: lo prende y lo
 * apaga quien lo usa, con un @if.
 *
 *   @if (guardando) {
 *     <app-overlay-spinner text="Guardando el viaje" />
 *   }
 */
@Component({
  standalone: true,
  selector: 'app-overlay-spinner',
  templateUrl: './overlay-spinner.html',
  styleUrl: './overlay-spinner.css',
})
export class OverlaySpinnerComponent {
  @Input() text = 'Cargando';
}
