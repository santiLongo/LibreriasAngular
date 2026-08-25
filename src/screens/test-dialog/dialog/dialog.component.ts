import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DialogSize } from 'lib-servicios';

export interface EditarUsuarioData {
  size: DialogSize;
  nombre: string;
  email: string;
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      min-width: 320px;
      padding-top: 8px;
    }
  `,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class DialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DialogComponent>);
  private readonly data = inject<EditarUsuarioData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    nombre: [this.data.nombre, Validators.required],
    email: [this.data.email, [Validators.required, Validators.email]],
  });

  guardar(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
