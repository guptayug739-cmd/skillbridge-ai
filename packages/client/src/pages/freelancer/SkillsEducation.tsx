import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, GraduationCap, Wrench, X, Check } from 'lucide-react';

interface Skill { id: string; name: string; category?: string; }
interface UserSkill { skill: Skill; proficiency?: string; }
interface Education { id: string; degree: string; institution: string; fieldOfStudy: string; startYear: number; endYear?: number; grade?: string; }

export default function SkillsEducation() {
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchSkill, setSearchSkill] = useState('');
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduForm, setEduForm] = useState({ degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' });
  const [proficiency, setProficiency] = useState<string>('INTERMEDIATE');

  useEffect(() => {
    Promise.all([
      api.get('/users/freelancer/profile'),
      api.get('/users/skills'),
    ]).then(([profileRes, skillsRes]) => {
      setUserSkills(profileRes.data.data.userSkills || []);
      setEducation(profileRes.data.data.education || []);
      setAllSkills(skillsRes.data.data || []);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const addSkill = async (skill: Skill) => {
    const updated = [...userSkills.map((us) => ({ id: us.skill.id, proficiency: us.proficiency })), { id: skill.id, proficiency }];
    try {
      await api.put('/users/freelancer/skills', { skills: updated });
      setUserSkills([...userSkills, { skill, proficiency }]);
      setSearchSkill('');
      toast.success(`Added ${skill.name}`);
    } catch { toast.error('Failed to add skill'); }
  };

  const removeSkill = async (skillId: string) => {
    const updated = userSkills.filter((us) => us.skill.id !== skillId).map((us) => ({ id: us.skill.id, proficiency: us.proficiency }));
    try {
      await api.put('/users/freelancer/skills', { skills: updated });
      setUserSkills(userSkills.filter((us) => us.skill.id !== skillId));
      toast.success('Skill removed');
    } catch { toast.error('Failed to remove skill'); }
  };

  const addEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/freelancer/education', {
        degree: eduForm.degree, institution: eduForm.institution, fieldOfStudy: eduForm.fieldOfStudy,
        startYear: parseInt(eduForm.startYear), endYear: eduForm.endYear ? parseInt(eduForm.endYear) : undefined,
        grade: eduForm.grade || undefined,
      });
      setEducation([res.data.data, ...education]);
      setShowEduForm(false);
      setEduForm({ degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' });
      toast.success('Education added');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to add'); }
  };

  const deleteEducation = async (id: string) => {
    if (!confirm('Delete this education record?')) return;
    try {
      await api.delete(`/users/freelancer/education/${id}`);
      setEducation(education.filter((e) => e.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = allSkills.filter((s) => !userSkills.some((us) => us.skill.id === s.id) && s.name.toLowerCase().includes(searchSkill.toLowerCase()));
  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in"><div className="card animate-pulse-soft h-40" /></div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Skills & Education</h1>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4"><Wrench className="w-5 h-5 text-brand-600" /> Skills</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {userSkills.map((us) => (
            <span key={us.skill.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-sm font-medium">
              {us.skill.name}
              {us.proficiency && <span className="text-xs text-brand-500">({us.proficiency})</span>}
              <button onClick={() => removeSkill(us.skill.id)} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
          {userSkills.length === 0 && <p className="text-gray-400 text-sm">No skills added yet</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input type="text" className={inputClass} placeholder="Search skills to add..." value={searchSkill} onChange={(e) => setSearchSkill(e.target.value)} />
          </div>
          <select value={proficiency} onChange={(e) => setProficiency(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="EXPERT">Expert</option>
          </select>
        </div>
        {searchSkill && filtered.length > 0 && (
          <div className="mt-2 border border-gray-100 rounded-xl max-h-48 overflow-y-auto">
            {filtered.slice(0, 15).map((skill) => (
              <button key={skill.id} onClick={() => addSkill(skill)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                <span className="text-xs text-gray-400">{skill.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-brand-600" /> Education</h2>
          <button onClick={() => setShowEduForm(true)} className="btn-secondary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
        </div>
        {education.length > 0 ? (
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl animate-fade-up">
                <div>
                  <p className="font-medium text-gray-900">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</p>
                  <p className="text-sm text-gray-600">{edu.institution}</p>
                  <p className="text-xs text-gray-400 mt-1">{edu.startYear} - {edu.endYear || 'Present'}{edu.grade && ` | ${edu.grade}`}</p>
                </div>
                <button onClick={() => deleteEducation(edu.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No education records yet</p>
        )}
      </div>

      {showEduForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-up relative">
            <button onClick={() => setShowEduForm(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Education</h2>
            <form onSubmit={addEducation} className="space-y-4">
              <div><label className={labelClass}>Degree *</label><input type="text" className={inputClass} required value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} placeholder="B.Tech, MCA, etc." /></div>
              <div><label className={labelClass}>Institution *</label><input type="text" className={inputClass} required value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} placeholder="University/College name" /></div>
              <div><label className={labelClass}>Field of Study</label><input type="text" className={inputClass} value={eduForm.fieldOfStudy} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} placeholder="Computer Science" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Start Year *</label><input type="number" className={inputClass} required min={1970} max={2030} value={eduForm.startYear} onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })} placeholder="2020" /></div>
                <div><label className={labelClass}>End Year</label><input type="number" className={inputClass} min={1970} max={2030} value={eduForm.endYear} onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })} placeholder="2024" /></div>
              </div>
              <div><label className={labelClass}>Grade/GPA</label><input type="text" className={inputClass} value={eduForm.grade} onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })} placeholder="8.5 CGPA, First Class, etc." /></div>
              <button type="submit" className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save Education</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
