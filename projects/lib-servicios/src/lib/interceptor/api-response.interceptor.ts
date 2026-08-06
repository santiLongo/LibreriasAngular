// api-response.interceptor.ts
import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ReponseDialogService } from '../services/reponse-dialog.service';
import { ApiResponse } from '../models/api-response';

export const apiResponseInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  const dialogService = inject(ReponseDialogService);
  const router = inject(Router);

  return next(req).pipe(

    map((event: HttpEvent<any>) => {

      if (event instanceof HttpResponse && event.body?.ok !== undefined) {

        const response = event.body as ApiResponse<any>;

        if (!response.ok || response.hayErrores) {
          const message =
            response.error ||
            response.errores?.join('\n') ||
            'Ocurrió un error';

          dialogService.showError(message);
          throw new Error(message);
        }

        if (!response.isSessionAlive) {
          dialogService.showError('Sesión expirada');
          localStorage.clear();
          router.navigate(['/login']);
          throw new Error('Session expired');
        }

        return event.clone({
          body: response.data
        });
      }

      return event;
    }),

    catchError((error: HttpErrorResponse) => {
      let message =
        error.error?.message ||
        error.message ||
        'Error inesperado del servidor';

      if(error.error?.message == undefined)
        message = 'Error al comunicarse con el servidor'

      if(error.status === 401){
        message = "Sesion expirada";
        localStorage.clear();
      }
        

      dialogService.showError(message, error.status);
      return throwError(() => error);
    })
  );
};
