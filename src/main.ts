import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get ConfigService to read environment variables
  const configService = app.get(ConfigService);

  /**
   * Global Validation Pipe
   *
   * What it does:
   * - Automatically validates all incoming data agains DTOs
   * - Transforms plain objects to class instances
   * - Strips properties that aren't in the DTO (whitelist)
   *
   * Example: If DTO expects { email, password } but receives { email, password, hacker: 'data' }
   * - It removes 'hacker' automatically
   * - Validates email format
   * - Ensures password exists
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties sent
      transform: true, // Transform payload to DTO instance
    }),
  );

  app.enableCors({
    origin:
      configService.get<string>('NODE_ENV') === 'production'
        ? 'http://frontend-domain.com' // Production frontend
        : 'http://localhost:5173', // Local dev
    credentials: true, // Allow cookies/auth headers
  });

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📝 Environment: ${configService.get<string>('NODE_ENV')}`);
}

void bootstrap();
