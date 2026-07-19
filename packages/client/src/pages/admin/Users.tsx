import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Search, Shield, ShieldOff, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = (p = 1) => {
    setIsLoading(true);
    const params: Record<string, any> = { page: p, limit: 15 };
    if (search) params.search = search;
    if (role) params.role = role;
    api.get('/admin/users', { params }).then((res) => {
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchUsers(page); }, [page, role]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const verifyUser = async (id: string) => {
    setActionLoading(id);
    try { await api.put(`/admin/users/${id}/verify`); setUsers(users.map((u) => u.id === id ? { ...u, isVerified: true } : u)); toast.success('User verified'); }
    catch { toast.error('Failed'); } finally { setActionLoading(null); }
  };

  const suspendUser = async (id: string) => {
    setActionLoading(id);
    try { const res = await api.put(`/admin/users/${id}/suspend`); setUsers(users.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u)); toast.success(res.data.message); }
    catch { toast.error('Failed'); } finally { setActionLoading(null); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6"><Users className="w-6 h-6 text-brand-600" /><h1 className="text-2xl font-bold text-gray-900">User Management</h1></div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">All Roles</option><option value="FREELANCER">Freelancers</option><option value="CLIENT">Clients</option><option value="ADMIN">Admins</option>
        </select>
      </div>
      {isLoading ? <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="card animate-pulse-soft h-16" />)}</div> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">User</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Joined</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4"><div><p className="font-medium text-gray-900 text-sm">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div></td>
                  <td className="px-6 py-4"><span className={`badge text-xs ${u.role === 'ADMIN' ? 'bg-red-50 text-red-700' : u.role === 'CLIENT' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{u.role}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2">
                    {u.isVerified ? <span className="badge-success text-xs">Verified</span> : <span className="badge-warning text-xs">Unverified</span>}
                    {!u.isActive && <span className="badge-danger text-xs">Suspended</span>}
                  </div></td>
                  <td className="px-6 py-4 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!u.isVerified && <button onClick={() => verifyUser(u.id)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Verify"><CheckCircle className="w-4 h-4" /></button>}
                      <button onClick={() => suspendUser(u.id)} disabled={actionLoading === u.id} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-50 text-gray-400 hover:text-red-600' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`} title={u.isActive ? 'Suspend' : 'Reactivate'}>
                        {u.isActive ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><span className="text-sm text-gray-500">{page} / {totalPages}</span><button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>}
    </div>
  );
}
