// get the node libraries
import { readFile, writeFile } from 'fs';

export function read(fileName, callbackFileRead) {
  // set the file read callback
  const whenFileIsRead = (error, JsonContent) => {
    // check for reading errors
    if (error) {
      console.log('reading error', error);
    }
    const dataContent = JSON.parse(JsonContent);
    callbackFileRead(dataContent);
  };
  // read the file
  readFile(fileName, 'utf-8', whenFileIsRead);
}

// write a file with the object passed in
export function write(filename, content, callbackAfterWriteFn) {
  const whenFileIsWritten = (error) => {
    const message = (error) ? `Error occurred: ${error}` : 'Write success!';
    console.log(message);
    callbackAfterWriteFn(null, error);
  };
  const outputContent = JSON.stringify(content);
  writeFile(filename, outputContent, whenFileIsWritten);
}

// add an object to an array of objects in a JSON file
export function add(filename, key, input, callback) {
  // set the file read callback
  const whenFileIsRead = (readingError, jsonFileData) => {
    // check for reading errors
    if (readingError) {
      console.log('reading error', readingError);
      callback(null, readingError);
      return;
    }

    console.log('input in Add: ', input);

    // parse the string into a JavaScript object
    const jsonObjectData = JSON.parse(jsonFileData);
    if (jsonObjectData[key]) {
      jsonObjectData[key].push(input);
    } else {
      return;
    }

    // turn it into a string
    const outputContent = JSON.stringify(jsonObjectData);
    writeFile(filename, outputContent, (writingError) => {
      if (writingError) {
        console.log('error writing', outputContent, writingError);
        callback(null, writingError);
      } else {
        // file written successfully
        console.log('success!');
        callback(jsonObjectData[key].length, null);
      }
    });
  };
  // read the file
  readFile(filename, 'utf-8', whenFileIsRead);
}
