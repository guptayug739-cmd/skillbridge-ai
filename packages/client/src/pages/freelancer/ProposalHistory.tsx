import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, ArrowUpRight, Filter } from 'lucide-react';

interface Proposal {
  id: string; coverLetter: string; bidAmount: number; deliveryTime: number;
  status: string; createdAt: string; attachments?: string[];
  project: { id: string; title: string; status: string; budgetMin?: number; budgetMax?: number; budgetType?: string; duration?: string; deadline?: string; };
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  PENDING: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending' },
  ACCEPTED: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Accepted' },
  REJECTED: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
  SHORTLISTED: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye, label: 'Shortlisted' },
  WITHDRAWN: { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle, label: 'Withdrawn' },
};

export default function ProposalHistory() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, any> = { page, limit: 10 };
    if (filter !== 'ALL') params.status = filter;
    api.get('/proposals/my', { params }).then((res) => {
      setProposals(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setIsLoading(false);
    }).catch(() => { setIsLoading(false); toast.error('Failed to load proposals'); });
  }, [filter, page]);

  const handleWithdraw = async (id: string) => {
    if (!confirm('Withdraw this proposal?')) return;
    try {
      await api.delete(`/proposals/${id}`);
      setProposals(proposals.map((p) => p.id === id ? { ...p, status: 'WITHDRAWN' } : p));
      toast.success('Proposal withdrawn');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to withdraw'); }
  };

  const tabs = ['ALL', 'PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="card animate-pulse-soft h-32" />)}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Proposals</h1>

      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" />
        {tabs.map((t) => (
          <button key={t} onClick={() => { setFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${filter === t ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {t === 'ALL' ? 'All' : STATUS_CONFIG[t]?.label || t}
          </button>
        ))}
      </div>

      {proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((p, i) => {
            const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
            return (
              <div key={p.id} className="card hover:shadow-md transition-all animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Link to={`/projects/${p.project.id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors flex items-center gap-1">
                        {p.project.title} <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                        <config.icon className="w-3 h-3" /> {config.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>₹{p.bidAmount.toLocaleString()} bid</span>
                      <span>{p.deliveryTime} days</span>
                      <span>Applied {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.coverLetter}</p>
                  </div>
                  {p.status === 'PENDING' && (
                    <button onClick={() => handleWithdraw(p.id)} className="text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">Withdraw</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium mb-2">No proposals found</p>
          <Link to="/projects" className="text-brand-600 text-sm font-medium hover:text-brand-700">Browse projects and apply</Link>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
