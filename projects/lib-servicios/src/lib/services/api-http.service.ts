import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { LoadingService } from './loading.service';
import { GridState, PagedResult } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class ApiHttpService {
  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  get<T>(url: string, params?: any): Observable<T> {
    return this.http.get<T>(url, {
      headers: this.getHeaders(),
      params: this.buildParams(params),
    });
  }

  getState<T>(
    url: string,
    params: any,
    state: GridState,
  ): Observable<PagedResult<T>> {
    let finalParams: any = {
      ...params,
      page: state.page,
      pageSize: state.pageSize,
    };

    if (state.sort) {
      finalParams['sort.field'] = state.sort.field;
      finalParams['sort.direction'] = state.sort.direction;
    }

    if (state.filters) {
      Object.entries(state.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          finalParams[`filters[${key}]`] = value;
        }
      });
    }

    const httpParams = this.buildParams(finalParams);

    return this.http.get<PagedResult<T>>(url, {
      headers: this.getHeaders(),
      params: httpParams,
    });
  }

  getBlob(url: string, params?: any, message?: string): Observable<Blob> {
    this.loadingService.show(message);

    return this.http
      .get(url, {
        headers: this.getHeaders(),
        params: this.buildParams(params),
        responseType: 'blob',
      })
      .pipe(finalize(() => this.loadingService.hide()));
  }

  getWithBlock<T>(url: string, params?: any, message?: string): Observable<T> {
    this.loadingService.show(message);

    return this.http
      .get<T>(url, {
        headers: this.getHeaders(),
        params: this.buildParams(params),
      })
      .pipe(finalize(() => this.loadingService.hide()));
  }

  post<T>(url: string, body: any, extraParams?: any): Observable<T> {
    return this.http.post<T>(url, body, {
      headers: this.getHeaders(),
      params: this.buildParams(extraParams),
    });
  }

  postWithBlock<T>(
    url: string,
    body: any,
    extraParams?: any,
    message?: string,
  ): Observable<T> {
    this.loadingService.show(message);

    return this.http
      .post<T>(url, body, {
        headers: this.getHeaders(),
        params: this.buildParams(extraParams),
      })
      .pipe(finalize(() => this.loadingService.hide()));
  }

  putWithBlock<T>(url: string, body: any, message?: string): Observable<T> {
    this.loadingService.show(message);

    return this.http
      .put<T>(url, body, {
        headers: this.getHeaders(),
      })
      .pipe(finalize(() => this.loadingService.hide()));
  }

  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (!params || typeof params !== 'object') {
      return httpParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== null && v !== undefined) {
            httpParams = httpParams.append(key, String(v));
          }
        });
        return;
      }

      if (value instanceof Date) {
        httpParams = httpParams.set(key, value.toISOString());
        return;
      }

      if (typeof value !== 'object') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}
