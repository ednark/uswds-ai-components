#!/usr/bin/env node
// R2 — fix invented design-system classes in USWDS tiles (audit 2026-09-22).
// Every replacement is an exact string match (deterministic). For each tile we
// also append a limitations note to agent-meta discovery.limitations so agents
// learn the real USWDS API instead of a phantom one.
//
// Usage: node tools/fix-invented-classes.mjs [--dry]

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INF = join(ROOT, 'infinite');
const dry = process.argv.includes('--dry');

// --- per-file exact replacements ---
const FIXES = {
  'card/media.html': {
    replacements: [
      { from: '"uswdsClass": "usa-card usa-card--media"', to: '"uswdsClass": "usa-card"' },
      { from: '"article.usa-card usa-card--media"', to: '"article.usa-card"' },
      { from: '<article class="usa-card usa-card--media">', to: '<article class="usa-card">' },
    ],
    limitation: 'usa-card--media is not a USWDS 3 class; the image area is the usa-card__media element (used in this markup).',
  },
  'card/inset.html': {
    replacements: [
      { from: '"uswdsClass": "usa-card usa-card--inset"', to: '"uswdsClass": "usa-card"' },
      { from: '"article.usa-card usa-card--inset"', to: '"article.usa-card"' },
      { from: '<article class="usa-card usa-card--inset">', to: '<article class="usa-card">' },
    ],
    limitation: 'usa-card--inset is not a USWDS 3 class; the real inset is usa-card__media--inset on the card\'s media element.',
  },
  'card/header-flag.html': {
    replacements: [
      { from: 'usa-card--header-flag', to: 'usa-card--header-first' },
    ],
    limitation: null, // rename to the real variant class
  },
  'card/default.html': {
    replacements: [
      { from: 'usa-card--media for image + content, usa-card--inset for content with background', to: 'usa-card__media for the image area, usa-card__media--inset for inset media' },
    ],
    limitation: null,
  },
  'logo/image-text.html': {
    replacements: [
      { from: '<img class="usa-logo-img" src="logo.svg"', to: '<img src="logo.svg"' },
      { from: '"img.usa-logo-img"', to: '"img"' },
      { from: 'img.usa-logo-img', to: 'img' },
    ],
    limitation: 'usa-logo-img is not a USWDS class; the logo image sits inside usa-logo without a dedicated class.',
  },
  'navbar/default.html': {
    replacements: [
      { from: 'usa-logo-text', to: 'usa-logo__text' },
    ],
    limitation: null,
  },
  'step-indicator/centered.html': {
    replacements: [
      { from: 'usa-step-indicator--centered', to: 'usa-step-indicator--center' },
    ],
    limitation: null, // real class is usa-step-indicator--center
  },
  'step-indicator/default.html': {
    replacements: [
      { from: 'usa-step-indicator--centered', to: 'usa-step-indicator--center' },
    ],
    limitation: null,
  },
  'accordion/multiselectable.html': {
    replacements: [
      { from: 'class="usa-accordion usa-accordion--multiselectable" data-allow-multiple', to: 'class="usa-accordion" data-allow-multiple' },
      { from: ' usa-accordion--multiselectable', to: '' },
    ],
    limitation: null, // data-allow-multiple attribute is the real USWDS mechanism
  },
  'input-mask/default.html': {
    replacements: [
      { from: 'usa-input--mask', to: 'usa-masked' },
    ],
    limitation: null, // usa-masked is the real USWDS marker class
  },
  'select/success.html': {
    replacements: [
      { from: 'usa-select--success', to: 'usa-input--success' },
      { from: '<span class="usa-success-message" ', to: '<span ' },
    ],
    limitation: 'usa-select--success is not a USWDS class; the success state class is usa-input--success. usa-success-message does not exist; success feedback uses usa-input--success plus hint text.',
  },
  'select/disabled.html': {
    replacements: [
      { from: 'usa-select--disabled', to: 'usa-select' },
    ],
    limitation: 'usa-select--disabled is not a USWDS class; disabled selects use the disabled attribute.',
  },
  'select/tile.html': {
    replacements: [
      { from: ' usa-select--tile', to: '' },
    ],
    limitation: 'usa-select--tile is not a USWDS class; tile variants exist for checkbox/radio, not select.',
  },
  'text-input/disabled.html': {
    replacements: [
      { from: ' usa-input--disabled', to: '' },
    ],
    limitation: 'usa-input--disabled is not a USWDS 3 class; disabled inputs use the disabled attribute.',
  },
  'text-input/tile.html': {
    replacements: [
      { from: ' usa-input--tile', to: '' },
    ],
    limitation: 'usa-input--tile is not a USWDS class; tile variants exist for checkbox/radio, not text inputs.',
  },
  'checkbox/success.html': {
    replacements: [{ from: '<span class="usa-success-message" ', to: '<span ' }],
    limitation: 'usa-success-message is not a USWDS class; success feedback uses usa-input--success plus hint text.',
  },
  'radio-buttons/success.html': {
    replacements: [{ from: '<span class="usa-success-message" ', to: '<span ' }],
    limitation: 'usa-success-message is not a USWDS class; success feedback uses usa-input--success plus hint text.',
  },
  'text-input/success.html': {
    replacements: [{ from: '<span class="usa-success-message" ', to: '<span ' }],
    limitation: 'usa-success-message is not a USWDS class; success feedback uses usa-input--success plus hint text.',
  },
  'summary-box/error.html': {
    replacements: [
      { from: 'usa-summary-box--error', to: 'usa-summary-box' },
    ],
    limitation: 'usa-summary-box--error is not a USWDS class — summary box has no variants (USWDS 3 docs).',
  },
  'summary-box/info.html': {
    replacements: [
      { from: 'usa-summary-box--info', to: 'usa-summary-box' },
    ],
    limitation: 'usa-summary-box--info is not a USWDS class — summary box has no variants (USWDS 3 docs).',
  },
  'summary-box/warning.html': {
    replacements: [
      { from: 'usa-summary-box--warning', to: 'usa-summary-box' },
    ],
    limitation: 'usa-summary-box--warning is not a USWDS class — summary box has no variants (USWDS 3 docs).',
  },
  'summary-box/default.html': {
    replacements: [
      { from: 'Add usa-summary-box--info, usa-summary-box--warning, or usa-summary-box--error for variants. Update heading an', to: 'Summary box has no variants in USWDS 3 — do not add usa-summary-box--* classes. Update heading an' },
    ],
    limitation: null,
  },
  'combo-box/lg.html': {
    replacements: [{ from: ' usa-combo-box--lg', to: '' }],
    limitation: 'usa-combo-box--lg is not a USWDS class — combo box has no size variants; larger sizing is a page-level customization.',
  },
  'date-picker/lg.html': {
    replacements: [{ from: ' usa-date-picker--lg', to: '' }],
    limitation: 'usa-date-picker--lg is not a USWDS class — date picker has no size variants.',
  },
  'range-slider/lg.html': {
    replacements: [{ from: ' usa-range--lg', to: '' }],
    limitation: 'usa-range--lg is not a USWDS class — range slider has no size variants.',
  },
  'banner/slim.html': {
    replacements: [{ from: ' usa-banner--slim', to: '' }],
    limitation: 'usa-banner--slim is a USWDS 2.x class, removed in USWDS 3 — the banner has one variant (default) plus the <usa-banner> web component.',
  },
  'banner/medium.html': {
    replacements: [{ from: ' usa-banner--medium', to: '' }],
    limitation: 'usa-banner--medium is a USWDS 2.x class, removed in USWDS 3 — the banner has one variant (default) plus the <usa-banner> web component.',
  },
  'banner/default.html': {
    replacements: [
      { from: 'Add usa-banner--slim or usa-banner--medium', to: 'USWDS 3 has no usa-banner--slim/--medium (2.x legacy); the banner has one variant plus the <usa-banner> web component' },
    ],
    limitation: null,
  },
  'breadcrumb/naviprev-next.html': {
    replacements: [{ from: ' usa-breadcrumb--naviprev-next', to: '' }],
    limitation: 'usa-breadcrumb--naviprev-next is not a USWDS class; prev/next flows use the pagination component.',
  },
  'breadcrumb/default.html': {
    replacements: [
      { from: '"Variant: usa-breadcrumb--wrap or usa-breadcrumb--naviprev-next"', to: '"Variant: usa-breadcrumb--truncate (single-line truncation); usa-breadcrumb--wrap is a documented backward-compat no-op since 3.14 (breadcrumbs wrap by default)"' },
    ],
    limitation: null,
  },
  'collection/list.html': {
    replacements: [{ from: ' usa-collection--list', to: '' }],
    limitation: 'usa-collection--list is not a USWDS class; collection list format is the default markup.',
  },
  'process-list/steps.html': {
    replacements: [{ from: ' usa-process-list--steps', to: '' }],
    limitation: 'usa-process-list--steps is not a USWDS class; the numbered process list is the default markup.',
  },
  'pagination/show-all.html': {
    replacements: [{ from: ' usa-pagination--show-all', to: '' }],
    limitation: 'usa-pagination--show-all is not a USWDS class; show-all pagination is the default markup.',
  },
  'icon-list/checklist.html': {
    replacements: [{ from: ' usa-icon-list--checklist', to: '' }],
    limitation: 'usa-icon-list--checklist is not a USWDS class; check icons come from the icon hrefs, not a variant class.',
  },
  'icon-list/default.html': {
    replacements: [
      { from: 'Add usa-icon-list--checklist for checklist st', to: 'Checklist style comes from the icon hrefs (no usa-icon-list--checklist class exists); st' },
      { from: 'Add usa-icon-list--icon-lg', to: 'Size icons via usa-icon-list__icon content (no usa-icon-list--icon-lg class exists)' },
    ],
    limitation: null,
  },
  'icon-list/icon-lg.html': {
    replacements: [{ from: ' usa-icon-list--icon-lg', to: '' }],
    limitation: 'usa-icon-list--icon-lg is not a USWDS class; icon sizing is not a USWDS 3 icon-list variant.',
  },
  'file-input/error.html': {
    replacements: [{ from: ' usa-file-input--error', to: '' }],
    limitation: 'usa-file-input--error is not a USWDS class; file-input errors use the usa-form-group--error wrapper pattern.',
  },
  'modal/lg.html': {
    replacements: [{ from: 'usa-button usa-button--primary', to: 'usa-button' }],
    limitation: null, // default button IS primary
  },

  // ---- Second wave (surfaced by the R1 guardrail, audit follow-up 2026-09-22) ----
  'banner/default.html': {
    replacements: [{ from: 'usa-banner__text', to: 'usa-banner__header-text' }],
    limitation: null, // second pass: token already replaced in first pass config
  },
  'banner/medium.html': {
    replacements: [{ from: 'usa-banner__text', to: 'usa-banner__header-text' }],
    limitation: null,
  },
  'banner/slim.html': {
    replacements: [{ from: 'usa-banner__text', to: 'usa-banner__header-text' }],
    limitation: null,
  },
  'banner/until-found.html': {
    replacements: [
      { from: ' usa-banner__header-action-mobile', to: '' },
    ],
    limitation: null,
  },
  'accordion/bordered.html': {
    replacements: [
      { from: '<li class="usa-accordion__item">', to: '<li>' },
      { from: '"li.usa-accordion__item"', to: '"li"' },
    ],
    limitation: 'usa-accordion__item is not a USWDS class; accordion sections are plain <li> containing h2.usa-accordion__heading + div.usa-accordion__content.',
  },
  'accordion/until-found.html': {
    replacements: [
      { from: '<li class="usa-accordion__item">', to: '<li>' },
      { from: '"li.usa-accordion__item"', to: '"li"' },
    ],
    limitation: 'usa-accordion__item is not a USWDS class; accordion sections are plain <li> with h2.usa-accordion__heading + div.usa-accordion__content (hidden="until-found" for this variant).',
  },
  'character-count/default.html': {
    replacements: [{ from: 'usa-character-count__count', to: 'usa-character-count__status' }],
    limitation: null, // 3.14 renamed the message class to __status
  },
  'character-count/error.html': {
    replacements: [{ from: ' usa-character-count__wrapper', to: '' }],
    limitation: 'usa-character-count__wrapper is not a USWDS class; the wrapper is a plain usa-form-group.',
  },
  'checkbox/disabled.html': {
    replacements: [{ from: ' usa-checkbox__group', to: '' }],
    limitation: 'usa-checkbox__group is not a USWDS class; grouped checkboxes use a plain usa-fieldset + legend.',
  },
  'checkbox/tile.html': {
    replacements: [{ from: ' usa-checkbox__group', to: '' }],
    limitation: 'usa-checkbox__group is not a USWDS class; grouped checkboxes use a plain usa-fieldset + legend.',
  },
  'checkbox/error.html': {
    replacements: [{ from: ' usa-checkbox__group', to: '' }],
    limitation: 'usa-checkbox__group is not a USWDS class; grouped checkboxes use a plain usa-fieldset + legend.',
  },
  'checkbox/success.html': {
    replacements: [
      { from: ' usa-checkbox__group', to: '' },
      { from: ' usa-checkbox__input--success', to: '' },
    ],
    limitation: 'usa-checkbox__group and usa-checkbox__input--success are not USWDS classes; success feedback is expressed with usa-input--success on inputs, hint text, and role="status" announcements.',
  },
  'radio-buttons/disabled.html': {
    replacements: [{ from: ' usa-radio__group', to: '' }],
    limitation: 'usa-radio__group is not a USWDS class; grouped radios use a plain usa-fieldset + legend.',
  },
  'radio-buttons/tile.html': {
    replacements: [{ from: ' usa-radio__group', to: '' }],
    limitation: 'usa-radio__group is not a USWDS class; grouped radios use a plain usa-fieldset + legend.',
  },
  'radio-buttons/error.html': {
    replacements: [{ from: ' usa-radio__group', to: '' }],
    limitation: 'usa-radio__group is not a USWDS class; grouped radios use a plain usa-fieldset + legend.',
  },
  'radio-buttons/success.html': {
    replacements: [
      { from: ' usa-radio__group', to: '' },
      { from: ' usa-radio__input--success', to: '' },
    ],
    limitation: 'usa-radio__group and usa-radio__input--success are not USWDS classes; success feedback is expressed with hint text and role="status" announcements.',
  },
  'collection/default.html': {
    replacements: [{ from: 'usa-collection__link', to: 'usa-link' }],
    limitation: null,
  },
  'data-visualizations/bar.html': {
    replacements: [{ from: 'usa-legend__color', to: 'demo-legend-item' }],
    limitation: null, // de-classed per L3: chart legend is registry demo structure
  },
  'data-visualizations/line.html': {
    replacements: [{ from: 'usa-legend__color', to: 'demo-legend-item' }],
    limitation: null,
  },
  'data-visualizations/pie.html': {
    replacements: [{ from: 'usa-legend__color', to: 'demo-legend-item' }],
    limitation: null,
  },
  'file-input/default.html': {
    replacements: [{ from: ' usa-file-input__label', to: '' }],
    limitation: 'usa-file-input__label is not a USWDS class; the label is a plain usa-label.',
  },
  'file-input/error.html': {
    replacements: [
      { from: ' usa-file-input__label', to: '' },
      { from: ' usa-file-input__message', to: '' },
    ],
    limitation: 'usa-file-input__label/__message are not USWDS classes; use plain usa-label and usa-hint.',
  },
  'footer/big.html': {
    replacements: [
      { from: 'usa-footer__grid', to: 'demo-footer-grid' },
      { from: 'usa-footer__col', to: 'demo-footer-col' },
      { from: 'usa-footer__heading', to: 'demo-footer-heading' },
    ],
    limitation: 'Footer column layout uses core grid classes (grid-row/grid-col) plus usa-footer__primary-link; usa-footer__grid/__col/__heading were invented and are now demo-* classes.',
  },
  'footer/email-signup.html': {
    replacements: [{ from: 'usa-footer__email-container', to: 'demo-footer-email' }],
    limitation: 'usa-footer__email-container is not a USWDS class; the email signup uses usa-footer__signup and core grid classes.',
  },
  'header/basic-megamenu.html': {
    replacements: [{ from: ' usa-nav__submenu-items', to: '' }],
    limitation: 'usa-nav__submenu-items is not a USWDS class; megamenu columns use core grid classes inside usa-nav__submenu.',
  },
  'header/megamenu.html': {
    replacements: [
      { from: 'usa-nav__megamenu-inner', to: '' },
      { from: 'usa-nav__megamenu', to: 'usa-megamenu' },
    ],
    limitation: null, // usa-megamenu is the real container class
  },
  'identifier/default.html': {
    replacements: [
      { from: 'usa-identifier__masthead', to: 'usa-identifier__section--masthead' },
      { from: 'usa-identifier__agency-name', to: 'usa-identifier__identity-domain' },
      { from: 'usa-identifier__links', to: 'usa-identifier__required-links-list' },
      { from: 'usa-identifier__required-links-list-list', to: 'usa-identifier__required-links-list' },
    ],
    limitation: null, // real USWDS identifier classes
  },
  'identifier/with-logo.html': {
    replacements: [{ from: '<h2 class="usa-identifier__heading" ', to: '<h2 ' }],
    limitation: 'usa-identifier__heading is not a USWDS class; the identifier section is titled via aria-label, not a heading element.',
  },
  'in-page-navigation/default.html': {
    replacements: [{ from: 'usa-in-page-nav__link', to: '' }],
    limitation: 'usa-in-page-nav__link is not a USWDS class; links inside usa-in-page-nav__item carry no class.',
  },
  'language-selector/default.html': {
    replacements: [{ from: ' usa-language__list', to: '' }],
    limitation: 'usa-language__list is not a USWDS class; language selector lists use usa-language__primary/__submenu families.',
  },
  'list/default.html': {
    replacements: [{ from: ' usa-list__item', to: '' }],
    limitation: 'usa-list__item is not a USWDS class; list items are plain <li> inside .usa-list.',
  },
  'link/default.html': {
    replacements: [{ from: 'usa-link--download', to: 'usa-link' }],
    limitation: 'usa-link--download is not a USWDS class; download links are plain usa-link (icon optional via usa-icon).',
  },
  'link/download.html': {
    replacements: [{ from: 'usa-link--download', to: 'usa-link' }],
    limitation: 'usa-link--download is not a USWDS class; download links are plain usa-link with an icon.',
  },
  'modal/default.html': {
    replacements: [
      { from: 'usa-modal__header', to: 'demo-modal-header' },
      { from: 'usa-modal__body', to: 'demo-modal-body' },
    ],
    limitation: 'usa-modal__header/__body are not USWDS classes; the real structure is usa-modal__content > usa-modal__main containing heading, close, and body.',
  },
  'pagination/default.html': {
    replacements: [
      { from: 'usa-pagination__page-item', to: 'usa-pagination__page-no' },
      { from: 'usa-pagination__current-page', to: 'usa-current' },
    ],
    limitation: null, // usa-pagination__page-no and usa-current are the documented classes
  },
  'pagination/show-all.html': {
    replacements: [
      { from: '<li class="usa-pagination__item usa-pagination__item--current">', to: '<li class="usa-pagination__item">' },
      { from: '<span class="usa-pagination__button" aria-current="page">5</span>', to: '<span class="usa-pagination__button usa-current" aria-current="page">5</span>' },
    ],
    limitation: null, // usa-current + aria-current is the documented pattern
  },
  'process-list/default.html': {
    replacements: [{ from: 'usa-process-list__header', to: 'usa-process-list__heading' }],
    limitation: null,
  },
  'side-navigation/default.html': {
    replacements: [{ from: 'usa-sidenav__list', to: 'usa-sidenav' }],
    limitation: null, // the top-level ul itself carries usa-sidenav
  },
  'site-alert/default.html': {
    replacements: [
      { from: '<div class="usa-site-alert__body">', to: '<div>' },
      { from: '<h3 class="usa-site-alert__heading">', to: '<h3 class="usa-alert__heading">' },
      { from: ' usa-site-alert__text', to: '' },
      { from: ' usa-site-alert__heading', to: ' usa-alert__heading' },
      { from: ' usa-site-alert__body', to: '' },
    ],
    limitation: 'usa-site-alert__body/__heading/__text are not USWDS classes; site alert content is an .usa-alert element with .usa-alert__heading inside the wrapper.',
  },
  'step-indicator/centered.html': {
    replacements: [{ from: 'usa-step-indicator__label', to: 'usa-step-indicator__segment-label' }],
    limitation: null,
  },
  'list/default.html': {
    replacements: [{ from: '<li class="usa-list__item">', to: '<li>' }],
    limitation: 'usa-list__item is not a USWDS class; list items are plain <li> inside .usa-list.',
  },
  'checkbox/disabled.html': {
    replacements: [{ from: '<div class="usa-checkbox__group">', to: '<div>' }],
    limitation: null,
  },
  'checkbox/tile.html': {
    replacements: [{ from: '<div class="usa-checkbox__group">', to: '<div>' }],
    limitation: null,
  },
  'checkbox/error.html': {
    replacements: [{ from: '<div class="usa-checkbox__group">', to: '<div>' }],
    limitation: null,
  },
  'checkbox/success.html': {
    replacements: [{ from: '<div class="usa-checkbox__group">', to: '<div>' }],
    limitation: null,
  },
  'radio-buttons/disabled.html': {
    replacements: [{ from: '<div class="usa-radio__group">', to: '<div>' }],
    limitation: null,
  },
  'radio-buttons/tile.html': {
    replacements: [{ from: '<div class="usa-radio__group">', to: '<div>' }],
    limitation: null,
  },
  'radio-buttons/error.html': {
    replacements: [{ from: '<div class="usa-radio__group">', to: '<div>' }],
    limitation: null,
  },
  'radio-buttons/success.html': {
    replacements: [{ from: '<div class="usa-radio__group">', to: '<div>' }],
    limitation: null,
  },
  'file-input/default.html': {
    replacements: [
      { from: '<label class="usa-file-input__label" for="file-input">', to: '<label for="file-input">' },
      { from: '"label.usa-file-input__label with aria-describedby"', to: '"label with aria-describedby"' },
    ],
    limitation: null,
  },
  'file-input/error.html': {
    replacements: [
      { from: '<label for="file-input-error" class="usa-file-input__label">', to: '<label for="file-input-error">' },
      { from: 'class="usa-file-input__message"', to: 'class="usa-error-message"' },
      { from: '"label.usa-file-input__label"', to: '"label"' },
    ],
    limitation: null, // usa-error-message is the real error-message class
  },
  'language-selector/default.html': {
    replacements: [{ from: '<ul class="usa-language__list">', to: '<ul class="usa-language__primary">' }],
    limitation: null, // usa-language__primary is the real list class
  },
  'identifier/default.html': {
    replacements: [{ from: 'usa-identifier__required-links', to: 'usa-identifier__required-links-list' }],
    limitation: null,
  },
  'process-list/default.html': {
    replacements: [
      { from: '<div class="usa-process-list__description">', to: '<div>' },
      { from: '"div.usa-process-list__description for body"', to: '"plain div inside usa-process-list__item for body text"' },
      { from: '"Step descriptions (usa-process-list__description)"', to: '"Step descriptions (plain div inside usa-process-list__item)"' },
    ],
    limitation: 'usa-process-list__description is not a USWDS class; step descriptions are plain content inside usa-process-list__item.',
  },
};

