import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ProfileSkeleton } from '../components/ui/Skeleton';
import { MapPin, DollarSign, Star, Briefcase, Award, Globe, Calendar, Mail } from 'lucide-react';

export default function FreelancerProfile() {
  const { id } = useParams();
  const [freelancer, setFreelancer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/freelancer/${id}`).then((res) => {
      setFreelancer(res.data.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in"><ProfileSkeleton /></div>;
  if (!freelancer) return <div className="text-center py-20 animate-fade-up"><div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase className="w-10 h-10 text-gray-300" /></div><p className="text-gray-500">Freelancer not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="card mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-3xl font-bold text-brand-700">{freelancer.user?.name?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{freelancer.user?.name}</h1>
            <p className="text-gray-500 mt-0.5">{freelancer.title || 'Freelancer'}</p>
            <div className="flex flex-wrap gap-3 mt-4 text-sm">
              {freelancer.location && <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600"><MapPin className="w-4 h-4 mr-1.5 text-gray-400" />{freelancer.location}</span>}
              {freelancer.hourlyRate && <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600"><DollarSign className="w-4 h-4 mr-1.5 text-gray-400" />₹{freelancer.hourlyRate}/hr</span>}
              {freelancer.rating && <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600"><Star className="w-4 h-4 mr-1.5 text-yellow-400 fill-yellow-400" />{freelancer.rating}/5</span>}
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600"><Briefcase className="w-4 h-4 mr-1.5 text-gray-400" />{freelancer.experienceYears} years exp</span>
              {freelancer.aiScore && <span className="inline-flex items-center px-3 py-1.5 bg-purple-50 rounded-lg text-purple-700"><Award className="w-4 h-4 mr-1.5" />AI Score: {freelancer.aiScore}</span>}
            </div>
          </div>
        </div>
      </div>

      {freelancer.bio && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <p className="text-gray-600 leading-relaxed">{freelancer.bio}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {freelancer.userSkills?.map((us: any) => (
              <span key={us.skill.id} className="badge bg-brand-50 text-brand-700 border border-brand-200 font-medium">{us.skill.name}</span>
            ))}
            {(!freelancer.userSkills || freelancer.userSkills.length === 0) && (
              <p className="text-gray-400 text-sm">No skills listed</p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Languages</h2>
          {freelancer.languages?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {freelancer.languages.map((lang: string) => (
                <span key={lang} className="badge bg-gray-100 text-gray-700 border border-gray-200">{lang}</span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No languages listed</p>
          )}
        </div>
      </div>

      {freelancer.portfolios?.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {freelancer.portfolios.map((item: any, i: number) => (
              <div key={item.id} className="group rounded-xl overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm text-gray-900">{item.title}</p>
                  {item.projectUrl && (
                    <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 flex items-center mt-1.5 hover:text-brand-700 transition-colors">
                      <Globe className="w-3 h-3 mr-1" /> View Project
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {freelancer.reviews?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          <div className="space-y-4">
            {freelancer.reviews.map((review: any, i: number) => (
              <div key={review.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">{review.reviewer?.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{review.reviewer?.name}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: review.rating }, (_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
