import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ExternalLink, Image as ImageIcon, X } from 'lucide-react';

interface PortfolioItem {
  id: string; title: string; description?: string; imageUrl: string; projectUrl?: string; tags?: string[];
}

export default function PortfolioManagement() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', projectUrl: '', tags: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    api.get('/users/freelancer/profile').then((res) => {
      setItems(res.data.data.portfolios || []);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Please select an image'); return; }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.description) fd.append('description', form.description);
      if (form.projectUrl) fd.append('projectUrl', form.projectUrl);
      if (form.tags) fd.append('tags', form.tags);
      fd.append('images', selectedFile);

      const res = await api.post('/users/freelancer/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setItems([res.data.data, ...items]);
      setShowModal(false);
      setForm({ title: '', description: '', projectUrl: '', tags: '' });
      setSelectedFile(null);
      setPreview('');
      toast.success('Portfolio item added');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add item');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portfolio item?')) return;
    try {
      await api.delete(`/users/freelancer/portfolio/${id}`);
      setItems(items.filter((i) => i.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[1,2,3].map((i) => <div key={i} className="card animate-pulse-soft h-60" />)}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={item.id} className="card p-0 overflow-hidden group animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="relative overflow-hidden">
                <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                <button onClick={() => handleDelete(item.id)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-wrap gap-1">{item.tags?.slice(0, 3).map((t) => <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{t}</span>)}</div>
                  {item.projectUrl && <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700"><ExternalLink className="w-4 h-4" /></a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium mb-2">No portfolio items yet</p>
          <p className="text-sm text-gray-400 mb-4">Showcase your best work to attract clients</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4 mr-1 inline" /> Add your first item</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-up relative">
            <button onClick={() => { setShowModal(false); setPreview(''); setSelectedFile(null); }} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Portfolio Item</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className={labelClass}>Image *</label>
                <input type="file" accept="image/*" onChange={handleFile} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
                {preview && <img src={preview} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-xl" />}
              </div>
              <div>
                <label className={labelClass}>Title *</label>
                <input type="text" className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Project title" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the project" />
              </div>
              <div>
                <label className={labelClass}>Project URL</label>
                <input type="url" className={inputClass} value={form.projectUrl} onChange={(e) => setForm({ ...form, projectUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>Tags (comma-separated)</label>
                <input type="text" className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="React, Node.js, Tailwind" />
              </div>
              <button type="submit" disabled={isUploading || !form.title} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
                {isUploading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" /> : <><Plus className="w-4 h-4" /> Add Item</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
