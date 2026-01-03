/**
 * Types pour les profils utilisateurs WorkOn
 * Types frontend decouples de Prisma, alignes avec les reponses API backend
 */

export type PrimaryRole = "WORKER" | "EMPLOYER" | "BOTH";

export interface UserProfile {
  id: string;
  name: string | null;
  city: string | null;
  role: string | null;
  bio: string | null;
  primaryRole: PrimaryRole | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  hourlyRate: number;
  completedMissions: number;
  availability: WorkerAvailability | null;
  portfolio: PortfolioItem[] | null;
  skills: WorkerSkill[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkerAvailability {
  instantToggle?: boolean;
  schedules?: WorkerSchedule[];
}

export interface WorkerSchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface PortfolioItem {
  url: string;
  type: string;
  caption?: string;
}

export interface WorkerSkill {
  id: string;
  skillId: string;
  verified: boolean;
  skill: Skill;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
}

export interface SkillCategory {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    id: string;
    profile: UserProfile | null;
  };
}

export interface User {
  id: string;
  clerkId: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile | null;
  workerProfile: WorkerProfile | null;
}

export interface UserWithFullProfile extends User {
  reviewsReceived: Review[];
}

export interface PublicProfileResponse {
  user: UserWithFullProfile;
}

