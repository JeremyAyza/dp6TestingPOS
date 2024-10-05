import { test, expect } from '@playwright/test';

// Función de retraso
export const delay = (time = 1000) => new Promise(resolve => setTimeout(resolve, time));

// Función para obtener datos de IndexedDB
const getAllData = async (store) => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('casamarket', 6);
        request.onsuccess = async () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(store)) {
                db.close();
                return resolve([]);
            }

            const transaction = db.transaction(store, 'readonly');
            const schema = transaction.objectStore(store);
            const data = await schema.getAll();

            data.onsuccess = () => {
                resolve(data.result);
                db.close();
            };
        };
        request.onerror = reject; // Manejar el error
    });
};

// beforeEach: Lógica de inicio de sesión
test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'jeremy@desarrollo.com');
    await page.fill('input[type="password"]', '212121');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
});

// afterEach: Lógica de cierre de sesión
test.afterEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByText('Cerrar sesión').click();
    const modalConfirmLogout = await page.getByText('Confirmar');
    if (await modalConfirmLogout.isVisible()) {
        await modalConfirmLogout.click();
    }
    await page.waitForTimeout(200);
    await expect(page.url()).toBe('http://localhost:5173/');
});

// Test para crear una nueva venta
test.describe('new sale', () => {
    test('Crear una venta', async ({ page }) => {
        let saleResponseDetected = false;

        // Escuchar mensajes en consola y respuestas
        page.on('console', msg => console.log(`Console message: ${msg.type()} - ${msg.text()}`));
        page.on('response', async response => {
            if (response.url().includes('/type-document') && response.request().method() === 'POST') {
                const status = response.status();
                if (status === 200) {
                    console.log('Respuesta exitosa con código 200 para la venta');
                    saleResponseDetected = true;
                } else {
                    console.log(`Respuesta fallida con código ${status}`);
                }
            }
        });

        await page.goto('http://localhost:5173/punto-de-venta');

        // Buscar el producto
        const inputSearch = page.getByTestId('search-products-input');
        const textToSearch = 'Sofia';
        for (const char of textToSearch) {
            await page.keyboard.press(char);
            await delay(200); // Retraso de 200 ms entre cada letra
        }

        await inputSearch.focus();
        await delay(500);
        await inputSearch.press('Enter');

        // Pagar
        await page.getByTestId('btn-fast-payment').click();

        // Verificar modal de éxito
        const successModal = page.getByTestId('successfull-sale-alert');
        await expect(successModal).toBeVisible();

        // Verificar que al menos una venta se registró
        const salesData = await page.evaluate(getAllData, 'sales') as any[] || [];
        console.log('Datos de ventas en IndexedDB:', salesData);
        expect(salesData.length).toBeGreaterThan(0);

        await delay(15000); // Esperar 15 segundos

        // Verificar que no haya más ventas
        const salesDataAfterDelay = await page.evaluate(getAllData, 'sales') as any[] || [];
        console.log('Datos de ventas después de 15 segundos en IndexedDB:', salesDataAfterDelay);
        expect(salesDataAfterDelay.length).toBe(0);
    });
});
