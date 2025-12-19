import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Login DTO - Shape of login request
 *
 * Purpose: Validate login credentials
 *
 * Simpler than CreateUserDto because:
 * - Only need email + password
 * - No name, phone, role needed for login
 */
export class LoginDto {
  /**
   * Email
   *
   * Must be valid email format
   * Used to find user in database
   */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  /**
   * Password
   *
   * Plain text password from user
   * We'll compare this with hashed password in database
   *
   * Note: No strength validation here
   * Why? User might have old weak password from before we added rules
   * We only enforce strength on registration/password change
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}
