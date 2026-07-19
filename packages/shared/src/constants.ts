export const PLATFORM_FEE = {
  FIRST_PROJECT: 5,
  FUTURE_PROJECTS: 15,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const RATING = {
  MIN: 1,
  MAX: 5,
};

export const AI_SCORE = {
  MIN: 0,
  MAX: 100,
};

export const SKILL_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Graphic Design',
  'Content Writing',
  'Digital Marketing',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cloud Computing',
  'Cybersecurity',
  'Blockchain',
  'Game Development',
  'Video Editing',
  'Animation',
  'Virtual Assistant',
  'Customer Support',
  'Accounting',
  'Legal',
  'Consulting',
] as const;

export const EXPERIENCE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const;

export const PROJECT_DURATIONS = [
  'less_than_1_week',
  '1_2_weeks',
  '2_4_weeks',
  '1_3_months',
  '3_6_months',
  'more_than_6_months',
] as const;

export const COMMISSION_RATES = {
  FREELANCER: 0.15,
  CLIENT_FIRST: 0.05,
  CLIENT_FUTURE: 0.10,
};

export const ESCROW_FEE_PERCENTAGE = 0.02;
export const WITHDRAWAL_FEE_FLAT = 25;
export const MIN_WITHDRAWAL_AMOUNT = 500;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/zip',
  'application/x-rar-compressed',
];

export const REDIS_KEYS = {
  USER_SESSION: (id: string) => `session:user:${id}`,
  PROJECT_CACHE: (id: string) => `project:${id}`,
  FREELANCER_CACHE: (id: string) => `freelancer:${id}`,
  SKILLS_CACHE: 'skills:all',
  RECENT_PROJECTS: 'projects:recent',
  TOP_FREELANCERS: 'freelancers:top',
};
