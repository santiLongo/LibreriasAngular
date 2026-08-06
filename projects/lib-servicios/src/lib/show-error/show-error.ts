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
  selector: 'app-show-error-dialog',
  templateUrl: './show-error.html',
  imports: [MatDialogModule, NzButtonModule, NzResultModule, NzTypographyModule, NzIconModule ],
})
export class ShowErrorDialogComponent {
  type: NzResultStatusType;
  public error = '';

  constructor(
    private dialogRef: MatDialogRef<ShowErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: ShowErrorParams,
  ) {
    this.error = data.error;
    switch(data.status){
      case 404:
        this.type = '404';
        break;
      case 401:
      case 403:
        this.type = '403';
        break;
      default:
        this.type = '500';
        break;
    }
  }

  onSalir(){
    this.dialogRef.close();
  }
}

export interface ShowErrorParams
{ error: string, status: number }