// Node.js script that executes puppeteer code
const fs = require("fs/promises");
// Transform the original data into smaller files (used for search)
const initialTopics = "./data/how-to-topics.json";
const initialPlugins = "./data/plugins-api.json";
const searchTopics = "./data/wordpress-topics.json";
const searchPlugins = "./data/wordpress-plugins.json";

// Topics
(async () => {
    const originalFile = await fs.readFile(initialTopics, "utf-8");
    var originalArray = [];
    originalArray = JSON.parse(originalFile);
    var modifiedArray = [];
    for (let i = 0; i < originalArray.length; i++) {
        // Exclude index
        var topic = originalArray[i];
        modifiedArray.push(topic.title);
    }
    await fs.writeFile(searchTopics, JSON.stringify(modifiedArray, null, 2));
})();

// Plugins
(async () => {
    const originalFile = await fs.readFile(initialPlugins, "utf-8");
    var originalArray = [];
    var originalObject = JSON.parse(originalFile);
    for (var i in originalObject) {
        originalArray.push([i, originalObject[i]]);
    }
    var modifiedArray = [];
    for (let i = 0; i < originalArray.length; i++) {
        // Exclude description
        var plugin = originalArray[i];
        var selectedData = {slug: plugin[1].slug, name: plugin[1].name};
        modifiedArray.push(selectedData);
    }
    await fs.writeFile(searchPlugins, JSON.stringify(modifiedArray, null, 2));
})();