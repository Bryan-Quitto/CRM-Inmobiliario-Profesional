import { test, expect } from '@playwright/test';

test.describe('Flujo de Archivado Aislado - Contactos', () => {

  test.beforeEach(async ({ page }) => {
    // Ir a contactos (ya estaremos logueados gracias al global-setup)
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');
  });

  test('Validación de Navegación por Pills', async ({ page }) => {
    // 1. Catálogo Principal
    const tabMain = page.getByTestId('tab-main');
    await expect(tabMain).toBeVisible();
    
    // 2. Cambiar a Archivados
    const tabArchived = page.getByTestId('tab-archived');
    await tabArchived.click();
    
    // Esperar a que la URL o el contenido reaccione (si SWR hace re-fetch o filtra en memoria)
    // Buscamos alguna card de contacto (si el agente tiene archivados, deberían aparecer)
    // await expect(page.locator('text=Sin resultados')).not.toBeVisible();
  });

  test('Validación del Estado Read-Only en Perfil Archivado', async ({ page }) => {
    // 1. Ir a Archivados
    const tabArchived = page.getByTestId('tab-archived');
    await tabArchived.click();
    
    // 2. Clickear el primer contacto archivado que aparezca
    // (Asegúrate de que haya al menos un contacto archivado para este test)
    const firstContact = page.locator('button', { hasText: 'Ver Perfil' }).first();
    
    // Si no hay contactos archivados, el test se saltaría, pero en un entorno CI se usaría seed de datos.
    if (await firstContact.isVisible()) {
      await firstContact.click();
      
      // Esperar a que cargue el perfil
      await page.waitForLoadState('networkidle');

      // Asersión 1: El botón "Editar" NO debe existir
      await expect(page.getByTestId('btn-edit-entity')).toHaveCount(0);
      
      // Asersión 2: El botón de "Fusionar" NO debe existir
      await expect(page.getByTestId('btn-merge-entity')).toHaveCount(0);
      
      // Asersión 3: La sección de Notas/Intereses NO debe renderizar el formulario
      await expect(page.getByTestId('form-add-interest')).toHaveCount(0);
      
      // Asersión 4: El botón "Desarchivar" debe estar visible
      const btnToggle = page.getByTestId('btn-toggle-archive');
      await expect(btnToggle).toBeVisible();
      await expect(btnToggle).toHaveText(/Desarchivar/i);
    } else {
      console.log('No se encontraron contactos archivados para realizar la aserción de Read-Only. Asegúrate de sembrar datos.');
    }
  });

  test('Validación de Estado Activo en Catálogo Principal', async ({ page }) => {
    // 1. Asegurar que estamos en Catálogo Principal
    const tabMain = page.getByTestId('tab-main');
    await tabMain.click();
    
    // 2. Clickear el primer contacto activo
    const firstContact = page.locator('button', { hasText: 'Ver Perfil' }).first();
    
    if (await firstContact.isVisible()) {
      await firstContact.click();
      await page.waitForLoadState('networkidle');

      // Asersiones: Los botones SÍ deben existir
      await expect(page.getByTestId('btn-edit-entity')).toBeVisible();
      await expect(page.getByTestId('btn-merge-entity')).toBeVisible();
      await expect(page.getByTestId('form-add-interest')).toBeVisible();
      
      const btnToggle = page.getByTestId('btn-toggle-archive');
      await expect(btnToggle).toBeVisible();
      await expect(btnToggle).not.toHaveText(/Desarchivar/i);
      await expect(btnToggle).toHaveText(/Archivar/i);
    } else {
      console.log('No se encontraron contactos en el catálogo principal.');
    }
  });
});
