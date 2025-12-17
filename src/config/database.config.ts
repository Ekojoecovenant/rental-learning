import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Database Configuration Factory
 *
 * Why a factory function?
 * - ConfigService needs to be injected (it reads .env)
 * - We can't access process.env directly because timing issues
 * - This function runs AFTER ConfigModule loads environment variables
 *
 * @param configService - Injected service that safely reads .env values
 * @returns TypeORM configuration object
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres', // Database type (postgres, mysql, sqlite, etc.)

  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),

  /**
   * entities: Where are your database modules?
   * This pattern finds all *.entity.ts files in your project
   */
  entities: [__dirname + '/../**/*.entity{.ts, .js}'],

  /**
   * synchronize: Auto-create tables from entities
   *
   * IMPORTANT:
   * - TRUE in development (convenient, auto-updates schema)
   * - FALSE in production (dangerous! use migrations instead)
   *
   * Why dangerous in production?
   * - Can accidentally drop columns/tables
   * - No rollback mechanism
   * - Can cause data loss
   */
  synchronize: configService.get<string>('NODE_ENV') !== 'production',

  /**
   * loggin: See SQL queries in console
   * Helpful for learning and debugging
   */
  logging: configService.get<string>('NODE_ENV') === 'development',
});
