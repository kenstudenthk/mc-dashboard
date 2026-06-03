# DataEditMode Components

Inline table editing system: `DataEditTable` + `EditableCell` + `ColumnFilter`.

## When to use

Use for tables where users edit values in-place without navigating to a detail page.

## API

- `DataEditTable` — wraps a table, tracks which row/cell is being edited
- `EditableCell` — renders as text normally, input on click; validates on blur
- `ColumnFilter` — dropdown filter per column header

## Validation

Validate in `EditableCell` on blur. Return `error` string to show inline error. Never save invalid values.
