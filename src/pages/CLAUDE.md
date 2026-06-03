# Pages

## Routes

| Path | Page |
|---|---|
| `/` | Dashboard |
| `/orders` | OrderRegistry |
| `/orders/new` | NewOrder |
| `/orders/:id` | OrderDetails |
| `/customers` | Customers |
| `/customers/:id` | CustomerProfile |
| `/services` | ServiceCatalog |
| `/services/:id` | ServiceDetails |
| `/reports` | Reports |
| `/quick-links` | QuickLinks |
| `/audit-log` | AuditLog |
| `/email-templates` | EmailTemplates |
| `/settings` | Settings |
| `/help` | Help |
| `/feedback` | Feedback |
| `/feedback/new` | FeedbackNew |

`/login` is not a route — Login renders in place of the app shell when the auth guard fires.

## Data fetching

- Use `useOrdersQuery` hook for orders (includes caching).
- Never call `fetch()` directly — use service layer.
- Handle loading and error states explicitly in every component.

## Form patterns

Use controlled components. Validate on submit, not on every keystroke.
