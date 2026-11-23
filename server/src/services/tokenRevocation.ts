/**
 * A login token signed before the user's last password change no longer counts,
 * so changing or resetting a password signs out every other device.
 * JWT "iat" is in whole seconds, hence the one-second allowance for a token issued right after the change.
 */
export const isTokenRevoked = (issuedAtSeconds: unknown, passwordChangedAt: Date | null | undefined) =>
  !!passwordChangedAt &&
  typeof issuedAtSeconds === "number" &&
  issuedAtSeconds * 1000 < passwordChangedAt.getTime() - 1000;
