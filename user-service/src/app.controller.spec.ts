import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { MonitoringService } from './monitoring/monitoring.service';
import { Response } from 'express';

describe('AppController', () => {
  let appController: AppController;
  let monitoringService: MonitoringService;

  beforeEach(async () => {
    const monitoringServiceMock = {
      getMetrics: jest.fn().mockResolvedValue('mocked metrics'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: MonitoringService, useValue: monitoringServiceMock }],
    }).compile();

    appController = module.get<AppController>(AppController);
    monitoringService = module.get<MonitoringService>(MonitoringService);
  });

  it('should return metrics', async () => {
    const res = {
      set: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    await appController.getMetrics(res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(res.send).toHaveBeenCalledWith('mocked metrics');
    expect(monitoringService.getMetrics).toHaveBeenCalled();
  });
});
