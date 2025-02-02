// monitoring/monitoring.module.ts
import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Module({
  providers: [MonitoringService],
  exports: [MonitoringService],  // Make sure it's exported
})
export class MonitoringModule {}
