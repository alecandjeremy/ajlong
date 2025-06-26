// scrape.js (ES Module with PDF + HTML output)
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
  headless: true,
  args: ['--no-sandbox']
});

try {
  const page = await browser.newPage();
  console.log('📥 Navigating to Enhancv URL...');
  await page.goto(url.trim(), { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for the download button and click it
  const downloadBtnSelector = 'button[aria-label="Download"]';
  await page.waitForSelector(downloadBtnSelector, { timeout: 20000 });
  console.log('📄 Download button found, clicking...');
  const downloadPath = path.resolve(__dirname, '..');
  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath
  });
  await page.click(downloadBtnSelector);

  // Wait for download to complete (approximate wait)
  await page.waitForTimeout(10000);

  // Rename downloaded file (assumes only PDF was downloaded)
  const files = await fs.readdir(downloadPath);
  const downloadedPdf = files.find(f => f.endsWith('.pdf'));
  const finalPdfPath = path.join(downloadPath, 'JeremyLongResume.pdf');
  if (downloadedPdf) {
    await fs.move(path.join(downloadPath, downloadedPdf), finalPdfPath, { overwrite: true });
    console.log(`✅ PDF saved as: ${finalPdfPath}`);
  } else {
    throw new Error('❌ PDF file not found after download.');
  }

  // Create an HTML wrapper to embed the PDF and trigger download
  const outputHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Jeremy Long Resume</title>
</head>
<body style="margin:0; display:flex; flex-direction:column; align-items:center;">
  <h1>Jeremy Long Resume</h1>
  <p><a href="JeremyLongResume.pdf" download>📎 Download PDF</a></p>
  <iframe src="JeremyLongResume.pdf" width="100%" height="800px" style="border:none;"></iframe>
</body>
</html>`;

  await fs.writeFile(path.join(downloadPath, 'JeremyLongResume.html'), outputHtml, 'utf-8');
  console.log('✅ Resume HTML generated with PDF embedded');

} catch (err) {
  console.error('❌ Scraper failed:', err);
  process.exit(1);
} finally {
  await browser.close();
}
