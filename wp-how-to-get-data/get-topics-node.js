// Node.js script that executes puppeteer code
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const baseUrl = 'https://www.wpbeginner.com/category/wp-tutorials';
  const totalPages = 78; // Replace with the total number of pages

  const titles = [];

  for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
    const pageUrl = `${baseUrl}/page/${pageIdx}`;
    await page.goto(pageUrl);

    const tutorialTitles = await page.evaluate(() => {
      const titleElements = document.querySelectorAll('.entry-title-link'); // Selector for tutorial titles
      const titles = [];
      titleElements.forEach(titleElement => titles.push(titleElement.textContent.trim()));
      return titles;
    });

    titles.push(...tutorialTitles);
  }

  await browser.close();

  const jsonOutput = JSON.stringify(titles, null, 2);

  fs.writeFile('how-to-topics.json', jsonOutput, err => {
    if (err) throw err;
    console.log('Titles saved to how-to-topics.json');
  });
})();
