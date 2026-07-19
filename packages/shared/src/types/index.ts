// ==================== ENUMS ====================
export enum UserRole {
  FREELANCER = 'FREELANCER',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum ProposalStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  SHORTLISTED = 'SHORTLISTED',
}

export enum ContractStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EscrowStatus {
  FUNDED = 'FUNDED',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
  RELEASE = 'RELEASE',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum NotificationType {
  PROPOSAL_RECEIVED = 'PROPOSAL_RECEIVED',
  PROPOSAL_ACCEPTED = 'PROPOSAL_ACCEPTED',
  PROPOSAL_REJECTED = 'PROPOSAL_REJECTED',
  PROJECT_STARTED = 'PROJECT_STARTED',
  MILESTONE_COMPLETED = 'MILESTONE_COMPLETED',
  MILESTONE_APPROVED = 'MILESTONE_APPROVED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_RELEASED = 'PAYMENT_RELEASED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  VERIFICATION_COMPLETE = 'VERIFICATION_COMPLETE',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// ==================== USER ====================
export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  googleId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFreelancer {
  id: string;
  userId: string;
  title?: string;
  bio?: string;
  hourlyRate?: number;
  experienceYears?: number;
  available: boolean;
  aiScore?: number;
  completedProjects: number;
  totalEarnings: number;
  rating?: number;
  resumeUrl?: string;
  location?: string;
  languages: string[];
  socialLinks: Record<string, string>;
}

export interface IClient {
  id: string;
  userId: string;
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  companyDescription?: string;
  verificationStatus: VerificationStatus;
  verificationDocuments?: string[];
  totalProjectsPosted: number;
  totalSpent: number;
  rating?: number;
}

export interface IAdmin {
  id: string;
  userId: string;
  permissions: string[];
}

// ==================== PROJECT ====================
export interface IProject {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetMin: number;
  budgetMax: number;
  budgetType: 'FIXED' | 'HOURLY';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  duration: string;
  status: ProjectStatus;
  attachments: string[];
  proposalsCount: number;
  hiredFreelancerId?: string;
  deadline: Date;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== PROPOSAL ====================
export interface IProposal {
  id: string;
  projectId: string;
  freelancerId: string;
  coverLetter: string;
  bidAmount: number;
  deliveryTime: number;
  attachments: string[];
  status: ProposalStatus;
  aiScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CONTRACT ====================
export interface IContract {
  id: string;
  projectId: string;
  freelancerId: string;
  clientId: string;
  status: ContractStatus;
  budget: number;
  platformFee: number;
  freelancerAmount: number;
  startDate: Date;
  endDate?: Date;
  terms: string;
}

// ==================== MESSAGE ====================
export interface IMessage {
  id: string;
  contractId: string;
  senderId: string;
  content: string;
  attachments: string[];
  readAt?: Date;
  createdAt: Date;
}

// ==================== PAYMENT ====================
export interface IEscrowAccount {
  id: string;
  contractId: string;
  amount: number;
  platformFee: number;
  freelancerAmount: number;
  status: EscrowStatus;
  fundedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
}

export interface ITransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  fee: number;
  netAmount: number;
  status: PaymentStatus;
  referenceType?: string;
  referenceId?: string;
  description: string;
  createdAt: Date;
}

export interface IWallet {
  id: string;
  userId: string;
  balance: number;
  lockedBalance: number;
  totalWithdrawn: number;
  totalEarned: number;
}

// ==================== AI ====================
export interface IAIResumeAnalysis {
  id: string;
  freelancerId: string;
  skills: string[];
  experience: string;
  education: string;
  overallScore: number;
  recommendations: string[];
}

export interface IAIFreelancerRecommendation {
  projectId: string;
  freelancerId: string;
  score: number;
  matchReason: string;
  skillMatch: number;
  experienceMatch: number;
  ratingScore: number;
}

// ==================== REVIEW ====================
export interface IReview {
  id: string;
  contractId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  content: string;
  createdAt: Date;
}

// ==================== DISPUTE ====================
export interface IDispute {
  id: string;
  contractId: string;
  raisedById: string;
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolvedById?: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// ==================== NOTIFICATION ====================
export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// ==================== API RESPONSES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken: string;
}

// ==================== DASHBOARD ====================
export interface FreelancerDashboard {
  activeProjects: number;
  pendingProposals: number;
  totalEarnings: number;
  averageRating: number;
  completedProjects: number;
  recentProjects: IProject[];
  upcomingDeadlines: { project: IProject; contract: IContract }[];
  earningsChart: { month: string; amount: number }[];
}

export interface ClientDashboard {
  postedProjects: number;
  activeHires: number;
  totalSpent: number;
  pendingProposals: number;
  recentProjects: IProject[];
  spendingChart: { month: string; amount: number }[];
}

export interface AdminDashboard {
  totalUsers: number;
  totalFreelancers: number;
  totalClients: number;
  totalProjects: number;
  totalRevenue: number;
  pendingVerifications: number;
  activeContracts: number;
  openDisputes: number;
  revenueChart: { month: string; revenue: number }[];
  userGrowthChart: { month: string; users: number }[];
}
