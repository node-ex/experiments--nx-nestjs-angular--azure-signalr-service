import { Module } from '@nestjs/common';
import { SignalrController } from './signalr.controller';

@Module({
  imports: [],
  controllers: [SignalrController],
})
export class SignalrModule {}
