import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAppSelector } from '../../hooks/useAppSelector';
import toast from 'react-hot-toast';
import { Plus, Briefcase, Clock, DollarSign, Users, ArrowRight, Filter } from 'lucide-react';

const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export default function ManageProjects() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  useEffect(() => {
    if (user?.role !== 'CLIENT') {
      navigate('/dashboard');
      return;
    }

    api.get('/projects', { params: { clientOnly: true } })
      .then((res) => {
        setProjects(res.data.data || []);
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setIsLoading(false));
  }, [user, navigate]);

  const filtered = activeStatus === 'ALL'
    ? projects
    : projects.filter((p) => p.status === activeStatus);

  const statusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'badge-success';
      case 'IN_PROGRESS': return 'badge-primary';
      case 'COMPLETED': return 'badge bg-gray-100 text-gray-600';
      case 'CANCELLED': return 'badge-danger';
      case 'DRAFT': return 'badge-warning';
      default: return 'badge bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => navigate('/projects/new')} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_TABS.map((status) => {
          const count = status === 'ALL' ? projects.length : projects.filter((p) => p.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeStatus === status
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status.replace(/_/g, ' ')}
              <span className={`ml-1.5 text-xs ${activeStatus === status ? 'text-brand-200' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {activeStatus === 'ALL' ? 'No projects yet' : `No ${activeStatus.toLowerCase().replace(/_/g, ' ')} projects`}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeStatus === 'ALL' ? 'Post your first project to start hiring freelancers.' : 'Try a different filter.'}
          </p>
          {activeStatus === 'ALL' && (
            <button onClick={() => navigate('/projects/new')} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" /> Post a Project
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((project, i) => (
            <div key={project.id} className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge text-xs ${statusColor(project.status)}`}>
                      {project.status?.replace(/_/g, ' ')}
                    </span>
                    {project.isFeatured && <span className="badge-warning text-xs">Featured</span>}
                  </div>
                  <Link to={`/projects/${project.id}`} className="text-lg font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-1">
                    {project.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      ₹{project.budgetMin?.toLocaleString()} - ₹{project.budgetMax?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {project.duration?.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {project.proposalsCount || 0} proposals
                    </span>
                  </div>
                  {project.projectSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.projectSkills.slice(0, 5).map((ps: any) => (
                        <span key={ps.skill.id} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                          {ps.skill.name}
                        </span>
                      ))}
                      {project.projectSkills.length > 5 && (
                        <span className="text-xs text-gray-400">+{project.projectSkills.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/projects/${project.id}`}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    View
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  {project.status === 'OPEN' && project.proposalsCount > 0 && (
                    <Link
                      to={`/projects/${project.id}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Review Proposals
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
