const csv = require("./csv");
const json = require("./json");
const sonar = require("./sonar");

const sampleAudit = {
  ecoIndex: 56,
  grade: "C",
  greenhouseGasesEmission: 1.88,
  waterConsumption: 2.82,
  pages: [
    {
      url: "url",
      ecoIndex: 56,
      grade: "C",
      greenhouseGasesEmission: 1.88,
      waterConsumption: 2.82,
      metrics: [
        {
          name: "number_requests",
          value: 16,
          status: "info",
          recommandation: "< 30 requests",
        },
        {
          name: "page_size",
          value: 1200,
          status: "warning",
          recommandation: "< 1000kb",
        },
        {
          name: "Page_complexity",
          value: 3000,
          status: "error",
          recommandation: "Between 300 and 500 nodes",
        },
      ],
    },
  ],
};

test("should report with CSV", () => {
  const consoleLogMock = jest.spyOn(global.console, "log").mockImplementation();
  csv(sampleAudit, { visits: 2000 });
  const result = consoleLogMock.mock.calls.join("\n");
  expect(result).toEqual(`Métrique,Valeur,Informations complémentaires
EcoIndex,56/100,
Note,C,
GES,1.88eqCO2,Pour un total de 2000 visites par mois, ceci correspond à 42km en voiture (Peugeot 208 5P 1.6 BlueHDi FAP (75ch) BVM5)
Eau,2.82cl,Pour un total de 2000 visites par mois, ceci correspond à 1 douche`);
  consoleLogMock.mockRestore();
});

test("should report with JSON", () => {
  const expected = JSON.stringify({
    score: 56,
    grade: "C",
    estimatation_co2: {
      comment:
        "Pour un total de 2000 visites par mois, ceci correspond à 42km en voiture (Peugeot 208 5P 1.6 BlueHDi FAP (75ch) BVM5)",
      commentDetails: {
        numberOfVisit: 2000,
        value_km: 42,
        value: 42,
        unit: "km",
      },
    },
    estimatation_water: {
      comment:
        "Pour un total de 2000 visites par mois, ceci correspond à 1 douche",
      commentDetails: {
        numberOfVisit: 2000,
        value_shower: 1,
        value: 1,
        unit: "douches",
      },
    },
    pages: [
      {
        url: "url",
        ecoIndex: 56,
        grade: "C",
        greenhouseGasesEmission: 1.88,
        waterConsumption: 2.82,
        metrics: [
          {
            name: "number_requests",
            value: 16,
            status: "info",
            recommandation: "< 30 requests",
          },
          {
            name: "page_size",
            value: 1200,
            status: "warning",
            recommandation: "< 1000kb",
          },
          {
            name: "Page_complexity",
            value: 3000,
            status: "error",
            recommandation: "Between 300 and 500 nodes",
          },
        ],
        estimatation_co2: {
          comment:
            "Pour un total de 2000 visites par mois, ceci correspond à 42km en voiture (Peugeot 208 5P 1.6 BlueHDi FAP (75ch) BVM5)",
          commentDetails: {
            numberOfVisit: 2000,
            value_km: 42,
            value: 42,
            unit: "km",
          },
        },
        estimatation_water: {
          comment:
            "Pour un total de 2000 visites par mois, ceci correspond à 1 douche",
          commentDetails: {
            numberOfVisit: 2000,
            value_shower: 1,
            value: 1,
            unit: "douches",
          },
        },
      },
    ],
  });

  const consoleLogMock = jest.spyOn(global.console, "log").mockImplementation();
  json(sampleAudit, { visits: 2000 });
  const result = consoleLogMock.mock.calls.join("\n");
  expect(JSON.stringify(JSON.parse(result))).toEqual(expected);
  consoleLogMock.mockRestore();
});

test("should report with Sonar", () => {
  const consoleLogMock = jest.spyOn(global.console, "log").mockImplementation();
  sonar(sampleAudit, { ecoIndex: 100, sonarFilePath: "sonarFilePath" });
  const result = consoleLogMock.mock.calls;

  expect(result[0][0]).toEqual([
    {
      engineId: "eco-index",
      primaryLocation: {
        filePath: "sonarFilePath",
        message: "You ecoindex (56) is below the configured threshold (100)",
      },
      ruleId: "eco-index-below-threshold",
      severity: "MAJOR",
      type: "BUG",
    },
    {
      engineId: "eco-index",
      primaryLocation: {
        filePath: "sonarFilePath",
        message:
          "The size of the page (1200) is below the configured threshold (< 1000kb) (url)",
      },
      ruleId: "eco-index-page_size",
      severity: "MINOR",
      type: "BUG",
    },
    {
      engineId: "eco-index",
      primaryLocation: {
        filePath: "sonarFilePath",
        message:
          "The complexity of the page (3000) is below the configured threshold (Between 300 and 500 nodes) (url)",
      },
      ruleId: "eco-index-page_complexity",
      severity: "MAJOR",
      type: "BUG",
    },
  ]);
});
