/**
 * Get date/time now in a nice format.
 * @returns Date/time string.
 */
export default function getDateNow() {
  const now = new Date(Date.now()).toLocaleString('en-GB');
  return now;
}
