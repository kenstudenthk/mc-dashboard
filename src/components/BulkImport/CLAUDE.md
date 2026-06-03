# BulkImport Component

Multi-step modal for CSV bulk imports.

## State machine (5 steps)

Upload → Validate → Preview → Conflict → Importing

Each step is a distinct UI state. Never skip steps or jump backwards.

## Usage

Wrap the trigger in a button that sets `isOpen=true`. The component manages its own step state internally.

## Validation

Validate at the Validate step before advancing to Preview. Reject malformed rows early.
