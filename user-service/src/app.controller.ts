import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MonitoringService } from './monitoring/monitoring.service';

@Controller()
export class AppController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('/metrics')
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain');
    res.send(await this.monitoringService.getMetrics());
  }
}
