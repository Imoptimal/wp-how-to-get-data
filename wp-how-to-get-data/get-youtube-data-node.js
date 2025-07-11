// Node.js script that executes puppeteer code
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require("fs/promises");
const path = require("path");

// Register the plugin
puppeteer.use(pluginStealth());

// Read search queries from an existing JSON file (change to get the data for other query type)
const topics = "./data/how-to-topics.json";
const plugins = "./data/plugins-api.json";
const searchQueriesFile = topics;

// Function to scroll down the page to load more videos
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

// Function to clean a string for use as a search query/file name
function cleanString(string, query = true) {
  if ((query = false)) {
    // for file name
    return string
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove characters not allowed in file names (including spaces)
      .replace(/\s+/g, "-") // Replace spaces with "-" symbol
      .substring(0, 100); // Limit the length of the file name
  } else {
    // for search query
    return string
      .replace(/[^\w\s-]/g, " ") // Remove characters not allowed in file names
      .replace(/\s\s+/g, " "); // Remove multiple spaces
  }
}

// Remove shorts from the search results
function removeShorts(videosArray) {
  var filteredArray;
  videosArray.forEach((video, index) => {
    let videoLink = video.link;
    if (videoLink.includes("/shorts/")) {
      videosArray.splice(index, 1);
    }
  });
  filteredArray = videosArray.slice(0, 5);
  return filteredArray;
}

// If missing videos (error occurs)
async function missingData() {
  let existingData;
  if (searchQueriesFile === topics) {
    existingData = JSON.parse(
      await fs.readFile("/data/missing-topics.json", "utf-8")
    );
  } else {
    // plugins
    existingData = JSON.parse(
      await fs.readFile("/data/missing-plugins.json", "utf-8")
    );
  }

  // Append current item to the existing data
  existingData.dateFiltered = dateFilteredVideos;

  await fs.writeFile(combinedFilePath, JSON.stringify(existingData, null, 2));
}

async function scrapeByRelevance(page, query, dataFolderPath, pluginSlug) {
  var cleanedQuery = cleanString(query);
  const queryParams = `?search_query=${encodeURIComponent(cleanedQuery)}`;
  const baseUrl = "https://www.youtube.com/results";

  if (pluginSlug === undefined) {
    // topics query
    pluginSlug = "Not needed!";
  }

  // Search by relevance
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36"
  );

  // Used multiple times below
  async function getData(page, query, dataFolderPath, pluginSlug) {
    // Selectors used later
    const relevanceVideos = await page.evaluate(() => {
      const videoElements = Array.from(
        document.querySelectorAll("ytd-video-renderer")
      );
      return videoElements.slice(0, 20).map((videoElement) => {
        const title = videoElement.querySelector("#video-title").textContent;
        const link = videoElement
          .querySelector("#video-title")
          .getAttribute("href");
        const publishDate =
          videoElement.querySelector("#metadata-line > span:nth-child(4)")
            ?.textContent || "";
        return { title, link, publishDate };
      });
    });

    // Store video details in a single JSON file as subobjects
    var cleanedName = "";
    if (searchQueriesFile === topics) {
      cleanedName += cleanString(query, false);
    } else {
      // plugins
      cleanedName += cleanString(pluginSlug, false);
    }

    const combinedData = {
      relevance: removeShorts(relevanceVideos),
    };
    const relevanceFileName = `${cleanedName}.json`;
    const combinedFilePath = path.join(dataFolderPath, relevanceFileName);
    await fs.writeFile(combinedFilePath, JSON.stringify(combinedData, null, 2));

    console.log(`JSON file created for "${query}" videos by relevance.`);
  }

  const maxAttempts = 3; // Set the maximum number of attempts
  let resultsFound = false;
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Attempt ${attempt}: Searching for "${query}"...`);
      await page.goto(baseUrl + queryParams);
      // Wait for the search results or "no results" page
      await Promise.race([
        page.waitForSelector("ytd-video-renderer", { timeout: 60000 }),
        // Results not found
        page.waitForSelector(".ytd-background-promo-renderer", {
          timeout: 60000,
        }),
      ]);

      // Check if no results are found
      const noResultsElement = await page.$(".ytd-background-promo-renderer");
      if (noResultsElement) {
        console.log("No results found. Retrying the search...");
        // Select "Last year" filter (you may need to adjust the selector)
        await page.click("#filter-button");
        await page.click('#label > yt-formatted-string:has-text("This year")');
        // Manually press the search button
        await page.click("button#search-icon-legacy");
        getData(page, query, dataFolderPath, pluginSlug);
      } else {
        // Scroll down to load more videos
        for (let j = 0; j < 1; j++) {
          // Adjust the number of scrolls as needed
          await scrollDown(page);
          await page.waitForTimeout(5000); // Wait for 2 seconds after each scroll
          getData(page, query, dataFolderPath, pluginSlug);
          resultsFound = true; // Set the flag to true
        }
        break; // Exit the loop if results are found
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
  if (!resultsFound) {
    console.log(`Results not found in ${maxAttempts} attempts.`);
  }
}

async function scrapeByDate(page, query, dataFolderPath, pluginSlug) {
  var cleanedQuery = cleanString(query);
  const queryParams = `?search_query=${encodeURIComponent(
    cleanedQuery
  )}&sp=EgIIBQ%253D%253D`;
  const baseUrl = "https://www.youtube.com/results";

  if (pluginSlug === undefined) {
    // topics query
    pluginSlug = "Not needed!";
  }

  // Search by date (past year)
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36"
  );

  // Used multiple times below
  async function getData(page, query, dataFolderPath, pluginSlug) {
    const dateFilteredVideos = await page.evaluate(() => {
      const videoElements = Array.from(
        document.querySelectorAll("ytd-video-renderer")
      );
      return videoElements.slice(0, 20).map((videoElement) => {
        const title = videoElement.querySelector("#video-title").textContent;
        const link = videoElement
          .querySelector("#video-title")
          .getAttribute("href");
        const publishDate =
          videoElement.querySelector("#metadata-line > span:nth-child(4)")
            ?.textContent || "";
        return { title, link, publishDate };
      });
    });

    // Load the existing JSON file for relevance-filtered data
    var cleanedName = "";
    if (searchQueriesFile === topics) {
      cleanedName += cleanString(query, false);
    } else {
      // plugins
      cleanedName += cleanString(pluginSlug, false);
    }
    const relevanceFilePath = path.join(dataFolderPath, `${cleanedName}.json`);
    const existingData = JSON.parse(
      await fs.readFile(relevanceFilePath, "utf-8")
    );

    // Append the date-filtered data to the existing data
    existingData.dateFiltered = removeShorts(dateFilteredVideos);

    // Update the JSON file with the combined data
    var cleanedQuery = "";
    if (searchQueriesFile === topics) {
      cleanedQuery += cleanString(query);
    } else {
      // plugins
      cleanedQuery += cleanString(pluginSlug);
    }
    const combinedFilePath = path.join(dataFolderPath, `${cleanedQuery}.json`);
    await fs.writeFile(combinedFilePath, JSON.stringify(existingData, null, 2));

    console.log(
      `JSON file updated for "${query}" videos within the past year.`
    );
  }

  const maxAttempts = 3; // Set the maximum number of attempts
  let resultsFound = false;
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Attempt ${attempt}: Searching for "${query}"...`);
      await page.goto(baseUrl + queryParams);
      // Wait for the search results or "no results" page
      await Promise.race([
        page.waitForSelector("ytd-video-renderer", { timeout: 60000 }),
        // Results not found
        page.waitForSelector(".ytd-background-promo-renderer", {
          timeout: 60000,
        }),
      ]);

      // Check if no results are found
      const noResultsElement = await page.$(".ytd-background-promo-renderer");
      if (noResultsElement) {
        console.log("No results found. Retrying the search...");
        // Select "Last year" filter (you may need to adjust the selector)
        await page.click("#filter-button");
        await page.click('#label > yt-formatted-string:has-text("This year")');
        // Manually press the search button
        await page.click("button#search-icon-legacy");
        getData(page, query, dataFolderPath, pluginSlug);
      } else {
        // Scroll down to load more videos
        for (let j = 0; j < 1; j++) {
          // Adjust the number of scrolls as needed
          await scrollDown(page);
          await page.waitForTimeout(5000); // Wait for 2 seconds after each scroll
          getData(page, query, dataFolderPath, pluginSlug);
          resultsFound = true; // Set the flag to true
        }
        break; // Exit the loop if results are found
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
  if (!resultsFound) {
    console.log(`Results not found in ${maxAttempts} attempts.`);
  }
}

