import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FOOTER_COLUMNS, REQUIRED_LINKS, USAGOV } from '../content/site-content';
import { InPageLink } from '../shared/in-page-link';

/** Registry: footer/big.html followed directly by identifier/default.html. */
@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, InPageLink],
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  protected readonly columns = FOOTER_COLUMNS;
  protected readonly requiredLinks = REQUIRED_LINKS;
  protected readonly usagov = USAGOV;
}
