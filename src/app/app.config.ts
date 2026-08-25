import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppComboDataProvider } from '../service/ComboHttp.service';
import { COMBO_DATA_PROVIDER } from 'lib-components';
import { MiServicioOyente } from '../screens/test-dialog/service/test-dialog.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // <mat-icon> usa Material Symbols en vez del set clásico: el enum ICONS
    // tiene nombres (person_apron, assignment_add) que sólo existen ahí.
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass(
        'material-symbols-outlined',
        'mat-ligature-font',
      );
    }),
    { provide: COMBO_DATA_PROVIDER, useExisting: AppComboDataProvider },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [MiServicioOyente], // esto lo instancia → se registra
      multi: true,
    },
  ],
};
