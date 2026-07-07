import { test, expect } from '@playwright/test';

// Helper for generating mock responses
const createMockResponse = (items = [], totalCount = 0) => ({
  items,
  totalCount,
  nuevos: 0,
  enNegociacion: 0
});

test.describe('Filtros Avanzados de Contactos (Mock Network)', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/contactos*', async (route) => {
      // Intercept initial load
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([
          {
            id: '1',
            nombre: 'Juan Perez',
            email: 'juan@test.com',
            origen: 'Referido',
            estadoEmbudo: 'Nuevo',
            esCliente: true,
            esPropietario: false,
            esCompartido: false,
            isArchivedForCurrentUser: false,
            botActivoWA: true,
            estadoIA_WA: null
          }
        ], 1))
      });
    });

    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');
  });

  test('Filtro de Búsqueda de Texto', async ({ page }) => {
    let searchUrl = '';
    await page.route(url => url.toString().includes('search=Juan'), async (route) => {
      searchUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([
          { id: '1', nombre: 'Juan Perez', email: 'juan@test.com' }
        ], 1))
      });
    });

    const searchInput = page.getByPlaceholder('Buscar por nombre, email o teléfono...');
    
    // Start waiting for the response BEFORE filling
    const responsePromise = page.waitForResponse(response => response.url().includes('search=Juan'));
    
    // Playwright fills input, debouncing will trigger SWR
    await searchInput.fill('Juan');
    
    await responsePromise;
    
    expect(searchUrl).toContain('search=Juan');
    await expect(page.locator('text=Juan Perez').first()).toBeVisible();
  });

  test('Filtro por Segmentos (Clientes / Propietarios)', async ({ page }) => {
    let segmentUrl = '';
    await page.route(url => url.toString().includes('segmento=propietarios'), async (route) => {
      segmentUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([
          { id: '2', nombre: 'Ana Propietaria', esPropietario: true }
        ], 1))
      });
    });

    const propietariosTab = page.locator('button', { hasText: 'Propietarios' }).first();
    
    const responsePromise = page.waitForResponse(response => response.url().includes('segmento=propietarios'));
    await propietariosTab.click();
    await responsePromise;

    expect(segmentUrl).toContain('segmento=propietarios');
    
    await expect(page.locator('text=Ana Propietaria').first()).toBeVisible();
  });

  test('Filtros Avanzados Múltiples (Visibilidad y Origen)', async ({ page }) => {
    let advancedUrl = '';
    
    await page.route(url => url.toString().includes('/api/contactos') && url.toString().includes('visibilidad=Compartidos'), async (route) => {
      advancedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([
          { id: '3', nombre: 'Contacto Compartido', esCompartido: true }
        ], 1))
      });
    });

    // 1. Desplegar Visibilidad y seleccionar Compartidos
    await page.locator('button').filter({ has: page.locator('svg.lucide-eye') }).first().click();
    
    const responsePromise = page.waitForResponse(response => response.url().includes('visibilidad=Compartidos'));
    await page.locator('button', { hasText: 'Compartidos' }).first().click();
    await responsePromise;

    expect(advancedUrl).toContain('visibilidad=Compartidos');
    
    // Comprobar que existe el botón de Clear All Filters (la X roja)
    const clearFiltersBtn = page.locator('button[title="Limpiar todos los filtros"]').first();
    await expect(clearFiltersBtn).toBeVisible();

    // Al limpiar, vuelve a pedir sin Visibilidad
    let clearedUrl = '';
    await page.route(url => url.toString().includes('/api/contactos') && !url.toString().includes('visibilidad'), async (route) => {
      clearedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([], 0))
      });
    });

    const clearPromise = page.waitForResponse(response => response.url().includes('/api/contactos') && !response.url().includes('visibilidad'));
    await clearFiltersBtn.click();
    await clearPromise;

    expect(clearedUrl).not.toContain('visibilidad=Compartidos');
  });

});
