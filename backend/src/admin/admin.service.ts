import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AdminService {
  constructor(private readonly paymentsService: PaymentsService) {}

  async reconcilePayments(adminId: string) {
    return this.paymentsService.reconcilePayments(adminId);
  }
}

