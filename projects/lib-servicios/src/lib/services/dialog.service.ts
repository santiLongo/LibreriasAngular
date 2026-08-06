import { Injectable, Type } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { Observable } from 'rxjs';

export type DialogSize = 's' | 'm' | 'l' | 'xl' | 'xxl' | 'full';

const SIZE_MAP: Record<DialogSize, MatDialogConfig> = {
  s: {
    width: '400px',
  },
  m: {
    width: '600px',
  },
  l: {
    width: '800px',
  },
  xl: {
    width: '1000px',
  },
  xxl: {
    width: '1200px',
  },
  full: {
    width: '100vw',
    height: '100vh',
    maxWidth: '100vw',
    maxHeight: '100vh',
    panelClass: 'dialog-fullscreen'
  }
};

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private dialog: MatDialog) {}

  open<TComponent, TData = any, TResult = any>(
    component: Type<TComponent>,
    options?: {
      size?: DialogSize;
      data?: TData;
      config?: MatDialogConfig;
    }
  ): MatDialogRef<TComponent, TResult> {

    const baseSize = SIZE_MAP[options?.size ?? 'm'];

    const config: MatDialogConfig = {
      ...baseSize,
      maxWidth: 'none',
      maxHeight: 'none',
      autoFocus: false,
      restoreFocus: false,
      data: options?.data,
      ...options?.config,
    };

    return this.dialog.open(component, config);
  }
}