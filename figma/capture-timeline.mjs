import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = __dirname;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3009/help ...');
  await page.goto('http://localhost:3009/help', { waitUntil: 'networkidle' });

  // Scroll to the Service Provisioning Timeline section
  console.log('Looking for Service Provisioning Timeline section...');
  const timelineSection = await page.locator('text=Service Provisioning Timeline').first();
  await timelineSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // Screenshot 1: Default state (first provider selected)
  const out1 = path.join(outputDir, 'timeline-preview-1.png');
  await page.screenshot({ path: out1, fullPage: false });
  console.log('Screenshot 1 saved:', out1);

  // Click "Microsoft Azure" tab
  console.log('Clicking Microsoft Azure tab...');
  const azureBtn = await page.locator('button, [role="tab"]').filter({ hasText: 'Microsoft Azure' }).first();
  await azureBtn.scrollIntoViewIfNeeded();
  await azureBtn.click();
  await page.waitForTimeout(600);

  // Screenshot 2: Azure selected state
  const out2 = path.join(outputDir, 'timeline-preview-2.png');
  await page.screenshot({ path: out2, fullPage: false });
  console.log('Screenshot 2 saved:', out2);

  await browser.close();
  console.log('Done.');
})();
