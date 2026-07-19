import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { resetPassword } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Sparkles, Eye, EyeOff, Loader2, Check, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (!token) return toast.error('Invalid reset link');
    setLoading(true);
    const r = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(r)) {
      setDone(true);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      toast.error(r.payload as string);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div className="absolute top-20 -left-20 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl"></div>
      <div className="w-full max-w-md relative animate-fade-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">SkillBridge</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Reset password</h2>
          <p className="text-gray-500 mt-2">Enter your new password</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-11" placeholder="At least 8 characters" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pr-11" placeholder="Re-enter your password" required minLength={8} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : <>Reset Password <Check className="ml-2 w-4 h-4 inline" /></>}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-green-700 font-semibold mb-1">Password reset!</p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </div>
          )}
          <Link to="/login" className="mt-6 flex items-center justify-center text-sm text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
