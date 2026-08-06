import { Observable } from 'rxjs';
import { NzUploadFile } from 'ng-zorro-antd/upload';

/**
 * Servicio base para el UploadFilesComponent.
 *
 * Implementalo para conectar el componente con la API que quieras.
 * El componente no sabe nada de tu backend: solo llama a estos metodos.
 *
 * - `upload`   (obligatorio): sube un archivo y devuelve la respuesta.
 * - `list`     (opcional): devuelve los archivos ya cargados para mostrarlos al iniciar.
 * - `download` (opcional): descarga un archivo ya cargado.
 * - `remove`   (opcional): elimina un archivo del servidor.
 */
export abstract class BaseUploadService {
  /** Sube un archivo y devuelve la respuesta del servidor. */
  abstract upload(file: File): Observable<void>;

  /** (Opcional) Devuelve los archivos ya cargados para mostrarlos al iniciar. */
  list?: () => Observable<NzUploadFile[]>;

  /** (Opcional) Descarga un archivo ya cargado. */
  download?: (file: NzUploadFile) => Observable<Blob>;

  /** (Opcional) Elimina un archivo del servidor. */
  remove?: (file: NzUploadFile) => Observable<any>;
}
