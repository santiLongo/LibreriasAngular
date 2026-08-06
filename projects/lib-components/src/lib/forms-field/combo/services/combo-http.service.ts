// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { ComboType } from '../models/combo-type';
// import { ApiHttpService } from 'lib-servicios';

// @Injectable({
//   providedIn: 'root',
// })
// export class ComboHttpService {
//   private url = '';

//   constructor(
//     private http: ApiHttpService,
//     private config: CoreLibService,
//   ) {
//     this.url = config.loginUrl + 'v1/combo/';
//   }

//   getCombo(type: string, extraParams?: any): Observable<ComboType[]> {
//     const fullUrl = this.url + 'get';

//     const params = {
//       type,
//       ...(extraParams ?? {}),
//     };
//     return this.http.get<ComboType[]>(fullUrl, params);
//   }
// }
// combo-data-provider.ts
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ComboType } from '../models/combo-type';

export interface IComboDataProvider {
  getDataCombo(type: string, extraParams?: any): Observable<ComboType[]>;
}

export const COMBO_DATA_PROVIDER = new InjectionToken<IComboDataProvider>(
  'COMBO_DATA_PROVIDER',
);