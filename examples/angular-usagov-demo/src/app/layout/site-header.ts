import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PRIMARY_NAV, SECONDARY_NAV } from '../content/site-content';

const DESKTOP = '(min-width: 64em)';
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Registry: header/extended.html + search/small.html (form prerequisite satisfied by
 * the search's own form element; not nested in another form, per form.incompatibleWith).
 * Structure follows the USWDS 3.13 extended header (usa-navbar + usa-nav__inner);
 * usa-header.js mobile behavior is reimplemented with signals.
 */
@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class SiteHeader {
  protected readonly primaryNav = PRIMARY_NAV;
  protected readonly secondaryNav = SECONDARY_NAV;
  protected readonly menuOpen = signal(false);

  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      this.document.body.classList.toggle('usa-js-mobile-nav--active', this.menuOpen());
    });

    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));

    const desktop = this.document.defaultView?.matchMedia(DESKTOP);
    if (desktop) {
      const onChange = (event: MediaQueryListEvent) => event.matches && this.menuOpen.set(false);
      desktop.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => desktop.removeEventListener('change', onChange));
    }
  }

  protected openMenu(): void {
    this.menuOpen.set(true);
    afterNextRender(() => this.closeButton().nativeElement.focus(), { injector: this.injector });
  }

  protected closeMenu(): void {
    if (!this.menuOpen()) {
      return;
    }
    this.menuOpen.set(false);
    afterNextRender(() => this.menuButton().nativeElement.focus(), { injector: this.injector });
  }

  /** Keep Tab focus inside the open mobile menu (usa-header.js focus trap equivalent). */
  protected trapFocus(event: KeyboardEvent): void {
    if (!this.menuOpen() || event.key !== 'Tab') {
      return;
    }
    const focusable = Array.from(
      this.nav().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
