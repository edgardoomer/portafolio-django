// Exports the cover / thumbnail (EOR.cover) as a 1080x1920 PNG.
// Usage: node portada.js [out.png]   (needs playwright; run node build.js first)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2] || path.join(__dirname, 'portada.png');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 720, height: 1400 } });
  p.on('pageerror', (e) => console.error('page error:', e.message));
  await p.goto('file://' + path.join(__dirname, 'eor-termico.html'));
  await p.waitForFunction('window.playerReady === true');
  const b64 = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; EOR.cover(c.getContext('2d'), 1080, 1920); return c.toDataURL('image/png').split(',')[1]; });
  fs.writeFileSync(out, Buffer.from(b64, 'base64')); await b.close();
  console.log('wrote', out);
})();
