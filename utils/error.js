import { databaseLog } from "./logger.js";

export const handleFileError = (resp, err, action) => {
  const errorObj = { error: `${action} err - ${err}` };
  databaseLog(`${action} err - ${err}`);
  resp.status(500).send(errorObj);
};
