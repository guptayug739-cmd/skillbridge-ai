import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminPayments() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = (p = 1) => {
    setIsLoading(true);
    const params: Record<string, any> = { page: p, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/payments', { params }).then((res) => {
      setTransactions(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchTransactions(page); }, [page, statusFilter]);

  const TYPE_COLORS: Record<string, string> = { PAYMENT: 'text-green-600 bg-green-50', RELEASE: 'text-blue-600 bg-blue-50', WITHDRAWAL: 'text-orange-600 bg-orange-50' };
  const STATUS_COLORS: Record<string, string> = { COMPLETED: 'badge-success', PENDING: 'badge-warning', FAILED: 'badge-danger' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6"><DollarSign className="w-6 h-6 text-brand-600" /><h1 className="text-2xl font-bold text-gray-900">Payments & Transactions</h1></div>
      <div className="flex items-center gap-2 mb-6">
        {['', 'COMPLETED', 'PENDING', 'FAILED'].map((s) => <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{s === '' ? 'All' : s}</button>)}
      </div>
      {isLoading ? <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="card animate-pulse-soft h-16" />)}</div> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">User</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Type</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Fee</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3"><p className="text-sm font-medium text-gray-900">{t.user?.name}</p><p className="text-xs text-gray-500">{t.user?.email}</p></td>
                  <td className="px-6 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[t.type] || ''}`}>{t.type}</span></td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">₹{t.amount?.toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">₹{t.fee?.toLocaleString()}</td>
                  <td className="px-6 py-3"><span className={`badge text-xs ${STATUS_COLORS[t.status] || ''}`}>{t.status}</span></td>
                  <td className="px-6 py-3 text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No transactions found</p></div>}
        </div>
      )}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><span className="text-sm text-gray-500">{page} / {totalPages}</span><button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>}
    </div>
  );
}
