import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the input file from command line
const inputFile = process.argv[2];

try {
  if (!inputFile) throw new Error("❌ No input HTML file provided.");

  const htmlPath = path.resolve(__dirname, inputFile);
  const htmlContent = await fs.readFile(htmlPath, 'utf-8');

  // Extract Enhancv URL from HTML content
  const match = htmlContent.match(/https:\/\/app\.enhancv\.com\/share\/[a-zA-Z0-9]+/);
  if (!match) throw new Error("❌ No Enhancv URL found in HTML.");

  const resumeUrl = match[0];
  console.log(`🌐 Scraping from: ${resumeUrl}`);

  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.goto(resumeUrl, { waitUntil: 'networkidle0' });

  await fs.ensureDir(path.resolve(__dirname, 'dist'));
  const outputPath = path.resolve(__dirname, 'dist', 'resume.html');
  await fs.writeFile(outputPath, await page.content(), 'utf-8');

  console.log(`✅ Resume saved to: ${outputPath}`);
  await browser.close();
} catch (err) {
  console.error("❌ Scraper failed:", err.message);
  process.exit(1);
}
