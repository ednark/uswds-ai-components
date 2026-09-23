import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/**
 * Registry: banner/default.html (requiresJs: no, cheap/moderate).
 * The tile's toggle is a non-focusable <p>; this follows the USWDS 3.13 package
 * markup instead (accordion button with aria-expanded/aria-controls) so the
 * expandable content is keyboard accessible, and replaces usa-banner.js with a signal.
 */
@Component({
  selector: 'app-gov-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gov-banner.html',
})
export class GovBanner {
  protected readonly expanded = signal(false);

  protected toggle(): void {
    this.expanded.update((open) => !open);
  }
}
