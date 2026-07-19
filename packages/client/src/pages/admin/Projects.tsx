import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Briefcase, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const STATUS_OPTIONS = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProjects = (p = 1) => {
    setIsLoading(true);
    const params: Record<string, any> = { page: p, limit: 15 };
    if (status) params.status = status;
    api.get('/admin/projects', { params }).then((res) => {
      setProjects(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchProjects(page); }, [page, status]);

  const updateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try { await api.put(`/admin/projects/${id}/status`, { status: newStatus }); setProjects(projects.map((p) => p.id === id ? { ...p, status: newStatus } : p)); toast.success('Status updated'); }
    catch { toast.error('Failed'); } finally { setActionLoading(null); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6"><Briefcase className="w-6 h-6 text-brand-600" /><h1 className="text-2xl font-bold text-gray-900">Project Management</h1></div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => { setStatus(''); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${!status ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>All</button>
        {STATUS_OPTIONS.map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${status === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{s.replace(/_/g, ' ')}</button>)}
      </div>
      {isLoading ? <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="card animate-pulse-soft h-20" />)}</div> : (
        <div className="space-y-3">
          {projects.map((p, i) => (
            <div key={p.id} className="card flex items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/projects/${p.id}`} className="font-semibold text-gray-900 hover:text-brand-600 text-sm flex items-center gap-1">{p.title} <ExternalLink className="w-3 h-3" /></Link>
                  <span className={`badge text-xs ${p.status === 'OPEN' ? 'badge-success' : p.status === 'IN_PROGRESS' ? 'badge-primary' : 'bg-gray-100 text-gray-600'}`}>{p.status?.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs text-gray-500">by {p.client?.companyName || p.client?.user?.name} · {p.category?.name} · {p._count?.proposals || 0} proposals</p>
              </div>
              <select value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)} disabled={actionLoading === p.id} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-40">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          ))}
          {projects.length === 0 && <div className="card text-center py-12"><p className="text-gray-500">No projects found</p></div>}
        </div>
      )}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><span className="text-sm text-gray-500">{page} / {totalPages}</span><button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>}
    </div>
  );
}