// --- limitations injection into agent-meta discovery ---
function injectLimitation(html, agentMetaId, note) {
  const re = new RegExp(`(<script[^>]*id="${agentMetaId}"[^>]*>)([\\s\\S]*?)(</script>)`);
  const m = html.match(re);
  if (!m) return html;
  let meta;
  try { meta = JSON.parse(m[2]); } catch { return html; }
  meta.discovery = meta.discovery ?? {};
  meta.discovery.limitations = meta.discovery.limitations ?? [];
  if (!meta.discovery.limitations.includes(note)) meta.discovery.limitations.push(note);
  const replacement = `${m[1]}${JSON.stringify(meta, null, 2)}${m[3]}`;
  return html.replace(re, () => replacement);
}

let filesChanged = 0, replacementsApplied = 0, notesAdded = 0;
for (const [rel, fix] of Object.entries(FIXES)) {
  const path = join(INF, rel);
  let html = readFileSync(path, 'utf8');
  let changed = false;
  for (const { from, to } of FIXES[rel].replacements) {
    if (html.includes(from)) {
      html = html.split(from).join(to);
      changed = true;
      replacementsApplied++;
      console.log(`  ${rel}: "${from.slice(0, 60)}" -> "${String(to).slice(0, 50) || '(removed)'}"`);
    } else {
      console.warn(`  ! ${rel}: pattern not found: "${from.slice(0, 60)}"`);
    }
  }
  if (FIXES[rel].limitation) {
    const before = html;
    html = injectLimitation(html, 'uswds-agent-meta', FIXES[rel].limitation);
    if (html !== before) { changed = true; console.log(`  ${rel}: + limitation note`); }
  }
  if (changed && !dry) writeFileSync(path, html);
  if (changed) filesChanged++;
}
console.log(`\n${dry ? '[dry] ' : ''}Done: ${filesChanged} files changed, ${replacementsApplied} replacements applied.`);