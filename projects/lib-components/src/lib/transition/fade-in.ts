import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-fade-in',
  standalone: true,
  template: `
    <div class="fade-wrapper" [class.fast]="speed === 'fast'">
      <ng-content />
    </div>
  `,
  styleUrls: ['./fade-in.css']
})
export class FadeInComponent {
  @Input() speed: 'normal' | 'fast' = 'normal';
}