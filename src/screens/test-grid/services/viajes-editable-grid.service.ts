import { inject, Injectable } from '@angular/core';
import { AlertService, EditableGridService } from 'lib-components';
import { Viaje } from '../data/viajes.data';

/**
 * EditableGridService ya trae el CRUD en memoria + getRowKey; acá sólo lo
 * tipamos con Viaje y le resolvemos el AlertService que pide por constructor.
 */
@Injectable()
export class ViajesEditableGridService extends EditableGridService<Viaje> {
  constructor() {
    super(inject(AlertService));
  }
}
