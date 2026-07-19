import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

const BASE_URL = 'https://skillbridge.ai';
const DEFAULT_TITLE = 'SkillBridge AI - Connect with Top Freelancers';
const DEFAULT_DESCRIPTION = 'SkillBridge AI is an intelligent freelance marketplace connecting skilled freelancers with clients. AI-powered matching, secure payments, and seamless project management.';

export default function SEO({ title, description, url, image }: SEOProps) {
  const fullTitle = title ? `${title} | SkillBridge AI` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const ogImage = image || `${BASE_URL}/og-image.png`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SkillBridge AI" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
