import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShowErrorDialogComponent } from '../show-error/show-error';

@Injectable({
  providedIn: 'root',
})
export class ReponseDialogService {
  constructor(private dialog: MatDialog) {}

  showError(message: string, status: number = 500) {
    this.dialog.open(ShowErrorDialogComponent, { data: { error: message, status: status }, width: '600px' });
  }
}
