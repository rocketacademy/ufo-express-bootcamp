export const getDateTimeNow = () => {
  const now = new Date();
  return dateToDatetimeLocal(now);
};

const dateToDatetimeLocal = (date) =>
  new Date(date.getTime() + new Date().getTimezoneOffset() * -60 * 1000)
    .toISOString()
    .slice(0, 19);

export const generateRandomID = () => {
  length = 10;
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
