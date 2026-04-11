Prepare and build the project for production deployment.

## Steps

1. Run `npm run lint` — fix any type errors before proceeding
2. Run `npm run build` — confirm the build succeeds
3. Check for hardcoded secrets or environment variables that need to be set
4. Verify `GEMINI_API_KEY` is configured in the target environment
5. Run `npm run preview` to do a final sanity check on the production build
6. Report build output size and any warnings
