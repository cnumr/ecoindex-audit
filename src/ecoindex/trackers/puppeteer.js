const puppeteer = require("puppeteer");
const chalk = require("chalk");
const highlight = require("cli-highlight").highlight;
const format = require("html-format");
const Table = require("cli-table");
const {getPageMetrics} = require("ecoindex_puppeteer");

const logger = async (...messages) => {
  let results;

  if (process.env.ECOINDEX_VERBOSE !== "true") {
    return;
  }

  if (typeof messages[0] === "function") {
    const data = await messages[0]();
    if (Array.isArray(data)) {
      results = data;
    }

    results = [data];
  } else {
    results = messages;
  }

  if (results.length === 1 && results[0]?.options?.head) {
    console.log(chalk.bgBlue("EcoIndex"));
    console.log(results[0].toString());
  } else {
    console.log(chalk.bgBlue("EcoIndex"), ...results);
  }
};

module.exports = {
  async audit(
    urls,
    {
      beforeScript,
      afterScript,
      headless,
      globals,
      remote_debugging_port,
      remote_debugging_address,
      initialValues,
      beforeClosingPageTimeout,
      waitForSelector,
    }
  ) {
    const shouldReuseExistingChromium =
      remote_debugging_port && remote_debugging_address;
    let browser;

    if (shouldReuseExistingChromium) {
      const remote_address = `http://${remote_debugging_address}:${remote_debugging_port}`;
      logger("Connecting Puppeteer to an existing Chromium", remote_address);
      browser = await puppeteer.connect({
        browserURL: remote_address,
      });
    } else {
      browser = await puppeteer.launch({
        headless,
        devtools: !headless,
      });
    }

    const page = await browser.newPage();

    if (process.env.ECOINDEX_VERBOSE === "true") {
      page.on("console", async (msg) => {
        const msgArgs = msg.args();
        for (let i = 0; i < msgArgs.length; ++i) {
          console.log(await msgArgs[i].jsonValue());
        }
      });
    }


    const results = [];
    for (const url of urls) {

      await page.goto(url, { waitUntil: "domcontentloaded" });

      if (beforeScript) {
        await page.evaluate(beforeScript, globals);
      }

      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 5000 });
      }

      // Get page state metrics.
      const metrics = await getPageMetrics(page, url);

      if (process.env.ECOINDEX_DISPLAY_HTML === "true") {
        logger(async () => {
          const data = await page.evaluate(
            () => document.querySelector("*").outerHTML
          );
          return highlight(format(data), {
            language: "html",
            ignoreIllegals: true,
          });
        });
      }

      if (afterScript) {
        await page.evaluate(afterScript, globals);
      }
      if (!headless) {
        await page.evaluate(() => {
          // eslint-disable-next-line no-debugger
          debugger;
        });
      }

      results.push({
        url,
        metrics:
          metrics.getDomElementsCount() + (initialValues?.[url]?.metrics ?? 0),
        numberOfRequests:
          metrics.getRequestsCount() + (initialValues?.[url]?.numberOfRequests ?? 0),
        sizeOfRequests:
          metrics.bitSize + (initialValues?.[url]?.sizeOfRequests ?? 0),
      });
    }

    if (beforeClosingPageTimeout) {
      await new Promise((r) => setTimeout(r, beforeClosingPageTimeout));
    }

    page.removeAllListeners(["console"]);
    if (!shouldReuseExistingChromium) {
      await browser.close();
    } else {
      page.close();
    }

    logger(() => {
      const table = new Table({
        head: [
          "URL",
          "Number of Nodes",
          "Number of Requests",
          "Total Requests Size",
        ],
      });
      results.forEach((result) => {
        table.push([
          result.url,
          result.metrics,
          result.numberOfRequests,
          result.sizeOfRequests,
        ]);
      });
      return Promise.resolve(table);
    });

    return results;
  },
};
