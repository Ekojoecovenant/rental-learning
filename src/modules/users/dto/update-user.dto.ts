/* eslint-disable @typescript-eslint/no-unsafe-call */
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Update User DTO - Defines data structure for updating users
 *
 * PartialType Magic:
 *
 * Instead of rewriting all properties fro CreateUserDto,
 * PartialType makes ALL properties optional automatically.
 *
 * CreateUserDto has:
 * - fullname (required)
 * - email (required)
 * - password (required)
 * - phoneNumber (optional)
 *
 * UpdateUserDto inherits all, but makes them optional:
 * - fullName? (optional)
 * - email? (optional)
 * - password? (optional)
 * - phoneNumber? (optional)
 *
 * Why?
 * When updating, user might only want ot change email, not everything.
 *
 * Example update requests:
 * { "email": "newemail@example.com" }
 * { "password": "NewP@ss123" }
 * { "fullName": "Alpha", 'phoneNumber: "+233012345678" }
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  /**
   * Is Active - For admin use
   *
   * @IsOptional() - Only include if you wnat to activate/deactivate user
   * @IsBoolean() - Must be true or false
   *
   * Use cases:
   * - Admin bans user: { "isActive": false }
   * - Admin unbans user: { "isActive": true }
   * - User verfication: { "isActive": true } after email confirmation
   */
  @IsOptional() 
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Important Notes:
 *
 * 1. Password Handling:
 *    - If user updates password, it will be hashed by @BeforeUpdate() in entity
 *    - If user doesn't send password, existing one stays unchanged
 *
 * 2. All Validations Still Apply:
 *    - If user sends email, it must be valid format
 *    - If user sends password, it must meed strength requirements
 *    - PartialType keeps the validators, just makes fields optional
 *
 * 3. Role Changes:
 *    - Inherited from CreateUserDto (optional)
 *    - Should be restricted to admins only
 *    - We'll handle authorization in the service/controller
 *
 * Example Usage:
 *
 * PATCH /users/123
 * {
 *   "fullName": "Alpha Updated",
 *   "phoneNumber": "+233999999999"
 * }
 * - Only updates those two fields
 * - Email, password, role remain unchanged
 * - All validators still check the fields that ARE sent
 */
