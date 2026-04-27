const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG_PATH = path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const INPUT = process.argv[2];

if (!INPUT) {
    console.error('Usage: node convert.js <input.mp4>');
    process.exit(1);
}

const DIR = path.dirname(INPUT);
const BASE = path.basename(INPUT, '.mp4');
const OUT60 = path.join(DIR, `${BASE}-60fps.mp4`);
const OUTGIF = path.join(DIR, `${BASE}.gif`);
const PALETTE = path.join(DIR, `.palette-${BASE}.png`);

function run(args) {
    console.log(`▸ Running: ffmpeg ${args.join(' ')}`);
    const result = spawnSync(FFMPEG_PATH, args, { stdio: 'inherit' });
    if (result.status !== 0) {
        console.error(`✗ ffmpeg failed with status ${result.status}`);
        process.exit(1);
    }
}

console.log(`▸ Converting ${INPUT} to 60fps MP4 and GIF...`);

// 1. Generate 60fps MP4
run([
    '-y', '-i', INPUT,
    '-vf', 'fps=60',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.0',
    '-crf', '18', '-preset', 'medium', '-movflags', '+faststart',
    OUT60
]);

// 2. Generate Palette for GIF
run([
    '-y', '-i', INPUT,
    '-vf', 'fps=15,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff',
    PALETTE
]);

// 3. Generate GIF using Palette
run([
    '-y', '-i', INPUT, '-i', PALETTE,
    '-lavfi', 'fps=15,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    OUTGIF
]);

// Cleanup
if (fs.existsSync(PALETTE)) {
    fs.unlinkSync(PALETTE);
}

console.log(`✓ Conversion complete!`);
console.log(`  MP4: ${OUT60}`);
console.log(`  GIF: ${OUTGIF}`);
