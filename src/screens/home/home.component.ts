import { Component, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  protected readonly title = signal('librerias-generales');
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  navigate(route: string) {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
