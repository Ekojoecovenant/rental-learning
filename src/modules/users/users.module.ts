import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

/**
 * Users Module - Encapsulates user feature
 *
 * @Module() decorator defines a module
 * Modules organize your application into cohesive blocks
 *
 * Think of it like a department in a company:
 * - Has its own staff (providers)
 * - Has its own interface with customers (controllers)
 * - Uses certain tools (imports)
 * - Can share resources with other departments (exports)
 */
@Module({
  /**
   * imports: Other modules this module depends on
   *
   * TypeOrmModule.forFeature([User])
   * - Registers User entity with TypeORM
   * - Makes User repository available for injection
   * - Without this, @InjectRepository(User) in service would fall
   *
   * Think: "This module needs database access for User table"
   */
  imports: [TypeOrmModule.forFeature([User])],

  /**
   * controllers: API endpoints (routes)
   *
   * NestJs automatically instantiates controllers
   * Maps HTTP routes to controller methods
   *
   * UsersController handles all /users routes
   */
  controllers: [UsersController],

  /**
   * providers: Services that can be injected
   *
   * UsersService is available for:
   * 1. Injection into UsersController (already happening)
   * 2. Injection into other providers in this module
   * 3. Injection into other modules IF we export it (see below)
   *
   * NestJS creates a single instance (singleton pattern)
   * Same instance is shared everywhere it's injected
   */
  providers: [UsersService],

  /**
   * exports: Make this module's providers available to other modules
   *
   * Why export UsersService?
   *
   * Example: AuthModule needs to:
   * - Find user by email (for login)
   * - Validate user exists
   *
   * By exporting UsersService:
   * 1. AuthModule imports UsersModule
   * 2. AuthModule can inject UsersService
   * 3. AuthModule can call usersService.findByEmail()
   *
   * Without export:
   * - UsersService is private to UsersModule only
   * - Other modules can't access it
   *
   * This is encapsulation with controlled access!
   */
  exports: [UsersService],
})
export class UsersModule {}

/**
 * Module Lifecycle:
 *
 * 1. AppModule imports UsersModule
 * 2. NestJS sees TypeOrmModule.forFeature([User])
 *    - Registers User entity
 *    - Creates User repository
 * 3. NestJS creates UsersService instance
 *    - Injects User repository
 * 4. NestJS creates UsersController instance
 *    - Injects UsersService
 * 5. Routes are registered and ready!
 */
