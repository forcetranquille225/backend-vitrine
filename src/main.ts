import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  });

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

  // Protection CSRF via cookies (sauf pour endpoints publics)
  app.use((req, res, next) => {
    // Ignorer CSRF pour le formulaire de contact public
    if (req.path === '/api/contact' && req.method === 'POST') {
      return next();
    }
    
    // Appliquer CSRF pour les autres endpoints
    return csurf({
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
      },
    })(req, res, next);
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
