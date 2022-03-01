  // The reqCookie.visits should be cumulative from multiple users
  let visits = Number(reqCookies.visits);

  // Exit the function if a user visited this site before
  // as indicated by an expires attribute in cookie
  if (reqCookies.expires) {
    return;
  }

  // If num of visits is NaN i.e this is the 1st visitor...
  if (Number.isNaN(visits)) {
    visits = 1;
    response.cookie('visits', 1);
    response.cookie('expires', setExpiryForCookies());
    // else if the resCookie sends back a legit visits number and has no expiry
    // it must be a new & unique visitor
  } else {
    visits += 1;
    response.cookie('visits', visits);
    response.cookie('expires', setExpiryForCookies());
  }
  data.visits = visits;

  //Working version
  // Function that handles visitors count
const trackVisitorsCount = (reqCookies, response, data) => {
  let visits = Number(reqCookies.visits);
  // Checks
  if (!Number.isNaN(visits)) {
    visits += 1;
    response.cookie('visits', visits);
    response.cookie('expires', setExpiryForCookies());
  } else {
    visits = 1;
    response.cookie('visits', 1);
    response.cookie('expires', setExpiryForCookies());
  }
  data.visits = visits;
};