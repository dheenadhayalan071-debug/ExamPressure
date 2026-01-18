
export type MistakeCategory = 'Knowledge Gap' | 'Trap' | 'Overthinking' | 'Time Pressure' | 'Blind Guess';
export type PaperStatus = 'locked' | 'available' | 'submitted' | 'analyzed';
export type Zone = 'Safe' | 'Borderline' | 'Danger';

export interface Profile {
  id: string;
  exam_name: string;
  target_score: number;
  streak_count: number;
  current_zone: Zone;
  exam_date: string;
  group_id: string | null;
  region: string;
  target_level: 'National' | 'State' | 'Board';
}

export interface StudyGroup {
  id: string;
  code: string;
  created_at: string;
}

export interface Paper {
  id: string;
  user_id: string;
  status: PaperStatus;
  score: number;
  accuracy: number;
  difficulty_level: number;
  is_recovery_mode: boolean;
  created_at: string;
  submitted_at?: string;
  unlocked_at?: string; // Analysis unlock time
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  is_verified_source: boolean;
  trap_explanation: string;
  section: string; // Added for syllabus categorization
}

export interface Answer {
  id: string;
  paper_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent: number; // in seconds
  mistake_category?: MistakeCategory;
}

export interface StudyMaterial {
  topic: string;
  summary: string;
  priority: 'High' | 'Medium';
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  streak: number;
  region: string;
  level: string;
  is_current_user?: boolean;
}
