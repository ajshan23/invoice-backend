import puppeteer from "puppeteer";

console.log("Puppeteer object:", puppeteer);
console.log("Puppeteer version:", puppeteer.version || "Unknown");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Before wait");
  await page.waitForTimeout(1000); // Should wait 1 second
  console.log("After wait");
  await browser.close();
})();
