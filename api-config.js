/** Private edition: the application uses the repository's configured token. */
export const PRIVATE_CREDENTIAL_EDITION = true;

// The owner supplies this application's Cesium ion browser token here.
// No credential form, browser-storage lookup or shared-token endpoint is used.
export const CESIUM_ION_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMjU4OWRkNS1kOTM5LTRkYzAtOWEzNS04MjhhOGU0NmJmZTAiLCJpZCI6MzkxMzE4LCJpYXQiOjE3NzEzMjEzMTZ9.HjzuElbTRDAeVG_zqom2QELNM0LgaoGdkonHGvA8xH4";

export function getCesiumToken() {
  return typeof CESIUM_ION_TOKEN === 'string' ? CESIUM_ION_TOKEN.trim() : '';
}

export function validateCesiumToken(value) {
  const token = typeof value === 'string' ? value.trim() : '';
  if (!token) return 'empty';
  if (token.length > 8192 || token.length < 20 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return 'format';
  return '';
}
