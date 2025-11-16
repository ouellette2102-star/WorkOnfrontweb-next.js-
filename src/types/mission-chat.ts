/**
 * Types pour le chat des missions WorkOn
 * Alignés avec le backend NestJS + Prisma
 */

export enum MessageSenderRole {
  WORKER = "WORKER",
  EMPLOYER = "EMPLOYER",
}

export type Message = {
  id: string;
  missionId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  content: string;
  createdAt: string;
};

export type CreateMessagePayload = {
  content: string;
};

