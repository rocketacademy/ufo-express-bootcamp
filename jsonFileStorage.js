import { readFile, writeFile } from 'fs';
// read a file. call the callback with the file contents
export function read(filename, callback) {
  const whenFileIsRead = (error, jsonContent) => {
    // check for reading errors
    if (error) {
      console.log('reading error', error);
      callback(null, error);
      return;
    }

    // start dealing with the JSON

    // parse the string into a *real* JavaScript object
    const content = JSON.parse(jsonContent);

    // call the function that got passed in
    callback(content, null);
  };

  // read the file
  readFile(filename, 'utf-8', whenFileIsRead);
}

// write a file with the object passed in
export function write(filename, content, callback) {
  const outputContent = JSON.stringify(content);

  writeFile(filename, outputContent, (writingError) => {
    if (writingError) {
      console.log('error writing', writingError);
      callback(writingError);
    } else {
      // file written successfully
      console.log('success!');
    }
  });
}

// Add an element to an array

export function add(filename, key, input, callback) {
  // set the file read callback
  const whenFileIsRead = (readingError, jsonContent) => {
    // check for reading errors
    if (readingError) {
      console.log('reading error', readingError);
      callback(null, readingError);
      return;
    }

    // parse the string into a JavaScript object
    const content = JSON.parse(jsonContent);

    // check for the key, if it doesn't exist, exit out
    if (!(key in content)) {
      // create your own error message
      const errorMessage = "key doesn't exist";

      // call the callback
      callback(null, errorMessage);
      return;
    }
    // Add timestamp
    const timeStamp = getTimeStamp();
    // Input ID to new obj that is to be appended towards the end
    const inputWithID = { id: Number(content.sightings.length) + 1, ...input, timeSubmitted: timeStamp };

    content[key].push(inputWithID);

    // turn it into a string
    const outputContent = JSON.stringify(content);

    writeFile(filename, outputContent, (writingError) => {
      if (writingError) {
        console.log('error writing', outputContent, writingError);
        callback(null, writingError);
        return;
      }
      // file written successfully
      console.log('success!');
      callback(content, null);
    });
  };

  // read the file
  readFile(filename, 'utf-8', whenFileIsRead);
}

export function edit(filename, id, newInput, callback) {
  const editItem = (data, error) => {
    // check for error
    if (error) {
      console.log('error', error);
      callback(error);
      return;
    }
    // Add timestamp
    const timeStamp = getTimeStamp();
    // Input ID to new obj that is to be appended at the same position
    const inputWithID = { id: Number(id), ...newInput, timeSubmitted: timeStamp };
    data.sightings[id - 1] = inputWithID;
    callback(data);
    write(filename, data);
  };

  read(filename, editItem);
}

export function deleteContent(filename, id, callback) {
  const deleteItem = (data, error) => {
    // check for error
    if (error) {
      console.log('error', error);
      callback(error);
      return;
    }
    // If no error, delete by splice
    data.sightings.splice(id - 1, 1);
    if (callback) {
      callback(data);
    }
    data.sightings.forEach((sighting, arrayIndex) => {
      sighting.id = arrayIndex + 1;
    });
    write(filename, data);
  };
  read(filename, deleteItem);
}

// Helper Function that creates a timestamp when an item is edited or created
const getTimeStamp = () => {
  // Input time of submission
  const newSubmission = new Date();
  const timeStamp = newSubmission.toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  console.log(timeStamp);
  return timeStamp;
};
