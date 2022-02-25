import crypto from 'crypto';
import moment from 'moment';

/**
 * Count visits.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @param {Function} next Next route.
 */
const countVisits = (req, res, next) => {
  let visits = 0;

  if (req.cookies.visits) {
    visits = Number(req.cookies.visits);
  }
  visits += 1;

  res.cookie('visits', visits);

  next();
};

/**
 * Count daily unique visits.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @param {Function} next Next route.
 */
const countDailyUniqueVisits = (req, res, next) => {
  let dailyUniqueVisits = 0;

  if (!req.cookies['user-id']
    || (moment().diff(req.cookies['last-visit'], 'days') > 1)) {
    res.cookie('user-id', crypto.randomUUID());
    res.cookie('last-visit', moment().format('YYYY-MM-DD HH:mm:ss'));

    if (req.cookies['daily-unique-visits']) {
      dailyUniqueVisits = Number(req.cookies['daily-unique-visits']);
    }
    dailyUniqueVisits += 1;

    res.cookie('daily-unique-visits', dailyUniqueVisits);
  }

  next();
};

export { countVisits, countDailyUniqueVisits };
