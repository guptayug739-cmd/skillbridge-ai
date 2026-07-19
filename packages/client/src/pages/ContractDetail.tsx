import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAppSelector } from '../hooks/useAppSelector';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, AlertCircle, Loader2, Send, ChevronRight, DollarSign, Calendar, MessageSquare } from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  PENDING: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
  IN_REVIEW: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  APPROVED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ACTIVE: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  CANCELLED: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

export default function ContractDetail() {
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);
  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', amount: '', dueDate: '' });

  const isClient = user?.role === 'CLIENT';
  const isFreelancer = user?.role === 'FREELANCER';

  useEffect(() => {
    api.get(`/contracts/${id}`).then((res) => { setContract(res.data.data); setIsLoading(false); }).catch(() => setIsLoading(false));
  }, [id]);

  const handleMilestoneAction = async (milestoneId: string, action: 'complete' | 'approve') => {
    setActionLoading(milestoneId);
    try {
      await api.put(`/contracts/milestones/${milestoneId}/${action}`);
      toast.success(`Milestone ${action === 'complete' ? 'submitted for review' : 'approved'}`);
      const res = await api.get(`/contracts/${id}`);
      setContract(res.data.data);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/contracts/${id}/milestones`, {
        title: milestoneForm.title, description: milestoneForm.description,
        amount: parseFloat(milestoneForm.amount), dueDate: milestoneForm.dueDate,
      });
      toast.success('Milestone added');
      setShowMilestoneForm(false);
      setMilestoneForm({ title: '', description: '', amount: '', dueDate: '' });
      const res = await api.get(`/contracts/${id}`);
      setContract(res.data.data);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const completeContract = async () => {
    if (!confirm('Mark this contract as completed?')) return;
    try { await api.post(`/contracts/${id}/complete`); toast.success('Contract completed'); const res = await api.get(`/contracts/${id}`); setContract(res.data.data); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="card animate-pulse-soft h-64" /></div>;
  if (!contract) return <div className="text-center py-20"><p className="text-gray-500">Contract not found</p></div>;

  const completedMilestones = contract.milestones?.filter((m: any) => m.status === 'APPROVED').length || 0;
  const totalMilestones = contract.milestones?.length || 0;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">{contract.project?.title}</h1>
        <p className="text-gray-500 text-sm mt-1">Contract with {isClient ? contract.freelancer?.user?.name : contract.client?.companyName || contract.client?.user?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card"><DollarSign className="w-5 h-5 text-green-600 mb-1" /><p className="text-lg font-bold text-gray-900">₹{contract.budget?.toLocaleString()}</p><p className="text-xs text-gray-500">Budget</p></div>
        <div className="card"><DollarSign className="w-5 h-5 text-blue-600 mb-1" /><p className="text-lg font-bold text-gray-900">₹{contract.freelancerAmount?.toLocaleString()}</p><p className="text-xs text-gray-500">Freelancer Amount</p></div>
        <div className="card"><DollarSign className="w-5 h-5 text-orange-600 mb-1" /><p className="text-lg font-bold text-gray-900">₹{contract.platformFee?.toLocaleString()}</p><p className="text-xs text-gray-500">Platform Fee (15%)</p></div>
        <div className="card">
          {(() => { const C = STATUS_CONFIG[contract.status] || STATUS_CONFIG.ACTIVE; return <><C.icon className={`w-5 h-5 ${C.color} mb-1`} /><p className="text-lg font-bold text-gray-900">{contract.status}</p></>; })()}
          <p className="text-xs text-gray-500">Status</p>
        </div>
      </div>

      {totalMilestones > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Progress</h2>
            <span className="text-sm font-medium text-gray-600">{completedMilestones}/{totalMilestones} milestones</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Milestones</h2>
          {isClient && contract.status === 'ACTIVE' && <button onClick={() => setShowMilestoneForm(!showMilestoneForm)} className="btn-secondary text-sm">+ Add Milestone</button>}
        </div>

        {showMilestoneForm && (
          <form onSubmit={addMilestone} className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
            <input type="text" placeholder="Milestone title" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} />
            <textarea placeholder="Description" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px]" value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Amount (₹)" required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={milestoneForm.amount} onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })} />
              <input type="date" required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary text-sm py-2">Add Milestone</button>
          </form>
        )}

        {contract.milestones?.length > 0 ? (
          <div className="space-y-3">
            {contract.milestones.map((m: any, i: number) => {
              const config = STATUS_CONFIG[m.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={m.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}><config.icon className={`w-5 h-5 ${config.color}`} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{m.title}</p>
                    {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>₹{m.amount?.toLocaleString()}</span>
                      <span>Due: {new Date(m.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className={`font-medium ${config.color}`}>{m.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isFreelancer && m.status === 'PENDING' && <button onClick={() => handleMilestoneAction(m.id, 'complete')} disabled={actionLoading === m.id} className="btn-primary text-xs py-1.5 px-3">{actionLoading === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit'}</button>}
                    {isClient && m.status === 'IN_REVIEW' && <button onClick={() => handleMilestoneAction(m.id, 'approve')} disabled={actionLoading === m.id} className="btn-primary text-xs py-1.5 px-3 bg-green-600 hover:bg-green-700">{actionLoading === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve'}</button>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-center text-gray-400 text-sm py-6">No milestones yet</p>}
      </div>

      <div className="flex gap-3">
        <Link to={`/chat/${contract.id}`} className="btn-secondary flex-1 flex items-center justify-center gap-2"><MessageSquare className="w-4 h-4" /> Open Chat</Link>
        {isClient && contract.status === 'ACTIVE' && (
          <button onClick={completeContract} className="btn-primary flex-1 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Complete Contract</button>
        )}
      </div>
    </div>
  );
}
