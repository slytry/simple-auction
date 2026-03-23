export const ADMIN_COOKIE_NAME = "auction_admin_auth";

export function isValidAdminPassword(password) {
  return Boolean(process.env.ADMIN_PASSWORD) && password === process.env.ADMIN_PASSWORD;
}
