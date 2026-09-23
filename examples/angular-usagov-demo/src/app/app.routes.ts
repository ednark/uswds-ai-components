import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Making government services easier to find | USAGov (demo)',
    loadComponent: () => import('./pages/home').then((m) => m.Home),
  },
  {
    path: 'contact',
    title: 'Contact USAGov | USAGov (demo)',
    loadComponent: () => import('./pages/contact').then((m) => m.Contact),
  },
  { path: '**', redirectTo: '' },
];
