import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlFile = process.argv[2] || '../JeremyLongResume.html';
const enhancvUrl = 'https://app.enhancv.com/share/edc19ab4';

console.log(`🌐 Scraping from: ${enhancvUrl}`);
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

console.log('📥 Navigating to Enhancv URL...');
await page.goto(enhancvUrl, { waitUntil: 'networkidle2', timeout: 60000 });

console.log('✅ Page loaded, capturing HTML...');
const content = await page.content();

const outputPath = path.resolve(__dirname, htmlFile);
await fs.writeFile(outputPath, content, 'utf-8');

console.log(`✅ Resume saved to: ${outputPath}`);
await browser.close();
