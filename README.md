# USWDS AI Components

[![146 components](https://img.shields.io/badge/components-146-blue?style=flat)](https://designsystem.digital.gov/components/)
[![USWDS 3.13](https://img.shields.io/badge/USWDS-3.13.0-blue?style=flat)](https://designsystem.digital.gov/)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-green?style=flat)](#accessibility)
[![Gov Compliance](https://img.shields.io/badge/gov-Section%20508%20%7C%2021st%20Century%20IDEA-blueviolet?style=flat)](#compliance)

---

## What Is This?

USWDS AI Components is a **structured component knowledge base for AI coding agents** building government websites with the U.S. Web Design System (USWDS).

Think of it as a **component database with search indexes** — not a UI library to install. When an AI agent needs to build a form, navigation element, data display, or any government-compliant UI pattern, it queries this registry to find the right USWDS component, understand when to use it, and retrieve production-ready markup with embedded adaptation guidance.

**The value is in the structure**: every component is labeled, scored, faceted, and indexed so an agent can consistently select and adapt the right component for any given design task.

---

## Architecture

This registry extends the [AI Component Registry Spec](https://github.com/ednark/ai-component-registry-spec) as a git submodule at `_base/`. The base layer provides:

- **Protocol spec** (`_base/protocol.md`) — the retrieval protocol (3-surface architecture, flow, adaptation rules)
- **Generic generator** (`_base/generate-index.mjs`) — config-driven index generator
- **Templates** (`_base/agents.template.json`, `_base/llms.template.txt`) — fill-in templates
- **Tile format spec** (`_base/tile-format.md`) — HTML + embedded metadata block spec

This project provides the USWDS-specific content:

- **`registry.config.json`** — declares the design system, facets, agentMetaId, and URLs
- **`infinite/`** — 152 USWDS component tiles with embedded `uswds-agent-meta` JSON (structurally self-contained; component appearance comes from USWDS CSS — standalone preview via generated `*.resolved.html` companions, validated against `@uswds/uswds` at build time)
- **`agents.json`, `catalog.json`, `llms.txt`** — the manifest, catalog, and protocol

The retrieval protocol was originated by [forever-ai-components](https://github.com/isas1/forever-ai-components). The spec repo extracts and generalizes that protocol so any design system can adopt it.

```bash
# Update the base layer when the spec repo improves:
git submodule update --remote _base/

# Regenerate indexes using the shared generator:
node tools/generate-uswds.mjs   # delegates to _base/generate-index.mjs
```

---

## When to Use This Registry

Use this registry whenever you are building or improving a government website UI and need to:

| Scenario | How the Registry Helps |
|----------|----------------------|
| **Building a new feature** | Query the index to find the right component type (forms, navigation, feedback, data display, layout) |
| **Adding accessibility** | Filter by `govCompliance` and `a11y` facets to ensure Section 508 / WCAG 2.1 AA requirements |
| **Reducing JavaScript** | Filter `requiresJs: "no"` to prefer CSS-only components |
| **Finding variants** | Look up `variants[]` to see all available USWDS variants (e.g., `slim`, `bordered`, `error`, `tile`) |
| **Ensuring token consistency** | Check `tokenOverrides[]` to know which USWDS Sass tokens affect this component |
| **Understanding limitations** | Read `knownLimitations[]` to avoid misuse |
| **Pairing components** | Check `relatedComponents[]` for commonly used combinations |

**Do not generate custom UI** if a suitable component exists in the registry. Custom UI lacks the government-compliance metadata that this registry provides.

---

## How AI Agents Should Use This

### The Retrieval Flow

```
1. Load facets.json          → Learn what you can filter on
2. Load components.index.json → Get the full component list with discovery facets
3. Filter by facets          → Narrow down to candidates
4. Fetch component HTML       → Get the actual markup + embedded adaptation metadata
5. Follow agentPrompt        → Adapt the component correctly
```

### Step 1: Learn the Filter Vocabulary

```
GET infinite/facets.json
```

Returns: every filterable facet with its possible values and component counts. A few KB. Load this once to understand what's available.

### Step 2: Load the Discovery Index

```
GET infinite/components.index.json
```

Returns: a flat array of all 128 components with their discovery facets. **Does not include** the heavy adaptation prose — that's embedded in each tile file. Filter in code.

### Step 3: Filter by Facet

```js
// Find all CSS-only form components with WCAG 2.1 AA
components
  .filter(c => c.section === 'forms')
  .filter(c => c.requiresJs === 'no')
  .filter(c => c.a11y.wcag21AA === true)
  .filter(c => c.govCompliance.includes('Section 508'))

// Find navigation components that don't require JavaScript
components
  .filter(c => c.section === 'navigation')
  .filter(c => c.requiresJs === 'no')

// Find components that work for mobile
components
  .filter(c => c.a11y.keyboardNav === true)
  .filter(c => c.a11y.screenReader === true)
```

### Step 4: Fetch the Component Tile

```
GET infinite/{component}/{variant}.html
```

Returns: a self-contained HTML file with:
- Complete, production-ready USWDS markup
- Embedded `<script id="uswds-agent-meta">` with adaptation guidance

### Step 5: Follow the Embedded Guidance

Each tile contains adaptation metadata that tells you:

| Field | Purpose |
|-------|---------|
| `useWhen[]` | Situations where this component is the right choice |
| `avoidWhen[]` | Situations where this component is wrong or problematic |
| `agentPrompt` | Concrete instruction for how to adapt it |
| `editableAreas[]` | What you can safely change (classes, tokens, content) |
| `preserveElements[]` | What you must keep unchanged for correctness |
| `knownLimitations[]` | Constraints, browser quirks, or usage caveats |

**Always parse the embedded metadata** before modifying a retrieved component. It prevents common mistakes like removing required ARIA attributes or using the wrong variant class.

---

## Real-World Usage Scenarios

### Scenario 1: Building a Contact Form

```
Task: "Build a contact form with name, email, and message fields"

1. Filter: section=forms, requiresJs=no
2. Candidates: text-input, form
3. Fetch: text-input/default.html
4. Read metadata:
   - useWhen: ["Text entry", "User input"]
   - agentPrompt: "Add usa-input class to input element"
   - editableAreas: ["Label text", "placeholder", "id/for attributes"]
   - preserveElements: ["label.usa-label", "input.usa-input", "aria-describedby"]
5. Adapt: Create three text-input instances for name, email, message
```

### Scenario 2: Adding a Validation Error Display

```
Task: "Show validation errors at the top of a form"

1. Filter: section=forms, variant=error
2. Candidates: text-input/error, validation/alert, summary-box/error
3. Fetch: summary-box/error.html
4. Read metadata:
   - useWhen: ["Form validation errors", "Error summaries at top of forms"]
   - agentPrompt: "Use for form error summaries with links to fields"
   - knownLimitations: []
5. Adapt: Add links (href="#field-id") pointing to the invalid fields
```

### Scenario 3: Creating a Data Table with Striped Rows

```
Task: "Display tabular data with alternating row colors"

1. Filter: section=data-display, uswdsComponentType=table
2. Candidates: table/striped.html
3. Fetch: table/striped.html
4. Read metadata:
   - useWhen: ["Long lists of data", "Report-style displays"]
   - avoidWhen: ["Very short tables"]
   - agentPrompt: "Add usa-table--striped class to usa-table"
5. Adapt: Populate with real data, add data-label attributes for mobile stacking
```

### Scenario 4: Adding a Government Banner

```
Task: "Add the required federal government banner"

1. Filter: section=supporting, uswdsComponentType=banner
2. Candidates: banner/default.html
3. Fetch: banner/default.html
4. Read metadata:
   - govCompliance: ["Section 508", "WCAG 2.1 AA", "21st Century IDEA", "Required by US federal agencies"]
   - agentPrompt: "Place immediately after <body> tag on all federal government sites"
5. Adapt: Include exactly as-is — this component is required by law
```

---

## Decision Strategy

When solving a government UI task, follow this order:

1. **Understand the outcome** — what does the interface need to accomplish?
2. **Infer the component type** — form element, navigation, feedback, data display?
3. **Check `requiresJs`** — prefer `no` unless the task explicitly needs JavaScript behavior
4. **Verify `govCompliance`** — does it include applicable requirements (Section 508, 21st Century IDEA)?
5. **Check `a11y` defaults** — prefer `wcag21AA: true` and `keyboardNav: true`
6. **Filter by `section`** — narrow to forms, navigation, feedback, data-display, layout, or utilities
7. **Check `relatedComponents`** — what else is typically used with this component?
8. **Read the embedded metadata** — understand `useWhen`, `avoidWhen`, and `agentPrompt` before modifying
9. **Only generate custom UI** if no suitable component exists in the registry

---

## Accessibility

All components meet WCAG 2.1 AA requirements. Accessibility features include:

- **Keyboard navigation** — All interactive components are fully keyboard accessible
- **Screen reader support** — Proper ARIA labels, roles, and live regions
- **Reduced motion** — Components respect `prefers-reduced-motion`
- **Forced colors** — Components support Windows High Contrast and `forced-colors` mode
- **Focus indicators** — Visible focus states for keyboard users

---

## Government Compliance

Components support compliance with:

- **Section 508** — Federal accessibility law (36 CFR 1194)
- **WCAG 2.1 AA** — Web Content Accessibility Guidelines
- **21st Century IDEA** — Integrated Digital Experience Act
- **NIST Guidelines** — National Institute of Standards and Technology guidance

---

## Registry Structure

```
uswds-ai-components/
├── catalog.json                    # Source of truth: full component definitions
├── agents.json                     # Compact agent entry point (URLs, facet schema, count)
├── README.md                       # This file
│
└── infinite/
    ├── facets.json                 # Filter vocabulary: facets + values + counts
    ├── components.index.json        # Lean discovery index (all 128 components)
    │
    └── {component}/
        └── {variant}.html          # Self-contained USWDS demo + embedded adaptation metadata
                                    # Fetch only the tiles you actually need
```

---

## USWDS Component Inventory

### Forms (16 components)
Text Input, Checkbox, Radio Buttons, Select, Combo Box, Date Picker, Date Range Picker, File Input, Memorable Date, Time Picker, Range Slider, Character Count, Input Mask, Input Prefix/Suffix, Form Validation, Form

### Navigation (13 components)
Header, Side Navigation, Breadcrumb, Pagination, Step Indicator, In-Page Navigation, Search, Language Selector, Icon List, Link, **Skip Nav**, **Navbar**, **Sidenav**

### Feedback (8 components)
Alert, Site Alert, Modal, Tooltip, Banner, Process List, Summary Box, Tag

### Data Display (6 components)
Table, Card, Collection, Identifier, Icon, Data Visualizations

### Layout (6 components)
Footer, Header, Prose, Typography, **Media Block**, **Layout Docs**

### Utilities (4 components)
Button, Button Group, Accordion, **Overlay**

---

## Patterns from usa.gov

The following patterns were identified by inspecting [usa.gov](https://www.usa.gov) and its subpages (branches-of-government, agency-index, benefit-finder, passport):

- **`hidden="until-found"`** — HTML5 pattern used on usa.gov for accordion/banner content. Content stays hidden but is searchable via browser find-in-page. See `accordion/until-found.html` and `banner/until-found.html`.
- **`usa-sidenav`** — The actual USWDS sidenav class (distinct from `usa-nav`). Used on every content page with sidebar navigation. See `side-navigation/sidenav.html`.
- **`usa-footer__primary-content--collapsible`** — Footer sections that collapse on mobile. Used in the big footer variant on every usa.gov page. See `footer/collapsible.html`.
- **`usa-overlay`** — Empty div placed at top of body, toggled by USWDS JS when mobile menu opens. See `overlay/default.html`.
- **`usa-media-block`** — Image + text layout used inside the banner. See `media-block/default.html`.
- **`usa-layout-docs`** — Documentation layout with sidenav + main content. Used on all content pages. See `layout-docs/default.html`.
- **`usa-skipnav`** — Skip navigation link, first element in body for keyboard accessibility. See `skip-nav/default.html`.

### Patterns from pandemicoversight.gov

The following patterns were identified by inspecting [pandemicoversight.gov](https://www.pandemicoversight.gov) (homepage, about, news):

- **Basic header with mega-menu dropdowns** — Uses `usa-header--basic` with `usa-nav__submenu` containing multi-column grids and `usa-nav__submenu-items` with `item-title` + `item-description`. Different from the `usa-header--megamenu` class. See `header/basic-megamenu.html`.
- **Clickable cards** — `usa-card__container make-link` pattern where the entire card container is wrapped in a link. Used for topic cards on landing pages. See `card/clickable.html`.
- **Feedback form** — "Was this page helpful?" Yes/No form at the bottom of content pages. Uses `usa-form` with two `usa-button` submit inputs. See `form/feedback.html`.
- **Footer with email signup** — `usa-footer__email-container` integrated into the footer primary section with a newsletter subscription form. Often uses GovDelivery. See `footer/email-signup.html`.
- **Nav search dropdown** — Search icon as a `usa-nav__primary-item` that expands to a `usa-nav__submenu` panel containing a `usa-search` form. See `header/nav-search.html`.
- **Logo with image + text** — `usa-logo` variant combining `usa-logo-img` with a `logo-text` div containing bold name and tagline. See `logo/image-text.html`.
- **`usa-current` page marker** — Class applied to sidenav links/divs to mark the current page in the navigation hierarchy. See `side-navigation/current.html`.

---

## License

MIT. Components are part of the U.S. Web Design System (USWDS) which is in the public domain.
