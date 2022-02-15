import { read, readFile, writeFile } from "fs";

const dataPath = "data.json";

const readPath = dataPath;
const writePath = dataPath;

/**
 *
 * @param {*} sighting
 * @returns index of new sighting or -1
 */
const addSighting = (req, res, sighting) => {
  console.log("[addSighting]");
  readFile(readPath, (err, content) => {
    if (err) {
      throw err;
    }
    const json = JSON.parse(content);
    const newJson = { ...json, sightings: [...json.sightings, sighting] };
    const newContent = JSON.stringify(newJson);
    writeFile(writePath, newContent, (err) => {
      if (err) {
        throw err;
      }
    });
  });
};

export { addSighting };
