---
title: Integration with Cypress
---

## Integration with Cypress

For the moment, you can only use `eco-index-audit` inside a Cypress test suites running on a Chromium-based browser.

```shell
npx cypress run -b chrome
```

You are able to run this module during your Cypress test. The first step is to define a new task in the `cypress.config.js` file.

```js
const { defineConfig } = require("cypress");
const {
  prepareAudit,
  checkEcoIndex,
} = require("eco-@cnumr/eco-index-audit/src/cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on("before:browser:launch", (_browser, launchOptions) => {
        prepareAudit(launchOptions);
      });

      on("task", {
        checkEcoIndex: ({ url, options }) =>
          checkEcoIndex({
            url,
            options: {
              headless: false,
              globals: { data: "data" },
              beforeScript: (globals) => console.log(globals),
              afterScript: (globals) => console.log(globals),
            },
          }),
      });
    },
  },
});
```

If the `headless` parameter is set to false, the UI will opened with the Devtools enabled and will automatically stopped running everything after loading the page (using a debugger statement),

The `globals` object can be used if you need to share some data during the execution of the `beforeScript` and `afterScript` hooks. This object will be available as a parameter to these two hooks.

Inside a Cypress test, `eco-index-audit` will reuse the same Chromium-based browser used by Cypress.

And then use this task inside your test. Inside your test, you can check if the ecoIndex is below a threshold.

```js
describe("Cypress test", () => {
  const url = "https://google.com";
  beforeEach(() => {
    cy.visit(url);
  });

  it("should have a good ecoindex", () => {
    const threshold = 50;
    cy.task("checkEcoIndex", { url })
      .its("ecoIndex", { timeout: 0 })
      .should("be.greaterThan", threshold);
  });
});
```

If you have interceptors inside your Cypress test, your eco-index will be better than expected. In order to be as closed as the reality, you can update the initial values of the metrics we used to. For example, if you intercept 4 HTTP requests of 1024 bytes

```js
describe("Cypress test", () => {
  const url = "https://google.com";
  beforeEach(() => {
    cy.visit(url);
  });

  it("should have a good ecoindex", () => {
    const threshold = 50;
    cy.task("checkEcoIndex", {
      url,
      initialValues: {
        numberOfRequests: 4,
        sizeOfRequests: 4 * 1024,
      },
    })
      .its("ecoIndex", { timeout: 0 })
      .should("be.greaterThan", threshold);
  });
});
```

You can also define the `outputPathDir` option in order to save the result in a file. These properties are only use for the `json` and `csv` formats.

```js
const path = require("path");

describe("Cypress test", () => {
  const url = "https://google.com";
  beforeEach(() => {
    cy.visit(url);
  });

  const outputPathDir = path.join(__dirname, "reports");

  it("should have a good ecoindex", () => {
    const threshold = 50;
    cy.task("checkEcoIndex", {
      url,
      options: {
        output: "json",
        outputPathDir,
      },
    })
      .its("ecoIndex", { timeout: 0 })
      .should("be.greaterThan", threshold);
  });
});
```

You can also add a `timeout` before closing the Puppeteer page in order to debug the page thank to the `beforeClosingPageTimeout` options. The value is in `ms`

```js
describe("Cypress test", () => {
  const url = "https://google.com";
  beforeEach(() => {
    cy.visit(url);
  });

  it("should have a good ecoindex", () => {
    const threshold = 50;
    cy.task("checkEcoIndex", {
      url,
      options: {
        beforeClosingPageTimeout: 10000,
      },
    })
      .its("ecoIndex", { timeout: 0 })
      .should("be.greaterThan", threshold);
  });
});
```