// scrape.js (ES Module)
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = process.argv[2];
const htmlFile = path.resolve(__dirname, htmlPath);
const url = await fs.readFile(htmlFile, 'utf-8');

console.log(`🌍 Scraping from: ${url.trim()}`);

const browser = await puppeteer.launch({
  args: ['--no-sandbox'],
  headless: 'new'
});

try {
  const page = await browser.newPage();
  console.log('📥 Navigating to Enhancv URL...');
  await page.goto(url.trim(), { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for resume container to render
  await page.waitForSelector('[id^="resume-"]', { timeout: 45000 });
  await page.waitForTimeout(10000); // Additional wait to ensure rendering
  console.log('✅ Resume container detected, capturing HTML...');

  // Get only the outer HTML of the resume container
  const resumeHtml = await page.$eval('[id^="resume-"]', el => el.outerHTML);

  const distDir = path.resolve(__dirname, '..');
  await fs.ensureDir(distDir);
  await fs.writeFile(path.join(distDir, 'JeremyLongResume.html'), resumeHtml, 'utf-8');
  console.log('✅ Resume saved to: JeremyLongResume.html');
} catch (err) {
  console.error('❌ Scraper failed:', err);
  process.exit(1);
} finally {
  await browser.close();
}
