import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCompanies = (p = 1) => {
    setIsLoading(true);
    const params: Record<string, any> = { page: p, limit: 15 };
    if (filter) params.verificationStatus = filter;
    api.get('/admin/companies', { params }).then((res) => {
      setCompanies(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchCompanies(page); }, [page, filter]);

  const verifyCompany = async (id: string) => {
    setActionLoading(id);
    try { await api.put(`/admin/companies/${id}/verify`); setCompanies(companies.map((c) => c.id === id ? { ...c, verificationStatus: 'VERIFIED' } : c)); toast.success('Company verified'); }
    catch { toast.error('Failed'); } finally { setActionLoading(null); }
  };

  const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-yellow-50 text-yellow-700', VERIFIED: 'bg-green-50 text-green-700', REJECTED: 'bg-red-50 text-red-700' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6"><Shield className="w-6 h-6 text-brand-600" /><h1 className="text-2xl font-bold text-gray-900">Company Verification</h1></div>
      <div className="flex items-center gap-2 mb-6">
        {['', 'PENDING', 'VERIFIED', 'REJECTED'].map((s) => <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{s === '' ? 'All' : s}</button>)}
      </div>
      {isLoading ? <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="card animate-pulse-soft h-20" />)}</div> : (
        <div className="space-y-3">
          {companies.map((c, i) => (
            <div key={c.id} className="card flex items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-700">{c.companyName?.charAt(0) || c.user?.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{c.companyName || 'Unnamed Company'}</p>
                  <p className="text-xs text-gray-500">{c.user?.name} · {c.user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-xs ${STATUS_COLORS[c.verificationStatus] || ''}`}>{c.verificationStatus}</span>
                    {c.industry && <span className="text-xs text-gray-400">· {c.industry}</span>}
                    {c.companySize && <span className="text-xs text-gray-400">· {c.companySize}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {c.verificationDocuments?.length > 0 && <a href={c.verificationDocuments[0]} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                {c.verificationStatus === 'PENDING' && <button onClick={() => verifyCompany(c.id)} disabled={actionLoading === c.id} className="btn-primary text-xs py-1.5 px-3">Verify</button>}
              </div>
            </div>
          ))}
          {companies.length === 0 && <div className="card text-center py-12"><p className="text-gray-500">No companies found</p></div>}
        </div>
      )}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><span className="text-sm text-gray-500">{page} / {totalPages}</span><button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>}
    </div>
  );
}
