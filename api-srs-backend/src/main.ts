import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Instanciação e Configuração Rigorosa do ValidationPipe Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos enviados na requisição que não possuem decorators no DTO.
      forbidNonWhitelisted: true, // Bloqueia a requisição se campos desconhecidos forem injetados (Segurança).
      transform: true, // Converte automaticamente o payload JSON genérico para instâncias reais das classes DTO/Input.
    }),
  );

  // Substituição de '*' pelas origens explícitas do Vite, satisfazendo a regra do credentials: true
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Forçamos o log no terminal para saber exatamente em qual porta o NestJS inicializou
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `🚀 Servidor NestJS operacional em: http://localhost:${port}/graphql`,
  );
}

bootstrap().catch((err) => {
  console.error('Erro fatal ao iniciar a aplicação:', err);
  process.exit(1);
  // eslint-disable-next-line prettier/prettier
});