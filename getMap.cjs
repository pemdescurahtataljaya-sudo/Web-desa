const puppeteer = require('puppeteer-core');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: "new",
    defaultViewport: { width: 1080, height: 1920 } // Mobile/Portrait ratio for a nice map
  });

  const page = await browser.newPage();
  console.log('Navigating to Google Maps...');
  // Go to the exact Google Maps search URL for Curah Tatal to trigger the boundary
  await page.goto('https://www.google.com/maps/place/Curah+Tatal,+Kec.+Arjasa,+Kabupaten+Situbondo,+Jawa+Timur', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log('Waiting for map to render...');
  // Wait a bit extra for the red boundary to fully render and the satellite imagery to load
  await new Promise(r => setTimeout(r, 6000));
  
  console.log('Taking screenshot of clean map...');
  // Hide UI elements if possible (search box, etc) to get a clean map
  try {
    await page.evaluate(() => {
      const sidePanel = document.getElementById('QA0Szd');
      if (sidePanel) sidePanel.style.display = 'none';
      const searchBox = document.getElementById('omnibox-container');
      if (searchBox) searchBox.style.display = 'none';
    });
  } catch(e) {}

  await page.screenshot({ path: 'public/peta-statis.png' });
  console.log('Screenshot saved to public/peta-statis.png');

  await browser.close();
})();
