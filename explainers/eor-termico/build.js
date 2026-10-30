// Inlines the shared libs + explainer into the single-file pages.
const fs = require('fs'), path = require('path');
const here = (p) => path.join(__dirname, p);
const libs = ['lib/harness.js', 'lib/sound.js', 'eor.js'].map((f) => fs.readFileSync(here(f), 'utf8')).join('\n');
for (const [src, out] of [['src/storyboard.template.html', 'storyboard.html'], ['src/player.template.html', 'eor-termico.html']]) {
  if (!fs.existsSync(here(src))) continue;
  fs.writeFileSync(here(out), fs.readFileSync(here(src), 'utf8').replace('/*LIBS*/', () => libs));
  console.log('wrote', out);
}
