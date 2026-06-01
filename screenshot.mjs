import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Auto-increment filename
let n = 1;
while (fs.existsSync(path.join(dir, `screenshot-${n}${label ? '-' + label : ''}.png`))) n++;
const filename = `screenshot-${n}${label ? '-' + label : ''}.png`;
const outPath = path.join(dir, filename);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll through the entire page to trigger IntersectionObserver reveals
await page.evaluate(async () => {
  await new Promise(resolve => {
    const totalHeight = document.body.scrollHeight;
    let scrolled = 0;
    const step = 400;
    const timer = setInterval(() => {
      window.scrollBy(0, step);
      scrolled += step;
      if (scrolled >= totalHeight) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, 80);
  });
});

// Extra wait for animations to settle and images to load
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: temporary screenshots/${filename}`);
