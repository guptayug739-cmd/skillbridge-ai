import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 lg:gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SkillBridge</span>
              <span className="text-[10px] font-bold text-white bg-gradient-to-r from-brand-500 to-purple-500 px-2 py-0.5 rounded-full tracking-wider uppercase">AI</span>
            </Link>
            <p className="text-gray-500 mb-6 max-w-sm leading-relaxed">
              The AI-powered freelance marketplace connecting top talent with great companies.
              Hire smarter, work faster.
            </p>
            <div className="flex space-x-4">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                <span key={social} className="w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer transition-all duration-200 text-xs font-medium">
                  {social.charAt(0)}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h3>
            <ul className="space-y-3">
              <li><Link to="/projects" className="text-gray-500 hover:text-white transition-colors text-sm">Browse Projects</Link></li>
              <li><Link to="/register" className="text-gray-500 hover:text-white transition-colors text-sm">Create Profile</Link></li>
              <li><Link to="/register" className="text-gray-500 hover:text-white transition-colors text-sm">Post a Project</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">For Freelancers</h3>
            <ul className="space-y-3">
              <li><Link to="/projects" className="text-gray-500 hover:text-white transition-colors text-sm">Find Work</Link></li>
              <li><Link to="/register" className="text-gray-500 hover:text-white transition-colors text-sm">Join as Freelancer</Link></li>
              <li><span className="text-gray-500 text-sm cursor-default">AI Proposals</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">For Clients</h3>
            <ul className="space-y-3">
              <li><Link to="/register" className="text-gray-500 hover:text-white transition-colors text-sm">Post a Project</Link></li>
              <li><Link to="/projects" className="text-gray-500 hover:text-white transition-colors text-sm">Find Talent</Link></li>
              <li><span className="text-gray-500 text-sm cursor-default">Hire Faster</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} SkillBridge AI. All rights reserved.</p>
          <div className="flex space-x-8 text-sm">
            <span className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>
            <span className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">Cookie Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
