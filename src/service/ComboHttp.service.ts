// app-combo-data.provider.ts (en la app)
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IComboDataProvider, ComboType } from 'lib-components';
import { ApiHttpService } from 'lib-servicios';

@Injectable({ providedIn: 'root' })
export class AppComboDataProvider implements IComboDataProvider {
  private url = '' + 'v1/combo/';

  constructor(private http: ApiHttpService) {}

  getDataCombo(type: string, extraParams?: any): Observable<ComboType[]> {
    const params = { type, ...(extraParams ?? {}) };
    return this.http.get<ComboType[]>(this.url + 'get', params);
  }
}