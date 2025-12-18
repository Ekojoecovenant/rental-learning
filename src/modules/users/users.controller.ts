import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Users Controller - API Endpoints
 *
 * @Controller('users') sets base route: /users
 * All routes in this controller start with /users
 *
 * Think of it as the receptionist:
 * - Receives requests
 * - Validates data (DTOs + ValidationPipe)
 * - Calls appropriate service method
 * - Returns response
 *
 * NO business logic here! Just routing and delegation
 */
@Controller('users')
export class UsersController {
  /**
   * Inject UsersService
   *
   * NestJS sees UsersService in constructor
   * Automatically creates instance and injects it
   *
   * This is Dependency Injection in action!
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users - Create new users (Registration)
   *
   * @Post() decorator makes this handle POST requests
   *
   * @Body() decorator extracts request body
   * - Automatically transforms to CreateUserDto
   * - ValidationPipe validates it
   * - If invalid, returns 400 automatically
   * - If valid, passes to this method
   *
   * @HttpCode(HttpStatus.CREATED) sets response status to 201
   * Default for POST is 201 (Created), but being explicit is good practice
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  /**
   * GET /users - Get all users
   *
   * @Get() with no parameter = base route (/users)
   *
   * Later, we'll add:
   * - Pagination: GET /users?page=1&limit=10
   * - Filtering: GET /users?role=driver
   * - Searching: GET /users?search=john
   *
   * Security Note:
   * This should be protected! Only admins should see all users.
   * We'll add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles('admin')
   * in Phase C when we build guards.
   *
   * Response: 200 OK
   */
  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  /**
   * GET /users/:id - Get single user by ID
   *
   * @Param('id') extracts the :id from URL
   *
   * Automatic validation:
   * If you want to validate UUID format, add validation pipe:
   * @Param('id', ParseUUIDPipe) id: string
   *
   * This will reject invalid UUIDs with 400 Bad Request
   *
   * Response: 200 OK
   * {
   *   "id": "uuid-here",
   *   "fullName": "John Doe",
   *   ...
   * }
   *
   * Or 404 Not Found if user doesn't exist
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  /**
   * PATCH /users/:id - Update user
   *
   * Route: PATCH http://localhost:3000/users/uuid-here
   *
   * @Patch() vs @Put():
   * - PATCH = Partial update (only send fields you want to change)
   * - PUT = Full replacement (send entire object)
   *
   * We use PATCH because UpdateUserDto has all optional fields
   *
   * @Param('id') - Which user to update
   * @Body() - What to update (UpdateUserDto)
   *
   * Request example:
   * PATCH /users/uuid-here
   * {
   *   "phoneNumber": "+233999999999"
   * }
   *
   * Only phoneNumber is updated, everything else stays the same
   *
   * Security Note:
   * Users should only update their own profile
   * Admins can update anyone
   * We'll enforce this with guards later
   *
   * Response: 200 OK
   * {
   *   "id": "uuid-here",
   *   "fullName": "John Doe",
   *   "phoneNumber": "+233888888888", // Updated
   *   ...
   * }
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  /**
   *  DELETE /users/:id - Deactivate user (soft delete)
   *
   * Route: DELETE http://localhost:3000/users/uuid-here
   *
   * @Delete() handles DELETE requests
   * @HttpCode(204) = No Content (successful deletion)
   *
   * Why 204?
   * - Standard for successful DELETE
   * - No response body needed
   * - Client knows it succeeded if they get 204
   *
   * Alternative: Return 200 with message
   * We're doing this (returning message) for clarity
   *
   * Security Note:
   * Users shouldn't delete themselves
   * Only admins should deactivate accounts
   * Add guards in Phase C
   *
   * Response: 200 OK (or 204 if you remove @HttpCode)
   * {
   *   "message": "User alpha@code.com has been deactivated"
   * }
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}

/**
 * Route Summary:
 *
 * POST      /users         - Create user (register)
 * GET       /users         - List all users
 * GET       /users/:id     - Get single user
 * PATCH     /users/:id     - Update user
 * DELETE    /users/:id     - Deactivate user
 *
 *
 * What's Missing (We'll add in Phase C - RBAC):
 *
 * 1. Authentication:
 *    @UseGuards(JwtAuthGuard)
 *    - Ensure user is logged in
 *
 * 2. Authorization:
 *    @Roles('admin')
 *    - Ensure user has required role
 *
 * 3. Self-restriction:
 *    Users can only update their own profile (except admins)
 *
 * 4. Input santization:
 *    Prevent XSS attacks (handled by ValidationPipe + class-validator)
 */
