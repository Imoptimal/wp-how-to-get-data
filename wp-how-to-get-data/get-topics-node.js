// Node.js script that executes puppeteer code
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const baseUrl = 'https://www.wpbeginner.com/category/wp-tutorials';
  const totalPages = 78; // Replace with the total number of pages
  let currentIndex = 0;
  const titles = [];

  for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
    const pageUrl = `${baseUrl}/page/${pageIdx}`;
    await page.goto(pageUrl);

    const tutorialTitles = await page.evaluate(currentIndex => {
      const titleElements = document.querySelectorAll('.entry-title-link'); // Selector for tutorial titles
      const titles = [];
      titleElements.forEach(titleElement => {
        titles.push({ index: currentIndex, title: titleElement.textContent.trim() });
        currentIndex++;
      });
      return { titles, currentIndex }; // Return both titles and currentIndex
    }, currentIndex);

    titles.push(...tutorialTitles.titles);
    currentIndex = tutorialTitles.currentIndex; // Update currentIndex from the result
  }

  await browser.close();

  const jsonOutput = JSON.stringify(titles, null, 2);

  fs.writeFile('./data/how-to-topics.json', jsonOutput, err => {
    if (err) throw err;
    console.log('Titles saved to how-to-topics.json');
  });
})();
