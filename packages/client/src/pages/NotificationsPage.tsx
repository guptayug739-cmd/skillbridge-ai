import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Bell, Check, CheckCheck, Trash2, Inbox } from 'lucide-react';

interface Notification { id: string; title: string; message: string; read: boolean; type: string; createdAt: string; data?: any; }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = (p = 1) => {
    setIsLoading(true);
    api.get(`/notifications?page=${p}&limit=15`).then((res) => {
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
      setTotalPages(res.data.pagination.totalPages);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchNotifications(page); }, [page]);

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="card animate-pulse-soft h-20" />)}</div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
          </div>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"><CheckCheck className="w-4 h-4" /> Mark all read</button>}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <div key={n.id} className={`card flex items-start gap-3 animate-fade-up ${!n.read ? 'border-brand-200 bg-brand-50/20' : ''}`} style={{ animationDelay: `${i * 40}ms` }}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.read && <button onClick={() => markRead(n.id)} className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title="Mark read"><Check className="w-4 h-4" /></button>}
                <button onClick={() => deleteNotif(n.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No notifications</p>
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
