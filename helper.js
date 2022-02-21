export const visitCounter = (request, response) => {
  let visits = 0;
  if (request.cookies.visits) {
    visits = Number(request.cookies.visits);
  }
  visits += 1;
  response.cookie('visits', visits);

  return visits;
};
