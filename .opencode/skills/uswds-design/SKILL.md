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

## Workflow

1. Fetch the index (one JSON array, lean — no prose)
2. Filter in code by section, requiresJs, govCompliance, a11y
3. Fetch only the chosen tiles
4. Parse the `uswds-agent-meta` JSON block inside each tile
5. Follow `agentPrompt`, respect `preserveElements`, modify `editableAreas`

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
- Preserve ARIA attributes and required class structures
- Check `govCompliance` for Section 508 / WCAG 2.1 AA
- For Drupal implementation, also query the drupal-uswds-ai-components registry
