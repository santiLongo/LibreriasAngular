import { Injectable, OnDestroy } from '@angular/core';
import { DialogService, EventBusService, ListenerToken } from 'lib-servicios';
import { DialogComponent, EditarUsuarioData } from '../dialog/dialog.component';

@Injectable({ providedIn: 'root' })
export class MiServicioOyente implements OnDestroy {
  private token: ListenerToken;

  constructor(
    bus: EventBusService,
    private dialogService: DialogService,
  ) {
    this.token = bus.register('levantar-dialog', (payload: EditarUsuarioData) => {
      this.dialogService.open(DialogComponent, {
        data: payload,
        size: payload.size,
      });
    });
  }

  ngOnDestroy() {
    this.token.unregister(); // clave: liberá la clave o queda ocupada (zombie)
  }
}
