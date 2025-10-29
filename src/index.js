import fs from 'fs'
async function writeMyFile() {
  const filePath = 'myPromiseFile.txt';
  const content = 'Content from a promise-based write.';

  try {
    await fsync.writeFile(filePath, content);
    console.log('Promise-based file written successfully!');
  } catch (err) {
    console.error('Error writing promise-based file:', err);
  }
}

writeMyFile();