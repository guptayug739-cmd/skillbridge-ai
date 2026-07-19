import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { register, sendEmailOtp, verifyEmailOtp, sendMobileOtp, verifyMobileOtp } from '../../store/slices/authSlice';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Briefcase, User, Sparkles, ArrowRight, ArrowLeft, Check, Phone, Mail, Shield, RefreshCw,
  Calendar, MapPin, Navigation, Search, Briefcase as WorkIcon, GraduationCap, BookOpen,
  Star, Plus, X, CreditCard, IndianRupee, Loader2, Eye, EyeOff
} from 'lucide-react';

const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Email' },
  { id: 3, label: 'Mobile' },
  { id: 4, label: 'Personal' },
  { id: 5, label: 'Skills' },
  { id: 6, label: 'Verify' },
];

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);

  const [role, setRole] = useState(searchParams.get('role') === 'freelancer' ? 'FREELANCER' : 'CLIENT');

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [personal, setPersonal] = useState({ dateOfBirth: '', gender: '' });
  const [address, setAddress] = useState({ line: '', city: '', state: '', pincode: '', country: 'India' });
  const [experience, setExperience] = useState({ years: '', title: '', bio: '' });
  const [skills, setSkills] = useState<any[]>([]);
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [education, setEducation] = useState({ degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' });
  const [educationList, setEducationList] = useState<any[]>([]);
  const [identity, setIdentity] = useState({ type: '', number: '', documentUrl: '' });
  const [resumeUrl, setResumeUrl] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addressFetching, setAddressFetching] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [mobileOtp, setMobileOtp] = useState(['', '', '', '', '', '']);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [mobileOtpTimer, setMobileOtpTimer] = useState(0);

  const emailInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mobileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isFreelancer = role === 'FREELANCER';
  const totalFreelancerSteps = isFreelancer ? 6 : 3;
  const displayedSteps = steps.slice(0, totalFreelancerSteps);

  useEffect(() => { if (emailOtpTimer > 0) { const t = setInterval(() => setEmailOtpTimer((p) => p - 1), 1000); return () => clearInterval(t); } }, [emailOtpTimer]);
  useEffect(() => { if (mobileOtpTimer > 0) { const t = setInterval(() => setMobileOtpTimer((p) => p - 1), 1000); return () => clearInterval(t); } }, [mobileOtpTimer]);

  useEffect(() => {
    if (isFreelancer) api.get('/users/skills').then((r) => setAllSkills(r.data.data || [])).catch(() => {});
  }, [isFreelancer]);

  const handleOtpChange = (index: number, value: string, arr: 'email' | 'mobile') => {
    if (!/^\d?$/.test(value)) return;
    const setter = arr === 'email' ? setEmailOtp : setMobileOtp;
    const refs = arr === 'email' ? emailInputRefs : mobileInputRefs;
    setter((prev) => { const n = [...prev]; n[index] = value; return n; });
    if (value && index < 5) refs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent, arr: 'email' | 'mobile') => {
    const otp = arr === 'email' ? emailOtp : mobileOtp;
    const refs = arr === 'email' ? emailInputRefs : mobileInputRefs;
    if (e.key === 'Backspace' && !otp[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleSendEmailOtp = async () => {
    setOtpLoading(true);
    const r = await dispatch(sendEmailOtp(form.email));
    if (sendEmailOtp.fulfilled.match(r)) { toast.success('OTP sent to your email'); setEmailOtpSent(true); setEmailOtpTimer(120); }
    else { toast.error(r.payload as string); }
    setOtpLoading(false);
  };
  const handleVerifyEmailOtp = async () => {
    const otp = emailOtp.join('');
    if (otp.length !== 6) return toast.error('Enter complete OTP');
    setOtpLoading(true);
    const r = await dispatch(verifyEmailOtp({ email: form.email, otp }));
    if (verifyEmailOtp.fulfilled.match(r)) { toast.success('Email verified!'); setEmailVerified(true); setTimeout(() => setStep(isFreelancer ? 4 : 4), 500); }
    else { toast.error(r.payload as string); setEmailOtp(['', '', '', '', '', '']); emailInputRefs.current[0]?.focus(); }
    setOtpLoading(false);
  };
  const handleSendMobileOtp = async () => {
    setOtpLoading(true);
    const r = await dispatch(sendMobileOtp(form.phone));
    if (sendMobileOtp.fulfilled.match(r)) { toast.success('OTP sent to your mobile'); setMobileOtpSent(true); setMobileOtpTimer(120); }
    else { toast.error(r.payload as string); }
    setOtpLoading(false);
  };
  const handleVerifyMobileOtp = async () => {
    const otp = mobileOtp.join('');
    if (otp.length !== 6) return toast.error('Enter complete OTP');
    setOtpLoading(true);
    const r = await dispatch(verifyMobileOtp({ phone: form.phone, otp }));
    if (verifyMobileOtp.fulfilled.match(r)) { toast.success('Mobile verified!'); setMobileVerified(true); setTimeout(() => setStep(isFreelancer ? 4 : 7), 500); }
    else { toast.error(r.payload as string); setMobileOtp(['', '', '', '', '', '']); mobileInputRefs.current[0]?.focus(); }
    setOtpLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    const r = await dispatch(register({ ...form, role }));
    if (register.fulfilled.match(r)) {
      toast.success('Account created!');
      if (isFreelancer) { setStep(2); } else { setStep(2); }
    } else { toast.error(r.payload as string); }
  };

  const handleAutoDetectAddress = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setAddressFetching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const addr = data.address || {};
          setAddress({
            line: [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            pincode: addr.postcode || '',
            country: addr.country || 'India',
          });
          toast.success('Address auto-detected!');
        } catch { toast.error('Could not auto-detect address'); }
        setAddressFetching(false);
      },
      () => { toast.error('Location permission denied'); setAddressFetching(false); },
      { timeout: 10000 }
    );
  };

  const handlePincodeLookup = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data?.[0]?.Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        setAddress((prev) => ({
          ...prev,
          city: postOffice.District || prev.city,
          state: postOffice.State || prev.state,
        }));
      }
    } catch { /* ignore */ }
    setPincodeLoading(false);
  }, []);

  const toggleSkill = (skill: any) => {
    setSkills((prev) =>
      prev.find((s) => s.id === skill.id) ? prev.filter((s) => s.id !== skill.id) : [...prev, skill]
    );
  };
  const addEducation = () => {
    if (!education.degree || !education.institution) return toast.error('Degree and institution required');
    setEducationList((prev) => [...prev, { ...education, id: Date.now().toString() }]);
    setEducation({ degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' });
  };
  const removeEducation = (id: string) => setEducationList((prev) => prev.filter((e) => e.id !== id));

  const submitFreelancerProfile = async () => {
    setSubmitting(true);
    try {
      await api.put('/users/freelancer/profile', {
        title: experience.title, bio: experience.bio, experienceYears: parseInt(experience.years) || 0,
        dateOfBirth: personal.dateOfBirth, gender: personal.gender,
        addressLine: address.line, city: address.city, state: address.state, pincode: address.pincode, country: address.country,
        hourlyRate: parseFloat(hourlyRate) || 0,
        identityType: identity.type, identityNumber: identity.number,
        resumeUrl,
      });
      if (skills.length > 0) await api.put('/users/freelancer/skills', { skills: skills.map((s) => ({ id: s.id })) });
      for (const edu of educationList) {
        await api.post('/users/freelancer/education', {
          degree: edu.degree, institution: edu.institution, fieldOfStudy: edu.fieldOfStudy,
          startYear: edu.startYear ? parseInt(edu.startYear) : null,
          endYear: edu.endYear ? parseInt(edu.endYear) : null, grade: edu.grade,
        });
      }
      setStep(7);
      toast.success('Profile completed!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    }
    setSubmitting(false);
  };

  const filteredSkills = allSkills.filter((s) =>
    s.name?.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div className="absolute top-20 -right-20 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-xl relative animate-fade-up">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6 group">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/30 transition-all">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">SkillBridge</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-500 mt-1">Join the AI-powered freelance marketplace</p>
        </div>

        {step <= totalFreelancerSteps && (
          <div className="mb-6 flex items-center justify-center gap-0">
            {displayedSteps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step > s.id ? 'bg-green-500 text-white' :
                  step === s.id ? 'bg-brand-600 text-white ring-2 ring-brand-200' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                {i < displayedSteps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 transition-all duration-300 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 animate-fade-up">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button onClick={() => setRole('CLIENT')} className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${role === 'CLIENT' ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                <Briefcase className={`w-6 h-6 mx-auto mb-1.5 ${role === 'CLIENT' ? 'text-brand-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-semibold ${role === 'CLIENT' ? 'text-brand-700' : 'text-gray-600'}`}>I'm a Client</span>
              </button>
              <button onClick={() => setRole('FREELANCER')} className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${role === 'FREELANCER' ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                <User className={`w-6 h-6 mx-auto mb-1.5 ${role === 'FREELANCER' ? 'text-brand-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-semibold ${role === 'FREELANCER' ? 'text-brand-700' : 'text-gray-600'}`}>I'm a Freelancer</span>
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{role === 'CLIENT' ? 'Company Name' : 'Full Name'}</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder={role === 'CLIENT' ? 'Acme Corp' : 'John Doe'} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+91 98765 43210" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pr-11" placeholder="At least 8 characters" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field pr-11" placeholder="Re-enter your password" required minLength={8} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 group">
                {isLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : <>Create Account <ArrowRight className="ml-2 w-4 h-4 inline group-hover:translate-x-0.5 transition-transform" /></>}
              </button>
            </form>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-gray-400">Or continue with</span></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <button className="btn-secondary py-3 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm" onClick={() => toast.error('Google sign-in coming soon')}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span className="hidden sm:inline">Google</span>
                </button>
                <button className="btn-secondary py-3 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm" onClick={() => toast.error('GitHub sign-in coming soon')}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  <span className="hidden sm:inline">GitHub</span>
                </button>
                <button className="btn-secondary py-3 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm" onClick={() => toast.error('LinkedIn sign-in coming soon')}>
                  <svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  <span className="hidden sm:inline">LinkedIn</span>
                </button>
              </div>
            </div>
            <p className="mt-5 text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Sign in</Link></p>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fade-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mx-auto mb-4"><Mail className="w-7 h-7 text-brand-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Verify your email</h3>
              <p className="text-gray-500 text-sm mt-1">Enter the 6-digit code sent to <span className="font-medium text-gray-700">{form.email}</span></p>
            </div>
            {!emailOtpSent ? (
              <button onClick={handleSendEmailOtp} disabled={otpLoading} className="btn-primary w-full py-3.5">
                {otpLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : <>Send OTP <Mail className="ml-2 w-4 h-4 inline" /></>}
              </button>
            ) : !emailVerified ? (
              <div className="space-y-5">
                <div className="flex justify-center gap-2">
                  {emailOtp.map((d, i) => (
                    <input key={i} ref={(el) => { emailInputRefs.current[i] = el; }}
                      type="text" maxLength={1} value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value, 'email')}
                      onKeyDown={(e) => handleOtpKeyDown(i, e, 'email')}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                  ))}
                </div>
                <button onClick={handleVerifyEmailOtp} disabled={otpLoading || emailOtp.join('').length !== 6} className="btn-primary w-full py-3.5">
                  {otpLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : <>Verify Email <Shield className="ml-2 w-4 h-4 inline" /></>}
                </button>
                <div className="text-center">
                  {emailOtpTimer > 0 ? (
                    <p className="text-sm text-gray-400">Resend in {Math.floor(emailOtpTimer / 60)}:{String(emailOtpTimer % 60).padStart(2, '0')}</p>
                  ) : (
                    <button onClick={handleSendEmailOtp} disabled={otpLoading} className="text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Resend OTP</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-green-600" /></div>
                <p className="text-green-700 font-semibold">Email Verified!</p>
              </div>
            )}
            <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center w-full"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fade-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mx-auto mb-4"><Phone className="w-7 h-7 text-brand-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Verify your mobile</h3>
              <p className="text-gray-500 text-sm mt-1">Enter the 6-digit code sent to <span className="font-medium text-gray-700">{form.phone}</span></p>
            </div>
            {!mobileOtpSent ? (
              <button onClick={handleSendMobileOtp} disabled={otpLoading} className="btn-primary w-full py-3.5">
                {otpLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : <>Send OTP <Phone className="ml-2 w-4 h-4 inline" /></>}
              </button>
            ) : !mobileVerified ? (
              <div className="space-y-5">
                <div className="flex justify-center gap-2">
                  {mobileOtp.map((d, i) => (
                    <input key={i} ref={(el) => { mobileInputRefs.current[i] = el; }}
                      type="text" maxLength={1} value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value, 'mobile')}
                      onKeyDown={(e) => handleOtpKeyDown(i, e, 'mobile')}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                  ))}
                </div>
                <button onClick={handleVerifyMobileOtp} disabled={otpLoading || mobileOtp.join('').length !== 6} className="btn-primary w-full py-3.5">
                  {otpLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : <>Verify Mobile <Shield className="ml-2 w-4 h-4 inline" /></>}
                </button>
                <div className="text-center">
                  {mobileOtpTimer > 0 ? (
                    <p className="text-sm text-gray-400">Resend in {Math.floor(mobileOtpTimer / 60)}:{String(mobileOtpTimer % 60).padStart(2, '0')}</p>
                  ) : (
                    <button onClick={handleSendMobileOtp} disabled={otpLoading} className="text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Resend OTP</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-green-600" /></div>
                <p className="text-green-700 font-semibold">Mobile Verified!</p>
              </div>
            )}
            <button onClick={() => setStep(2)} className="mt-4 text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center w-full"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fade-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mx-auto mb-4"><Calendar className="w-7 h-7 text-brand-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Personal Info & Address</h3>
              <p className="text-gray-500 text-sm">Tell us about yourself</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={personal.dateOfBirth} onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={personal.gender} onChange={(e) => setPersonal({ ...personal, gender: e.target.value })} className="input-field">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <button type="button" onClick={handleAutoDetectAddress} disabled={addressFetching} className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center">
                  {addressFetching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Navigation className="w-3 h-3 mr-1" />}
                  Auto-detect
                </button>
              </div>
              <input type="text" value={address.line} onChange={(e) => setAddress({ ...address, line: e.target.value })} className="input-field mb-2" placeholder="Street, Locality" />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="input-field" placeholder="City" />
                <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="input-field" placeholder="State" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input type="text" value={address.pincode} onChange={(e) => { setAddress({ ...address, pincode: e.target.value }); if (e.target.value.length === 6) handlePincodeLookup(e.target.value); }} className="input-field pr-8" placeholder="Pincode" maxLength={6} />
                  {pincodeLoading && <Loader2 className="absolute right-2.5 top-3 w-4 h-4 animate-spin text-gray-400" />}
                </div>
                <input type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="input-field" placeholder="Country" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</button>
              <button onClick={() => setStep(5)} className="btn-primary flex-1">Continue <ArrowRight className="ml-1.5 w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fade-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mx-auto mb-4"><WorkIcon className="w-7 h-7 text-brand-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Experience, Skills & Education</h3>
              <p className="text-gray-500 text-sm">Showcase your expertise</p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input type="number" value={experience.years} onChange={(e) => setExperience({ ...experience, years: e.target.value })} className="input-field" placeholder="e.g. 3" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                  <input type="text" value={experience.title} onChange={(e) => setExperience({ ...experience, title: e.target.value })} className="input-field" placeholder="e.g. Full Stack Developer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Summary</label>
                <textarea value={experience.bio} onChange={(e) => setExperience({ ...experience, bio: e.target.value })} className="input-field h-20" placeholder="Brief summary of your skills and experience..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input type="text" value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} className="input-field pl-9" placeholder="Search skills..." />
                </div>
                <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-0.5">
                  {filteredSkills.slice(0, 20).map((skill) => {
                    const selected = skills.find((s) => s.id === skill.id);
                    return (
                      <button key={skill.id} type="button" onClick={() => toggleSkill(skill)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selected ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {skill.name} {selected && <Check className="w-3.5 h-3.5 inline float-right mt-0.5 text-brand-600" />}
                      </button>
                    );
                  })}
                  {filteredSkills.length === 0 && <p className="text-gray-400 text-sm text-center py-2">No skills found</p>}
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skills.map((s) => (
                      <span key={s.id} className="badge bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
                        {s.name} <X className="w-3 h-3 cursor-pointer" onClick={() => toggleSkill(s)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Education</label>
                </div>
                {educationList.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {educationList.map((edu) => (
                      <div key={edu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{edu.degree} at {edu.institution}</p>
                          <p className="text-xs text-gray-400">{edu.startYear}{edu.endYear ? ` - ${edu.endYear}` : ''}</p>
                        </div>
                        <button onClick={() => removeEducation(edu.id)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={education.degree} onChange={(e) => setEducation({ ...education, degree: e.target.value })} className="input-field" placeholder="Degree (e.g. B.Tech)" />
                  <input type="text" value={education.institution} onChange={(e) => setEducation({ ...education, institution: e.target.value })} className="input-field" placeholder="Institution" />
                  <input type="text" value={education.fieldOfStudy} onChange={(e) => setEducation({ ...education, fieldOfStudy: e.target.value })} className="input-field" placeholder="Field of Study" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={education.startYear} onChange={(e) => setEducation({ ...education, startYear: e.target.value })} className="input-field" placeholder="Start Year" />
                    <input type="number" value={education.endYear} onChange={(e) => setEducation({ ...education, endYear: e.target.value })} className="input-field" placeholder="End Year" />
                  </div>
                </div>
                <button type="button" onClick={addEducation} className="mt-2 text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Education
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(4)} className="btn-secondary flex-1"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</button>
              <button onClick={() => setStep(6)} className="btn-primary flex-1">Continue <ArrowRight className="ml-1.5 w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fade-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield className="w-7 h-7 text-brand-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Identity & Rate</h3>
              <p className="text-gray-500 text-sm">Verification and pricing</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Identity Verification</label>
                <select value={identity.type} onChange={(e) => setIdentity({ ...identity, type: e.target.value })} className="input-field">
                  <option value="">Select ID type</option>
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="PAN">PAN Card</option>
                  <option value="DIGILOCKER">DigiLocker</option>
                </select>
              </div>
              {identity.type && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                    <input type="text" value={identity.number} onChange={(e) => setIdentity({ ...identity, number: e.target.value })} className="input-field" placeholder="Enter ID number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document (optional)</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-300 transition-colors cursor-pointer">
                      <input type="file" accept="image/*,.pdf" className="hidden" id="idUpload" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setIdentity({ ...identity, documentUrl: file.name });
                      }} />
                      <label htmlFor="idUpload" className="cursor-pointer">
                        <CreditCard className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload ID document</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF (max 5MB)</p>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Resume (PDF)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-300 transition-colors cursor-pointer">
                  <input type="file" accept=".pdf" className="hidden" id="resumeUpload" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setResumeUrl(file.name);
                  }} />
                  <label htmlFor="resumeUpload" className="cursor-pointer">
                    <BookOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">{resumeUrl || 'Click to upload resume (PDF)'}</p>
                    <p className="text-xs text-gray-400 mt-1">PDF only (max 5MB)</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Hourly Rate (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="input-field pl-9" placeholder="e.g. 500" min="0" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(5)} className="btn-secondary flex-1"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</button>
              <button onClick={submitFreelancerProfile} disabled={submitting} className="btn-primary flex-1">
                {submitting ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : <>Complete Profile <Check className="ml-1.5 w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scale-in text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h3>
            <p className="text-gray-500 mb-2">Your account has been created with all verifications complete.</p>
            <p className="text-gray-400 text-sm mb-8">Start exploring projects and connecting with clients.</p>
            <Link to="/dashboard" className="btn-primary py-3.5 px-8 inline-flex items-center group">
              Go to Dashboard <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
