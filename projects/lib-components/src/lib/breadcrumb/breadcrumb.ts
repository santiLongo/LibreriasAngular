import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbService } from './service/breadcrumb.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumb.html'
})
export class BreadcrumbComponent{
  public breadcrumbs$;

  constructor(private breadcrumbService: BreadcrumbService) {
  this.breadcrumbs$ = this.breadcrumbService.breadcrumbs;
  }
}
