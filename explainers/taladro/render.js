// Render taladro.html to MP4: frames via window.seek(i/30) in headless Chromium, audio via SOUND.renderOffline.
//   node render.js [out.mp4]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2] || 'taladro.mp4', FPS = 30, wav = out.replace(/\.mp4$/, '.wav');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', (e) => console.error('pageerror', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'taladro.html')); await p.evaluate(() => window.ready);
  // audio
  const a = await p.evaluate(async () => {
    const r = await SOUND.renderOffline(window.scoreSound, window.DURATION, 48000, { voiceover: false });
    const i16 = new Int16Array(r.inter.length); for (let i = 0; i < r.inter.length; i++) i16[i] = Math.max(-1, Math.min(1, r.inter[i])) * 32767;
    const u8 = new Uint8Array(i16.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { b64: btoa(s), peak: r.peak, frames: r.frames, sr: r.sr };
  });
  const pcm = Buffer.from(a.b64, 'base64'), hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
  hdr.writeUInt32LE(a.sr, 24); hdr.writeUInt32LE(a.sr * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(wav, Buffer.concat([hdr, pcm])); console.log('audio peak', a.peak.toFixed(3));
  // video
  const D = await p.evaluate(() => window.DURATION), N = Math.round(D * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  let worst = 0;
  for (let i = 0; i < N; i++) {
    const { url, ms } = await p.evaluate((t) => { const t0 = performance.now(); window.seek(t); const ms = performance.now() - t0; return { url: document.getElementById('c').toDataURL('image/png'), ms }; }, i / FPS);
    worst = Math.max(worst, ms);
    if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`wrote ${out}: ${N} frames, slowest frame ${worst.toFixed(1)} ms`);
  await b.close();
})();
