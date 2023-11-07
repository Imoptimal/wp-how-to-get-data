# wp-how-to-get-data - Plugin and scripts to get the YouTube videos for WP How to plugin

- Install WordPress plugin locally and run it in order to get the plugins_api data.

- Run node.js (puppeteer scripts) to get the topics data, and YouTube items for both categories:
    - To get topics data use the command 'npm run topics'
    - To get YouTube items for each category use the command 'npm run youtube' (In the file get-youtube-data-node.js change manually variable searchQueriesFile accordingly)
    - To create json files (wordpress-topics.json and wordpress-plugins.json) for search functionality use the command 'npm run search'.

    - To test segments of puppeteer (node) code, use the test-node.js and the command 'npm run test'.

- Upload those files (search files and individual api files) to the WP How to website.