import { useState } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, FileText, Award, TrendingUp, CheckCircle, AlertTriangle, Lightbulb, BarChart3, X } from 'lucide-react';

interface AnalysisResult {
  skills: string[];
  experienceLevel: string;
  experienceYears: number;
  keyStrengths: string[];
  recommendations: string[];
  overallScore: number;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return 'from-green-500 to-emerald-600';
  if (score >= 60) return 'from-yellow-500 to-orange-500';
  return 'from-red-500 to-rose-600';
};

const SCORE_LABEL = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Poor';
};

export default function AIResumeReview() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [preview, setPreview] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }
    setSelectedFile(file);
    setPreview(file.name);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) { toast.error('Please select a resume file'); return; }
    setIsAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('resume', selectedFile);
      const res = await api.post('/ai/analyze-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data.data);
      toast.success('Analysis complete');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally { setIsAnalyzing(false); }
  };

  const reset = () => { setResult(null); setSelectedFile(null); setPreview(''); };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Resume Review</h1>
          <p className="text-sm text-gray-500">Get instant feedback on your resume</p>
        </div>
      </div>

      {!result ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Resume</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Our AI will analyze your resume and provide detailed feedback on skills, experience level, strengths, and areas for improvement.</p>

            <div className="max-w-sm mx-auto">
              <label className="block w-full cursor-pointer">
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-purple-300 hover:bg-purple-50/30 transition-all text-center">
                  <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  {selectedFile ? (
                    <p className="text-sm font-medium text-purple-600">{preview}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700">Click to upload PDF</p>
                      <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
                    </>
                  )}
                </div>
                <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
              </label>
            </div>

            <button onClick={handleAnalyze} disabled={!selectedFile || isAnalyzing} className="mt-6 btn-primary px-8 py-3 flex items-center gap-2 mx-auto disabled:opacity-40">
              {isAnalyzing ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" /> Analyzing...</>
              ) : (
                <><BarChart3 className="w-5 h-5" /> Analyze Resume</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-up">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Overall Score</h2>
              <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"><X className="w-4 h-4" /> New Analysis</button>
            </div>
            <div className="flex items-center gap-6">
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${SCORE_COLOR(result.overallScore)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <div className="text-center text-white">
                  <p className="text-3xl font-bold">{result.overallScore}</p>
                  <p className="text-xs opacity-80">/100</p>
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{SCORE_LABEL(result.overallScore)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {result.experienceLevel} level · {result.experienceYears} years experience
                </p>
              </div>
            </div>
          </div>

          {result.skills.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {result.keyStrengths.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Award className="w-5 h-5 text-blue-500" /> Key Strengths</h3>
              <div className="space-y-2">
                {result.keyStrengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-orange-500" /> Recommendations</h3>
              <div className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
