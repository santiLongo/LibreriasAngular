import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadChangeParam,
  NzUploadXHRArgs,
  NzUploadListType,
} from 'ng-zorro-antd/upload';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import {
  PaperClipOutline,
  DeleteOutline,
  DownloadOutline,
  LoadingOutline,
  UploadOutline,
  EyeOutline,
  PlusOutline,
} from '@ant-design/icons-angular/icons';
import { map, Observable, Subscription } from 'rxjs';
import { BaseUploadService } from './services/base-upload.service';

/**
 * Componente generico para subir archivos.
 *
 * Se maneja con un `BaseUploadService` que le pasas por `[service]`.
 * El servicio decide contra que API pega. Ejemplo de uso:
 *
 * ```html
 * <app-upload-files [service]="miUploadService"></app-upload-files>
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-upload-files',
  templateUrl: './upload-files.html',
  imports: [NzUploadModule, NzButtonModule, NzIconModule],
  providers: [
    provideNzIconsPatch([
      PaperClipOutline,
      DeleteOutline,
      DownloadOutline,
      LoadingOutline,
      UploadOutline,
      EyeOutline,
      PlusOutline,
    ]),
  ],
})
export class UploadFilesComponent implements OnInit {
  /** Servicio que resuelve las operaciones contra la API. */
  @Input({ required: true }) service!: BaseUploadService;

  /** Permite seleccionar varios archivos a la vez. */
  @Input() multiple = true;
  /** Tipos aceptados (ej: '.pdf,.png,image/*'). */
  @Input() accept?: string;
  /** Estilo de la lista: 'text' | 'picture' | 'picture-card'. */
  @Input() listType: NzUploadListType = 'text';
  /** Tamanio maximo por archivo en KB (0 = sin limite). */
  @Input() maxSizeKb = 0;
  /** Deshabilita el componente. */
  @Input() disabled = false;
  /** Texto del boton disparador. */
  @Input() buttonText = 'Seleccionar archivos';
  /** Si el servicio implementa `list`, carga los archivos existentes al iniciar. */
  @Input() loadExisting = true;

  /** Lista de archivos (soporta two-way binding). */
  @Input() fileList: NzUploadFile[] = [];
  @Output() fileListChange = new EventEmitter<NzUploadFile[]>();

  /** Se emite cuando un archivo termina de subirse. */
  @Output() uploaded = new EventEmitter<NzUploadFile>();
  /** Se emite cuando un archivo se elimina. */
  @Output() removed = new EventEmitter<NzUploadFile>();
  /** Se emite en cada cambio de estado (ver ejemplo nzChange). */
  @Output() changed = new EventEmitter<NzUploadChangeParam>();

  ngOnInit(): void {
    if (this.service.list) {
      this.service.list().subscribe((files) => {
        this.fileList = files ?? [];
        this.fileListChange.emit(this.fileList);
      });
    }
  }

  get showDownload(): boolean {
    return !!this.service.download;
  }

  /** Valida el tamanio antes de aceptar el archivo. */
  beforeUpload = (file: NzUploadFile): boolean => {
    if (this.maxSizeKb > 0) {
      const sizeKb = (file.size ?? 0) / 1024;
      if (sizeKb > this.maxSizeKb) {
        return false;
      }
    }
    return true;
  };

  /** Delega la subida de cada archivo al servicio inyectado. */
  customRequest = (item: NzUploadXHRArgs): Subscription => {
    const file = item.postFile as File;
    return this.service.upload(file).subscribe({
      next: (res) => item.onSuccess?.(res ?? {}, item.file, res),
      error: (err) => item.onError?.(err, item.file),
    });
  };

  /** Descarga usando el servicio (si lo implementa). */
  onDownload = (file: NzUploadFile): void => {
    if (!this.service.download) {
      return;
    }
    this.service.download(file).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  };

  /**
   * Elimina usando el servicio (si lo implementa).
   * Si el servicio no tiene `remove`, solo lo saca de la lista local.
   */
  onRemove = (file: NzUploadFile): boolean | Observable<boolean> => {
    if (!this.service.remove) {
      return true;
    }
    return this.service.remove(file).pipe(map(() => true));
  };

  /** Maneja los cambios de estado del upload (uploading | done | error | removed). */
  onChange(event: NzUploadChangeParam): void {
    this.fileList = event.fileList;
    this.fileListChange.emit(this.fileList);
    this.changed.emit(event);

    if (event.file.status === 'done') {
      this.uploaded.emit(event.file);
    } else if (event.file.status === 'removed') {
      this.removed.emit(event.file);
    }
  }
}
