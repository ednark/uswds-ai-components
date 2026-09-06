---
name: uswds-design
description: USWDS design knowledge skill. Query the uswds-ai-components registry to find the right USWDS component for any government UI task. Use when building forms, navigation, data displays, or any USWDS component. Triggers on USWDS, government website, usa-button, usa-card, usa-header, Section 508, WCAG.
---

# USWDS Design Knowledge Skill

When building or modifying UI for a USWDS-based government website, query the design registry BEFORE generating any markup.

## Registry

- **Manifest:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/agents.json
- **Index:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/components.index.json
- **Facets:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/facets.json
- **Tile pattern:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/{file}
- **Agent meta ID:** `uswds-agent-meta`
- **Metadata schema:** v2 (categorized: discovery/selection/instruction/constraints)

## Workflow

1. Fetch the index (lean — facets normalized to flat fields)
2. Filter in code by section, requiresJs, govCompliance, a11y
3. Fetch only the chosen tiles
4. Parse the `uswds-agent-meta` JSON block inside each tile
5. Read categorized metadata:
   - `selection.useWhen` / `selection.avoidWhen` — confirm component fits
   - `instruction.agentPrompt` — follow this guidance
   - `constraints.preserve` — NEVER modify these elements
   - `constraints.editable` — safe to change
   - `constraints.limitations` — respect caveats
6. Adapt following `instruction.agentPrompt` within `constraints` boundaries
7. Verify all `constraints.preserve` elements are intact in output

## Constraint Priority

When constraints conflict, follow this order (highest to lowest):
1. `constraints.preserve` — never modify (ARIA, semantic HTML, base classes)
2. `constraints.limitations` — respect known caveats
3. `instruction.agentPrompt` — adapt within boundaries
4. `constraints.editable` — prefer changes listed here

## Facets

- `section`: forms, navigation, feedback, data-display, layout, utilities, supporting, typography, buttons, overlays, notifications
- `requiresJs`: no, optional, required
- `govCompliance`: Section 508, WCAG 2.1 AA, 21st Century IDEA
- `a11y`: wcag21AA, keyboardNav, screenReader, reducedMotion, forcedColors, ariaAttributes
- `interaction`: passive, click, hover, keyboard, focus, drag, scroll, submit, input, dismiss
- `variant`: default, bordered, slim, big, error, success, disabled, tile, etc.

## Rules

- ALWAYS query the registry before generating USWDS markup
- Do not guess USWDS class names — fetch the tile
- Prefer `requiresJs: "no"` unless JS is explicitly needed
- Preserve all `constraints.preserve` elements (ARIA, classes, structure)
- Never remove `constraints.preserve` elements to satisfy `instruction.agentPrompt`
- Check `govCompliance` for Section 508 / WCAG 2.1 AA
- For Drupal implementation, also query the drupal-uswds-ai-components registry
