import { test, expect } from '@playwright/test';

// ID Agente Objetivo: 5bba363b-8903-4711-acd6-2a0da5774616

test.describe('Flujo de Archivado Aislado - Propiedades', () => {

  test.beforeEach(async ({ page }) => {
    // Ir a propiedades (ya estaremos logueados gracias al global-setup)
    await page.goto('/propiedades');
    await page.waitForLoadState('networkidle');
  });

  test('Validación de Navegación por Pills', async ({ page }) => {
    const tabMain = page.getByTestId('tab-main');
    const tabArchived = page.getByTestId('tab-archived');

    await expect(tabMain).toBeVisible();
    await tabArchived.click();
    
    // Verificamos que la clase visual cambie indicando que el tab activo es Archivados
    await expect(tabArchived).toHaveClass(/bg-white/);
  });

  test('Validación de Status Lock y Read-Only en Perfil Archivado', async ({ page }) => {
    await page.getByTestId('tab-archived').click();
    
    // Click en la primera propiedad archivada
    const firstProperty = page.locator('button', { hasText: 'Ver Inmueble' }).first();
    
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      await page.waitForLoadState('networkidle');

      // Asersión 1: Botón Editar NO debe existir
      await expect(page.getByTestId('btn-edit-entity')).toHaveCount(0);

      // Asersión 2: Botón Compartir WhatsApp NO debe existir
      await expect(page.getByTestId('btn-share-whatsapp')).toHaveCount(0);

      // Asersión 3: El botón Desarchivar debe existir
      const btnToggle = page.getByTestId('btn-toggle-archive');
      await expect(btnToggle).toBeVisible();
      await expect(btnToggle).toHaveText(/Desarchivar/i);
    } else {
      console.log('No se encontraron propiedades archivadas para realizar la aserción de Read-Only. Asegúrate de sembrar datos.');
    }
  });

  test('Validación de Estado Activo en Catálogo Principal', async ({ page }) => {
    // 1. Asegurar que estamos en Catálogo Principal
    await page.getByTestId('tab-main').click();
    
    // 2. Click en la primera propiedad activa
    const firstProperty = page.locator('button', { hasText: 'Ver Inmueble' }).first();
    
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      await page.waitForLoadState('networkidle');

      // Asersiones: Los botones SÍ deben existir
      await expect(page.getByTestId('btn-edit-entity')).toBeVisible();
      await expect(page.getByTestId('btn-share-whatsapp')).toBeVisible();

      const btnToggle = page.getByTestId('btn-toggle-archive');
      await expect(btnToggle).toBeVisible();
      await expect(btnToggle).not.toHaveText(/Desarchivar/i);
      await expect(btnToggle).toHaveText(/Archivar/i);
    } else {
      console.log('No se encontraron propiedades en el catálogo principal.');
    }
  });
});
