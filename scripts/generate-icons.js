#!/usr/bin/env node
/* global __dirname */
// The app's icons, drawn from the board's own knight
// (src/lib/chessboard/defaultPieceSet.ts) on the default blue board - the
// "board" logo. Writes each as an SVG beside a PNG in assets/, rendered
// with rsvg-convert (brew install librsvg). Run again after changing the
// drawing: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ASSETS = path.join(__dirname, '..', 'assets');
const SOURCES = path.join(ASSETS, 'icon-sources');
const KNIGHT =
  'M72 79 C77 60 77 40 67 27 L63 13 L56 21 C46 20 37 26 31 36 L22 50 C20 54 22 59 27 59 L35 57 C39 56 42 53 46 51 C38 60 31 68 30 79 Z';
const LIGHT = '#d0dff4';
const DARK = '#4b648a';

const knight = (x, y, s, fill = '#f8f7f3', stroke = '#1f1f1f') =>
  `<g transform="translate(${x} ${y}) scale(${s})" stroke-linejoin="round" stroke-linecap="round"><path d="${KNIGHT}" fill="${fill}" stroke="${stroke}" stroke-width="2.6"/><rect x="22" y="79" width="56" height="9" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="2.6"/><circle cx="46" cy="32" r="2.8" fill="${stroke}"/><path d="M67 31 C71 45 71 59 67 72" fill="none" stroke="${stroke}" stroke-width="2.6"/></g>`;
const board = `<rect width="1024" height="1024" fill="${LIGHT}"/><rect width="512" height="512" fill="${DARK}"/><rect x="512" y="512" width="512" height="512" fill="${DARK}"/>`;
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;
// The knight spans about x 20-80, y 11-90 of its 100: centred at a scale.
const centred = (scale) => knight(512 - 50 * scale, 512 - 50.5 * scale, scale);

const icons = {
  // iOS and the default icon: no transparency (Apple refuses alpha).
  icon: { svg: svg(board + knight(102, 70, 8.4)), background: LIGHT },
  // Android's adaptive layers: only the middle 66% always shows, so the
  // knight sits well inside it; the board is the background layer.
  'adaptive-icon': { svg: svg(centred(5.4)) },
  'adaptive-icon-background': { svg: svg(board) },
  'adaptive-icon-monochrome': {
    svg: svg(
      `<g transform="translate(${512 - 50 * 5.4} ${512 - 50.5 * 5.4}) scale(5.4)"><path d="${KNIGHT}" fill="#000"/><rect x="22" y="79" width="56" height="9" rx="3" fill="#000"/></g>`,
    ),
  },
  'splash-icon': { svg: svg(centred(6)) },
  favicon: { svg: svg(board + knight(102, 70, 8.4)), size: 48 },
};

fs.mkdirSync(SOURCES, { recursive: true });
for (const [name, { svg: source, background, size = 1024 }] of Object.entries(
  icons,
)) {
  const svgPath = path.join(SOURCES, `${name}.svg`);
  fs.writeFileSync(svgPath, source);
  execFileSync('rsvg-convert', [
    '-w',
    String(size),
    '-h',
    String(size),
    ...(background ? ['-b', background] : []),
    svgPath,
    '-o',
    path.join(ASSETS, `${name}.png`),
  ]);
}
console.log(`wrote ${Object.keys(icons).length} icons to ${ASSETS}`);
