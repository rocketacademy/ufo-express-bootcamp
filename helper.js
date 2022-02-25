import moment from 'moment';

export const visitCounter = (request, response) => {
  let visits = 0;
  if (request.cookies.visits) {
    visits = Number(request.cookies.visits);
  }
  visits += 1;
  response.cookie('visits', visits);

  return visits;
};

export const daysFromNow = (data) => {
  const day = data.toString().slice(0, 2);
  const month = data.toString().slice(3, 5);
  const year = data.toString().slice(6);

  return moment([year, month, day]).fromNow();
};
