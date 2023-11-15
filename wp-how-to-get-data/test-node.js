// Node.js script that executes puppeteer code
// For testing purposes

// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require("fs/promises");
const path = require("path");

// Register the plugin
puppeteer.use(pluginStealth());

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        const queryParams = `?search_query=${encodeURIComponent(
            "Testing"
          )}sp=EgIIAQ%253D%253D`;
        const baseUrl = "https://www.youtube.com/results";
        await page.goto(baseUrl + queryParams);
        await page.waitForSelector("ytd-video-renderer", { timeout: 10000 })
    } catch (error) {
        console.error("Error:", error.name);
        // Handle "Aw, snap" error
        if (error.name === "TimeoutError") {
        await page.reload();
        }
    } finally {
        await browser.close();
    }
})();