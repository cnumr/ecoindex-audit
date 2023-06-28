#! /usr/bin/env node

const check = require("./main");
const commandLineArgs = require("command-line-args");
const fs = require("fs");
const path = require("path");

const optionDefinitions = [
  { name: "grade", alias: "g", type: String },
  { name: "ecoIndex", alias: "e", type: Number },
  { name: "url", type: String, multiple: true },
  { name: "visits", type: Number },
  { name: "output", type: String, multiple: true },
  { name: "outputPathDir", type: String },
  { name: "outputFileName", type: String },
  { name: "sonarFilePath", type: String },
  { name: "staticFolder", type: String },
  { name: "staticUrlExcludes", type: String, multiple: true },
];

(async () => {
  let options = commandLineArgs(optionDefinitions);

  const configPath = path.join(process.cwd(), "eco-index-audit.js");
  if (fs.existsSync(configPath)) {
    const config = require(configPath);
    options = {
      ...config,
      ...options,
    };
  }
  const result = await check(options);
  if (!result) {
    process.exit(1);
  }
})();
