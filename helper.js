import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

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
  if (data === undefined) {
    return ' ';
  }
  const day = data.toString().slice(8, 10);
  const month = data.toString().slice(5, 7);
  const year = data.toString().slice(0, 4);
  console.log(year, month, day);
  return moment([year, month, day]).fromNow();
};

export const formatDate = (date) => {
  const formattedDate = moment(date).format('dddd, MMMM Do YYYY');
  return formattedDate;
};

export const uniqueVisitor = (request, response) => {
  if (request.cookies.UUID) {
    /* if cookie exist, set the unique number to variable 'unique'  */
    const unique = Number(request.cookies.uniqueVisitor);
    return unique;
  }
  /* if cookie does not exist, set a UUID to expire in 24 hrs  */

  response.cookie('UUID', uuidv4(), { maxAge: 24 * 60 * 60 * 1000 });
  /* increment unique by 1 if UUID does not exist */
  if (!request.cookies.uniqueVisitor) {
    const unique = 0;
    response.cookie('uniqueVisitor', unique);
    return unique;
  }
  let unique = Number(request.cookies.uniqueVisitor);
  unique += 1;
  response.cookie('uniqueVisitor', unique);
  return unique;
};
