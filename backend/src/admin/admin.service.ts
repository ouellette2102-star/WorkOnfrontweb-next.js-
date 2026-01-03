import { Injectable } from '@nestjs/common';
// import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AdminService {
  // constructor(private readonly paymentsService: PaymentsService) {}

  async reconcilePayments(adminId: string) {
    // TODO: Re-enable after PaymentsModule is fixed
    throw new Error('Payment reconciliation temporarily disabled');
    // return this.paymentsService.reconcilePayments(adminId);
  }
}

