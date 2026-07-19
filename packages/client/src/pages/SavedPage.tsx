import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAppSelector } from '../hooks/useAppSelector';
import { Bookmark, Briefcase, Star, MapPin, Clock, DollarSign } from 'lucide-react';

export default function SavedPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isClient = user?.role === 'CLIENT';
  const [savedFreelancers, setSavedFreelancers] = useState<any[]>([]);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'freelancers' | 'projects'>(isClient ? 'freelancers' : 'projects');

  useEffect(() => {
    Promise.all([
      api.get('/saved/freelancers').catch(() => ({ data: { data: [] } })),
      api.get('/saved/projects').catch(() => ({ data: { data: [] } })),
    ]).then(([fRes, pRes]) => {
      setSavedFreelancers(fRes.data.data);
      setSavedProjects(pRes.data.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map((i) => <div key={i} className="card animate-pulse-soft h-48" />)}</div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-bold text-gray-900">Saved</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('freelancers')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'freelancers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Freelancers ({savedFreelancers.length})</button>
        <button onClick={() => setTab('projects')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'projects' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Projects ({savedProjects.length})</button>
      </div>

      {tab === 'freelancers' && (
        savedFreelancers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedFreelancers.map((s: any, i: number) => (
              <Link key={s.id} to={`/freelancers/${s.freelancer?.id}`} className="card hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-700">{s.freelancer?.user?.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.freelancer?.user?.name}</p>
                    <p className="text-xs text-gray-500">{s.freelancer?.title || 'Freelancer'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {s.freelancer?.userSkills?.slice(0, 3).map((us: any) => <span key={us.skill.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{us.skill.name}</span>)}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ₹{s.freelancer?.hourlyRate}/hr</span>
                  {s.freelancer?.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {s.freelancer.rating}</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : <div className="card text-center py-12"><Bookmark className="w-14 h-14 mx-auto mb-3 text-gray-300" /><p className="text-gray-500 font-medium">No saved freelancers</p></div>
      )}

      {tab === 'projects' && (
        savedProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedProjects.map((s: any, i: number) => (
              <Link key={s.id} to={`/projects/${s.project?.id}`} className="card hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-primary text-xs">{s.project?.category?.name || 'General'}</span>
                  <span className={`badge text-xs ${s.project?.status === 'OPEN' ? 'badge-success' : 'badge bg-gray-100 text-gray-600'}`}>{s.project?.status?.replace(/_/g, ' ')}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{s.project?.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{s.project?.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span className="font-bold text-brand-600">₹{s.project?.budgetMin?.toLocaleString()} - ₹{s.project?.budgetMax?.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.project?.duration?.replace(/_/g, ' ')}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : <div className="card text-center py-12"><Bookmark className="w-14 h-14 mx-auto mb-3 text-gray-300" /><p className="text-gray-500 font-medium">No saved projects</p><Link to="/projects" className="text-brand-600 text-sm font-medium hover:text-brand-700 mt-2 inline-block">Browse projects</Link></div>
      )}
    </div>
  );
}
