#!/usr/bin/env node
/* global __dirname */
// The app's icons: the cchess mark - a board's corner, two paper squares
// on vermilion (Paper & Vermilion, the default color theme), as the
// server's web pages draw it. Writes each as an SVG
// beside a PNG in assets/, rendered with rsvg-convert (brew install
// librsvg). Run again after changing the drawing:
// node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ASSETS = path.join(__dirname, '..', 'assets');
const SOURCES = path.join(ASSETS, 'icon-sources');
const VERMILION = '#c2411a';
const PAPER = '#faf7f0';

// Two light squares of a 2x2 board, top-left and bottom-right, a grid
// `size` across centred on the 1024 canvas.
const squares = (size, fill = PAPER) => {
  const half = size / 2;
  const at = 512 - half;
  return `<rect x="${at}" y="${at}" width="${half}" height="${half}" fill="${fill}"/><rect x="512" y="512" width="${half}" height="${half}" fill="${fill}"/>`;
};
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;
const ground = `<rect width="1024" height="1024" fill="${VERMILION}"/>`;
// The mark on a rounded tile, as on the web pages: 4 of 24 in from each
// edge, the corners 6 of 24.
const tile = `<rect width="1024" height="1024" rx="256" fill="${VERMILION}"/>${squares(683)}`;

const icons = {
  // iOS and the default icon: no transparency (Apple refuses alpha); the
  // system rounds its corners.
  icon: { svg: svg(ground + squares(683)), background: VERMILION },
  // Android's adaptive layers: only a circle 61% across always shows, so
  // the grid's corners sit inside it; vermilion is the background layer.
  'adaptive-icon': { svg: svg(squares(420)) },
  'adaptive-icon-background': { svg: svg(ground) },
  'adaptive-icon-monochrome': { svg: svg(squares(420, '#000')) },
  // The splash is vermilion in light and dark alike (app.json), so its
  // image is the squares alone.
  'splash-icon': { svg: svg(squares(683)) },
  favicon: { svg: svg(tile), size: 48 },
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
