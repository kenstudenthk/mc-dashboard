import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // vitest@2 pins vite ^5, but this project runs vite 6, so npm nests a second
  // vite copy under vitest. That gives `react()` (typed against vite 6) and
  // vitest/config's defineConfig (typed against the nested vite 5) two distinct
  // Plugin identities, which tsc flags. The runtime is unaffected. Proper
  // long-term fix is upgrading to vitest@3 (peer vite ^5||^6); until then this
  // localized suppression keeps `npm run lint` green. See issue #64.
  // @ts-expect-error -- vite 6 / vitest 2 dual-instance Plugin type clash
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: { provider: 'v8', thresholds: { lines: 80 } },
  },
});
