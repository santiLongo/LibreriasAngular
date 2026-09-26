import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { ShowErrorDialogComponent } from '../show-error/show-error';

@Injectable({
  providedIn: 'root',
})
export class ReponseDialogService {
  /**
   * Semáforo: mientras haya un dialog de error en pantalla no se abre otro.
   * Si tres peticiones fallan juntas, el usuario ve un solo cartel.
   */
  private dialogRef: MatDialogRef<ShowErrorDialogComponent> | null = null;

  private readonly cerrado = new Subject<void>();

  /** Se emite cada vez que el usuario cierra el dialog de error */
  readonly errorCerrado$: Observable<void> = this.cerrado.asObservable();

  constructor(private dialog: MatDialog) {}

  /** Hay un error en pantalla */
  get hayErrorAbierto(): boolean {
    return this.dialogRef !== null;
  }

  /**
   * Muestra el error. Devuelve false si había uno abierto y este se descartó,
   * así quien llama sabe que el mensaje no se mostró.
   */
  showError(message: string, status: number = 500): boolean {
    if (this.dialogRef) return false;

    const ref = this.dialog.open(ShowErrorDialogComponent, {
      data: { error: message, status: status },
      width: '600px',
    });

    this.dialogRef = ref;

    // afterClosed corre también si cierra con Escape o clickeando el backdrop,
    // así que el semáforo siempre se libera.
    ref.afterClosed().subscribe(() => {
      if (this.dialogRef !== ref) return;

      this.dialogRef = null;
      this.cerrado.next();
    });

    return true;
  }

  /** Cierra el error que esté abierto y libera el semáforo */
  cerrarError(): void {
    this.dialogRef?.close();
  }
}
