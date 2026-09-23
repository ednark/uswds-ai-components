import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HOW_DO_I, TOPICS, USAGOV } from '../content/site-content';
import { InPageLink } from '../shared/in-page-link';
import { UsaIcon } from '../shared/usa-icon';

/**
 * Registry recipe: topic-landing-page (banner -> extended header -> card group -> footer).
 * Cards: card/group.html container with the USWDS 3.13 li.usa-card > .usa-card__container
 * structure; whole-card click via a stretched heading link (one link, short accessible name).
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InPageLink, UsaIcon],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly howDoI = HOW_DO_I;
  protected readonly topics = TOPICS;
  protected readonly benefitFinder = `${USAGOV}/benefit-finder`;
}
