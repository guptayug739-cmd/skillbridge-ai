export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'FREELANCER' | 'CLIENT' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  freelancer?: FreelancerProfile;
  client?: ClientProfile;
  wallet?: Wallet;
}

export interface FreelancerProfile {
  id: string;
  title?: string;
  bio?: string;
  hourlyRate?: number;
  experienceYears?: number;
  rating?: number;
  aiScore?: number;
  available: boolean;
  completedProjects: number;
  totalEarnings: number;
  location?: string;
  languages: string[];
  user: { name: string; email: string; avatar?: string };
  userSkills: { skill: { id: string; name: string; category: string }; proficiency?: string }[];
  portfolios: Portfolio[];
  resumes: Resume[];
}

export interface ClientProfile {
  id: string;
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  totalProjectsPosted: number;
  totalSpent: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: 'FIXED' | 'HOURLY';
  experienceLevel: string;
  duration: string;
  status: string;
  deadline: string;
  attachments: string[];
  proposalsCount: number;
  client: { id: string; companyName?: string; user: { name: string; avatar?: string } };
  category: { id: string; name: string; icon?: string };
  projectSkills: { skill: { id: string; name: string; category: string } }[];
  createdAt: string;
  isFeatured: boolean;
}

export interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string;
  coverLetter: string;
  bidAmount: number;
  deliveryTime: number;
  status: string;
  aiScore?: number;
  createdAt: string;
  freelancer: { id: string; title?: string; rating?: number; user: { name: string; avatar?: string } };
}

export interface Contract {
  id: string;
  projectId: string;
  freelancerId: string;
  clientId: string;
  status: string;
  budget: number;
  platformFee: number;
  freelancerAmount: number;
  startDate: string;
  endDate?: string;
  project: { title: string; budgetMin: number; budgetMax: number };
  freelancer: { id: string; title?: string; user: { name: string; avatar?: string } };
  client: { id: string; companyName?: string; user: { name: string } };
  milestones: Milestone[];
  escrowAccount?: EscrowAccount;
}

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  dueDate: string;
  completedAt?: string;
}

export interface EscrowAccount {
  id: string;
  amount: number;
  platformFee: number;
  freelancerAmount: number;
  status: string;
}

export interface Message {
  id: string;
  contractId: string;
  senderId: string;
  content: string;
  attachments: string[];
  readAt?: string;
  createdAt: string;
  sender: { id: string; name: string; avatar?: string };
}

export interface Portfolio {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  projectUrl?: string;
  tags: string[];
}

export interface Resume {
  id: string;
  fileUrl: string;
  fileName: string;
  isPrimary: boolean;
}

export interface Wallet {
  id: string;
  balance: number;
  lockedBalance: number;
  totalWithdrawn: number;
  totalEarned: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  description: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface DashboardData {
  activeProjects: number;
  pendingProposals: number;
  totalEarnings: number;
  averageRating: number;
  completedProjects: number;
  postedProjects: number;
  activeHires: number;
  totalSpent: number;
}
