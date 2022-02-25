import { read, write } from "../utils/jsonFileStorage.js";
import { COOKIES } from "../app.js";
import { handleFileError } from "../utils/error.js";

export const getFavorite = (req, resp) => {
  const favIdx = req.query.index;
  read(COOKIES, (err, data) => {
    if (err) {
      handleFileError(resp, err, "read");
    }

    if (!data.favorite_sightings.includes(Number(favIdx))) {
      data.favorite_sightings.push(Number(favIdx));
    }

    write(COOKIES, data, (err, data) => {
      handleFileError(resp, err, "write");
    });

    resp.cookie("favorite", JSON.stringify(data.favorite_sightings));

    // TODO: render favorite sightings page, clear all cookies with https://stackoverflow.com/questions/27978868/destroy-cookie-nodejs
    resp.send(
      `Current cookie key and value: favoriteSightingIndexes: ${data.favorite_sightings}`
    );
  });
};
