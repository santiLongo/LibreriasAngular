import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiNovedades } from '../../models';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-novedades-dialog',
  templateUrl: './novedades-dialog.component.html',
  styleUrls: ['./novedades-dialog.scss'],
  imports: [MatDialogModule, MatIcon, MatButtonModule]
})
export class NovedadesDialogComponent {

  constructor(
    private readonly dialogRef: MatDialogRef<NovedadesDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: ApiNovedades
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }
}