/**
 * Icon generation script for CylinderSathi.
 *
 * Run once after cloning to generate the required PNG assets:
 *   node assets/generate-icons.js
 *
 * Requires: sharp
 *   npm install --save-dev sharp
 *
 * This reads icon.svg and outputs:
 *   assets/icon.png              (1024×1024 — App Store / Play Store)
 *   assets/adaptive-icon.png    (1024×1024 — Android adaptive foreground)
 *   assets/splash.png            (2048×2048 — Splash screen)
 *   assets/notification-icon.png (96×96    — Android notification)
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const SRC   = path.join(__dirname, 'icon.svg');
const OUT   = __dirname;

async function generate() {
  const tasks = [
    { file: 'icon.png',              size: 1024 },
    { file: 'adaptive-icon.png',     size: 1024 },
    { file: 'splash.png',            size: 2048, bg: '#FF6B35' },
    { file: 'notification-icon.png', size: 96   },
  ];

  for (const task of tasks) {
    const dest = path.join(OUT, task.file);
    let pipeline = sharp(SRC).resize(task.size, task.size);
    if (task.bg) {
      pipeline = pipeline.flatten({ background: task.bg });
    }
    await pipeline.png().toFile(dest);
    console.log(`✅ Generated ${task.file} (${task.size}×${task.size})`);
  }
  console.log('\n🎉 All icon assets generated!');
  console.log('Next step: run "npx expo start" or "eas build"');
}

generate().catch(console.error);
