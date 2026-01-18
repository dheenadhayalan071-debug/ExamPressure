
import { Profile, Paper, Question, Answer, LeaderboardEntry } from './types';

const STORAGE_KEYS = {
  PROFILE: 'ep_profile',
  PAPERS: 'ep_papers',
  QUESTIONS: 'ep_questions',
  ANSWERS: 'ep_answers',
  GROUPS: 'ep_groups',
  ALL_PROFILES: 'ep_all_profiles'
};

const get = <T,>(key: string): T | null => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const set = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const db = {
  getProfile: (): Profile | null => get<Profile>(STORAGE_KEYS.PROFILE),
  setProfile: (p: Profile) => {
    set(STORAGE_KEYS.PROFILE, p);
    const all = get<Profile[]>(STORAGE_KEYS.ALL_PROFILES) || [];
    const idx = all.findIndex(item => item.id === p.id);
    if (idx > -1) all[idx] = p;
    else all.push(p);
    set(STORAGE_KEYS.ALL_PROFILES, all);
  },
  
  getPapers: (): Paper[] => get<Paper[]>(STORAGE_KEYS.PAPERS) || [],
  savePaper: (p: Paper) => {
    const papers = db.getPapers();
    const existing = papers.findIndex(item => item.id === p.id);
    if (existing > -1) papers[existing] = p;
    else papers.push(p);
    set(STORAGE_KEYS.PAPERS, papers);
  },

  getQuestions: (paperId: string): Question[] => {
    const all = get<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS) || {};
    return all[paperId] || [];
  },
  saveQuestions: (paperId: string, qs: Question[]) => {
    const all = get<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS) || {};
    all[paperId] = qs;
    set(STORAGE_KEYS.QUESTIONS, all);
  },

  getAnswers: (paperId: string): Answer[] => {
    const all = get<Answer[]>(STORAGE_KEYS.ANSWERS) || [];
    return all.filter(a => a.paper_id === paperId);
  },
  saveAnswer: (a: Answer) => {
    const all = get<Answer[]>(STORAGE_KEYS.ANSWERS) || [];
    const idx = all.findIndex(item => item.id === a.id);
    if (idx > -1) all[idx] = a;
    else all.push(a);
    set(STORAGE_KEYS.ANSWERS, all);
  },

  getGroupStats: (groupId: string | null) => {
    if (!groupId) return { totalMembers: 0, attemptedToday: 0 };
    const allProfiles = get<Profile[]>(STORAGE_KEYS.ALL_PROFILES) || [];
    const members = allProfiles.filter(p => p.group_id === groupId);
    const papers = get<Paper[]>(STORAGE_KEYS.PAPERS) || [];
    
    const today = new Date().toLocaleDateString();
    const attemptedToday = members.filter(m => {
      return papers.some(p => p.user_id === m.id && new Date(p.created_at).toLocaleDateString() === today && p.status !== 'available');
    }).length;

    return { totalMembers: members.length, attemptedToday };
  },

  getLeaderboard: (region?: string, level?: string): LeaderboardEntry[] => {
    // Static mock data mixed with current user
    const mockCompetitors: LeaderboardEntry[] = [
      { rank: 1, name: 'Anjali S.', score: 98, streak: 45, region: 'Delhi NCR', level: 'National' },
      { rank: 2, name: 'Rahul K.', score: 96, streak: 32, region: 'Delhi NCR', level: 'National' },
      { rank: 3, name: 'Priya M.', score: 92, streak: 28, region: 'Karnataka', level: 'State' },
      { rank: 4, name: 'Vikram D.', score: 88, streak: 12, region: 'Mumbai', level: 'Board' },
      { rank: 5, name: 'Sneha L.', score: 84, streak: 15, region: 'Karnataka', level: 'State' },
    ];

    const profile = db.getProfile();
    if (profile) {
      mockCompetitors.push({
        rank: 6,
        name: 'You',
        score: profile.target_score - 5,
        streak: profile.streak_count,
        region: profile.region,
        level: profile.target_level,
        is_current_user: true
      });
    }

    return mockCompetitors
      .filter(e => (!region || e.region === region) && (!level || e.level === level))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }
};

export const seedMockData = () => {
  if (db.getProfile()) return;

  const profile: Profile = {
    id: 'u1',
    exam_name: 'UPSC CSE',
    target_score: 95,
    streak_count: 18,
    current_zone: 'Borderline',
    exam_date: new Date(Date.now() + 72 * 24 * 60 * 60 * 1000).toISOString(),
    group_id: 'EXAM-PRO',
    region: 'Delhi NCR',
    target_level: 'National'
  };
  db.setProfile(profile);

  // Sync initial profile to all profiles list
  set(STORAGE_KEYS.ALL_PROFILES, [
    profile,
    { ...profile, id: 'u2', name: 'Member 2', streak_count: 12 },
    { ...profile, id: 'u3', name: 'Member 3', streak_count: 5 }
  ]);

  const papers: Paper[] = [
    {
      id: 'p4',
      user_id: 'u1',
      status: 'available',
      score: 0,
      accuracy: 0,
      difficulty_level: 3,
      is_recovery_mode: false,
      created_at: new Date().toISOString()
    }
  ];
  papers.forEach(p => db.savePaper(p));
};
