import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Decorative USWDS sprite icon. Accessible names belong on the surrounding control or text. */
@Component({
  selector: 'app-usa-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <svg [class]="sizeClass()" aria-hidden="true" focusable="false" role="img">
      <use [attr.href]="'assets/uswds/img/sprite.svg#' + name()"></use>
    </svg>
  `,
})
export class UsaIcon {
  readonly name = input.required<string>();
  /** USWDS icon size step (3-9), or 0 for the default 1em */
  readonly size = input(0);

  protected readonly sizeClass = computed(() =>
    this.size() ? `usa-icon usa-icon--size-${this.size()}` : 'usa-icon',
  );
}
