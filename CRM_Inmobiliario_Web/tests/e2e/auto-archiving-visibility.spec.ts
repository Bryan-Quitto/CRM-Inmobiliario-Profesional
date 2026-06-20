import { test, expect } from '@playwright/test';

test.describe('Visibilidad de Auto-Archivado (E2E Manual)', () => {

  test('El contacto auto-archivado NO debe estar visible en el catálogo principal', async ({ page }) => {
    // 1. Ir a contactos (usa la sesión de global-setup)
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');
    
    // 2. Asegurarse de estar en la pestaña principal
    const tabMain = page.getByTestId('tab-main');
    await tabMain.click();
    await page.waitForLoadState('networkidle');
    
    // 3. Verificar que el contacto no existe en la lista activa
    await expect(page.locator('text=Prueba Contacto').first()).not.toBeVisible();
    
    // 4. Verificar que SÍ está en archivados
    const tabArchived = page.getByTestId('tab-archived');
    await tabArchived.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Prueba Contacto').first()).toBeVisible();
  });

  test('La propiedad auto-archivada NO debe estar visible en el catálogo principal', async ({ page }) => {
    // 1. Ir a propiedades
    await page.goto('/propiedades');
    await page.waitForLoadState('networkidle');
    
    // 2. Asegurarse de estar en la pestaña principal
    const tabMain = page.getByTestId('tab-main');
    await tabMain.click();
    await page.waitForLoadState('networkidle');
    
    // 3. Verificar que la propiedad NO existe en la lista activa
    await expect(page.locator('text=Suite en Venta - Excelente oportunidad en Sur').first()).not.toBeVisible();
    
    // 4. Verificar que SÍ está en archivados
    const tabArchived = page.getByTestId('tab-archived');
    await tabArchived.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Suite en Venta - Excelente oportunidad en Sur').first()).toBeVisible();
  });
});
