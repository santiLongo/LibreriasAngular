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
import { catchError, EMPTY, map, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ReponseDialogService } from '../services/reponse-dialog.service';
import { ApiResponse } from '../models/api-response';

/** La respuesta llegó con 200 pero el back avisa que la operación falló */
class ApiBusinessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiBusinessError';
  }
}

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

          // lo tira un solo lugar: el catchError de abajo muestra el dialog
          throw new ApiBusinessError(message, 500);
        }

        if (!response.isSessionAlive) {
          throw new ApiBusinessError('Sesión expirada', 401);
        }

        return event.clone({
          body: response.data
        });
      }

      return event;
    }),

    catchError((error: unknown): Observable<never> => {
      const { message, status } = describirError(error);

      if (status === 401) {
        localStorage.clear();
        router.navigate(['/login']);
      }

      // Si ya hay un error en pantalla el servicio lo descarta, así dos
      // peticiones que fallan juntas no apilan dos dialogs.
      dialogService.showError(message, status);

      // Acá muere la cadena. EMPTY completa sin emitir nada: el next() del
      // componente nunca corre (no sigue como si la petición hubiera andado),
      // el error no se propaga, y los finalize() de arriba igual se ejecutan
      // para que se apaguen spinners y loadings.
      return EMPTY;
    })
  );
};

function describirError(error: unknown): { message: string; status: number } {
  if (error instanceof ApiBusinessError) {
    return { message: error.message, status: error.status };
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return { message: 'Sesión expirada', status: 401 };
    }

    return {
      message: error.error?.message || 'Error al comunicarse con el servidor',
      status: error.status,
    };
  }

  return {
    message: (error as Error)?.message || 'Error inesperado del servidor',
    status: 500,
  };
}
