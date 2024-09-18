import { Module } from '@nestjs/common';
import { SignalrController } from './signalr.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      // No need to import in other modules
      isGlobal: true,
      expandVariables: true,
      // cache: true,
    }),
  ],
  controllers: [SignalrController],
})
export class SignalrModule {}
