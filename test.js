const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err));
  
  await page.goto('https://reclaim-ai-henna.vercel.app/ai-assistant', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(2000);
  
  await page.fill('input', 'hello world');
  await page.click('button[type="submit"]', {force: true});
  
  console.log('Clicked submit, waiting 5 seconds...');
  await page.waitForTimeout(5000);
  
  // Dump messages again
  await page.evaluate(() => {
    console.log('Final check from browser...');
  });
  
  await browser.close();
})()
