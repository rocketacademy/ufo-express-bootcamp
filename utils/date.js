export const getDateTimeNow = () => {
  const now = new Date();
  return dateToDatetimeLocal(now);
};

const dateToDatetimeLocal = (date) =>
  new Date(date.getTime() + new Date().getTimezoneOffset() * -60 * 1000)
    .toISOString()
    .slice(0, 19);
