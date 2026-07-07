import { test, expect } from '@playwright/test';

// Helper for generating mock responses
const createMockResponse = (items: unknown[] = [], totalCount = 0) => ({
  items,
  totalCount,
  countVentas: 0,
  countAlquiler: 0,
  pageNumber: 1,
  pageSize: 20
});

test.describe('Filtros Avanzados de Propiedades (Mock Network)', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/propiedades*', async (route) => {
      // Intercept initial load
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([
          {
            id: '1',
            titulo: 'Casa Base',
            tipoPropiedad: 'Casa',
            operacion: 'Venta',
            precio: 150000,
            sector: 'Centro',
            ciudad: 'Quito',
            estadoComercial: 'Activo',
            esCaptacionPropia: true,
            gestorNombre: 'Agente Prueba',
            fechaIngreso: new Date().toISOString(),
            permissions: { canEditMasterData: true, canChangeStatus: true }
          }
        ], 1))
      });
    });

    await page.goto('/propiedades');
    await page.waitForLoadState('networkidle');
  });

  test('Filtro de Búsqueda de Texto', async ({ page }) => {
    let lastUrl = '';
    await page.route('**/api/propiedades*', async (route) => {
      lastUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([{ id: '2', titulo: 'Lujosa oficina centro' }], 1))
      });
    });

    const searchInput = page.getByPlaceholder('Buscar título, sector...').first();
    const responsePromise = page.waitForResponse(response => response.url().includes('searchQuery=Lujosa'));
    
    await searchInput.fill('Lujosa');
    await responsePromise;
    
    expect(lastUrl).toContain('searchQuery=Lujosa');
  });

  test('Filtros Rápidos (Estado Comercial y Tipo Propiedad)', async ({ page }) => {
    let lastUrl = '';
    await page.route('**/api/propiedades*', async (route) => {
      lastUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([{ id: '3', titulo: 'Depto Disponible' }], 1))
      });
    });

    await page.getByRole('button', { name: 'Todos los estados' }).click();
    await page.getByRole('button', { name: 'Disponible', exact: true }).first().click();

    await page.getByRole('button', { name: 'Todos los tipos' }).click();
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('estadoComercial=Disponible') && 
      response.url().includes('tipoPropiedad=Departamento')
    );
    await page.getByRole('button', { name: 'Departamento', exact: true }).first().click();
    await responsePromise;

    expect(lastUrl).toContain('estadoComercial=Disponible');
    expect(lastUrl).toContain('tipoPropiedad=Departamento');
  });

  test('Filtros Avanzados (Operación y Rango de Precios)', async ({ page }) => {
    let lastUrl = '';
    await page.route('**/api/propiedades*', async (route) => {
      lastUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockResponse([{ id: '4', titulo: 'Alquiler Caro' }], 1))
      });
    });

    // Abrir Drawer de filtros avanzados
    await page.locator('button[title="Filtros avanzados"]').first().click();
    
    const drawer = page.locator('.fixed.inset-y-0');
    await expect(drawer.first()).toBeVisible();

    // Seleccionar 'Alquiler' desde el select de Operación dentro del drawer
    await drawer.getByRole('button', { name: 'Todas', exact: true }).first().click();
    await drawer.getByRole('button', { name: 'Alquiler', exact: true }).first().click();
    
    // Esperar a que el estado reaccione (evitar stale closures de React Router params)
    await page.waitForTimeout(600);

    // Llenar rangos de precio. (Precio es el primero con Mínimo/Máximo)
    await drawer.getByPlaceholder('Mínimo').first().fill('1000');
    await page.waitForTimeout(600);
    
    await drawer.getByPlaceholder('Máximo').first().fill('5000');
    await page.waitForTimeout(600); 

    // Cerrar drawer "Ver Resultados"
    await drawer.getByRole('button', { name: 'Ver Resultados' }).first().click();

    expect(lastUrl).toContain('operacion=Alquiler');
    expect(lastUrl).toContain('precioMin=1000');
    expect(lastUrl).toContain('precioMax=5000');
  });

  test('Limpieza de Filtros (Clear All)', async ({ page }) => {
    let lastUrl = '';
    await page.route('**/api/propiedades*', async (route) => {
      lastUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createMockResponse([], 0)) });
    });

    // Aplicar un filtro rápido
    await page.getByRole('button', { name: 'Todos los estados' }).click();
    const filterPromise = page.waitForResponse(response => response.url().includes('estadoComercial=Disponible'));
    await page.getByRole('button', { name: 'Disponible', exact: true }).first().click();
    await filterPromise;

    // Click Clear All
    const clearFiltersBtn = page.locator('button[title="Limpiar todos los filtros"]').first();
    await expect(clearFiltersBtn).toBeVisible();

    const clearPromise = page.waitForResponse(response => response.url().includes('/api/propiedades') && !response.url().includes('estadoComercial'));
    await clearFiltersBtn.click();
    await clearPromise;

    expect(lastUrl).not.toContain('estadoComercial');
  });

});
