/**
 * Decodes JWT token payload safely in the browser environment.
 */
export function decodeTokenPayload(token?: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired.
 * Includes a small 5-second buffer to prevent race conditions with backend verification.
 */
export function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) return true;

  // exp is in seconds; Date.now() is in milliseconds.
  // We buffer by 5 seconds so near-expired tokens are considered expired immediately.
  const expiryMs = payload.exp * 1000;
  return Date.now() >= expiryMs - 5000;
}

/**
 * Returns remaining milliseconds until token expiration.
 * Returns 0 if already expired or invalid.
 */
export function getTokenRemainingMs(token?: string | null): number {
  if (!token) return 0;
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) return 0;

  const expiryMs = payload.exp * 1000;
  const remaining = expiryMs - Date.now();
  return remaining > 0 ? remaining : 0;
}
