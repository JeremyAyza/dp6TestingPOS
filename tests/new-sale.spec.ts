import { test, expect } from '@playwright/test';
export const delay = (time = 1000) => {
    return new Promise((resolve) => setTimeout(resolve, time))
}

test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    // login page
    await page.fill('input[type="email"]', 'jeremy@desarrollo.com');
    await page.fill('input[type="password"]', '212121');
    await page.locator('button[type="submit"]').click();
    await delay(5 * 1000);
    // await page.goto('http://localhost:5173/punto-de-venta')


})



test.describe('new sale ', () => {
    test('Crear una venta', async ({ page }) => {
        page.on('console', msg => {
            console.log(`Console message: ${msg.type()} - ${msg.text()}`);
        });
        await page.goto('http://localhost:5173/punto-de-venta')
        const InputSearch = page.getByTestId('search-products-input')
        const text = 'Sofia';
        for (const char of text) {
            await page.keyboard.press(char);
            await page.waitForTimeout(200); // Retraso de 200 ms entre cada letra
        }

        InputSearch.focus()
        await page.waitForTimeout(500); // Espera 500 ms, ajusta según sea necesario
        InputSearch.press('Enter')
        await page.getByTestId('btn-fast-payment').click()
        const successModal = page.getByTestId('successfull-sale-alert')
        await expect(successModal).toBeVisible()
    })
})