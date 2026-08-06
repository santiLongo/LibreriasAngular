import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AlertDialogComponent } from '../dialog-alter/dialog-alert';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor(private dialog: MatDialog) {}

  error$(title: string, subtitle?: string): Observable<boolean> {
    return this.dialog.open(AlertDialogComponent, { data: { type: 'error', title, subtitle }, width: '600px' }).afterClosed();
  }

  success$(title: string, subtitle?: string): Observable<boolean> {
    return this.dialog.open(AlertDialogComponent, { data: { type: 'success', title, subtitle }, width: '600px' }).afterClosed();
  }

  info$(title: string, subtitle?: string): Observable<boolean> {
    return this.dialog.open(AlertDialogComponent, { data: { type: 'info', title, subtitle }, width: '600px' }).afterClosed();
  }

  warning$(title: string, subtitle?: string): Observable<boolean> {
    return this.dialog.open(AlertDialogComponent, { data: { type: 'warning', title, subtitle }, width: '600px' }).afterClosed();
  }
}
