import { DOCUMENT, Directive, inject, input } from '@angular/core';

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

/**
 * Same-page anchor for skip-nav, "return to top", and error-summary links.
 *
 * A plain href="#id" resolves against <base href="/">, so on /contact it would
 * navigate to /#id instead of moving within the page. This keeps the anchor
 * semantics but moves focus (not just scroll) to the target, which is what
 * keyboard and screen reader users need.
 */
@Directive({
  selector: 'a[appInPageLink]',
  host: {
    '[attr.href]': "'#' + appInPageLink()",
    '(click)': 'onClick($event)',
  },
})
export class InPageLink {
  readonly appInPageLink = input.required<string>();

  private readonly document = inject(DOCUMENT);

  protected onClick(event: MouseEvent): void {
    const target = this.document.getElementById(this.appInPageLink());
    if (!target) {
      return;
    }
    event.preventDefault();
    if (!target.matches(FOCUSABLE)) {
      target.setAttribute('tabindex', '-1');
    }
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  }
}
