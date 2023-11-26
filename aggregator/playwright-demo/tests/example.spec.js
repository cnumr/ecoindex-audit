import { test } from '@playwright/test';
import check  from "@cnumr/eco-index-audit";
import fs  from "fs";
import path  from "path";
import { fileURLToPath } from 'url';
import { playAudit } from 'playwright-lighthouse'
import aggregate from '@cnumr/lighthouse-eco-index-aggregator/src/main.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lighthouseOutputPathDir = path.join(__dirname, "reports-playwright/lighthouse");
const ecoIndexOutputPathDir = path.join(__dirname, "reports-playwright/ecoindex");

if(fs.existsSync(lighthouseOutputPathDir)){
    fs.rmdirSync(lighthouseOutputPathDir, { recursive: true, force: true });
}
if(fs.existsSync(ecoIndexOutputPathDir)){
    fs.rmdirSync(ecoIndexOutputPathDir, { recursive: true, force: true });
}

fs.mkdirSync(ecoIndexOutputPathDir, {recursive: true});
fs.mkdirSync(lighthouseOutputPathDir, {recursive: true});

test("Eco Index and Lighthouse", async ({ page }) => {
  const url = "https://playwright.dev/";

  await page.goto(url);

  await playAudit({
    page: page,
    port: 9222,
    ignoreError: true,
    reports: {
      formats: {
        json: true,
        html: true,
      },
      name: url.replace("://", "_").replace("/", "_"),
      directory: lighthouseOutputPathDir
    }
  });

  await check(
    {
      url,
      remote_debugging_port: 9222,
      output: ["json"],
      outputPathDir: ecoIndexOutputPathDir,
      outputFileName: url.replace("://", "_").replace("/", "_")
    },
    true
  );

  await aggregate({
    reports: [
      "html"    ],
    srcLighthouse: lighthouseOutputPathDir,
    srcEcoIndex: ecoIndexOutputPathDir,
    outputPath: "report_final",
  }) 
});
