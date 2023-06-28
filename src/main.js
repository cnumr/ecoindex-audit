const audit = require("./ecoindex/audit");
const reportResult = require("./reporter/table");
const reportCsvResult = require("./reporter/csv");
const reportJsonResult = require("./reporter/json");
const reportSonarResult = require("./reporter/sonar");
const config = require("./config");
const path = require("path");

const grades = ["A", "B", "C", "D", "E", "F", "G"];

module.exports = async (options, withResult = false) => {
  const _audit = async (_urls) => {
    const result = await audit(_urls, {
      beforeScript: options.beforeScript,
      afterScript: options.afterScript,
      headless: options.headless ?? true,
      globals: options.globals,
      remote_debugging_port: options.remote_debugging_port,
      remote_debugging_address: options.remote_debugging_address,
      initialValues: options.initialValues,
      beforeClosingPageTimeout: options.beforeClosingPageTimeout,
      waitForSelector: options.waitForSelector,
    });
    const gradeInput = grades.findIndex((o) => o === options.grade);
    const gradeOutput = grades.findIndex((o) => o === result.grade);

    options.output?.forEach((output) => {
      if (typeof output !== "string") {
        output(result, optionsWithDefault);
      } else if (output?.indexOf("csv") >= 0)
        reportCsvResult(result, optionsWithDefault);
      else if (output?.indexOf("json") >= 0)
        reportJsonResult(result, optionsWithDefault);
      else if (output?.indexOf("sonar") >= 0)
        reportSonarResult(result, optionsWithDefault);
      else if (
        output?.indexOf("table") >= 0 ||
        !options.output ||
        options.output?.length === 0
      )
        reportResult(result, optionsWithDefault);
    });

    if (gradeInput !== -1 && gradeOutput > gradeInput) {
      console.error(
        `Your grade is ${gradeOutput}, but should be below ${gradeInput}`
      );
      return false;
    }
    if (result.ecoIndex < options.ecoIndex) {
      const message = `Your ecoIndex is ${result.ecoIndex}, but should be at least equal to ${options.ecoIndex}`;
      console.error(message);
      return withResult ? { valid: false, ...result } : false;
    }
    return withResult ? { valid: true, ...result } : true;
  };

  const optionsWithDefault = {
    visits: config.TOTAL_VISITS,
    ...options,
  };
  const urls = Array.isArray(options.url) ? options.url : [options.url];

  if (options.staticFolder) {
    const { glob } = require("glob");

    return new Promise((resolve) => {
      const rootPath = path.join(process.cwd(), options.staticFolder);
      glob(rootPath + "/**/*.html", {
        ignore: (options.staticUrlExcludes ?? []).map(staticFolderExclude => path.join(process.cwd(), options.staticFolder, staticFolderExclude)),
      }).then((files) => {

        urls.push(
          ...files.map((url) => `http://localhost:3000` + url).map(url => url.replace(rootPath, ""))
        );

        const StaticServer = require("static-server");
        const server = new StaticServer({
          rootPath: options.staticFolder,
          port: 3000,
          name: "eco-index-server",
          host: "localhost",
        });

        server.start(async function () {
          console.log("Server listening to", server.port);
          const result = await _audit(urls);
          server.stop();
          resolve(result);
        });
      });
    });
  } else {
    return _audit(urls);
  }
};
