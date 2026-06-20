import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  const { baseURL, ignoreHTTPSErrors } = config.projects[0].use;
  
  const authDir = path.join(process.cwd(), 'playwright', '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors });
  const page = await context.newPage();

  try {
    await page.goto(baseURL || 'https://localhost:5173');
    
    const emailInput = page.locator('#email');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    if (await emailInput.isVisible()) {
      const email = process.env.E2E_AGENT_EMAIL;
      const password = process.env.E2E_AGENT_PASSWORD;

      if (!email || !password) {
        throw new Error('Faltan variables de entorno E2E_AGENT_EMAIL o E2E_AGENT_PASSWORD en .env.local');
      }

      await emailInput.fill(email);
      await page.locator('#password').fill(password);
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    }

    // Save signed-in state to 'playwright/.auth/user.json'
    await page.context().storageState({ path: path.join(authDir, 'user.json') });
  } finally {
    await browser.close();
  }
}

export default globalSetup;
