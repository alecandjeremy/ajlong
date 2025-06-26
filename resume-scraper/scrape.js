import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const inputFile = process.argv[2];

  try {
    if (!inputFile) throw new Error("❌ No input HTML file provided.");

    const htmlPath = path.resolve(__dirname, inputFile);
    const htmlContent = await fs.readFile(htmlPath, 'utf-8');

    const match = htmlContent.match(/https:\/\/app\.enhancv\.com\/share\/[a-zA-Z0-9]+/);
    if (!match) throw new Error("❌ No Enhancv URL found in HTML.");

    const resumeUrl = match[0];
    console.log(`🌐 Scraping from: ${resumeUrl}`);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    console.log("📥 Navigating to Enhancv URL...");
    await page.goto(resumeUrl, {
      waitUntil: 'networkidle2', // looser than networkidle0
      timeout: 60000             // 60 seconds max wait
    });
    console.log("✅ Page loaded, capturing HTML...");

    const distDir = path.resolve(__dirname, 'dist');
    await fs.ensureDir(distDir);

    const outputPath = path.join(distDir, 'JeremyLongResume.html');
    await fs.writeFile(outputPath, await page.content(), 'utf-8');

    const screenshotPath = path.join(distDir, 'debug-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`✅ Resume saved to: ${outputPath}`);
    console.log(`🖼️  Screenshot saved to: ${screenshotPath}`);

    await browser.close();
  } catch (err) {
    console.error("❌ Scraper failed:", err.message);
    process.exit(1);
  }
})();
