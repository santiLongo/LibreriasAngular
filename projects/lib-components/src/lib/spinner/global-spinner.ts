import { Component } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { LoadingService } from 'lib-servicios'

@Component({
  standalone: true,
  selector: 'app-global-spinner',
  template: `
    @if (loadingService.loading$ | async) {
      <div class="overlay">
        <div class="spinner-box">
          <div class="spinner"></div>
          <p>{{ loadingService.message$ | async }}</p>
        </div>
      </div>
    }
  `,
  styleUrls: ['./global-spinner.css'],
  imports: [CommonModule, AsyncPipe]
})
export class GlobalSpinnerComponent {
  constructor(public loadingService: LoadingService) {}
}
