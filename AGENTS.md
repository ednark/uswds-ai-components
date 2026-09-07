# AGENTS.md — USWDS AI Components

## What This Is

A structured component knowledge base for AI coding agents building government websites with the U.S. Web Design System (USWDS 3.13.0). 146 component tiles with categorized adaptation metadata (schema v2).

## How to Query This Registry

1. **Manifest:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/agents.json
2. **Index:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/components.index.json
3. **Facets:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/facets.json
4. **Tile pattern:** https://raw.githubusercontent.com/ednark/uswds-ai-components/main/infinite/{file}

## Workflow

1. Fetch the index (lean, no prose — facets normalized to flat fields)
2. Filter in code by section, requiresJs, govCompliance, a11y, costTier, prerequisites, compositionRecipes
3. **Recipe check:** if the task matches a published pattern (contact-form, login-flow, data-table-with-sorting, error-handling-stack, navigation-hierarchy), fetch `infinite/recipes/{name}.json` instead of composing manually
4. Fetch only the chosen tiles
5. Parse the `uswds-agent-meta` JSON block inside each tile
6. Check `_schemaVersion` — v2 tiles have categorized metadata:
   - `discovery` — facets (already in index; includes `compliance`, `mobileUX`, `supportedTokenProfiles` blocks — full detail stays tile-side, flattened summaries in index)
   - `selection` — `useWhen` / `avoidWhen` (confirm component fits the task)
   - `instruction` — `agentPrompt` (follow this guidance)
   - `coordination` — `prerequisiteComponents` / `incompatibleWith` / `compositionCost` / `agentPromptSequence` / `compositionRecipes` / `variantRules` (plan before composing; lean summaries `prerequisites`, `incompatibleWith`, `costTier`, `compositionRecipes` are also in the index)
   - `constraints` — `preserve` / `editable` / `limitations` / `portableInvariants` (enforce these boundaries)
   - `portability` — `classMapping` for simple target-system class substitution
7. Adapt following `instruction.agentPrompt` within `constraints` boundaries
8. Verify all `constraints.preserve` elements are intact in output

## Cross-Design System Transfer

This registry can translate components to other design systems (Material Design 3, Bootstrap 5, GOV.UK, Carbon). Follow this decision order when asked to produce non-USWDS markup:

1. Parse `constraints.portableInvariants` — these MUST survive any translation
2. IF `portability.classMapping` has an entry for the target system → simple class substitution (replace classes, keep invariants)
3. ELSE IF the adapter registry has an entry for the component → fetch `{adapterBase}/{component}.json` and follow `structuralMapping` (replace/add/remove), respecting `semanticNotes` and `limitations`
4. ELSE IF `compatibility.json` has a family-level entry → css-only maps substitute classes; structural/framework entries are ADVISORY ONLY (adopt the target component, carry invariants, never fabricate translations)
5. ELSE → fall back to `portableInvariants` only; note "No mapping available for {target system}" in output
6. Always validate final output against `portableInvariants`

- Adapter manifest: https://raw.githubusercontent.com/ednark/uswds-ai-components/main/adapters/adapters.json
- Compatibility map: https://raw.githubusercontent.com/ednark/uswds-ai-components/main/compatibility.json
- Adapter spec: https://raw.githubusercontent.com/ednark/ai-component-registry-spec/main/adapter-format.md

## MCP Server

This registry ships a Model Context Protocol server (`_base/mcp/server.mjs`) that exposes the
above workflow as MCP tools. When an MCP client is connected, prefer calling the tools over raw
HTTP fetches:

- `search_components` — filter the index by facets / text (incl. costTier, prerequisites, incompatibleWith, recipe)
- `get_component` — fetch a tile (HTML + metadata)
- `list_facets` / `get_index` — discovery surfaces
- `get_adapter` — cross-system adapter mapping
- `translate_component` — adapt a tile to another design system (enforces portableInvariants)
- `get_recipe` — list recipes or fetch one recipe's ordered component set with nesting + validation notes
- `query_compliance` — compliance readiness queries (fedRampMin, piiHandling, auditTrail, nistControl) with summary counts
- `get_versions` — registry version history (Surface 5): what changed between registry versions and how to migrate
- `translate_component` — adapt a tile to material / bootstrap / govuk / carbon (tile classMapping → adapters → compatibility.json advisory; enforces portableInvariants)

CLI tools (from the registry root):

- `node _base/validate-registry.mjs` — lint the registry (refs, coverage, leanness); `--conformance <path>` validates any registry against the spec
- `node _base/compliance-scorer.mjs --target-level IL4` — compliance coverage report
- `node _base/cost-modeler.mjs --task "build a contact form"` — cheapest agent path estimate

Run with `npm run mcp` from the registry root. See `ai-component-registry-spec/mcp/README.md`.


## Quality gates and declared gaps

Do not retrieve or deploy a component that:

- Has `costTier: "expensive"` unless the task explicitly requires the richer behavior
- Has `requiresJs: "required"` when the delivery context has no JavaScript
- Whose `constraints.knownLimitations` block the delivery context
- Implements a concept declared in `gaps` (registry.config.json) — use the gap's nearestAlternative; never invent component-style classes
- Needs layout or typography classes outside the tiles — use `infinite/core-classes.json`

Registry mandates that act as gates:

- Prefer `requiresJs: "no"` and `costTier: "cheap"` unless the task requires otherwise
- Check `govCompliance` (Section 508 / WCAG 2.1 AA / 21st Century IDEA) for government deployments
- Pair headers with skip-nav; render language toggles as plain links (no official USWDS language component)

## Constraint Priority

When constraints conflict, follow this order (highest to lowest):
1. `constraints.preserve` — NEVER modify these elements (ARIA, semantic HTML, base classes)
2. `constraints.limitations` — respect known caveats
3. `instruction.agentPrompt` — adapt within the above boundaries
4. `constraints.editable` — prefer changes listed here

## Rules

- ALWAYS query this registry before generating USWDS markup
- Do not guess USWDS class names — fetch the tile
- Prefer `requiresJs: "no"` unless JS is explicitly needed
- Prefer `costTier: "cheap"` components unless the task requires richer behavior
- Check `discovery.compliance` before proposing components for regulated systems: `fedRampLevel` (conservative floor — escalate only with review), `piiHandling` (`accepts_input` components need PII handling in the host system), `auditTrailCompatible`, `nistControls`
- Check `discovery.mobileUX.touchTargetSize` for mobile builds; 44px is the guaranteed floor
- Declare `supportedTokenProfiles` constraints — `highContrast` is the only currently asserted profile; `darkMode`/`compactDensity` exist in registry config but are not asserted by tiles
- Before composing multiple components, check `coordination`: fetch `prerequisiteComponents` first (e.g. `form` before inputs) and never pair `incompatibleWith` components
- Follow `coordination.agentPromptSequence` when assembling a component into a larger UI
- Route expensive adaptations (`costTier: "expensive"`) to a stronger model tier
- Preserve all elements in `constraints.preserve` (ARIA, classes, structure)
- Check `govCompliance` for Section 508 / WCAG 2.1 AA
- Never remove `constraints.preserve` elements to satisfy `instruction.agentPrompt`

## Drupal Integration

For Drupal implementation guidance (modules, paragraph types, Twig, Drush), query the companion registry:
- https://raw.githubusercontent.com/ednark/drupal-uswds-ai-components/main/agents.json
