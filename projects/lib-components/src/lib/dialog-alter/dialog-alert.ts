import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResultModule, NzResultStatusType } from 'ng-zorro-antd/result';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  standalone: true,
  selector: 'app-dialog-alert',
  templateUrl: './dialog-alert.html',
  imports: [
    MatDialogModule,
    NzButtonModule,
    NzResultModule,
    NzTypographyModule,
    NzIconModule,
  ],
})
export class AlertDialogComponent {
  public type: NzResultStatusType;
  public title: string;
  public subtitle?: string;

  constructor(
    private dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    data: { type: NzResultStatusType; title: string; subtitle?: string },
  ) {
    this.type = data.type;
    this.title = data.title;
    this.subtitle = data.subtitle;
  }

  onSalir(b: boolean) {
    this.dialogRef.close(b);
  }

  onAceptar(b: boolean) {
    this.dialogRef.close(b);
  }
}
