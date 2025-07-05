/**
 * Parses an array of cookie strings into an object of key-value pairs.
 *
 * Each string in the input array is expected to be in the format:
 *
 *     "key=value"
 *
 * If the same cookie name appears multiple times in the array, the
 * **last occurrence takes precedence**, overwriting any previous value.
 * This matches browser behavior and the HTTP cookie standard (RFC 6265),
 * where only one cookie per name is sent in the Cookie header.
 *
 * @param cookieArray - An array of cookie strings from an HTTP API event, or undefined.
 * @returns An object mapping cookie names to their values.
 *
 * @example
 * const cookies = parseCookies([
 *   "foo=123",
 *   "bar=abc",
 *   "foo=456"
 * ]);
 * console.log(cookies);
 * // Output:
 * // { foo: "456", bar: "abc" }
 */
export function parseCookies(
  cookieArray: string[] | undefined,
): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieArray) return cookies;

  for (const cookieStr of cookieArray) {
    const index = cookieStr.indexOf("=");
    if (index === -1) continue;
    const key = cookieStr.substring(0, index);
    const value = cookieStr.substring(index + 1);
    cookies[key] = value;
  }

  return cookies;
}
