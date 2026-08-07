import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppComboDataProvider } from '../service/ComboHttp.service';
import { COMBO_DATA_PROVIDER } from 'lib-components';
import { MiServicioOyente } from '../screens/test-dialog/service/test-dialog.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: COMBO_DATA_PROVIDER, useExisting: AppComboDataProvider },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [MiServicioOyente], // esto lo instancia → se registra
      multi: true,
    },
  ],
};
