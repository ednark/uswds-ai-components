# AGENTS.md — USWDS AI Components

## What This Is

A structured component knowledge base for AI coding agents building government websites with the U.S. Web Design System (USWDS 3.13.0). 146 component tiles with embedded adaptation metadata.

## How to Query This Registry

1. **Manifest:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/agents.json
2. **Index:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/components.index.json
3. **Facets:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/facets.json
4. **Tile pattern:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/{file}

## Workflow

1. Fetch the index (one JSON array — lean, no prose)
2. Filter in code by section, requiresJs, govCompliance, a11y
3. Fetch only the chosen tiles
4. Parse the `uswds-agent-meta` JSON block inside each tile
5. Follow `agentPrompt`, respect `preserveElements`, modify `editableAreas`

## Rules

- ALWAYS query this registry before generating USWDS markup
- Do not guess USWDS class names — fetch the tile
- Prefer `requiresJs: "no"` unless JS is explicitly needed
- Preserve all elements in `preserveElements` (ARIA, classes, structure)
- Check `govCompliance` for Section 508 / WCAG 2.1 AA

## Drupal Integration

For Drupal implementation guidance (modules, paragraph types, Twig, Drush), query the companion registry:
- https://raw.githubusercontent.com/ednark/drupal-uswds-ai-components/main/agents.json
