// Node.js script that executes puppeteer code
const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const path = require('path');

async function scrollDown(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const maxTries = 100;

      const scrollInterval = setInterval(() => {
        const scrollableElement = document.scrollingElement;
        scrollableElement.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollableElement.scrollHeight || maxTries <= 0) {
          clearInterval(scrollInterval);
          resolve();
        }
        maxTries--;
      }, 100);
    });
  });
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    // Read search queries from an existing JSON file
    const searchQueriesFile = 'how-to-topics.json'; // Replace with your JSON file
    const searchQueries = await fs.readFile(searchQueriesFile, 'utf-8');
    const queriesArray = JSON.parse(searchQueries);

    const baseUrl = 'https://www.youtube.com/results';

    // Create a 'data' subfolder if it doesn't exist
    const dataFolderPath = path.join(__dirname, 'data');
    await fs.mkdir(dataFolderPath, { recursive: true });

    for (const query of queriesArray) {
      let queryParams = `?search_query=${encodeURIComponent(query)}&hl=EN`;

      // Search by relevance
      await page.goto(baseUrl + queryParams);
      await page.waitForSelector('ytd-video-renderer');

      // Scroll down to load more videos
      for (let i = 0; i < 2; i++) { // Adjust the number of scrolls as needed
        await scrollDown(page);
        await page.waitForTimeout(1000); // Wait for some time after scrolling
      }

      const relevanceVideos = await page.evaluate(() => {
        const videoElements = Array.from(document.querySelectorAll('ytd-video-renderer'));
        return videoElements.slice(0, 20).map(videoElement => {
          const title = videoElement.querySelector('#video-title').textContent;
          const link = videoElement.querySelector('#video-title').getAttribute('href');
          const description = videoElement.querySelector('#dismissible > div > div.metadata-snippet-container-one-line.style-scope.ytd-video-renderer.style-scope.ytd-video-renderer > yt-formatted-string')?.textContent || '';
          const publishDate = videoElement.querySelector('#metadata-line > span:nth-child(4)')?.textContent || '';
          return { title, link, description, publishDate };
        });
      });

      // Search by date
      queryParams += '&sp=CAI%253D';
      await page.goto(baseUrl + queryParams);
      await page.waitForSelector('ytd-video-renderer');

      // Scroll down to load more videos
      for (let i = 0; i < 2; i++) { // Adjust the number of scrolls as needed
        await scrollDown(page);
        await page.waitForTimeout(1000); // Wait for some time after scrolling
      }

      const dateVideos = await page.evaluate(() => {
        const videoElements = Array.from(document.querySelectorAll('ytd-video-renderer'));
        return videoElements.slice(0, 20).map(videoElement => {
          const title = videoElement.querySelector('#video-title').textContent;
          const link = videoElement.querySelector('#video-title').getAttribute('href');
          const description = videoElement.querySelector('#dismissible > div > div.metadata-snippet-container-one-line.style-scope.ytd-video-renderer.style-scope.ytd-video-renderer > yt-formatted-string')?.textContent || '';
          const publishDate = videoElement.querySelector('#metadata-line > span:nth-child(4)')?.textContent || '';
          return { title, link, description, publishDate };
        });
      });

      // Store video details in a single JSON file as subobjects
      const combinedData = {
        relevance: relevanceVideos,
        date: dateVideos,
      };
      const combinedFilePath = path.join(dataFolderPath, `${query}.json`);
      await fs.writeFile(combinedFilePath, JSON.stringify(combinedData, null, 2));

      console.log(`JSON file created for "${query}" videos by relevance and date.`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
