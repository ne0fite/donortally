import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3333',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(require('express').json({ limit: '500kb' }));
  app.setGlobalPrefix('api');

  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(require('express').static(publicDir));
    app.use((req: any, res: any, next: any) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(publicDir, 'index.html'));
      } else {
        next();
      }
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
