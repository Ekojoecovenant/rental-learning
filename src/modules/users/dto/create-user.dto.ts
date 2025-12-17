/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * Create User DTO - Defines required data to create a user
 *
 * DTO = Data Transfer Object
 *
 * Purpose:
 * 1. Validation: Ensures incoming data is correct
 * 2. Type Safety: TypeScript knows what properties exist
 * 3. Documentation: Shows what API expects
 *
 * How it works with ValidationPipe:
 * - User sends: { email: "test", password: "123" }
 * - ValidationPipe checks against this DTO
 * - Sees email is invalid, password too short
 * - Returns 400 Bad Request with error details
 * - Your controller never runs if validation fails
 */
export class CreateUserDto {
  /**
   * Full Name
   *
   * Validators:
   * @IsString() - Must be text
   * @IsNotEmpty() - Cannot be empty string or null
   * @MinLength(2) - At least 2 characters
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  fullName: string;

  /**
   * Email
   *
   * Validators:
   * @IsEmail() - Must be valid email format (user@domain.com)
   * @IsNotEmpty() - Required field
   *
   * Example valid: john@example.com
   * Example invalid: john@ @example.com, john
   */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  /**
   * Password
   *
   * Validators:
   * @IsString() - Must be text
   * @IsNotEmpty() - Required
   * @MinLength(8) - Security: At least 8 characters
   * @Matches() - Must contain: uppercase, lowercase, number, special character
   *
   * Why strict password rules?
   * - Prevents weak passwords like "123345678"
   * - Prevents user accounts from brute force attacks
   *
   * Example valid: MyP@ssw0rd
   * Example invalid: password (no uppercase, no number, no special char)
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  /**
   * Phone Number - Optional
   *
   * @IsOptional() - User doesn't have to provide this
   * @IsString() - If provided, must be text
   *
   * Note: If you want format validation (e.g., +233XXXXXXXXX);
   * Add @Matches() with phone regex
   */
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /**
   * Role - Optional (defaults to 'customer' in entity)
   *
   * @IsOptional() - Only admins might set this during user creatio
   * @IsEnum() - Must be one of these exact values
   *
   * Why enum?
   * - Prevents typos ('custmer' instead of 'customer')
   * - Type safety: TypeScript knows exact possible values
   * - Database integrity: Matches entity enum
   *
   * Security Note:
   * In real app, regular users shouldn't be able to set their own role
   * Only admins should. We'll handle this in the service layer.
   */
  @IsOptional()
  @IsEnum(['customer', 'driver', 'manager', 'admin'], {
    message: 'Role must be customer, driver, manager, or admin',
  })
  role?: string;
}

/**
 * How This Works in Practice:
 *
 * 1. User sends POST /users with body:
 * {
 *   "fullName": "Alpha Code",
 *   "email": "alpha@alphashelf.com",
 *   "password": "MyP@ssw0rd",
 *   "phoneNumber": "+233123456789"
 * }
 *
 * 2. ValidationPipe (in main.ts) automatically:
 *    - Transforms plain object to CreateUserDto instance
 *    - Runs all validators (@IsEmail, @MinLength, etc.)
 *    - If valid: passes to controller
 *    - If invalid: returns 400 with detailed errors
 *
 * 3. Controller receives validated, type-safe DTO:
 * @Post()
 * create(@Body() createUserDto: CreateUserDto) {
 *   // createUserDto is guaranteed to be valid here
 *   return this.usersService.create(createUserDto);
 * }
 *
 * No manual validation needed! 🎉
 */
