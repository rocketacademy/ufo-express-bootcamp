import { readFile, writeFile } from 'fs';
import getDateNow from './date.js';

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {object} jsonContentObj - The content to write to the JSON file
 * @param {function} callback - The callback function to execute on error or success
 *                              Callback takes write error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
export function write(filename, jsonContentObj, callback) {
  // Convert content object to string before writing
  const jsonContentStr = JSON.stringify(jsonContentObj);

  // Write content to DB
  writeFile(filename, jsonContentStr, (writeErr) => {
    if (writeErr) {
      console.error('Write error', jsonContentStr, writeErr);
      // Allow each client app to handle errors in their own way
      callback(writeErr, null);
      return;
    }
    console.log('Write success!');
    // Call client-provided callback on successful write
    callback(null, jsonContentStr);
  });
}

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {function} callback - The callback function to execute on error or success
 *                              Callback takes read error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
export function read(filename, callback) {
  const handleFileRead = (readErr, jsonContentStr) => {
    if (readErr) {
      console.error('Read error', readErr);
      // Allow client to handle error in their own way
      callback(readErr, null);
      return;
    }

    // Convert file content to JS Object
    const jsonContentObj = JSON.parse(jsonContentStr);

    // Call client callback on file content
    callback(null, jsonContentObj);
  };

  // Read content from DB
  readFile(filename, 'utf-8', handleFileRead);
}

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {function} callback - The callback function to execute on error or success
 *                              Callback takes read error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
export function edit(filename, readCallback, writeCallback) {
  // Read contents of target file and perform callback on JSON contents
  read(filename, (readErr, jsonContentObj) => {
    // Exit if there was a read error
    if (readErr) {
      console.error('Read error', readErr);
      readCallback(readErr, null);
      return;
    }

    // Perform custom edit operations here.
    // jsonContentObj mutated in-place because object is mutable data type.
    readCallback(null, jsonContentObj);

    // Write updated content to target file.
    write(filename, jsonContentObj, writeCallback);
  });
}

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {string} key - The key in the JSON file whose value is the target array
 * @param {string} input - The value to append to the target array
 * @param {function} callback - The callback function to execute on error or success
 *                              Callback takes read or write error as 1st param and written string as 2nd param.
 * @returns undefined
 */
export function add(filename, key, input, callback) {
  edit(
    filename,
    (err, jsonContentObj) => {
      // Exit if there was an error
      if (err) {
        console.error('Edit error', err);
        callback(err);
        return;
      }

      // Exit if key does not exist in DB
      if (!(key in jsonContentObj)) {
        console.error('Key does not exist');
        // Call callback with relevant error message to let client handle
        callback('Key does not exist');
        return;
      }

      // Add input element to target array
      jsonContentObj[key].push(input);
    },
    // Pass callback to edit to be called after edit completion
    callback,
  );
}

/**
 * Complete an element from an array in JSON
 * @param {string} filename
 * @param {string} key - The name of the key of the array we wish to edit
 * @param {number} index - The index of the array we wish to delete from
 * @param {function} callback - The callback function to call after completing
 * @returns undefined
 */
export function complete(filename, key, index, callback) {
  edit(
    filename,
    (err, jsonContentObj) => {
      // Exit if there was an error
      if (err) {
        console.error('Remove error', err);
        callback(err);
        return;
      }

      // Exit if key does not exist in DB
      if (!(key in jsonContentObj)) {
        console.error('Key does not exist');
        // Call callback with relevant error message to let client handle
        callback('Key does not exist');
        return;
      }

      // Get available items
      const items = jsonContentObj[key].filter(
        (item) => (item.completed === null) && (item.removed === null),
      );

      // Complete element
      items[index - 1].completed = getDateNow();
    },
    // Pass callback to remove to be called after remove completion
    callback,
  );
}

/**
 * Remove an element from an array in JSON
 * @param {string} filename
 * @param {string} key - The name of the key of the array we wish to edit
 * @param {number} index - The index of the array we wish to delete from
 * @param {function} callback - The callback function to call after removing
 * @returns undefined
 */
export function remove(filename, key, index, callback) {
  edit(
    filename,
    (err, jsonContentObj) => {
      // Exit if there was an error
      if (err) {
        console.error('Remove error', err);
        callback(err);
        return;
      }

      // Exit if key does not exist in DB
      if (!(key in jsonContentObj)) {
        console.error('Key does not exist');
        // Call callback with relevant error message to let client handle
        callback('Key does not exist');
        return;
      }

      // Get available items
      const items = jsonContentObj[key].filter(
        (item) => (item.completed === null) && (item.removed === null),
      );

      // Remove element
      items[index - 1].removed = getDateNow();
    },
    // Pass callback to remove to be called after remove completion
    callback,
  );
}

/**
 * Edit the properties of an element in an array in JSON
 * @param {string} filename
 * @param {string} key - The name of the key of the array we wish to edit
 * @param {number} index - The index of the array we wish to edit
 * @param {object} payload - The attributes we wish to add to the element
 * @param {function} callback - The callback function to call after editing
 * @returns undefined
 */
export function editOneElement(filename, key, index, payload, callback) {
  edit(
    filename,
    (err, jsonContentObj) => {
      // Exit if there was an error
      if (err) {
        console.error('EditOneElement error', err);
        callback(err);
        return;
      }

      // Exit if key does not exist in DB
      if (!(key in jsonContentObj)) {
        console.error('Key does not exist');
        // Call callback with relevant error message to let client handle
        callback('Key does not exist');
        return;
      }

      // Get available items
      const items = jsonContentObj[key].filter(
        (item) => (item.completed === null) && (item.removed === null),
      );

      // Edit element
      Object.keys(items[index - 1]).forEach((k) => {
        items[index - 1][k] = payload[k];
      });
    },
    // Pass callback to remove to be called after remove completion
    callback,
  );
}