async function executeCode() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--lang=en-US']
  });
  const page = await browser.newPage();

  try {
    const searchQueries = await fs.readFile(searchQueriesFile, "utf-8");
    var queriesArray = [];
    if (searchQueriesFile === topics) {
      queriesArray = JSON.parse(searchQueries);
    } else {
      // plugins
      var queriesObject = JSON.parse(searchQueries);
      for (var i in queriesObject) {
        queriesArray.push([i, queriesObject[i]]);
      }
    }
    // Load the last processed query from a progress JSON file
    let lastProcessedIndex = 0;
    const progressFilePath = "./data/progress.json";
    try {
      const progressData = await fs.readFile(progressFilePath, "utf-8");
      const progress = JSON.parse(progressData);
      lastProcessedIndex = progress.lastProcessedIndex;
    } catch (error) {
      console.error("Progress file not found. Starting from the beginning.");
    }

    // Create a 'data' subfolder if it doesn't exist
    var dataFolderPath = "";
    if (searchQueriesFile == topics) {
      dataFolderPath += path.join(
        __dirname,
        "data/individual-api-files/how-to"
      );
    } else {
      // plugin
      dataFolderPath += path.join(
        __dirname,
        "data/individual-api-files/plugins"
      );
    }
    await fs.mkdir(dataFolderPath, { recursive: true });

    for (let i = lastProcessedIndex; i < queriesArray.length; i++) {
      // Update the progress JSON file with the last processed query
      progressData = {
        lastProcessedIndex: i,
      };
      fs.writeFile(progressFilePath, JSON.stringify(progressData, null, 2));
      // Execute query
      let query = "";
      let pluginSlug;
      if (searchQueriesFile === topics) {
        query += queriesArray[i].title;
      } else {
        // plugins
        query += queriesArray[i][1].name + " WordPress plugin tutorial";
        pluginSlug = queriesArray[i][1].slug;
      }

      // Scrape by relevance
      await scrapeByRelevance(page, query, dataFolderPath, pluginSlug);
      await page.waitForTimeout(5000);

      // Scrape by date
      await scrapeByDate(page, query, dataFolderPath, pluginSlug);
      await page.waitForTimeout(5000);
    }
  } catch (error) {
    console.error("Error:", error);
    executeCode();
  } finally {
    //await browser.close();
  }
}
executeCode();
