/**
 * Types pour le suivi du temps des missions WorkOn
 */

export enum MissionTimeLogType {
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
}

export type MissionTimeLog = {
  id: string;
  missionId: string;
  userId: string;
  type: MissionTimeLogType;
  note?: string;
  timestamp: string;
  createdAt: string;
};

