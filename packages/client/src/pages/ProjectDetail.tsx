import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAppSelector } from '../hooks/useAppSelector';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Clock, DollarSign, Briefcase, Send, ChevronLeft, Check, X, Star, ExternalLink,
  Loader2, Shield, ShieldAlert, Sparkles, Bot, AlertTriangle, Users, TrendingUp, UserPlus, Bookmark,
} from 'lucide-react';

interface ScamResult { isScam: boolean; riskScore: number; flags: string[]; recommendation: string; }

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposal, setProposal] = useState({ coverLetter: '', bidAmount: '', deliveryTime: '' });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [scamResult, setScamResult] = useState<ScamResult | null>(null);
  const [scamLoading, setScamLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteResults, setInviteResults] = useState<any[]>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const fetchProject = () => {
    api.get(`/projects/${id}`).then((res) => {
      setProject(res.data.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchProject(); }, [id]);

  useEffect(() => {
    if (project && isFreelancer) {
      api.get('/saved/projects').then((res) => {
        setIsSaved(res.data.data.some((s: any) => s.project?.id === project.id));
      }).catch(() => {});
    }
  }, [project]);

  const isOwner = isAuthenticated && user?.role === 'CLIENT' && project?.client?.userId === user?.id;
  const isFreelancer = isAuthenticated && user?.role === 'FREELANCER';

  const detectScam = async () => {
    if (!project) return;
    setScamLoading(true);
    try {
      const res = await api.post('/ai/detect-scam', { projectId: project.id });
      setScamResult(res.data.data);
    } catch { setScamResult(null); }
    finally { setScamLoading(false); }
  };

  const loadRecommendations = async () => {
    if (!project) return;
    setRecLoading(true);
    try {
      const res = await api.get(`/ai/recommend-freelancers/${project.id}`);
      setRecommendations(res.data.data);
    } catch { setRecommendations([]); }
    finally { setRecLoading(false); }
  };

  useEffect(() => {
    if (project && isFreelancer && project.status === 'OPEN') detectScam();
    if (project && isOwner) loadRecommendations();
  }, [project]);

  const searchFreelancers = async (q: string) => {
    setInviteSearch(q);
    if (q.length < 2) { setInviteResults([]); return; }
    try { const res = await api.get(`/users/freelancers/top`); setInviteResults(res.data.data.filter((f: any) => f.user?.name?.toLowerCase().includes(q.toLowerCase()) || f.title?.toLowerCase().includes(q.toLowerCase()))); } catch {}
  };

  const inviteFreelancer = async (freelancerId: string) => {
    setInvitingId(freelancerId);
    try {
      await api.post('/invites', { projectId: id, freelancerId, message: `You've been invited to apply for "${project.title}"` });
      toast.success('Invitation sent');
      setShowInvite(false);
      setInviteSearch('');
      setInviteResults([]);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to invite'); }
    finally { setInvitingId(null); }
  };

  const toggleSave = async () => {
    try {
      if (isSaved) { await api.delete(`/projects/${id}/save`); setIsSaved(false); }
      else { await api.post(`/projects/${id}/save`); setIsSaved(true); }
    } catch {}
  };

  const generateProposal = async () => {
    if (!proposal.bidAmount || !proposal.deliveryTime) { toast.error('Enter bid amount and delivery time first'); return; }
    setAiGenerating(true);
    try {
      const res = await api.post('/ai/generate-proposal', {
        projectId: id, bidAmount: parseFloat(proposal.bidAmount), deliveryTime: parseInt(proposal.deliveryTime),
      });
      setProposal({ ...proposal, coverLetter: res.data.data.coverLetter });
      toast.success('Proposal generated');
    } catch (err: any) { toast.error(err.response?.data?.error || 'AI generation failed'); }
    finally { setAiGenerating(false); }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProposal(true);
    try {
      await api.post('/proposals', {
        ...proposal, projectId: id, bidAmount: parseFloat(proposal.bidAmount), deliveryTime: parseInt(proposal.deliveryTime),
      });
      toast.success('Proposal submitted successfully!');
      setShowProposalForm(false);
      setProposal({ coverLetter: '', bidAmount: '', deliveryTime: '' });
      fetchProject();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to submit proposal'); }
    finally { setSubmittingProposal(false); }
  };

  const handleProposalAction = async (proposalId: string, action: 'ACCEPTED' | 'REJECTED') => {
    setActionLoading(proposalId);
    try {
      await api.post(`/proposals/${proposalId}/${action.toLowerCase()}`);
      toast.success(`Proposal ${action.toLowerCase()} successfully`);
      fetchProject();
    } catch (err: any) { toast.error(err.response?.data?.error || `Failed to ${action.toLowerCase()} proposal`); }
    finally { setActionLoading(null); }
  };

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!project) return (
    <div className="text-center py-20 animate-fade-up">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase className="w-10 h-10 text-gray-300" /></div>
      <p className="text-gray-500">Project not found</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 group">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back
      </button>

      {scamResult && scamResult.riskScore > 0 && (
        <div className={`mb-6 p-4 rounded-2xl border-2 flex items-start gap-4 animate-fade-up ${scamResult.isScam ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          {scamResult.isScam ? <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" /> : <Shield className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className={`font-semibold text-sm ${scamResult.isScam ? 'text-red-800' : 'text-green-800'}`}>
              {scamResult.isScam ? 'High Risk Warning' : 'Looks Legitimate'}
            </p>
            {scamResult.flags.length > 0 && (
              <div className="mt-1.5 space-y-0.5">
                {scamResult.flags.map((f, i) => <p key={i} className="text-xs text-gray-600">• {f}</p>)}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">{scamResult.recommendation}</p>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-primary">{project.category?.name}</span>
              {project.isFeatured && <span className="badge-warning">Featured</span>}
              <span className={`badge ${project.status === 'OPEN' ? 'badge-success' : project.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge bg-gray-100 text-gray-600'}`}>
                {project.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.title}</h1>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500 mb-1">Budget</p>
            <span className="text-2xl md:text-3xl font-bold gradient-text">
              ₹{project.budgetMin?.toLocaleString()} - ₹{project.budgetMax?.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 text-sm">
          <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600"><Clock className="w-4 h-4 mr-1.5 text-gray-400" /> {project.duration?.replace(/_/g, ' ').toLowerCase()}</span>
          <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600"><Briefcase className="w-4 h-4 mr-1.5 text-gray-400" /> {project.experienceLevel}</span>
          <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600"><DollarSign className="w-4 h-4 mr-1.5 text-gray-400" /> {project.budgetType}</span>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Skills Required</h3>
          <div className="flex flex-wrap gap-2">
            {project.projectSkills?.map((ps: any) => (
              <span key={ps.skill.id} className="badge bg-brand-50 text-brand-700 border border-brand-200">{ps.skill.name}</span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-brand-700">{project.client?.user?.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{project.client?.companyName || project.client?.user?.name}</p>
              <p className="text-sm text-gray-500">{project.proposalsCount} proposals received</p>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowInvite(true)} className="btn-secondary text-sm flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Invite</button>
              <button onClick={() => navigate('/projects/manage')} className="btn-secondary text-sm">Manage Projects</button>
            </div>
          )}
          {isFreelancer && <button onClick={toggleSave} className={`p-2 rounded-lg transition-colors ${isSaved ? 'bg-yellow-50 text-yellow-600' : 'hover:bg-gray-100 text-gray-400'}`}><Bookmark className={`w-5 h-5 ${isSaved ? 'fill-yellow-500' : ''}`} /></button>}
        </div>
      </div>

      {isFreelancer && project.status === 'OPEN' && (
        <div className="card">
          {!showProposalForm ? (
            <button onClick={() => setShowProposalForm(true)} className="btn-primary w-full py-3.5 group">
              <Send className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" /> Submit Proposal
            </button>
          ) : (
            <form onSubmit={handleSubmitProposal}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Submit Your Proposal</h3>
                <button type="button" onClick={() => setShowProposalForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bid Amount (₹)</label>
                    <input type="number" value={proposal.bidAmount} onChange={(e) => setProposal({ ...proposal, bidAmount: e.target.value })} className="input-field" min="0" required placeholder="25000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Time (days)</label>
                    <input type="number" value={proposal.deliveryTime} onChange={(e) => setProposal({ ...proposal, deliveryTime: e.target.value })} className="input-field" min="1" required placeholder="14" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                    <button type="button" onClick={generateProposal} disabled={aiGenerating || !proposal.bidAmount || !proposal.deliveryTime}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-40">
                      {aiGenerating ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-purple-600" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate with AI</>}
                    </button>
                  </div>
                  <textarea value={proposal.coverLetter} onChange={(e) => setProposal({ ...proposal, coverLetter: e.target.value })} className="input-field h-40" placeholder="Explain why you're the best fit for this project..." required minLength={50} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submittingProposal} className="btn-primary flex-1">
                    {submittingProposal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Proposal
                  </button>
                  <button type="button" onClick={() => setShowProposalForm(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {isOwner && (
        <div className="mt-6">
          {recLoading ? (
            <div className="card text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" /><p className="text-sm text-gray-500 mt-2">Loading recommendations...</p></div>
          ) : recommendations.length > 0 ? (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-purple-600" /> AI Recommended Freelancers</h3>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <Link key={rec.freelancerId} to={`/freelancers/${rec.freelancerId}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-brand-700">{rec.freelancer.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{rec.freelancer.name}</p>
                        <p className="text-xs text-gray-500">{rec.freelancer.title || 'Freelancer'} · {rec.matchReason}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-sm font-bold text-purple-600">{rec.score}% match</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {rec.freelancer.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {rec.freelancer.rating}</span>}
                        <span>₹{rec.freelancer.hourlyRate}/hr</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {project.proposals?.length > 0 && isOwner && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-4">Proposals ({project.proposals.length})</h3>
          <div className="space-y-4">
            {project.proposals.map((p: any, i: number) => (
              <div key={p.id} className={`p-5 border rounded-xl transition-all duration-200 animate-fade-up ${p.status === 'ACCEPTED' ? 'border-green-200 bg-green-50/50' : p.status === 'REJECTED' ? 'border-red-200 bg-red-50/30 opacity-60' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/freelancers/${p.freelancer?.id}`} className="flex items-center gap-3 group">
                    <div className="w-11 h-11 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center group-hover:ring-2 group-hover:ring-brand-300 transition-all">
                      <span className="text-sm font-bold text-brand-700">{p.freelancer?.user?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{p.freelancer?.user?.name}</p>
                      {p.freelancer?.title && <p className="text-xs text-gray-400">{p.freelancer.title}</p>}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-400 transition-colors" />
                  </Link>
                  <span className="text-xl font-bold gradient-text">₹{p.bidAmount?.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{p.coverLetter}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {p.deliveryTime} days</span>
                    {p.freelancer?.rating && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {p.freelancer.rating.toFixed(1)}</span>}
                    <span className={`badge text-xs ${p.status === 'PENDING' ? 'badge-warning' : p.status === 'ACCEPTED' ? 'badge-success' : 'badge-danger'}`}>{p.status}</span>
                  </div>
                  {p.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleProposalAction(p.id, 'REJECTED')} disabled={actionLoading === p.id} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                        {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5 mr-1 inline" /> Reject</>}
                      </button>
                      <button onClick={() => handleProposalAction(p.id, 'ACCEPTED')} disabled={actionLoading === p.id} className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                        {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1 inline" /> Accept</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-up relative">
            <button onClick={() => { setShowInvite(false); setInviteSearch(''); setInviteResults([]); }} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invite Freelancer</h2>
            <input type="text" value={inviteSearch} onChange={(e) => searchFreelancers(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm mb-3" placeholder="Search by name or skill..." />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {inviteResults.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-brand-700">{f.user?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{f.user?.name}</p>
                      <p className="text-xs text-gray-500">{f.title || 'Freelancer'}</p>
                    </div>
                  </div>
                  <button onClick={() => inviteFreelancer(f.id)} disabled={invitingId === f.id} className="text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-40">
                    {invitingId === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite'}
                  </button>
                </div>
              ))}
              {inviteSearch.length >= 2 && inviteResults.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No freelancers found</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
