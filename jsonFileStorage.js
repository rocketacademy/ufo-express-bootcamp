import { readFile, writeFile } from 'fs';

const cleanData = (dataObject) => {
  dataObject.shapes = [];
  dataObject.cities = [];

  dataObject.sightings.forEach((sighting) => {
  // check index
    sighting.index = dataObject.sightings.indexOf(sighting);
    const objShape = sighting.shape.toLowerCase();
    console.log(objShape);
    const objCity = sighting.city.toLowerCase();
    console.log(objCity);
    if (!dataObject.shapes.includes(objShape)) {
      dataObject.shapes.push(objShape);
    }
    // check cities
    if (!dataObject.cities.includes(objCity)) {
      dataObject.cities.push(objCity);
    }
  });
};

// eslint-disable-next-line import/prefer-default-export
export const read = (fileName, callback) => {
  readFile(fileName, 'utf-8', (err, data) => {
    if (err) {
      console.log('err', err);
      return;
    }
    callback(JSON.parse(data));
  });
};

export const write = (fileName, content) => {
  const stringifyData = JSON.stringify(content);

  writeFile(fileName, stringifyData, (err) => {
    if (err) {
      console.log('err', err);
    }
    // callback(stringifyData);
  });
};

export const addData = (fileName, key, contentObj, callback) => {
  read(fileName, (dataObject) => {
    contentObj.recorded = Date();

    contentObj.date_time = new Date(contentObj.date_time).toString();

    // eslint-disable-next-line prefer-destructuring
    contentObj.date_UTC = new Date(contentObj.date_time).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).replace(' ', 'T');

    dataObject[key].push(contentObj);

    cleanData(dataObject);
    const stringifyData = JSON.stringify(dataObject);
    writeFile(fileName, stringifyData, (err) => {
      if (err) {
        console.log('err', err);
      }
    });
    callback(dataObject);
  });
};

export const editData = (fileName, key, contentObj, index, callback) => {
  read(fileName, (dataObject) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const editedKey in contentObj) {
      if (contentObj[editedKey] !== dataObject[key][index][editedKey]) {
        dataObject[key][index][editedKey] = contentObj[editedKey];
        if (editedKey === 'date_UTC') {
          // const displayDate = convertDate(contentObj.date_time);

          dataObject[key][index].date_time = new Date(contentObj.date_UTC).toString();

          console.log(dataObject[key][index].date_UTC, 'date');
        }
      }
    }
    if (!('fav' in contentObj)) {
      dataObject[key][index].edited = Date();
    }
    const stringifyData = JSON.stringify(dataObject);
    writeFile(fileName, stringifyData, (err) => {
      if (err) {
        console.log('err', err);
      }
    });
    callback(dataObject);
  });
};

export const deleteEntry = (fileName, key, index) => {
  read(fileName, (dataObject) => {
    dataObject[key].splice(index, 1);
    cleanData(dataObject);
    write(fileName, dataObject);
  });
};
