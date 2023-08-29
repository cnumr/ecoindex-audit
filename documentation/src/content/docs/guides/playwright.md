---
title: Integration with Playwright
---

## Integration with Playwright

We can also run the `eco-index-audit` module inside a Playwright test. In this repository, we have a working demo. you just need to run the following command after cloning the source code.

```shell
npx playwright test
```

In order to be able to run this module inside a Playwright test suites, you need to add this configuration in your `playwright.config.ts`

```typescript
{
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: ['--remote-debugging-port=9222'],
    }
  },

}
```

An then, in the configuration of `eco-index-audit`, you need to reuse the same `9222` HTTP port.

```typescript
import { test, expect } from "@playwright/test";
const check = require("../src/main");

test("get started link", async ({ page, launchOptions }) => {
  const url = "https://playwright.dev/";

  await page.goto(url);

  // Click the get started link.
  await page.getByRole("link", { name: "Get started" }).click();

  // Expects the URL to contain intro.
  await expect(page).toHaveURL(/.*intro/);

  const result = await check(
    {
      url,
      remote_debugging_port: 9222,
    },
    true
  );

  expect(result.ecoIndex).toBe(100);
});
```
