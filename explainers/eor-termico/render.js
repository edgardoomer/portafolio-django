// Renders eor-termico.html to an MP4: every frame via window.seek(i/30), audio via SOUND.renderOffline.
// Usage: node render.js [out.mp4]   (needs playwright + ffmpeg)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  const out = process.argv[2] || path.join(__dirname, 'eor-termico.mp4'), FPS = 30;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', (e) => console.error('page error:', e.message));
  await p.goto('file://' + path.join(__dirname, 'eor-termico.html'));
  await p.waitForFunction('window.playerReady === true');
  // full-resolution canvas for the render
  await p.evaluate(() => { const c = document.getElementById('c'); c.width = 1280; c.height = 720; });
  const D = await p.evaluate('window.DURATION');
  const wavPath = path.join(os.tmpdir(), 'eor-audio.f32');
  const b64 = await p.evaluate(async (D) => {
    const r = await SOUND.renderOffline(window.scoreSound, D, 48000, { voiceover: false });
    const u8 = new Uint8Array(r.inter.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    console.log('audio peak', r.peak.toFixed(3)); return btoa(s);
  }, D);
  fs.writeFileSync(wavPath, Buffer.from(b64, 'base64'));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', wavPath,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(D * FPS);
  for (let i = 0; i < N; i++) {
    const data = await p.evaluate((t) => { window.seek(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, i / FPS);
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${N}`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close();
  console.log('wrote', out);
})();
