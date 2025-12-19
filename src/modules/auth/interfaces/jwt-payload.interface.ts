/**
 * JWT Payload Interface
 *
 * Defines what information we store INSIDE the JWT token
 *
 * JWT Structure:
 * header.payload.signature
 *
 * The payload is the middle part (base64 encoded)
 * Anyone can decode and read it  (it's NOT encrypted)
 * But they can't MODIFY it without invalidating the signature
 *
 * What to include:
 * ✅ User ID (to identify who they are)
 * ✅ Email (convenient for display)
 * ✅ Role (for authorization checks)
 * ❌ Password (NEVER! Tokens can be decoded)
 * ❌ Sensitive data (credit card, etc.)
 *
 * Keep it minimal:
 * - Smaller token = faster transmission
 * - Less data = less exposure if token leaks
 */
export interface JwtPayload {
  /**
   * User ID - Primary identifier
   * Used to fetch full user data if needed
   */
  sub: string; // "sub" is JWT standard for "subject" (user ID)

  /**
   * Email - Convenient for display
   * Don't use this for critical operations, always verify with DB
   */
  email: string;

  /**
   * Role - For authorization
   * Check this in guards to allow/deny accesss
   */
  role: string;

  /**
   * Issued At (iat) and Expiration (exp) are added automatically by JWT library
   * iat: When token was created
   * exp: When token expires
   */
}
