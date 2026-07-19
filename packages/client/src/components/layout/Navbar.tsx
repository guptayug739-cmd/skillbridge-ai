import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Menu, X, Bell, ChevronDown, LogOut, User, LayoutDashboard, MessageSquare, Sparkles, Check } from 'lucide-react';

interface Notification { id: string; title: string; message: string; read: boolean; createdAt: string; type: string; data?: any; }

export default function Navbar() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => { window.removeEventListener('scroll', handleScroll); document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/notifications?limit=5').then((res) => { setNotifications(res.data.data); setUnreadCount(res.data.unreadCount); }).catch(() => {});
    }
  }, [isAuthenticated]);

  const markRead = async (id: string) => {
    try { await api.put(`/notifications/${id}/read`); setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n)); setUnreadCount(Math.max(0, unreadCount - 1)); } catch {}
  };

  const markAllRead = async () => {
    try { await api.put('/notifications/read-all'); setNotifications(notifications.map((n) => ({ ...n, read: true }))); setUnreadCount(0); } catch {}
  };

  const handleLogout = () => { dispatch(logout()); navigate('/'); setDropdownOpen(false); };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100/50' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/30 transition-all duration-300 group-hover:scale-105">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SkillBridge</span>
              <span className="text-[10px] font-bold text-white bg-gradient-to-r from-brand-500 to-purple-500 px-2 py-0.5 rounded-full tracking-wider uppercase">AI</span>
            </Link>
            <div className="hidden md:flex ml-12 space-x-1">
              <Link to="/projects" className="btn-ghost text-sm">Find Work</Link>
              {isAuthenticated && user?.role === 'CLIENT' && <Link to="/dashboard" className="btn-ghost text-sm">Post Project</Link>}
              <Link to="/projects" className="btn-ghost text-sm">Browse Projects</Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button onClick={() => setNotifOpen(!notifOpen)} className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl relative transition-all duration-200">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-fade-down overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm">Notifications</p>
                        {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Mark all read</button>}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map((n) => (
                          <div key={n.id} onClick={() => markRead(n.id)} className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-brand-50/30' : ''}`}>
                            <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        )) : <p className="text-center text-gray-400 text-sm py-8">No notifications</p>}
                      </div>
                      <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium py-3 border-t border-gray-100 hover:bg-gray-50">View All</Link>
                    </div>
                  )}
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`flex items-center space-x-3 p-2 rounded-xl transition-all duration-200 ${dropdownOpen ? 'bg-brand-50 ring-2 ring-brand-500/20' : 'hover:bg-gray-50'}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-down">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"><LayoutDashboard className="w-4 h-4 mr-3 text-gray-400" /> Dashboard</Link>
                        <Link to="/chat" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"><MessageSquare className="w-4 h-4 mr-3 text-gray-400" /> Messages</Link>
                        <Link to="/saved" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"><Bell className="w-4 h-4 mr-3 text-gray-400" /> Saved</Link>
                      </div>
                      <div className="border-t border-gray-100 pt-1">
                        <button onClick={handleLogout} className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4 mr-3" /> Sign Out</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2.5 px-5">Get Started</Link>
              </>
            )}
          </div>
          <button className="md:hidden p-2.5 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-fade-down">
          <div className="px-4 py-4 space-y-1">
            <Link to="/projects" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors">Find Work</Link>
            <Link to="/projects" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors">Browse Projects</Link>
            {isAuthenticated ? (
              <>
                <hr className="my-2" />
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors">Dashboard</Link>
                <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors">Messages</Link>
                <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors">Notifications</Link>
                <Link to="/saved" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors">Saved</Link>
                <hr className="my-2" />
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors">Sign Out</button>
              </>
            ) : (
              <div className="flex space-x-3 pt-4 px-0">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary text-sm flex-1 text-center py-3">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary text-sm flex-1 text-center py-3">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
