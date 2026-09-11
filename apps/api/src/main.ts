import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // CORS: trình duyệt chỉ cho web gọi API nếu API cho phép đúng địa chỉ web đó.
  // Trên máy là localhost:3000, trên mạng là link Vercel — đọc từ biến môi
  // trường để khỏi phải sửa code mỗi lần đổi chỗ chạy.
  // Nhiều địa chỉ thì ngăn cách bằng dấu phẩy.
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Mọi DTO đều được validate; field lạ bị loại bỏ thay vì đi thẳng vào DB
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Railway tự đặt PORT, trên máy thì lấy từ .env. Nếu PORT không phải số
  // (ví dụ gõ nhầm "400cos") thì báo lỗi rõ ràng thay vì chạy âm thầm sai cổng.
  const port = Number(process.env.PORT ?? 4000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT không hợp lệ: "${process.env.PORT}" — phải là một con số`);
  }

  await app.listen(port);
  console.log(`API chạy ở cổng ${port}  →  /api/v1/health`);
  console.log(`CORS cho phép: ${corsOrigins.join(', ')}`);
}

bootstrap();
