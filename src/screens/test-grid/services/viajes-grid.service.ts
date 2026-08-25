import { Injectable } from '@angular/core';
import { delay, finalize, Observable } from 'rxjs';
import { LocalGridService } from 'lib-components';
import { GridState, PagedResult } from 'lib-servicios';
import { Viaje } from '../data/viajes.data';

/**
 * Servicio local de la pantalla de prueba: la data vive en memoria y el
 * filtrado / orden / paginado los resuelve LocalGridService.
 * Lo único que agregamos es una demora opcional para poder ver el loading
 * de la grilla como si la data viniera del back.
 */
@Injectable()
export class ViajesGridService extends LocalGridService<Viaje> {
  /** ms de demora simulada. 0 = responde sincrónico. */
  demoraMs = 0;

  constructor(){
    super()
  }

  override getData(state: GridState): Observable<PagedResult<Viaje>> {
    const data$ = super.getData(state);

    if (!this.demoraMs) return data$;

    this.ref.loading = true;
    return data$.pipe(
      delay(this.demoraMs),
      finalize(() => (this.ref.loading = false)),
    );
  }
}
