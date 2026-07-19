import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Project } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { CardSkeleton } from '../components/ui/Skeleton';
import { Search, MapPin, Clock, Briefcase, Filter, ArrowRight } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchProjects = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get('/projects', { params });
      setProjects(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    api.get('/users/skills').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProjects(1), 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Projects</h1>
          <p className="text-gray-500 mt-1">Find your next opportunity</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..." className="input-field pl-10 w-full md:w-64" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field pl-10 w-full md:w-48 appearance-none">
              <option value="">All Categories</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map((i) => <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}><CardSkeleton /></div>)}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="card-hover animate-fade-up group hover:scale-[1.02]" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="badge-primary">{project.category?.name || 'General'}</span>
                  {project.isFeatured && <span className="badge-warning">Featured</span>}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600 transition-colors mb-2 line-clamp-1">{project.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.projectSkills?.slice(0, 4).map((ps) => (
                    <span key={ps.skill.id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">{ps.skill.name}</span>
                  ))}
                  {(project.projectSkills?.length || 0) > 4 && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-lg font-medium">+{project.projectSkills!.length - 4}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                  <span className="font-bold text-brand-600">₹{project.budgetMin.toLocaleString()} - ₹{project.budgetMax.toLocaleString()}</span>
                  <span className="flex items-center text-xs"><Clock className="w-3 h-3 mr-1" /> {project.duration?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                  <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {project.proposalsCount} proposals</span>
                  <span className="text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-xs font-medium">
                    View Details <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {projects.length === 0 && !isLoading && (
            <div className="text-center py-20 animate-fade-up">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => fetchProjects(page)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${page === pagination.page ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
