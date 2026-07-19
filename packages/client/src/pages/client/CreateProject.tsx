import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAppSelector } from '../../hooks/useAppSelector';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Loader2, FileText } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
}

const DURATION_OPTIONS = [
  'LESS_THAN_1_MONTH',
  '1_TO_3_MONTHS',
  '3_TO_6_MONTHS',
  '6_TO_12_MONTHS',
  'MORE_THAN_1_YEAR',
];

const EXPERIENCE_LEVELS = [
  'BEGINNER',
  'INTERMEDIATE',
  'EXPERT',
];

const BUDGET_TYPES = [
  'FIXED',
  'HOURLY',
];

export default function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    budgetMin: '',
    budgetMax: '',
    budgetType: 'FIXED',
    experienceLevel: 'INTERMEDIATE',
    duration: '1_TO_3_MONTHS',
    deadline: '',
    skills: [] as string[],
  });

  useEffect(() => {
    api.get('/users/skills').then((res) => {
      const skills = res.data.data || [];
      setAllSkills(skills);
      const cats = [...new Map(skills.map((s: Skill) => [s.category, { id: s.category, name: s.category }])).values()];
      setCategories(cats as Category[]);
    }).catch(() => {});
  }, []);

  const filteredSkills = allSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !form.skills.includes(s.name),
  );

  const addSkill = (name: string) => {
    setForm((prev) => ({ ...prev, skills: [...prev.skills, name] }));
    setSkillSearch('');
  };

  const removeSkill = (name: string) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.skills.length === 0) {
      toast.error('Add at least one skill');
      return;
    }

    if (parseFloat(form.budgetMin) > parseFloat(form.budgetMax)) {
      toast.error('Minimum budget cannot exceed maximum budget');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/projects', {
        ...form,
        budgetMin: parseFloat(form.budgetMin),
        budgetMax: parseFloat(form.budgetMax),
        deadline: form.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success('Project posted successfully!');
      navigate(`/projects/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'CLIENT') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Client Access Required</h2>
        <p className="text-gray-500 mb-6">Only clients can post projects.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 group">
        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Project</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="e.g. Build a responsive e-commerce website"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field h-40"
              placeholder="Describe your project in detail. Include requirements, expectations, and any relevant context..."
              required
              minLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills Required</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.skills.map((skill) => (
                <span key={skill} className="badge bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="input-field"
              placeholder="Search and add skills..."
            />
            {skillSearch && filteredSkills.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                {filteredSkills.slice(0, 10).map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => addSkill(skill.name)}
                    className="w-full text-left px-4 py-2.5 hover:bg-brand-50 text-sm text-gray-700 hover:text-brand-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {skill.name}
                    <span className="text-xs text-gray-400 ml-2">{skill.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Budget (₹)</label>
              <input
                type="number"
                value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                className="input-field"
                min="0"
                required
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Budget (₹)</label>
              <input
                type="number"
                value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                className="input-field"
                min="0"
                required
                placeholder="50000"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget Type</label>
              <select
                value={form.budgetType}
                onChange={(e) => setForm({ ...form, budgetType: e.target.value })}
                className="input-field"
              >
                {BUDGET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience</label>
              <select
                value={form.experienceLevel}
                onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                className="input-field"
              >
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="input-field"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline (optional)</label>
            <input
              type="date"
              value={form.deadline ? form.deadline.split('T')[0] : ''}
              onChange={(e) => setForm({ ...form, deadline: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              className="input-field"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3.5"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Publish Project</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
