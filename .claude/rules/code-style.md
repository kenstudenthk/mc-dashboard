# Code Style

## Immutability

Always create new objects — never mutate state in place. Use spread operators and `Array.map/filter/reduce` instead of push/splice/direct assignment.

## Component Size

Keep components under 200 lines. Extract sub-components or hooks when a component grows beyond this.

## TypeScript

- Prefer explicit return types on exported functions
- Use `interface` for object shapes, `type` for unions/intersections
- Never use `any` — use `unknown` and narrow with type guards

## Naming

- Components: PascalCase
- Hooks: `use` prefix + camelCase
- Constants: UPPER_SNAKE_CASE
- Files: match the default export name
