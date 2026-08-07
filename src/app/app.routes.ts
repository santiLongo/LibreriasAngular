import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('../screens/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'test-dialog',
        loadComponent: () => import('../screens/test-dialog/test-dialog.component').then(m => m.TestDialogComponent)
    }
];
