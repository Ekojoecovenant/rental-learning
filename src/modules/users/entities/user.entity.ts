import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * User Entity - Represents the 'users' table in database
 *
 * @Entity() decorator tells TypeORM:
 * "This class maps to a database table"
 *
 * TypeORM will create a table called 'users' with these columns
 */
@Entity('users')
export class User {
  /**
   * Primary Key - Unique identifier
   *
   * @PrimaryGeneratedColumn('uuid')
   * - Auto-generates unique ID
   * - Uses UUID format (e.g., '123e4567-e89b-12d3-a456-426614174000')
   * - Better than auo-increment for distributed systems
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Full Name
   *
   * @Column() creates a database column
   * No options = defaults to VARCHAR(255)
   */
  @Column()
  fullName: string;

  /**
   * Email - Must be unique
   *
   * unique: true - Database enforces no duplicate emails
   * This is faster than checking manually in code
   */
  @Column({ unique: true })
  email: string;

  /**
   * Password - Hashed, never sent in responses
   *
   * select: false means:
   * - When you query users, password is NOT included by default
   * - Must explicitly request it: find({ select: ['password'] })
   * - Security: Prevents accidentally sending passwords to frontend
   */
  @Column({ select: false })
  password: string;

  /**
   * Phone Number - Optional
   *
   * nullable: true = This column can be NULL in database
   * User doesn't have to provide phone on registration
   */
  @Column({ nullable: true })
  phoneNumber?: string;

  /**
   * User Role - For RBAC (Role-Based Access Control)
   *
   * type: 'enum' = Only these values allowed
   * default: 'customer' = New users are customers by default
   *
   * Roles:
   * - customer: Can book vehicles
   * - driver: Can see assigned rentals
   * - manager: Can manage vehicles
   * - admin: Full access
   */
  @Column({
    type: 'enum',
    enum: ['customer', 'driver', 'manager', 'admin'],
    default: 'customer',
  })
  role: string;

  /**
   * Account Status
   *
   * default: true = New accounts are active
   *
   * Use cases:
   * - Ban problematic users (isActive = false)
   * - Require email verification before activation
   * - Soft delete (deactivate instead of deleting)
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Created At - Auto-set when row is created
   *
   * @CreateDateColumn() automatically sets timestamp on INSERT
   * You never set this manually
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Updated At - Auto-updated on every change
   *
   * @UpdateDateColumn() automatically updates on every UPDATE
   * Useful for tracking "last modified" time
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Lifecycle Hook: Before Insert
   *
   * @BeforeInsert() runs BEFORE saving new user to database
   *
   * User case: Hash password before storing
   *
   * Why here and not in service?
   * - Ensures password is ALWAYS hashed, even if saved differently
   * - Single responsibility: Entity manages its own data integrity
   */
  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  /**
   * Helper Method: Validate Password
   *
   * Not a column, just a utility function
   * Used during login to check if password matches
   *
   * @param plainPassword - password user typed during login
   * @returns boolean - Does it match the hashed password?
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}
