const fs = require('fs');
const path = require('path');

const folderPath = '/path/to/your/folder'; // Replace with the actual path to your folder
const fileName = 'yourfile.txt'; // Replace with the actual file name

const filePath = path.join(folderPath, fileName);

// Check if the file exists
fs.access(filePath, fs.constants.F_OK, (err) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.log(`File "${fileName}" does not exist in the folder.`);
      // Add item to missing items file
    } else {
      console.error('Error checking file existence:', err);
    }
  } else {
    console.log(`File "${fileName}" exists in the folder.`);
    // Open and check how many items stored
    // If les than 5/5 - add item to missing items file
  }
});
