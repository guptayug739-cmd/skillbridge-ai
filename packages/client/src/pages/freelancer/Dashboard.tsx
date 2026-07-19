import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAppSelector } from '../../hooks/useAppSelector';
import { StatSkeleton } from '../../components/ui/Skeleton';
import { Briefcase, DollarSign, Star, TrendingUp, MessageSquare, User, ArrowRight, Edit3, FolderOpen, FileText, Wallet, Wrench, BarChart3 } from 'lucide-react';

export default function FreelancerDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [profile, setProfile] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [proposalCount, setProposalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/freelancer/profile'),
      api.get('/contracts'),
      api.get('/proposals/my', { params: { limit: 1 } }),
    ]).then(([profileRes, contractsRes, proposalsRes]) => {
      setProfile(profileRes.data.data);
      setContracts(contractsRes.data.data);
      setProposalCount(proposalsRes.data.pagination?.total || 0);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const stats = [
    { label: 'Active Projects', value: contracts.filter((c: any) => c.status === 'ACTIVE').length, icon: Briefcase, color: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-600' },
    { label: 'Total Earnings', value: `₹${(profile?.totalEarnings || 0).toLocaleString()}`, icon: DollarSign, color: 'from-green-500 to-green-600 bg-green-50 text-green-600' },
    { label: 'Rating', value: profile?.rating ? `${profile.rating}/5` : 'N/A', icon: Star, color: 'from-yellow-500 to-yellow-600 bg-yellow-50 text-yellow-600' },
    { label: 'Proposals', value: proposalCount, icon: FileText, color: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-600' },
  ];

  const quickActions = [
    { label: 'Edit Profile', to: '/profile/edit', icon: Edit3, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { label: 'Portfolio', to: '/portfolio', icon: FolderOpen, color: 'bg-green-50 text-green-600 hover:bg-green-100' },
    { label: 'Skills & Education', to: '/skills-education', icon: Wrench, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
    { label: 'My Proposals', to: '/proposals', icon: FileText, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
    { label: 'Wallet', to: '/wallet', icon: Wallet, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
    { label: 'AI Resume Review', to: '/ai/resume-review', icon: BarChart3, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
  ];

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map((i) => <div key={i} className="animate-pulse-soft"><StatSkeleton /></div>)}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-500">{profile?.title || 'Complete your profile to get started'}</p>
        </div>
        <Link to="/projects" className="btn-primary">
          Browse Projects <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center mb-3 shadow-sm`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, i) => (
            <Link key={action.to} to={action.to} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${action.color} animate-fade-up`} style={{ animationDelay: `${i * 60}ms` }}>
              <action.icon className="w-4 h-4" /> {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Contracts</h2>
            {contracts.filter((c: any) => c.status === 'ACTIVE').length > 0 && (
              <Link to="/chat" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All</Link>
            )}
          </div>
          {contracts.filter((c: any) => c.status === 'ACTIVE').length > 0 ? (
            <div className="space-y-2">
              {contracts.filter((c: any) => c.status === 'ACTIVE').slice(0, 5).map((contract: any, i: number) => (
                <Link key={contract.id} to={`/chat/${contract.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 hover:translate-x-0.5 transition-all" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{contract.project?.title}</p>
                    <p className="text-sm text-gray-500">{contract.client?.companyName || contract.client?.user?.name}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 flex-shrink-0 ml-3">₹{contract.budget?.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No active contracts</p>
              <Link to="/projects" className="text-brand-600 text-sm font-medium hover:text-brand-700">Browse projects</Link>
            </div>
          )}
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
            <Link to="/chat" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Open Chat</Link>
          </div>
          {contracts.length > 0 ? (
            <div className="space-y-2">
              {contracts.slice(0, 5).map((contract: any) => (
                <Link key={contract.id} to={`/chat/${contract.id}`} className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">{contract.client?.companyName || contract.client?.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{contract.project?.title}</p>
                  </div>
                  {contract.unreadCount > 0 && (
                    <span className="bg-brand-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center ml-2 px-1">{contract.unreadCount}</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No messages yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
