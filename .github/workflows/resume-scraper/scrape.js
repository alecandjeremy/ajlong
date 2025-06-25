const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { JSDOM } = require("jsdom");

// 🔹 Get file name from CLI argument
const inputFile = process.argv[2];
if (!inputFile) {
  console.error("❌ Please provide a file like 'jeremylongresume.html'");
  process.exit(1);
}

const inputPath = path.join(__dirname, inputFile);
const baseName = path.basename(inputFile, ".html");
const OUTPUT_DIR = path.join(__dirname, "dist", baseName);

async function download(url, filepath) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  await fs.outputFile(filepath, res.data);
}

async function scrapeResume() {
  const htmlContent = await fs.readFile(inputPath, "utf-8");
  const dom = new JSDOM(htmlContent);
  const meta = dom.window.document.querySelector('meta[name="resume-url"]');

  if (!meta || !meta.content) {
    throw new Error(`❌ No <meta name="resume-url"> found in ${inputFile}`);
  }

  const RESUME_URL = meta.content;
  console.log(`🔗 Scraping resume from: ${RESUME_URL}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(RESUME_URL, { waitUntil: "networkidle0" });

  const html = await page.content();
  const resumeDom = new JSDOM(html);
  const resumeNode = resumeDom.window.document.querySelector(".resume-renderer");

  if (!resumeNode) throw new Error("❌ Resume container not found.");

  const localHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${baseName} Resume</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
${resumeNode.outerHTML}
</body>
</html>`;

  await fs.ensureDir(OUTPUT_DIR);
  await fs.writeFile(path.join(OUTPUT_DIR, "index.html"), localHTML);

  const styles = Array.from(resumeDom.window.document.querySelectorAll("link[rel=stylesheet]"))
    .map(link => link.href)
    .filter(href => href.startsWith("http"));

  for (const [i, url] of styles.entries()) {
    const filename = `style-${i}.css`;
    await download(url, path.join(OUTPUT_DIR, "assets", filename));
  }

  await browser.close();
  console.log(`🎉 Scraped resume saved to /dist/${baseName}`);
}

scrapeResume().catch(err => {
  console.error(err);
  process.exit(1);
});
