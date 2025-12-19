import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT Strategy - How to validate JWT tokens
 *
 * This class extends PassportStrategy(Strategy)
 * Strategy = passport-jwt's JWT validation logic
 *
 * Flow:
 * 1. User sends request with token in Authorization header
 * 2. JwtAuthGuard extracts token
 * 3. This strategy validates token signature
 * 4. If valid, calls validate() method
 * 5. Whatever validate() returns becomes req.user
 *
 * Think of it as a security checkpoint:
 * - Guard : "Show me your badge (token)"
 * - Strategy: "Let me verify this badge is real"
 * - validate(): "Badge is real, here's your info"
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    /**
     * super() configures the JWT validation
     * These options tell passport-jwt HOW to validate tokens
     */
    super({
      /**
       * jwtFromRequest: Where to find the token?
       *
       * ExtractJwt.fromAuthHeaderAsBearerToken()
       * Looks for: Authorization: Bearer <token>
       *
       * This is standard practice
       * Token is sent in HTTP header, not URL or body
       *
       * Alternative extractors:
       * - fromUrlQueryParameter('token') -> ?token=xyz
       * - fromBodyField('token') -> { token: 'xyz' }
       * - Custom: (req) => req.cookies.jwt
       */
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      /**
       * ignoreExpiration: Should we accept expired tokens?
       *
       * false: Expired tokens are rejected (SECURE ✅)
       * true = Accept expired tokens (INSECURE ❌)
       *
       * Always false in production
       * Tokens should expire for security
       */
      ignoreExpiration: false,

      /**
       * secretOrKey: The secret used to sign/verify tokens
       *
       * CRITICAL SECURITY:
       * - Must match the secret used to CREATE tokens
       * - If this leaks, anyone can create valid tokens
       * - Use long random string (32+ characters)
       * - Store in .env, NEVER commit to git
       * - Rotate regularly in production
       *
       * How JWT signature works:
       * 1. Server creates token with payload + secret
       * 2. Creates signature: HMAC(header + payoad, secret)
       * 3. Token = header.payload.signature
       * 4. On verification:
       *    - Recalculare signature with same secret
       *    - If matches -> token is valid and unmodified
       *    - If doesn't match -> token was tampered with
       */
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * validate() - Called AFTER token signature is verified
   *
   * At this point we know:
   * ✅ Token signature is valid (not tampered)
   * ✅ Token hasn't expired
   * ✅ Token was signed with our secret
   *
   * @param payload - The decoded JWT payload
   *                  Contains: { sub, email, role, iat, exp }
   * @returns Whatever you return becomes req.user in controllers
   *
   * Why return payload directly?
   * - We trust the token (It's been verified)
   * - No need to query database on every request
   * - Fast and efficient
   *
   * Alternative (more secure but slower):
   * async validate(payload: JwtPayload) {
   *   const user = await this.usersService.findOne(payload.sub);
   *   if (!user || !user.isActive) {
   *     throw new UnauthorizedException();
   *   }
   *   return user; // Full user from DB
   * }
   *
   * Trade-off:
   * - Current approach: Fast, but can't revoke tokens instantly
   * - DB approach: Slower, but can check isActive/banned in real-time
   *
   * For most apps, current approach is fine
   * For banking/high-security: DB approach is better.
   */
  validate(payload: JwtPayload) {
    /**
     * Return the payload as-is
     * This becoes available in controllers as:
     *
     * @Get('profile')
     * @UseGuards(JwtAuthGuard)
     * getProfile(@Request() req) {
     *   console.log(req.user);
     * }
     */
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

/**
 * Security Considerations:
 *
 * 1. Token Storage (Frontend):
 *    ❌ localStorage - Vulnerable to XSS attacks
 *    ✅ httpOnly cookies - More secure
 *    ✅ Memory only - Most secure but lost on refresh
 *
 * 2. Token Expiration:
 *    - Short-lived (15min - 1hr) = More secure
 *    - Long-lived (7 days) = More convenient
 *    - Best: Short access token + long refresh token
 *
 * 3. Secret Management:
 *    - Use environment variables
 *    - Rotate secrets regularly
 *    - Use key management services (AWS KMS, etc.) in production
 *
 * 4. HTTPS:
 *    - ALWAYS use HTTPS in production
 *    - Tokens in headers can be intercepted on HTTP
 *
 * 5. Token Revocation:
 *    - Current approach can't revoke tokens immediately
 *    - Token is valid until expiration
 *    - Solutions: Redis blacklist, DB check, shorter expiration
 */
