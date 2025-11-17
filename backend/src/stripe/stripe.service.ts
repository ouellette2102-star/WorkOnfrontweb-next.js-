import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentStatus, NotificationType } from '@prisma/client';
import Stripe from 'stripe';

/**
 * Service de gestion Stripe Connect pour WorkOn
 * Gère l'onboarding des Workers et les paiements via destination charges
 */
@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  private readonly PLATFORM_FEE_PERCENT = 0.12; // 12% de frais WorkOn

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY manquant dans .env');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  /**
   * Créer un lien d'onboarding Stripe Connect pour un Worker
   * @param userId - ID Clerk de l'utilisateur
   * @returns URL de l'onboarding Stripe
   */
  async createConnectOnboardingLink(userId: string): Promise<string> {
    // Vérifier que l'utilisateur est un Worker
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { worker: true },
    });

    if (!user || !user.worker) {
      throw new ForbiddenException('Accès réservé aux workers WorkOn');
    }

    let accountId = user.stripeAccountId;

    // Si l'utilisateur n'a pas encore de compte Stripe Connect, le créer
    if (!accountId) {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'CA',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId: user.id,
          clerkId: user.clerkId || '',
          workonRole: 'WORKER',
        },
      });

      accountId = account.id;

      // Sauvegarder l'ID du compte dans la DB
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: accountId },
      });

      this.logger.log(
        `Compte Stripe Connect créé pour user ${userId}: ${accountId}`,
      );
    }

    // Créer le lien d'onboarding
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${frontendUrl}/worker/payments/onboarding/refresh`,
      return_url: `${frontendUrl}/worker/payments/onboarding/return`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  /**
   * Vérifier le statut d'onboarding d'un Worker
   * @param userId - ID de l'utilisateur
   * @returns Statut d'onboarding complet
   */
  async checkOnboardingStatus(userId: string): Promise<{
    onboarded: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirementsNeeded: string[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeAccountId) {
      return {
        onboarded: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsNeeded: ['account_creation'],
      };
    }

    const account = await this.stripe.accounts.retrieve(user.stripeAccountId);

    const onboarded =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted;

    // Mettre à jour le statut dans la DB
    if (onboarded !== user.stripeOnboarded) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeOnboarded: onboarded },
      });
    }

    return {
      onboarded,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      requirementsNeeded: account.requirements?.currently_due || [],
    };
  }

  /**
   * Créer un PaymentIntent pour une mission
   * L'Employer paie la mission, l'argent va directement au Worker moins les frais WorkOn
   * @param userId - ID de l'Employer qui paie
   * @param missionId - ID de la mission
   * @param amountCents - Montant en centimes
   * @returns Client secret pour le frontend
   */
  async createPaymentIntent(
    userId: string,
    missionId: string,
    amountCents: number,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    // Vérifier que l'utilisateur est un Employer
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
    });

    if (!employer) {
      throw new ForbiddenException('Accès réservé aux employeurs WorkOn');
    }

    // Récupérer la mission et vérifier la propriété
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        worker: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!mission) {
      throw new NotFoundException('Mission introuvable');
    }

    if (mission.employerId !== employer.id) {
      throw new ForbiddenException(
        "Vous ne pouvez payer que vos propres missions",
      );
    }

    if (mission.status !== 'COMPLETED') {
      throw new BadRequestException(
        'La mission doit être complétée avant le paiement',
      );
    }

    if (!mission.worker) {
      throw new BadRequestException('Aucun worker assigné à cette mission');
    }

    const workerStripeAccountId = mission.worker.user.stripeAccountId;
    if (!workerStripeAccountId) {
      throw new BadRequestException(
        "Le worker n'a pas complété son onboarding Stripe",
      );
    }

    // Vérifier que le worker est bien onboardé
    const workerOnboardingStatus = await this.checkOnboardingStatus(
      mission.worker.user.id,
    );
    if (!workerOnboardingStatus.onboarded) {
      throw new BadRequestException(
        "Le worker doit compléter son onboarding Stripe avant de recevoir des paiements",
      );
    }

    // Calculer les frais WorkOn (12%)
    const feeCents = Math.ceil(amountCents * this.PLATFORM_FEE_PERCENT);

    // Créer le PaymentIntent avec destination charge
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'cad',
      application_fee_amount: feeCents,
      transfer_data: {
        destination: workerStripeAccountId,
      },
      metadata: {
        missionId: mission.id,
        employerId: employer.id,
        workerId: mission.worker.id,
        workonFee: feeCents.toString(),
      },
      description: `Paiement mission: ${mission.title}`,
    });

    // Créer l'entrée Payment dans la DB
    await this.prisma.payment.create({
      data: {
        missionId: mission.id,
        stripePaymentIntentId: paymentIntent.id,
        amountCents,
        feeCents,
        currency: 'CAD',
        status: PaymentStatus.PENDING,
        stripeAccountId: workerStripeAccountId,
      },
    });

    this.logger.log(
      `PaymentIntent créé: ${paymentIntent.id} pour mission ${missionId}, montant: ${amountCents}¢, frais: ${feeCents}¢`,
    );

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Traiter les webhooks Stripe
   * @param rawBody - Body brut du webhook
   * @param signature - Signature Stripe
   * @returns Event traité
   */
  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET manquant dans .env');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `Erreur de vérification signature webhook: ${err.message}`,
      );
      throw new BadRequestException('Signature webhook invalide');
    }

    // Vérifier l'idempotence
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent && existingEvent.processed) {
      this.logger.log(`Event ${event.id} déjà traité, skip`);
      return event;
    }

    // Sauvegarder l'event
    await this.prisma.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: {
        stripeEventId: event.id,
        eventType: event.type,
        processed: false,
      },
      update: {},
    });

    // Traiter selon le type d'event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        this.logger.log(`Event type non géré: ${event.type}`);
    }

    // Marquer l'event comme traité
    await this.prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true, processedAt: new Date() },
    });

    return event;
  }

  /**
   * Gérer le succès d'un PaymentIntent
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: {
        mission: {
          include: {
            worker: { include: { user: true } },
            employer: { include: { user: true } },
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(
        `Payment introuvable pour PaymentIntent ${paymentIntent.id}`,
      );
      return;
    }

    // Mettre à jour le statut du paiement
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCEEDED },
    });

    // Mettre à jour le statut de la mission (custom field à ajouter si besoin)
    // Pour l'instant, on garde COMPLETED

    this.logger.log(
      `Paiement réussi: ${payment.id}, mission: ${payment.missionId}`,
    );

    // Notifier le Worker
    if (payment.mission.worker) {
      await this.notificationsService.createForMissionStatusChange(
        payment.mission.id,
        'COMPLETED',
        'PAID',
        payment.mission.worker.user.id,
      );
    }

    // Notifier l'Employer
    if (payment.mission.employer) {
      await this.notificationsService.createForMissionStatusChange(
        payment.mission.id,
        'COMPLETED',
        'PAID',
        payment.mission.employer.user.id,
      );
    }
  }

  /**
   * Gérer l'échec d'un PaymentIntent
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    this.logger.error(
      `Paiement échoué: ${payment.id}, raison: ${paymentIntent.last_payment_error?.message}`,
    );
  }

  /**
   * Gérer la mise à jour d'un compte Stripe Connect
   */
  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { stripeAccountId: account.id },
    });

    if (!user) {
      return;
    }

    const onboarded =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted;

    if (onboarded !== user.stripeOnboarded) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { stripeOnboarded: onboarded },
      });

      this.logger.log(
        `Statut onboarding mis à jour pour user ${user.id}: ${onboarded}`,
      );
    }
  }

  /**
   * Récupérer l'historique des paiements d'un Worker
   */
  async getWorkerPayments(userId: string): Promise<any[]> {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      throw new ForbiddenException('Accès réservé aux workers WorkOn');
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        mission: {
          workerId: worker.id,
        },
      },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return payments.map((p: any) => ({
      id: p.id,
      missionId: p.missionId,
      missionTitle: p.mission.title,
      missionCategory: p.mission.category,
      amountCents: p.amountCents,
      feeCents: p.feeCents,
      netAmountCents: p.amountCents - p.feeCents,
      currency: p.currency,
      status: p.status,
      completedAt: p.createdAt, // Utiliser createdAt du payment comme date approximative
      createdAt: p.createdAt,
    }));
  }
}

