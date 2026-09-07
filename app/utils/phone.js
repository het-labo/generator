// Puts a Belgian phone number into the house format: +32 followed by the
// number without its trunk zero, grouped the way the numbering plan groups it.
//
// Shared by the signature and the business card so a person's number reads the
// same everywhere, whichever way they happened to type it in.
//
// The grouping depends on what kind of number it is, and Belgium tells those
// apart by length rather than by prefix alone:
//
//   mobile              0470 12 34 56   -> +32 470 12 34 56   (3-2-2-2)
//   two-digit area      03 296 05 38    -> +32 3 296 05 38    (1-3-2-2)
//   three-digit area    014 49 04 16    -> +32 14 49 04 16    (2-2-2-2)
//
// 04 is both the Liège area code and the start of every mobile number, so
// those two can only be separated by counting digits.

/** Area codes written with a single digit after the country code. */
const TWO_DIGIT_AREAS = new Set(['2', '3', '4', '9'])

const group = (digits, sizes) => {
  const parts = []
  let at = 0
  for (const size of sizes) {
    parts.push(digits.slice(at, at + size))
    at += size
  }
  return parts.join(' ')
}

/**
 * @param phone whatever the user typed
 * @returns the number in house format, or the input untouched when it is not
 *          a Belgian number this knows how to group — better an unstyled
 *          number than a mangled one.
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''

  let digits = String(phone).replace(/\D/g, '')

  // Strip the country code however it was written: +32, 0032 or a bare 32.
  // A bare leading 32 is only a country code if what follows is long enough to
  // be a whole number on its own, otherwise it is an area code.
  if (digits.startsWith('0032')) digits = digits.slice(4)
  else if (digits.startsWith('32') && digits.length >= 10) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  else return phone

  if (digits.startsWith('0')) return phone

  if (digits.length === 9 && digits.startsWith('4')) return `+32 ${group(digits, [3, 2, 2, 2])}`
  if (digits.length === 8) {
    return TWO_DIGIT_AREAS.has(digits[0])
      ? `+32 ${group(digits, [1, 3, 2, 2])}`
      : `+32 ${group(digits, [2, 2, 2, 2])}`
  }
  return phone
}
