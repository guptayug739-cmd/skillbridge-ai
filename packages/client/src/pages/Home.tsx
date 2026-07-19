import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { useEffect, useState, useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import SEO from '../components/ui/SEO';
import { ArrowRight, Sparkles, Briefcase, Users, Shield, Zap, BarChart, MessageSquare, Star, ChevronRight, CheckCircle } from 'lucide-react';

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * end));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center group">
      <div className="text-4xl md:text-5xl font-bold gradient-text mb-1 transition-all duration-300 group-hover:scale-105">
        {count}{suffix}
      </div>
      <div className="text-gray-400 text-sm font-medium">{label}</div>
    </div>
  );
}

function AnimateOnScroll({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  return (
    <div ref={ref} className={`transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const features = [
    { icon: Sparkles, title: 'AI-Powered Matching', description: 'Smart algorithms match you with the perfect projects or freelancers based on skills, experience, and work style.' },
    { icon: Shield, title: 'Secure Escrow Payments', description: 'Funds held securely and released automatically when work is approved. Peace of mind for both parties.' },
    { icon: MessageSquare, title: 'Real-Time Collaboration', description: 'Built-in chat, file sharing, and milestone tracking for seamless project management from start to finish.' },
    { icon: Zap, title: 'Smart Proposals', description: 'AI-generated proposal drafts help freelancers apply faster and win more projects with less effort.' },
    { icon: BarChart, title: 'Analytics & Insights', description: 'Track earnings, project success rates, and growth with beautiful, actionable dashboards.' },
    { icon: Users, title: 'Verified Talent Pool', description: 'Every freelancer and company is verified for a trusted, high-quality marketplace experience.' },
  ];

  const steps = [
    { number: '01', title: 'Create Account', description: 'Sign up as a freelancer or client in under 2 minutes.' },
    { number: '02', title: 'AI Matching', description: 'Our AI finds the best matches based on your requirements.' },
    { number: '03', title: 'Collaborate & Deliver', description: 'Work together with built-in tools and secure payments.' },
  ];

  return (
    <div>
      <SEO title="Home" description="SkillBridge AI is an intelligent freelance marketplace connecting skilled freelancers with clients. AI-powered matching, secure payments, and seamless project management." />
      <section className="relative overflow-hidden bg-gray-50">
        <div className="absolute inset-0 bg-grid opacity-40"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-50/50 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 relative">
          <div className="text-center max-w-4xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200/50 text-brand-700 text-sm font-medium mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-brand-500" /> AI-Powered Freelance Marketplace
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Hire Smarter.<br />
              <span className="gradient-text">Work Faster.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              The AI-powered platform connecting exceptional freelancers with forward-thinking companies.
              Skip the noise, find the perfect match.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to={user?.role === 'FREELANCER' ? '/projects' : '/dashboard'} className="btn-primary text-lg px-8 py-4 shadow-lg shadow-brand-600/25 group">
                  Go to Dashboard <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-4 shadow-lg shadow-brand-600/25 group">
                    Start Hiring <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link to="/register?role=freelancer" className="btn-secondary text-lg px-8 py-4 group">
                    Start Working <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <AnimateOnScroll>
        <section className="py-16 md:py-20 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <AnimatedStat value={10000} label="Active Freelancers" suffix="+" />
              <AnimatedStat value={25000} label="Projects Completed" suffix="+" />
              <AnimatedStat value={98} label="Client Satisfaction" suffix="%" />
              <AnimatedStat value={50} label="Total Payouts (Cr)" suffix="+" />
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-brand-600 uppercase tracking-widest">Features</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">Why SkillBridge AI?</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">We combine cutting-edge AI with a seamless experience to transform how freelance work gets done.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div key={feature.title} className="group card-hover transition-all duration-500 hover:scale-[1.02]" style={{ animation: `fadeUp 0.6s ease-out ${i * 0.1}s forwards` }}>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center mb-4 group-hover:from-brand-100 group-hover:to-brand-200 group-hover:scale-110 transition-all duration-300 shadow-sm">
                    <feature.icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-700 transition-colors">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-brand-600 uppercase tracking-widest">How It Works</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">Simple 3-Step Process</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Get started in minutes and find your perfect match.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {steps.map((step, i) => (
                <div key={step.number} className="text-center transition-all duration-700 hover:scale-105" style={{ animation: `fadeUp 0.6s ease-out ${i * 0.15}s forwards` }}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/20 group-hover:shadow-xl group-hover:shadow-brand-500/30 transition-all">
                    <span className="text-xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800"></div>
        <div className="absolute inset-0 bg-grid opacity-[0.07]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-purple-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }}></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <span className="text-sm font-semibold text-brand-200 uppercase tracking-widest">Get Started Today</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-3 mb-6">Ready to Transform Your Work?</h2>
          <p className="text-brand-100/80 text-lg mb-10 max-w-2xl mx-auto">Join thousands of freelancers and companies already using SkillBridge AI to find their perfect match.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="inline-flex items-center px-8 py-4 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-all shadow-xl shadow-black/10 group">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/projects" className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10">
              Browse Projects
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-brand-200">
            <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5" /> No credit card</span>
            <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5" /> Free to join</span>
            <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5" /> Cancel anytime</span>
          </div>
        </div>
      </section>
      </AnimateOnScroll>
    </div>
  );
}
