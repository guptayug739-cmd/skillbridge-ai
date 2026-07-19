import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { AlertTriangle, Search, ChevronLeft, ChevronRight, CheckCircle, X } from 'lucide-react';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resolveModal, setResolveModal] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchDisputes = (p = 1) => {
    setIsLoading(true);
    const params: Record<string, any> = { page: p, limit: 15 };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/disputes', { params }).then((res) => {
      setDisputes(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchDisputes(page); }, [page, statusFilter]);

  const handleResolve = async () => {
    if (!resolveModal || !resolution.trim()) return;
    setResolving(true);
    try {
      await api.put(`/admin/disputes/${resolveModal}/resolve`, { resolution });
      setDisputes(disputes.map((d) => d.id === resolveModal ? { ...d, status: 'RESOLVED', resolution } : d));
      setResolveModal(null); setResolution(''); toast.success('Dispute resolved');
    } catch { toast.error('Failed'); } finally { setResolving(false); }
  };

  const STATUS_COLORS: Record<string, string> = { OPEN: 'bg-red-50 text-red-700', UNDER_REVIEW: 'bg-yellow-50 text-yellow-700', RESOLVED: 'bg-green-50 text-green-700', DISMISSED: 'bg-gray-100 text-gray-600' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6"><AlertTriangle className="w-6 h-6 text-brand-600" /><h1 className="text-2xl font-bold text-gray-900">Dispute Management</h1></div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((s) => <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${statusFilter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{s === '' ? 'All' : s.replace(/_/g, ' ')}</button>)}
      </div>
      {isLoading ? <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="card animate-pulse-soft h-24" />)}</div> : (
        <div className="space-y-3">
          {disputes.map((d, i) => (
            <div key={d.id} className="card animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs ${STATUS_COLORS[d.status] || ''}`}>{d.status?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{d.contract?.project?.title || 'Unknown Project'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Raised by: {d.raisedBy?.name} ({d.raisedBy?.email})</p>
                  <p className="text-sm text-gray-600 mt-2">{d.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">{d.description}</p>
                  {d.resolution && <p className="text-sm text-green-700 mt-2 bg-green-50 p-2 rounded-lg">Resolution: {d.resolution}</p>}
                </div>
                {d.status === 'OPEN' && <button onClick={() => { setResolveModal(d.id); setResolution(''); }} className="btn-primary text-xs py-1.5 px-3 flex-shrink-0">Resolve</button>}
              </div>
            </div>
          ))}
          {disputes.length === 0 && <div className="card text-center py-12"><p className="text-gray-500">No disputes found</p></div>}
        </div>
      )}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><span className="text-sm text-gray-500">{page} / {totalPages}</span><button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>}

      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-up relative">
            <button onClick={() => setResolveModal(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resolve Dispute</h2>
            <textarea className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Describe the resolution..." value={resolution} onChange={(e) => setResolution(e.target.value)} />
            <button onClick={handleResolve} disabled={resolving || !resolution.trim()} className="w-full btn-primary py-2.5 mt-4 flex items-center justify-center gap-2">
              {resolving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" /> : <><CheckCircle className="w-4 h-4" /> Resolve</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
