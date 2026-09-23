import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  Injector,
  afterNextRender,
  inject,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, skip } from 'rxjs';

import { GovBanner } from './layout/gov-banner';
import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';
import { InPageLink } from './shared/in-page-link';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, GovBanner, SiteHeader, SiteFooter, InPageLink],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  constructor() {
    // SPA route changes don't move focus the way a page load does; announce the new
    // page by focusing its target (fragment) or the main landmark. Skip the first load.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        afterNextRender(() => this.focusNavigationTarget(event.urlAfterRedirects), {
          injector: this.injector,
        });
      });
  }

  private focusNavigationTarget(url: string): void {
    const fragment = this.router.parseUrl(url).fragment;
    const target =
      (fragment && this.document.getElementById(fragment)) ||
      this.document.getElementById('main-content');
    if (!target) {
      return;
    }
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }
}
