import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, User, MapPin, Globe, DollarSign, Briefcase } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', bio: '', hourlyRate: '', experienceYears: '', location: '',
    city: '', state: '', pincode: '', country: '', languages: '',
  });

  useEffect(() => {
    api.get('/users/freelancer/profile').then((res) => {
      const p = res.data.data;
      setForm({
        title: p.title || '', bio: p.bio || '', hourlyRate: p.hourlyRate?.toString() || '',
        experienceYears: p.experienceYears?.toString() || '', location: p.location || '',
        city: p.city || '', state: p.state || '', pincode: p.pincode || '', country: p.country || '',
        languages: p.languages?.join(', ') || '',
      });
      setIsLoading(false);
    }).catch(() => { toast.error('Failed to load profile'); setIsLoading(false); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/users/freelancer/profile', {
        title: form.title, bio: form.bio, hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
        experienceYears: form.experienceYears ? parseInt(form.experienceYears) : undefined,
        location: form.location, city: form.city, state: form.state, pincode: form.pincode, country: form.country,
        languages: form.languages ? form.languages.split(',').map((l) => l.trim()).filter(Boolean) : [],
      });
      dispatch(updateUser({ name: form.title }));
      toast.success('Profile updated');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="card animate-pulse-soft space-y-4">
        {[1,2,3,4,5,6].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-brand-600" /> Basic Info</h2>
          <div>
            <label className={labelClass}>Professional Title</label>
            <input type="text" className={inputClass} placeholder="e.g. Full Stack Developer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Bio</label>
            <textarea className={`${inputClass} min-h-[120px] resize-y`} placeholder="Tell clients about yourself, your experience, and what you can do..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Hourly Rate (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" className={`${inputClass} pl-9`} placeholder="500" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Years of Experience</label>
              <input type="number" className={inputClass} placeholder="3" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Languages</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" className={`${inputClass} pl-9`} placeholder="English, Hindi, Spanish" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-600" /> Location</h2>
          <div>
            <label className={labelClass}>Location</label>
            <input type="text" className={inputClass} placeholder="City, State" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>City</label>
              <input type="text" className={inputClass} placeholder="Mumbai" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input type="text" className={inputClass} placeholder="Maharashtra" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Pincode</label>
              <input type="text" className={inputClass} placeholder="400001" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" className={inputClass} placeholder="India" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSaving} className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2">
          {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" /> : <><Save className="w-5 h-5" /> Save Profile</>}
        </button>
      </form>
    </div>
  );
}
