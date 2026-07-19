import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAppSelector } from '../../hooks/useAppSelector';
import { StatSkeleton } from '../../components/ui/Skeleton';
import { Briefcase, DollarSign, Star, Users, Plus, Clock, FileText, ArrowRight } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/projects', { params: { clientOnly: true } }),
      api.get('/contracts'),
    ]).then(([meRes, projectsRes, contractsRes]) => {
      setClient(meRes.data.data.client);
      setProjects(projectsRes.data.data || []);
      setContracts(contractsRes.data.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const stats = [
    { label: 'Posted Projects', value: projects.length, icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Hires', value: contracts.filter((c: any) => c.status === 'ACTIVE').length, icon: Users, color: 'from-green-500 to-green-600' },
    { label: 'Total Spent', value: `₹${(client?.totalSpent || 0).toLocaleString()}`, icon: DollarSign, color: 'from-yellow-500 to-yellow-600' },
    { label: 'Pending Proposals', value: projects.reduce((sum: number, p: any) => sum + (p.proposalsCount || 0), 0), icon: FileText, color: 'from-purple-500 to-purple-600' },
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
          <p className="text-gray-500">{client?.companyName || 'Complete your company profile'}</p>
        </div>
        <button onClick={() => navigate('/projects/new')} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Post a Project
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
            {projects.length > 0 && (
              <Link to="/projects/manage" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All</Link>
            )}
          </div>
          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project: any) => (
                <div key={project.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <Link to={`/projects/${project.id}`} className="font-medium text-gray-900 hover:text-brand-600 transition-colors truncate block">{project.title}</Link>
                    <p className="text-sm text-gray-500">{project.proposalsCount} proposals</p>
                  </div>
                  <span className={`badge text-xs flex-shrink-0 ml-3 ${project.status === 'OPEN' ? 'badge-success' : project.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-warning'}`}>
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Plus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No projects yet</p>
              <button onClick={() => navigate('/projects/new')} className="text-brand-600 text-sm font-medium hover:text-brand-700">Post your first project</button>
            </div>
          )}
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Contracts</h2>
            <Link to="/chat" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Messages</Link>
          </div>
          {contracts.filter((c: any) => c.status === 'ACTIVE').length > 0 ? (
            <div className="space-y-2">
              {contracts.filter((c: any) => c.status === 'ACTIVE').slice(0, 5).map((contract: any) => (
                <Link key={contract.id} to={`/chat/${contract.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{contract.project?.title}</p>
                    <p className="text-sm text-gray-500">{contract.freelancer?.user?.name}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 flex-shrink-0 ml-3">₹{contract.budget?.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No active contracts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
