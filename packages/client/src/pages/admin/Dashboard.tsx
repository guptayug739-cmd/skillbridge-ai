import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StatSkeleton } from '../../components/ui/Skeleton';
import { Users, Briefcase, DollarSign, Shield, TrendingUp, AlertTriangle, CheckCircle, BarChart, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => {
      setDashboard(res.data.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="animate-pulse-soft"><StatSkeleton /></div>)}
      </div>
    </div>
  );

  const stats = [
    { label: 'Total Users', value: dashboard?.totalUsers?.toLocaleString() || '0', icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Freelancers', value: dashboard?.totalFreelancers?.toLocaleString() || '0', icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { label: 'Total Clients', value: dashboard?.totalClients?.toLocaleString() || '0', icon: Briefcase, color: 'from-purple-500 to-purple-600' },
    { label: 'Total Revenue', value: `₹${dashboard?.totalRevenue?.toLocaleString() || '0'}`, icon: DollarSign, color: 'from-yellow-500 to-yellow-600' },
    { label: 'Active Contracts', value: dashboard?.activeContracts || '0', icon: CheckCircle, color: 'from-teal-500 to-teal-600' },
    { label: 'Pending Verifications', value: dashboard?.pendingVerifications || '0', icon: Shield, color: 'from-orange-500 to-orange-600' },
    { label: 'Open Disputes', value: dashboard?.openDisputes || '0', icon: AlertTriangle, color: 'from-red-500 to-red-600' },
    { label: 'Total Projects', value: dashboard?.totalProjects?.toLocaleString() || '0', icon: BarChart, color: 'from-indigo-500 to-indigo-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and management</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue (Last 6 Months)</h2>
          {dashboard?.revenueChart?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.revenueChart.map((item: any) => (
                <div key={item.month} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-20 flex-shrink-0">{item.month}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (item.revenue / Math.max(...dashboard.revenueChart.map((r: any) => r.revenue))) * 100)}%` }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-24 text-right">₹{item.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-8">No revenue data</p>}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth (Last 6 Months)</h2>
          {dashboard?.userGrowthChart?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.userGrowthChart.map((item: any) => {
                const max = Math.max(...dashboard.userGrowthChart.map((r: any) => r.users));
                return (
                  <div key={item.month} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-20 flex-shrink-0">{item.month}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(item.users / max) * 100}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-24 text-right">{item.users} users</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-gray-400 text-center py-8">No user data</p>}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'User Management', desc: 'Verify, suspend, and manage users', icon: Users, to: '/admin/users', color: 'from-blue-500 to-blue-600' },
          { label: 'Project Management', desc: 'Review and manage all projects', icon: Briefcase, to: '/admin/projects', color: 'from-purple-500 to-purple-600' },
          { label: 'Dispute Resolution', desc: 'Resolve open disputes', icon: AlertTriangle, to: '/admin/disputes', color: 'from-red-500 to-red-600' },
          { label: 'Company Verification', desc: 'Verify client companies', icon: Shield, to: '/admin/companies', color: 'from-orange-500 to-orange-600' },
          { label: 'Payments & Transactions', desc: 'View all platform transactions', icon: DollarSign, to: '/admin/payments', color: 'from-green-500 to-green-600' },
          { label: 'Audit Logs', desc: 'Track all admin actions', icon: BarChart, to: '/admin/audit-logs', color: 'from-indigo-500 to-indigo-600' },
        ].map((item, i) => (
          <Link key={item.to} to={item.to} className="card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
