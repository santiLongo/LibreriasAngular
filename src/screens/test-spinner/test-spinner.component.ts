import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  CoreViewComponent,
  FormFieldComponent,
  OverlaySpinnerComponent,
} from 'lib-components';

@Component({
  selector: 'app-test-spinner',
  templateUrl: './test-spinner.component.html',
  styleUrl: './test-spinner.component.css',
  imports: [
    CoreViewComponent,
    ButtonComponent,
    FormFieldComponent,
    OverlaySpinnerComponent,
    FormsModule,
  ],
})
export class TestSpinnerComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  texto = 'Guardando el viaje';
  visible = false;

  mostrar(segundos: number) {
    this.visible = true;

    // La app es zoneless: lo que cambia fuera de un evento hay que marcarlo
    setTimeout(() => {
      this.visible = false;
      this.cdr.markForCheck();
    }, segundos * 1000);
  }
}
