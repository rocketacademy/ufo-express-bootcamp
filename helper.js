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
  const day = data.toString().slice(0, 2);
  const month = data.toString().slice(3, 5);
  const year = data.toString().slice(6);

  return moment([year, month, day]).fromNow();
};

export const uniqueVisitor = (request, response) => {
  if (request.cookies.UUID) {
    /* if cookie exist, set the unique number to variable 'unique'  */
    const unique = Number(request.cookies.uniqueVisitor);
    return unique;
  }
  /* if cookie does not exist, sen  */
  response.cookie('UUID', uuidv4());
  let unique = 0;
  unique += 1;
  response.cookie('uniqueVisitor', unique);
  return unique;
};
