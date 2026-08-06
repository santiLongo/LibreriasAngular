// breadcrumb.service.ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private breadcrumbs$ = new BehaviorSubject<Breadcrumb[]>([]);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const root = this.router.routerState.snapshot.root;
        const breadcrumbs = this.createBreadcrumbs(root);
        this.breadcrumbs$.next(breadcrumbs);
      });
  }

  get breadcrumbs() {
    return this.breadcrumbs$.asObservable();
  }

  private createBreadcrumbs(
    route: ActivatedRouteSnapshot,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {

    const routeUrl = route.url.map(segment => segment.path).join('/');
    if (routeUrl) {
      url += `/${routeUrl}`;
    }

    const label = route.data['title'];
    if (label) {
      breadcrumbs.push({ label, url });
    }

    route.children.forEach(child =>
      this.createBreadcrumbs(child, url, breadcrumbs)
    );

    return breadcrumbs;
  }
}
