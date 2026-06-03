# Components

Keep components under 200 lines. Extract sub-components or hooks when a component grows beyond this.

## TutorTooltip

Wraps any UI element to add a purple dashed ring + bouncing help icon + hover tooltip when Tutor
Mode is ON. Pass `text` (guidance), `position` (`top|bottom|left|right`), and optional `wrapperClass`.
Renders children passthrough when tutor mode is off.

## Comboboxes

- `CustomerCombobox` — searchable dropdown backed by `customerService`. Use when a form field needs a customer ID.
- `ServiceAccountCombobox` — searchable dropdown for service account lookup. Use in order forms.

## Design tokens (Tailwind v4 `@theme` in `src/index.css`)

| Token | Value |
|---|---|
| `--color-primary` | `#094cb2` |
| `--color-primary-light` | `#e6f0ff` |
| `--color-surface` | `#f4f6f8` (page background) |
| `--color-surface-elevated` | `#ffffff` (cards) |

Utility classes: `.card` (white rounded card + shadow), `.gradient-cta` (blue gradient button),
`.glass-panel` (frosted glass header), `.label-text` (uppercase tracking label).

Fonts: Inter (body), Noto Serif (headings h1–h6), Public Sans (`.label-text`).

## Layout

Fixed structure: `<Sidebar>` + column of `<TopNav>` + `<main>`. Page content goes in `main`.

## Other reusable components

- `ServiceTimeline` — visual timeline for order/service history
- `CloudProviderLogo` / `ServiceProviderLogo` — logos from constants files
- `EmailComposePanel` / `EmailTemplateEditPanel` — slide-in panels
- `RichTextEditor` — wrapper for rich-text input in email templates
