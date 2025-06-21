import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sécurité HTTP
  app.use(helmet());

  // Limitation brute force
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Trop de requêtes. Réessayez plus tard.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Cookies requis pour CSRF
  app.use(cookieParser());

  // Protection CSRF via cookies
  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: false, // true en production HTTPS
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
