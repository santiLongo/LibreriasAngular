import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppComboDataProvider } from '../service/ComboHttp.service';
import { COMBO_DATA_PROVIDER } from 'lib-components';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: COMBO_DATA_PROVIDER, useExisting: AppComboDataProvider },
  ]
};
