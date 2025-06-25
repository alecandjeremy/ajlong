const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { JSDOM } = require("jsdom");

const OUTPUT_DIR = path.join(__dirname, "dist");
const config = require("./resume.config.json"); const RESUME_URL = config.url;

async function download(url, filepath) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  await fs.outputFile(filepath, res.data);
}

async function scrapeResume() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.goto(RESUME_URL, { waitUntil: "networkidle0" });

  const html = await page.content();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const resumeNode = document.querySelector(".resume-renderer");
  if (!resumeNode) throw new Error("Resume container not found.");

  const localHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Jeremy Long Resume</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
${resumeNode.outerHTML}
</body>
</html>`;

  await fs.ensureDir(OUTPUT_DIR);
  await fs.writeFile(path.join(OUTPUT_DIR, "index.html"), localHTML);

  console.log("✅ HTML created. Pulling stylesheets…");

  const styles = Array.from(document.querySelectorAll("link[rel=stylesheet]"))
    .map(link => link.href)
    .filter(href => href.startsWith("http"));

  for (const [i, url] of styles.entries()) {
    const filename = `style-${i}.css`;
    const filepath = path.join(OUTPUT_DIR, "assets", filename);
    await download(url, filepath);
    console.log(`⬇️  ${url} → ${filename}`);
  }

  await browser.close();
  console.log("🎉 Done! Files saved to dist/");
}

scrapeResume().catch(err => {
  console.error("❌ Error scraping resume:", err);
  process.exit(1);
});
