export const databaseLog = (message) => {
  console.log(`[DB]: ${message}`);
};

export const debugLog = (message) => {
  console.log(`[DEBUG]: ${message}`);
};

export const loggerMiddleWare = (req, resp, next) => {
  debugLog(`req url - ${req.originalUrl}`);
  next();
};
