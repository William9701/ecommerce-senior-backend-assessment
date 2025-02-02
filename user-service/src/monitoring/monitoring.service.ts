import { Injectable } from '@nestjs/common';
import { Counter, register } from 'prom-client';

@Injectable()
export class MonitoringService {
  private userRegistrations = new Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
  });

  private logins = new Counter({
    name: 'user_logins_total',
    help: 'Total number of logins',
  });

  increaseRegistrationCount() {
    this.userRegistrations.inc();
  }

  increaseLoginCount() {
    this.logins.inc();
  }

  async getMetrics() {
    return register.metrics();
  }
}
