import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    /**
     * ConfigModule - Leads environment variables from .env
     *
     * isGlobal: true means you don't need to import it in every module
     * It's available everywhere automatically
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    /**
     * TypeOrmModule - Database connection
     *
     * for RootAsync: Wait for ConfigModule to load before connecting
     *
     * Why async?
     * 1. ConfigModule needs to load .env first
     * 2. Then we can read DB credentials
     * 3. Then we connect to database
     *
     * useFactory: Function that returns config
     * inject: Dependencies the factory needs (ConfigService)
     */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),

    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
