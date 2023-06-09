/// <reference types="cypress" />
const path = require("path");

describe("example to-do app", () => {
  const url = "https://www.google.fr";
  beforeEach(() => {
    cy.visit(url);
  });

  it("should have a good ecoindex", () => {
    const threshold = 50;
    const outputPathDir = path.join(__dirname, "ecoIndex")
    cy.task("checkEcoIndex", {
      url,
      options: {
        output: ["json"],
        outputPathDir,
        beforeClosingPageTimeout: 10000
      },
    })
      .its("ecoIndex", { timeout: 0 })
      .should("be.greaterThan", threshold);
  });
});
