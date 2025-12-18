import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Users Service - Business Logic Layer
 *
 * @Injectable() makes this class available for Dependency Injection
 * Other classes can request this service in their constructor
 *
 * Responsibilities:
 * - Validate business rules (e.g., email must be unique)
 * - Interact with databse through repository
 * - Handle errors appropriately
 * - Transform data if needed
 */
@Injectable()
export class UsersService {
  /**
   * Constructor Injection
   *
   * @InjectRepository(User) tells NestJS:
   * "Please give me the TypeORM repository for User entity"
   *
   * Repository = TypeORM's way to interact with database
   * It provides methods like: find(), findOne(), save(), update(), delete()
   *
   * private readonly = This is only accessible in this class, and can't be reassigned
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create New User
   *
   * Steps:
   * 1. Check if email already exists (business rule)
   * 2. Create user entity instance
   * 3. Save to database
   * 4. Return user (without password)
   *
   * @param createUserDto - Validated user data from controller
   * @returns User object (password excluded by select: false)
   * @throws ConflictException if email already exists
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      /**
       * ConflictException = HTTP 409
       * Means: "Request conflicts with current state"
       *
       * Why not BadRequestException?
       * - 400 = Malformed request (validation failed)
       * - 409 = Valid request, but conflicts with existing data
       *
       * Frontend can catch this and show: "Email already registered"
       */
      throw new ConflictException('Email already exists');
    }

    /**
     * Create entity instance
     *
     * userRepository.create() does NOT save to database yet
     * It just creates a User instance with the DTO data
     *
     * Why not just: new User() ?
     * - Repository.create() properly maps DTO to entity
     * - Handles default values
     * - Better for TypeORM internals
     */
    const user = this.userRepository.create(createUserDto);

    /**
     * Save to database
     *
     * This triggers:
     * 1. @BeforeInsert() hook (hashes password)
     * 2. INSERT query to database
     * 3. Returns saved user with generated ID and timestamps
     *
     * Password is hashed automatically by entity lifecycle hook
     */
    return await this.userRepository.save(user);
  }

  /**
   * Find All Users
   *
   * Returns all users in database
   * Password excluded automatically (select: false in entity)
   *
   * Use case: Admin dashboard showing all users
   *
   * Note: For production with many users, add pagination:
   * findAll(page: number, limit: number) {
   *   return this.userRepository.find({
   *     skip: (page - 1) * limit,
   *     take: limit,
   *   })
   * }
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Find User by ID
   *
   * @param id - User UUID
   * @returns User object
   * @throws NotFoundException if user doesn't exist
   *
   * Why throw exception instead of returning null?
   * - Consistent error handling
   * - Frontend knows something went wrong (404)
   * - Better than silent failures
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      /**
       * NotFoundException = HTTP 404
       * Standard response for "resource not found"
       */
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find User by Email
   *
   * Use case: Login - need to find user by email and verify password
   *
   * IMPORTANT: We select password here!
   *
   * select: ['id', 'email', 'password', 'role']
   * - Overrides select: false in entity
   * - We need password to verify during login
   * - Only use this in auth flow
   *
   * @param email - User email
   * @returns User with password included, or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'fullName', 'isActive'],
    });
  }

  /**
   * Update User
   *
   * Steps:
   * 1. Check if user exists
   * 2. if updating email, check it's not taken by someone else
   * 3. Merge updates with existing user
   * 4. Save to database
   *
   * @param id - User ID to update
   * @param updateUserDto - Fields to update (all optional)
   * @returns Updated user
   * @throws NotFoundException if user doesn't exist
   * @throws ConflictException if email already taken
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Find existing user
    const user = await this.findOne(id); // Reuses our findOne method

    // If updating email, check it's not taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    /**
     * Merge updates
     *
     * Object.assign(target, source)
     * - Copies properties from updateUserDto to user
     * - Only updates provided fields
     * - Example: { email: 'new@email.com' } only updates email
     *
     * Alternative (more explicit):
     * if (updateUserDto.fullName) user.fullName = updateUserDto.fullName;
     * if (updateUserDto.email) user.email = updateUserDto.email;
     * etc...
     */
    Object.assign(user, updateUserDto);

    /**
     * Save updates
     *
     * Triggers @BeforeUpdate() hook
     * - If password changed, it gets hashed
     * - If password not in updateUserDto, existing hash stays
     */
    return await this.userRepository.save(user);
  }

  /**
   * Remove User (Soft Delete)
   *
   * We don't actually delete from database
   * Instead, we set isActive = false
   *
   * Why soft delete?
   * - Keep historical data (bookings, payments)
   * - Can reactivate accounts
   * - Audit trail (who deleted when)
   * - Foreign key constraints (other tables reference this user)
   *
   * Hard delete (if needed):
   * await this.userRepository.delete(id);
   *
   * @param id - User ID to deactivate
   * @returns Success message
   */
  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: `User ${user.email} has been deactivated` };
  }

  /**
   * Helper: Check if User is Active
   *
   * Use caseL Before allowing login, check if account is active
   *
   * @param id - User ID
   * @returns boolean
   */
  async isUserActive(id: string): Promise<boolean> {
    const user = await this.findOne(id);
    return user.isActive;
  }
}

/**
 * Error Handling Summary:
 *
 * ConflictException (409):
 * - Email already exists
 * - Trying to create duplicate resource
 *
 * NotFoundException (404):
 * - User ID doesn't exist
 * - Resource not found
 *
 * BadRequestException (404):
 * - Invalid data format (handled by ValidationPipe)
 * - Business rule violation
 *
 * NestJS automatically:
 * - Catches these exceptions
 * - Returns proper HTTP status codes
 * - Formats error response as JSON
 *
 * Example error response:
 * {
 *   "statusCode": 409,
 *   "message": "Email already exists",
 *   "error": "Conflict"
 * }
 */
