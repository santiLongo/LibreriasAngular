import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ComboType, IComboDataProvider } from 'lib-components';

/**
 * Provider de combos falso para la pantalla de pruebas.
 * Evita depender del back: devuelve data local con un delay para
 * simular la demora de la request.
 */
/** ComboType + el padre que usa el combo dependiente para filtrar */
type ItemCombo = ComboType & { padre?: number };

@Injectable()
export class MockComboDataProvider implements IComboDataProvider {
  private readonly data: Record<string, ItemCombo[]> = {
    provincias: [
      { numero: 1, descripcion: 'Buenos Aires' },
      { numero: 2, descripcion: 'Córdoba' },
      { numero: 3, descripcion: 'Santa Fe' },
      { numero: 4, descripcion: 'Mendoza' },
      { numero: 5, descripcion: 'Tucumán' },
    ],
    localidades: [
      { numero: 101, descripcion: 'La Plata', padre: 1 },
      { numero: 102, descripcion: 'Mar del Plata', padre: 1 },
      { numero: 103, descripcion: 'Bahía Blanca', padre: 1 },
      { numero: 201, descripcion: 'Villa Carlos Paz', padre: 2 },
      { numero: 202, descripcion: 'Río Cuarto', padre: 2 },
      { numero: 301, descripcion: 'Rosario', padre: 3 },
      { numero: 302, descripcion: 'Rafaela', padre: 3 },
      { numero: 401, descripcion: 'Godoy Cruz', padre: 4 },
      { numero: 501, descripcion: 'Yerba Buena', padre: 5 },
    ],
    estados: [
      { numero: 'A', descripcion: 'Activo' },
      { numero: 'I', descripcion: 'Inactivo' },
      { numero: 'P', descripcion: 'Pendiente' },
      { numero: 'B', descripcion: 'Dado de baja' },
    ],
  };

  /** Se va llenando con cada llamada, lo mostramos en pantalla para ver el ciclo de carga. */
  readonly llamadas: string[] = [];

  getDataCombo(type: string, extraParams?: any): Observable<ComboType[]> {
    this.llamadas.push(
      `${new Date().toLocaleTimeString('es-AR')} → ${type} ${extraParams ? JSON.stringify(extraParams) : ''}`,
    );

    let items: ItemCombo[] = this.data[type] ?? [];

    // El combo dependiente manda el padre por extraParams
    if (extraParams?.padre != null) {
      items = items.filter((x) => x.padre === extraParams.padre);
    }

    return of(items).pipe(delay(400));
  }
}
