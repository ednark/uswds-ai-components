import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, map } from 'rxjs';

import { CONTACT_TOPICS, USAGOV } from '../content/site-content';
import { InPageLink } from '../shared/in-page-link';

export const MESSAGE_MAX_LENGTH = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldKey = 'fullName' | 'email' | 'topic' | 'message';

/** Order matches the visual field order, so the error summary reads top to bottom. */
const FIELDS: { key: FieldKey; id: string }[] = [
  { key: 'fullName', id: 'full-name' },
  { key: 'email', id: 'email' },
  { key: 'topic', id: 'topic' },
  { key: 'message', id: 'message' },
];

/** Wording mirrors usa-character-count.js so the Angular port reads the same. */
export function characterCountMessage(length: number, max: number): string {
  if (length === 0) {
    return `${max} characters allowed`;
  }
  const difference = Math.abs(max - length);
  const noun = difference === 1 ? 'character' : 'characters';
  return `${difference} ${noun} ${length > max ? 'over limit' : 'left'}`;
}

/**
 * Registry recipe: contact-form
 *   form/default -> text-input/default (x2) -> select/default -> character-count/default
 *   -> button/default, with validation/default + alert/error summary above the form and
 *   alert/success on completion. usa-character-count.js is reimplemented with signals.
 * Client-only: nothing is sent or stored (the fields are PII: piiHandling "accepts_input").
 */
@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, InPageLink],
  templateUrl: './contact.html',
})
export class Contact {
  protected readonly topics = CONTACT_TOPICS;
  protected readonly maxLength = MESSAGE_MAX_LENGTH;
  protected readonly phoneUrl = `${USAGOV}/phone`;

  protected readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    topic: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(MESSAGE_MAX_LENGTH)],
    }),
  });

  /** Errors appear after the first submit attempt, then track the fields until fixed. */
  protected readonly showErrors = signal(false);
  protected readonly sent = signal(false);

  // Bridge Reactive Forms into signals so OnPush/zoneless templates stay in sync.
  private readonly formEvents = toSignal(this.form.events);

  private readonly messageControl = this.form.controls.message;
  protected readonly messageLength = toSignal(
    this.messageControl.valueChanges.pipe(map((value) => value.length)),
    { initialValue: 0 },
  );
  protected readonly overLimit = computed(() => this.messageLength() > MESSAGE_MAX_LENGTH);
  protected readonly countMessage = computed(() =>
    characterCountMessage(this.messageLength(), MESSAGE_MAX_LENGTH),
  );
  /** Debounced like usa-character-count.js so screen readers aren't flooded while typing. */
  protected readonly srCountMessage = toSignal(
    this.messageControl.valueChanges.pipe(
      debounceTime(1000),
      map((value) => characterCountMessage(value.length, MESSAGE_MAX_LENGTH)),
    ),
    { initialValue: characterCountMessage(0, MESSAGE_MAX_LENGTH) },
  );

  private readonly fieldErrors = computed<Record<FieldKey, string | null>>(() => {
    this.formEvents();
    const { fullName, email, topic, message } = this.form.controls;
    return {
      fullName: fullName.hasError('required') ? 'Enter your full name' : null,
      email: email.hasError('required')
        ? 'Enter your email address'
        : email.hasError('pattern')
          ? 'Enter an email address in the correct format, like name@example.com'
          : null,
      topic: topic.hasError('required') ? 'Select a topic' : null,
      message: message.hasError('required')
        ? 'Enter your message'
        : message.hasError('maxlength')
          ? `Your message must be ${MESSAGE_MAX_LENGTH} characters or fewer`
          : null,
    };
  });

  protected readonly errors = computed(() => {
    if (!this.showErrors()) {
      return [];
    }
    const messages = this.fieldErrors();
    return FIELDS.filter(({ key }) => messages[key]).map(({ key, id }) => ({
      id,
      message: messages[key] as string,
    }));
  });

  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly successAlert = viewChild<ElementRef<HTMLElement>>('successAlert');
  private readonly injector = inject(Injector);

  protected error(key: FieldKey): string | null {
    return this.showErrors() ? this.fieldErrors()[key] : null;
  }

  protected describedBy(key: FieldKey, errorId: string, ...ids: string[]): string | null {
    const all = this.error(key) ? [errorId, ...ids] : ids;
    return all.length ? all.join(' ') : null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.sent.set(false);
      this.showErrors.set(true);
      this.focusAfterRender(() => this.errorSummary());
      return;
    }
    // Demo only: discard the values. A real service would POST them over HTTPS here.
    this.form.reset();
    this.showErrors.set(false);
    this.sent.set(true);
    this.focusAfterRender(() => this.successAlert());
  }

  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(
      () => {
        const element = target()?.nativeElement;
        element?.scrollIntoView({ block: 'start' });
        element?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
}
