import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = (p = 1) => {
    setIsLoading(true);
    api.get('/admin/audit-logs', { params: { page: p, limit: 30 } }).then((res) => {
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6"><ClipboardList className="w-6 h-6 text-brand-600" /><h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1></div>
      {isLoading ? <div className="space-y-2">{[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="card animate-pulse-soft h-14" />)}</div> : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={log.id} className="card flex items-center gap-4 animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{log.action} <span className="text-gray-400">on</span> {log.entityType}</p>
                <p className="text-xs text-gray-500">by {log.user?.name || 'System'} · {log.entityId ? `ID: ${log.entityId.substring(0, 8)}...` : ''}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {logs.length === 0 && <div className="card text-center py-12"><p className="text-gray-500">No audit logs found</p></div>}
        </div>
      )}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><span className="text-sm text-gray-500">{page} / {totalPages}</span><button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>}
    </div>
  );
}
