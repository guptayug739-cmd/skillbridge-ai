import { PrismaClient, UserRole, ProjectStatus, ProposalStatus, ContractStatus, MilestoneStatus, EscrowStatus, PaymentStatus, TransactionType, DisputeStatus, VerificationStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const categories = [
    { name: 'Web Development', icon: '🌐' },
    { name: 'Mobile Development', icon: '📱' },
    { name: 'UI/UX Design', icon: '🎨' },
    { name: 'Graphic Design', icon: '🖼️' },
    { name: 'Content Writing', icon: '✍️' },
    { name: 'Digital Marketing', icon: '📈' },
    { name: 'Data Science', icon: '📊' },
    { name: 'Machine Learning', icon: '🤖' },
    { name: 'DevOps', icon: '⚙️' },
    { name: 'Cloud Computing', icon: '☁️' },
    { name: 'Cybersecurity', icon: '🔒' },
    { name: 'Blockchain', icon: '🔗' },
    { name: 'Video Editing', icon: '🎬' },
    { name: 'Virtual Assistant', icon: '🤝' },
    { name: 'Customer Support', icon: '📞' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const skills = [
    { name: 'React', category: 'Web Development' },
    { name: 'Angular', category: 'Web Development' },
    { name: 'Vue.js', category: 'Web Development' },
    { name: 'Node.js', category: 'Web Development' },
    { name: 'Python', category: 'Data Science' },
    { name: 'Django', category: 'Web Development' },
    { name: 'Flask', category: 'Web Development' },
    { name: 'TypeScript', category: 'Web Development' },
    { name: 'JavaScript', category: 'Web Development' },
    { name: 'HTML/CSS', category: 'Web Development' },
    { name: 'Tailwind CSS', category: 'Web Development' },
    { name: 'Figma', category: 'UI/UX Design' },
    { name: 'Adobe XD', category: 'UI/UX Design' },
    { name: 'Sketch', category: 'UI/UX Design' },
    { name: 'Photoshop', category: 'Graphic Design' },
    { name: 'Illustrator', category: 'Graphic Design' },
    { name: 'After Effects', category: 'Video Editing' },
    { name: 'Premiere Pro', category: 'Video Editing' },
    { name: 'Final Cut Pro', category: 'Video Editing' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Kubernetes', category: 'DevOps' },
    { name: 'AWS', category: 'Cloud Computing' },
    { name: 'Azure', category: 'Cloud Computing' },
    { name: 'GCP', category: 'Cloud Computing' },
    { name: 'PostgreSQL', category: 'Web Development' },
    { name: 'MongoDB', category: 'Web Development' },
    { name: 'Redis', category: 'Web Development' },
    { name: 'GraphQL', category: 'Web Development' },
    { name: 'REST API', category: 'Web Development' },
    { name: 'SEO', category: 'Digital Marketing' },
    { name: 'SEM', category: 'Digital Marketing' },
    { name: 'Social Media Marketing', category: 'Digital Marketing' },
    { name: 'Content Strategy', category: 'Content Writing' },
    { name: 'Copywriting', category: 'Content Writing' },
    { name: 'Technical Writing', category: 'Content Writing' },
    { name: 'Swift', category: 'Mobile Development' },
    { name: 'Kotlin', category: 'Mobile Development' },
    { name: 'Flutter', category: 'Mobile Development' },
    { name: 'React Native', category: 'Mobile Development' },
    { name: 'TensorFlow', category: 'Machine Learning' },
    { name: 'PyTorch', category: 'Machine Learning' },
    { name: 'Solidity', category: 'Blockchain' },
    { name: 'Ethereum', category: 'Blockchain' },
    { name: 'Penetration Testing', category: 'Cybersecurity' },
    { name: 'Network Security', category: 'Cybersecurity' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  const hashedPassword = await bcrypt.hash('password123', 12);

  // ─── ADMIN ───
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@skillbridge.ai' },
    update: {},
    create: {
      email: 'admin@skillbridge.ai',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
      isVerified: true,
      admin: { create: { permissions: ['ALL'] } },
      wallet: { create: {} },
    },
  });

  // ─── CLIENTS ───
  const clientData = [
    { email: 'client@example.com', name: 'Acme Corp', company: 'Acme Corporation', website: 'https://acme.example.com', size: '50-200', industry: 'Technology', desc: 'A leading technology company focused on innovation.' },
    { email: 'sarah@techstart.io', name: 'Sarah Chen', company: 'TechStart Inc', website: 'https://techstart.io', size: '10-50', industry: 'SaaS', desc: 'Early-stage startup building the next generation of developer tools.' },
    { email: 'marcus@designstudio.co', name: 'Marcus Johnson', company: 'DesignStudio Co', website: 'https://designstudio.co', size: '10-50', industry: 'Design', desc: 'Award-winning design studio crafting beautiful digital experiences.' },
    { email: 'emma@contentlab.com', name: 'Emma Wilson', company: 'ContentLab', website: 'https://contentlab.com', size: '5-10', industry: 'Media', desc: 'Content agency producing high-quality B2B and technical content.' },
    { email: 'raj@growthmarket.com', name: 'Raj Patel', company: 'GrowthMarketers', website: 'https://growthmarket.com', size: '10-50', industry: 'Marketing', desc: 'Data-driven marketing agency helping brands scale.' },
    { email: 'james@securenet.com', name: 'James Anderson', company: 'SecureNet Solutions', website: 'https://securenet.com', size: '50-200', industry: 'Cybersecurity', desc: 'Enterprise cybersecurity consulting firm.' },
  ];

  interface ClientInfo {
    user: Awaited<typeof prisma.user.create>;
    client: Awaited<typeof prisma.client.findUnique>;
  }

  const clients: { email: string; user: any; client: any }[] = [];

  for (const c of clientData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        password: hashedPassword,
        name: c.name,
        role: 'CLIENT',
        isVerified: true,
        client: {
          create: {
            companyName: c.company,
            companyWebsite: c.website,
            companySize: c.size,
            industry: c.industry,
            companyDescription: c.desc,
            verificationStatus: 'VERIFIED',
          },
        },
        wallet: { create: {} },
      },
      include: { client: true },
    });
    clients.push({ email: c.email, user, client: user.client });
  }

  // ─── FREELANCERS ───
  const freelancerData = [
    { email: 'freelancer@example.com', name: 'John Developer', skillNames: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'GraphQL', 'Docker'], title: 'Full Stack Developer', bio: 'Experienced full stack developer with 5+ years building scalable web applications.', rate: 1500, exp: 5, rating: 4.8, aiScore: 85 },
    { email: 'sarah.designer@email.com', name: 'Sarah Designer', skillNames: ['Figma', 'Adobe XD', 'Sketch', 'HTML/CSS', 'Tailwind CSS', 'Photoshop'], title: 'Senior UI/UX Designer', bio: 'Passionate about creating intuitive user experiences with a strong focus on design systems.', rate: 1200, exp: 6, rating: 4.9, aiScore: 92 },
    { email: 'mike.writer@email.com', name: 'Mike Writer', skillNames: ['Content Strategy', 'Copywriting', 'Technical Writing', 'SEO'], title: 'Content Writer & Strategist', bio: 'Award-winning writer specializing in B2B tech content and documentation.', rate: 800, exp: 4, rating: 4.6, aiScore: 78 },
    { email: 'alex.data@email.com', name: 'Alex Data', skillNames: ['Python', 'TensorFlow', 'PyTorch', 'PostgreSQL', 'REST API', 'AWS'], title: 'Data Scientist & ML Engineer', bio: 'PhD in Computer Science with expertise in building production ML pipelines.', rate: 2000, exp: 7, rating: 4.7, aiScore: 90 },
    { email: 'priya.mobile@email.com', name: 'Priya Mobile', skillNames: ['Flutter', 'React Native', 'Swift', 'Kotlin', 'JavaScript', 'Firebase'], title: 'Mobile App Developer', bio: 'Cross-platform mobile developer with 15+ apps shipped on App Store and Play Store.', rate: 1800, exp: 5, rating: 4.8, aiScore: 88 },
    { email: 'david.marketing@email.com', name: 'David Marketing', skillNames: ['SEO', 'SEM', 'Social Media Marketing', 'Content Strategy', 'Analytics'], title: 'Digital Marketing Specialist', bio: 'Helped 50+ brands grow their online presence with data-driven marketing strategies.', rate: 1000, exp: 6, rating: 4.5, aiScore: 82 },
    { email: 'emily.sec@email.com', name: 'Emily Security', skillNames: ['Penetration Testing', 'Network Security', 'Python', 'AWS', 'Docker'], title: 'Cybersecurity Consultant', bio: 'Certified ethical hacker (CEH, OSCP) with 8 years in enterprise security.', rate: 2500, exp: 8, rating: 4.9, aiScore: 95 },
    { email: 'raj.devops@email.com', name: 'Raj DevOps', skillNames: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Python'], title: 'DevOps & Cloud Engineer', bio: 'Infrastructure architect specializing in Kubernetes and multi-cloud deployments.', rate: 2200, exp: 7, rating: 4.7, aiScore: 91 },
    { email: 'lisa.video@email.com', name: 'Lisa Video', skillNames: ['After Effects', 'Premiere Pro', 'Final Cut Pro', 'Photoshop', 'Illustrator'], title: 'Video Editor & Motion Designer', bio: 'Creative video editor with 6 years experience in commercial and explainer videos.', rate: 900, exp: 6, rating: 4.6, aiScore: 84 },
    { email: 'tom.blockchain@email.com', name: 'Tom Blockchain', skillNames: ['Solidity', 'Ethereum', 'Node.js', 'React', 'TypeScript'], title: 'Blockchain Developer', bio: 'Smart contract auditor and dApp developer with DeFi experience.', rate: 3000, exp: 4, rating: 4.4, aiScore: 79 },
    { email: 'anna.support@email.com', name: 'Anna Support', skillNames: ['Customer Support', 'CRM', 'Email Management', 'Project Management'], title: 'Virtual Assistant & Customer Support', bio: 'Helping startups streamline operations with top-notch administrative support.', rate: 500, exp: 3, rating: 4.7, aiScore: 86 },
    { email: 'carlos.backend@email.com', name: 'Carlos Backend', skillNames: ['Python', 'Node.js', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'Docker', 'AWS'], title: 'Backend Engineer', bio: 'Scalable systems architect with expertise in microservices and real-time applications.', rate: 1700, exp: 6, rating: 4.6, aiScore: 87 },
    { email: 'lena.frontend@email.com', name: 'Lena Frontend', skillNames: ['React', 'Vue.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'GraphQL', 'Figma'], title: 'Frontend Engineer', bio: 'Pixel-perfect React and Vue.js developer with an eye for design and accessibility.', rate: 1300, exp: 4, rating: 4.8, aiScore: 89 },
  ];

  interface FreelancerInfo {
    email: string;
    user: any;
    freelancer: any;
  }

  const freelancers: FreelancerInfo[] = [];

  for (const f of freelancerData) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: {},
      create: {
        email: f.email,
        password: hashedPassword,
        name: f.name.split(' ')[0],
        role: 'FREELANCER',
        isVerified: true,
        freelancer: {
          create: {
            title: f.title,
            bio: f.bio,
            hourlyRate: f.rate,
            experienceYears: f.exp,
            rating: f.rating,
            aiScore: f.aiScore,
            available: true,
          },
        },
        wallet: { create: { balance: Math.floor(Math.random() * 50000) } },
      },
      include: { freelancer: true },
    });

    for (const skillName of f.skillNames) {
      const skill = await prisma.skill.findUnique({ where: { name: skillName } });
      if (skill) {
        await prisma.userSkill.upsert({
          where: { freelancerId_skillId: { freelancerId: user.freelancer!.id, skillId: skill.id } },
          update: {},
          create: { freelancerId: user.freelancer!.id, skillId: skill.id },
        });
      }
    }

    freelancers.push({ email: f.email, user, freelancer: user.freelancer });
  }

  // ─── PORTFOLIOS ───
  const portfolioItems = [
    { email: 'sarah.designer@email.com', title: 'FinTech Dashboard Redesign', desc: 'Complete UX overhaul for a financial analytics platform serving 50K+ users.', tags: ['UX Research', 'Dashboard', 'FinTech'] },
    { email: 'sarah.designer@email.com', title: 'E-commerce Mobile App', desc: 'Designed the full app experience for a fashion marketplace.', tags: ['Mobile', 'E-commerce', 'Prototyping'] },
    { email: 'lena.frontend@email.com', title: 'SaaS Analytics Platform', desc: 'Built a real-time analytics dashboard with interactive charts and data visualization.', tags: ['React', 'D3.js', 'TypeScript'] },
    { email: 'lena.frontend@email.com', title: 'Healthcare Portal', desc: 'Accessible healthcare patient portal with appointment scheduling and telemedicine.', tags: ['React', 'Accessibility', 'Healthcare'] },
    { email: 'priya.mobile@email.com', title: 'Food Delivery App', desc: 'Cross-platform food delivery app with real-time tracking and in-app payments.', tags: ['Flutter', 'Firebase', 'Maps'] },
    { email: 'alex.data@email.com', title: 'Fraud Detection System', desc: 'ML-based real-time fraud detection system processing 1M+ transactions daily.', tags: ['Python', 'ML', 'Real-time'] },
    { email: 'lisa.video@email.com', title: 'Product Launch Video', desc: 'Animated explainer video for a SaaS product launch that drove 30% conversion.', tags: ['Animation', 'Explainer', 'Motion Design'] },
  ];

  for (const p of portfolioItems) {
    const f = freelancers.find(fr => fr.email === p.email);
    if (f) {
      const existing = await prisma.portfolio.findFirst({
        where: { freelancerId: f.freelancer.id, title: p.title },
      });
      if (!existing) {
        await prisma.portfolio.create({
          data: {
            freelancerId: f.freelancer.id,
            title: p.title,
            description: p.desc,
            imageUrl: `https://picsum.photos/seed/${encodeURIComponent(p.title)}/800/600`,
            tags: p.tags,
          },
        });
      }
    }
  }

  // ─── PROJECTS ───
  const projectData = [
    { clientEmail: 'sarah@techstart.io', title: 'Build E-commerce Platform', desc: 'We need a full-featured e-commerce platform with product management, cart, checkout, payment integration (Razorpay), and an admin dashboard.', cat: 'Web Development', budgetMin: 50000, budgetMax: 150000, budgetType: 'FIXED', expLevel: 'EXPERT', duration: '3 months', deadlineDays: 90, status: 'OPEN' as ProjectStatus, skillNames: ['React', 'Node.js', 'PostgreSQL', 'REST API', 'TypeScript', 'Redis'] },
    { clientEmail: 'marcus@designstudio.co', title: 'SaaS Landing Page Design', desc: 'Design a modern, conversion-optimized landing page for our B2B SaaS product. Must include animations and responsive design.', cat: 'UI/UX Design', budgetMin: 15000, budgetMax: 40000, budgetType: 'FIXED', expLevel: 'INTERMEDIATE', duration: '2 weeks', deadlineDays: 14, status: 'OPEN' as ProjectStatus, skillNames: ['Figma', 'UI/UX Design', 'Prototyping'] },
    { clientEmail: 'emma@contentlab.com', title: 'Technical Blog Content Package', desc: 'Looking for 10 technical blog posts (1500-2000 words each) about web development, cloud computing, and AI/ML topics.', cat: 'Content Writing', budgetMin: 15000, budgetMax: 30000, budgetType: 'FIXED', expLevel: 'INTERMEDIATE', duration: '1 month', deadlineDays: 30, status: 'OPEN' as ProjectStatus, skillNames: ['Technical Writing', 'SEO', 'Content Strategy'] },
    { clientEmail: 'raj@growthmarket.com', title: 'Full SEO Audit & Strategy', desc: 'Comprehensive SEO audit for our SaaS website followed by a 6-month growth strategy including technical SEO, content plan, and link building.', cat: 'Digital Marketing', budgetMin: 25000, budgetMax: 60000, budgetType: 'FIXED', expLevel: 'EXPERT', duration: '2 months', deadlineDays: 60, status: 'OPEN' as ProjectStatus, skillNames: ['SEO', 'SEM', 'Content Strategy', 'Social Media Marketing'] },
    { clientEmail: 'james@securenet.com', title: 'Penetration Testing Engagement', desc: 'Full-scope penetration test of our web application and internal network infrastructure. Must provide detailed report with remediation steps.', cat: 'Cybersecurity', budgetMin: 80000, budgetMax: 200000, budgetType: 'FIXED', expLevel: 'EXPERT', duration: '1 month', deadlineDays: 30, status: 'OPEN' as ProjectStatus, skillNames: ['Penetration Testing', 'Network Security', 'Python'] },
    { clientEmail: 'sarah@techstart.io', title: 'Mobile Fitness Tracker App', desc: 'Cross-platform fitness tracking app with workout logging, progress charts, social features, and Apple Health/Google Fit integration.', cat: 'Mobile Development', budgetMin: 80000, budgetMax: 200000, budgetType: 'FIXED', expLevel: 'EXPERT', duration: '4 months', deadlineDays: 120, status: 'OPEN' as ProjectStatus, skillNames: ['Flutter', 'React Native', 'Firebase', 'REST API'] },
    { clientEmail: 'client@example.com', title: 'Company Dashboard & Analytics', desc: 'Internal dashboard for tracking company KPIs, sales metrics, and team performance with customizable reports.', cat: 'Web Development', budgetMin: 40000, budgetMax: 100000, budgetType: 'FIXED', expLevel: 'INTERMEDIATE', duration: '2 months', deadlineDays: 60, status: 'OPEN' as ProjectStatus, skillNames: ['React', 'Node.js', 'PostgreSQL', 'GraphQL'] },
    { clientEmail: 'marcus@designstudio.co', title: 'Brand Identity & Design System', desc: 'Create a complete brand identity including logo, color palette, typography, and a comprehensive design system for our web and mobile products.', cat: 'Graphic Design', budgetMin: 30000, budgetMax: 75000, budgetType: 'FIXED', expLevel: 'EXPERT', duration: '6 weeks', deadlineDays: 42, status: 'OPEN' as ProjectStatus, skillNames: ['Illustrator', 'Photoshop', 'Figma'] },
    { clientEmail: 'emma@contentlab.com', title: 'API Documentation Overhaul', desc: 'Rewrite and restructure our entire API documentation for developer-friendliness, including code examples and interactive playground.', cat: 'Content Writing', budgetMin: 20000, budgetMax: 45000, budgetType: 'FIXED', expLevel: 'INTERMEDIATE', duration: '3 weeks', deadlineDays: 21, status: 'OPEN' as ProjectStatus, skillNames: ['Technical Writing', 'REST API', 'Copywriting'] },
    { clientEmail: 'raj@growthmarket.com', title: 'Social Media Ad Campaign', desc: 'Create and manage Facebook, Instagram, and LinkedIn ad campaigns for our B2B SaaS product targeting CTOs and engineering leaders.', cat: 'Digital Marketing', budgetMin: 35000, budgetMax: 80000, budgetType: 'FIXED', expLevel: 'INTERMEDIATE', duration: '3 months', deadlineDays: 90, status: 'OPEN' as ProjectStatus, skillNames: ['Social Media Marketing', 'SEM', 'Content Strategy'] },
    { clientEmail: 'client@example.com', title: 'Cloud Infrastructure Migration', desc: 'Migrate our on-premise infrastructure to AWS with minimal downtime, including containerization with Docker and orchestration with Kubernetes.', cat: 'Cloud Computing', budgetMin: 100000, budgetMax: 250000, budgetType: 'FIXED', expLevel: 'EXPERT', duration: '3 months', deadlineDays: 90, status: 'OPEN' as ProjectStatus, skillNames: ['AWS', 'Docker', 'Kubernetes', 'Terraform'] },
    { clientEmail: 'james@securenet.com', title: 'Security Training Video Series', desc: 'Produce a series of 8 training videos on cybersecurity awareness for enterprise employees (5-10 minutes each).', cat: 'Video Editing', budgetMin: 40000, budgetMax: 80000, budgetType: 'FIXED', expLevel: 'INTERMEDIATE', duration: '6 weeks', deadlineDays: 42, status: 'OPEN' as ProjectStatus, skillNames: ['After Effects', 'Premiere Pro', 'Animation'] },
  ];

  const webDevCat = await prisma.category.findUnique({ where: { name: 'Web Development' } });
  const uiuxCat = await prisma.category.findUnique({ where: { name: 'UI/UX Design' } });
  const contentCat = await prisma.category.findUnique({ where: { name: 'Content Writing' } });
  const digitalCat = await prisma.category.findUnique({ where: { name: 'Digital Marketing' } });
  const cyberCat = await prisma.category.findUnique({ where: { name: 'Cybersecurity' } });
  const mobileCat = await prisma.category.findUnique({ where: { name: 'Mobile Development' } });
  const graphicCat = await prisma.category.findUnique({ where: { name: 'Graphic Design' } });
  const cloudCat = await prisma.category.findUnique({ where: { name: 'Cloud Computing' } });
  const videoCat = await prisma.category.findUnique({ where: { name: 'Video Editing' } });

  const categoryMap: Record<string, any> = {
    'Web Development': webDevCat,
    'UI/UX Design': uiuxCat,
    'Content Writing': contentCat,
    'Digital Marketing': digitalCat,
    'Cybersecurity': cyberCat,
    'Mobile Development': mobileCat,
    'Graphic Design': graphicCat,
    'Cloud Computing': cloudCat,
    'Video Editing': videoCat,
  };

  const createdProjects: any[] = [];

  for (const p of projectData) {
    const clientInfo = clients.find(c => c.email === p.clientEmail);
    if (!clientInfo) continue;

    const cat = categoryMap[p.cat];
    if (!cat) continue;

    const existing = await prisma.project.findFirst({
      where: { clientId: clientInfo.client.id, title: p.title },
    });

    if (existing) {
      createdProjects.push(existing);
      continue;
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + p.deadlineDays);

    const project = await prisma.project.create({
      data: {
        clientId: clientInfo.client.id,
        title: p.title,
        description: p.desc,
        categoryId: cat.id,
        budgetMin: p.budgetMin,
        budgetMax: p.budgetMax,
        budgetType: p.budgetType,
        experienceLevel: p.expLevel,
        duration: p.duration,
        deadline,
        status: p.status,
        attachments: [],
        isFeatured: ['Build E-commerce Platform', 'SaaS Landing Page Design', 'Mobile Fitness Tracker App'].includes(p.title),
        proposalsCount: 0,
      },
    });

    for (const skillName of p.skillNames) {
      const skill = await prisma.skill.findUnique({ where: { name: skillName } });
      if (skill) {
        await prisma.projectSkill.create({
          data: { projectId: project.id, skillId: skill.id },
        }).catch(() => {});
      }
    }

    createdProjects.push(project);
  }

  // ─── PROPOSALS ───
  const proposalData = [
    { projectIndex: 0, freelancerEmail: 'lena.frontend@email.com', msg: 'I have built 3 e-commerce platforms using React/Node.js with Razorpay integration. My last project handled 10K+ daily transactions.', amount: 120000, delivery: 75 },
    { projectIndex: 0, freelancerEmail: 'carlos.backend@email.com', msg: 'Full-stack engineer with expertise in scalable e-commerce systems. I can deliver a robust platform within your timeline.', amount: 140000, delivery: 80 },
    { projectIndex: 1, freelancerEmail: 'sarah.designer@email.com', msg: 'I specialize in B2B SaaS landing pages that convert. My designs have improved conversion rates by 35% on average.', amount: 35000, delivery: 14 },
    { projectIndex: 2, freelancerEmail: 'mike.writer@email.com', msg: 'I have written 200+ technical articles for companies like DigitalOcean and Auth0. Can deliver high-quality content consistently.', amount: 25000, delivery: 28 },
    { projectIndex: 3, freelancerEmail: 'david.marketing@email.com', msg: 'SEO specialist with track record of 200%+ organic traffic growth for SaaS companies. Will provide detailed audit and roadmap.', amount: 50000, delivery: 55 },
    { projectIndex: 4, freelancerEmail: 'emily.sec@email.com', msg: 'OSCP-certified pentester with 100+ engagements. I follow PTES methodology and provide actionable remediation reports.', amount: 180000, delivery: 28 },
    { projectIndex: 5, freelancerEmail: 'priya.mobile@email.com', msg: 'Built 10+ cross-platform fitness and health apps with millions of downloads. Expert in HealthKit and Google Fit APIs.', amount: 180000, delivery: 110 },
    { projectIndex: 6, freelancerEmail: 'lena.frontend@email.com', msg: 'Experienced in building admin dashboards with real-time analytics. I use React, D3.js, and GraphQL for optimal performance.', amount: 85000, delivery: 55 },
    { projectIndex: 6, freelancerEmail: 'carlos.backend@email.com', msg: 'Can build the complete backend with real-time data processing and customizable report generation.', amount: 90000, delivery: 50 },
    { projectIndex: 7, freelancerEmail: 'sarah.designer@email.com', msg: 'I have created design systems for 5+ tech companies. I follow atomic design methodology and provide full Figma libraries.', amount: 65000, delivery: 40 },
    { projectIndex: 8, freelancerEmail: 'mike.writer@email.com', msg: 'API documentation specialist. I have documented 30+ REST and GraphQL APIs using Swagger/OpenAPI and ReadMe.', amount: 35000, delivery: 20 },
    { projectIndex: 9, freelancerEmail: 'david.marketing@email.com', msg: 'Managed $500K+ in B2B ad spend on LinkedIn and Meta with ROAS of 4.5x. I know exactly how to target engineering leaders.', amount: 70000, delivery: 85 },
    { projectIndex: 10, freelancerEmail: 'raj.devops@email.com', msg: 'AWS Solutions Architect with 7 years experience. I have migrated 20+ enterprises to cloud with zero-downtime strategies.', amount: 220000, delivery: 85 },
    { projectIndex: 11, freelancerEmail: 'lisa.video@email.com', msg: 'Produced 50+ corporate training videos. I create engaging content with motion graphics and professional voiceover.', amount: 65000, delivery: 40 },
  ];

  for (const prop of proposalData) {
    const project = createdProjects[prop.projectIndex];
    if (!project) continue;
    const freelancer = freelancers.find(f => f.email === prop.freelancerEmail);
    if (!freelancer) continue;

    const exists = await prisma.proposal.findUnique({
      where: { projectId_freelancerId: { projectId: project.id, freelancerId: freelancer.freelancer.id } },
    });
    if (exists) continue;

    const statuses: ProposalStatus[] = ['PENDING', 'PENDING', 'PENDING', 'SHORTLISTED', 'ACCEPTED'];
    const status = statuses[Math.min(prop.projectIndex, statuses.length - 1)];

    await prisma.proposal.create({
      data: {
        projectId: project.id,
        freelancerId: freelancer.freelancer.id,
        coverLetter: prop.msg,
        bidAmount: prop.amount,
        deliveryTime: prop.delivery,
        status,
        attachments: [],
        aiScore: Math.floor(Math.random() * 30) + 65,
      },
    });

    await prisma.project.update({
      where: { id: project.id },
      data: { proposalsCount: { increment: 1 } },
    });
  }

  // ─── CONTRACTS (for accepted proposals) ───
  const acceptedProposals = await prisma.proposal.findMany({
    where: { status: 'ACCEPTED' },
    include: { project: true, freelancer: true },
  });

  interface ContractInfo {
    id: string;
    projectId: string;
    freelancerId: string;
    clientId: string;
  }

  const createdContracts: ContractInfo[] = [];

  for (const proposal of acceptedProposals) {
    const existing = await prisma.contract.findFirst({
      where: { projectId: proposal.projectId, freelancerId: proposal.freelancerId },
    });
    if (existing) {
      createdContracts.push({ id: existing.id, projectId: existing.projectId, freelancerId: existing.freelancerId, clientId: existing.clientId });
      continue;
    }

    const clientInfo = clients.find(c => c.client.id === proposal.project.clientId);
    if (!clientInfo) continue;

    const platformFee = Math.round(proposal.bidAmount * 0.1);
    const freelancerAmount = proposal.bidAmount - platformFee;

    const contract = await prisma.contract.create({
      data: {
        projectId: proposal.projectId,
        freelancerId: proposal.freelancerId,
        clientId: clientInfo.client.id,
        status: 'ACTIVE',
        budget: proposal.bidAmount,
        platformFee,
        freelancerAmount,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        terms: `Standard terms: Payment released upon milestone approval. 10% platform fee applies.`,
        milestones: {
          create: [
            { title: 'Initial Research & Planning', description: 'Research requirements and create detailed plan', amount: Math.round(proposal.bidAmount * 0.2), status: 'APPROVED', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            { title: 'Development Phase 1', description: 'Core feature implementation', amount: Math.round(proposal.bidAmount * 0.4), status: 'IN_REVIEW', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
            { title: 'Testing & Deployment', description: 'QA testing and production deployment', amount: Math.round(proposal.bidAmount * 0.4), status: 'PENDING', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          ],
        },
        escrowAccount: {
          create: {
            amount: proposal.bidAmount,
            platformFee,
            freelancerAmount,
            status: 'HELD',
            razorpayOrderId: `order_sample_${proposal.id.slice(0, 8)}`,
          },
        },
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: proposal.projectId },
      data: { status: 'IN_PROGRESS', hiredFreelancerId: proposal.freelancerId },
    });

    createdContracts.push({ id: contract.id, projectId: contract.projectId, freelancerId: contract.freelancerId, clientId: contract.clientId });
  }

  // ─── REVIEWS (for completed milestones) ───
  const reviewPairs = [
    { contractIndex: 0, reviewerIsClient: true, rating: 5, content: 'Excellent work! The developer delivered high-quality code ahead of schedule.' },
    { contractIndex: 0, reviewerIsClient: false, rating: 5, content: 'Great client, very clear requirements and prompt payments.' },
  ];

  for (const r of reviewPairs) {
    const contract = createdContracts[r.contractIndex];
    if (!contract) continue;

    const reviewExists = await prisma.review.findFirst({
      where: { contractId: contract.id, reviewerId: r.reviewerIsClient ? clients[0].user.id : freelancers[0].user.id },
    });
    if (reviewExists) continue;

    const freelancerRec = await prisma.freelancer.findUnique({ where: { id: contract.freelancerId } });
    if (!freelancerRec) continue;

    await prisma.review.create({
      data: {
        contractId: contract.id,
        reviewerId: r.reviewerIsClient ? clients[0].user.id : freelancers[0].user.id,
        revieweeId: freelancerRec.id,
        rating: r.rating,
        content: r.content,
      },
    });
  }

  // ─── SAMPLE MESSAGES ───
  const messageThreads = [
    { contractIndex: 0, senderIsClient: true, content: 'Hi! Thanks for accepting the project. Let me know if you need any clarification on the requirements.' },
    { contractIndex: 0, senderIsClient: false, content: 'Thanks! I have reviewed the requirements and will start with the architecture design. Will share the plan by end of day.' },
    { contractIndex: 0, senderIsClient: true, content: 'Sounds great! Looking forward to seeing the plan.' },
    { contractIndex: 0, senderIsClient: false, content: 'Here is the architecture plan. I have used a microservices approach with Redis caching for performance.' },
  ];

  for (const msg of messageThreads) {
    const contract = createdContracts[msg.contractIndex];
    if (!contract) continue;

    const senderId = msg.senderIsClient
      ? clients.find(c => c.client.id === contract.clientId)?.user.id
      : freelancers.find(f => f.freelancer.id === contract.freelancerId)?.user.id;

    if (!senderId) continue;

    await prisma.message.create({
      data: {
        contractId: contract.id,
        senderId,
        content: msg.content,
        attachments: [],
        createdAt: new Date(Date.now() - (messageThreads.length - messageThreads.indexOf(msg)) * 3600000),
      },
    });
  }

  // ─── SOME TRANSACTIONS ───
  const clientUser = clients[0].user;
  const freelancerUser = freelancers[0].user;

  const txExists = await prisma.transaction.findFirst({ where: { userId: clientUser.id } });
  if (!txExists) {
    await prisma.transaction.createMany({
      data: [
        { userId: clientUser.id, type: 'DEPOSIT', amount: 100000, fee: 0, netAmount: 100000, status: 'COMPLETED', referenceType: 'RAZORPAY', referenceId: `pay_sample_dep_1`, description: 'Wallet top-up' },
        { userId: clientUser.id, type: 'PAYMENT', amount: 50000, fee: 5000, netAmount: 45000, status: 'COMPLETED', referenceType: 'CONTRACT', referenceId: createdContracts[0]?.id, description: 'Payment for E-commerce Platform' },
        { userId: freelancerUser.id, type: 'DEPOSIT', amount: 45000, fee: 0, netAmount: 45000, status: 'COMPLETED', referenceType: 'CONTRACT', referenceId: createdContracts[0]?.id, description: 'Received payment for E-commerce Platform' },
        { userId: freelancerUser.id, type: 'WITHDRAWAL', amount: 20000, fee: 100, netAmount: 19900, status: 'PROCESSING', referenceType: 'BANK', description: 'Withdrawal to bank account' },
      ],
    });
  }

  // ─── NOTIFICATIONS ───
  const notifExists = await prisma.notification.findFirst({ where: { userId: freelancerUser.id } });
  if (!notifExists) {
    await prisma.notification.createMany({
      data: [
        { userId: freelancerUser.id, type: 'PROPOSAL_ACCEPTED', title: 'Proposal Accepted!', message: 'Your proposal for "Build E-commerce Platform" has been accepted.', data: { projectId: createdProjects[0]?.id } },
        { userId: freelancerUser.id, type: 'MILESTONE_APPROVED', title: 'Milestone Approved', message: 'Your milestone "Initial Research & Planning" has been approved.', data: {} },
        { userId: clientUser.id, type: 'MILESTONE_COMPLETED', title: 'Milestone Completed', message: 'Milestone "Development Phase 1" has been submitted for review.', data: {} },
      ],
    });
  }

  // ─── SUMMARY ───
  console.log('\n=== Seed Summary ===');
  console.log(`Categories: ${categories.length}`);
  console.log(`Skills: ${skills.length}`);
  console.log(`Admins: 1`);
  console.log(`Clients: ${clients.length}`);
  console.log(`Freelancers: ${freelancers.length}`);
  console.log(`Portfolios: ${portfolioItems.length}`);
  console.log(`Projects: ${createdProjects.length}`);
  console.log(`Proposals: ${proposalData.length}`);
  console.log(`Contracts: ${createdContracts.length}`);
  console.log(`Messages: ${messageThreads.length}`);
  console.log('');
  console.log('=== Test Accounts (all password: password123) ===');
  console.log('Admin:      admin@skillbridge.ai');
  console.log('Client:     client@example.com');
  console.log('Client:     sarah@techstart.io');
  console.log('Client:     marcus@designstudio.co');
  console.log('Client:     emma@contentlab.com');
  console.log('Client:     raj@growthmarket.com');
  console.log('Client:     james@securenet.com');
  console.log('Freelancer: freelancer@example.com (John)');
  console.log('Freelancer: sarah.designer@email.com');
  console.log('Freelancer: mike.writer@email.com');
  console.log('Freelancer: alex.data@email.com');
  console.log('Freelancer: priya.mobile@email.com');
  console.log('Freelancer: david.marketing@email.com');
  console.log('Freelancer: emily.sec@email.com');
  console.log('Freelancer: raj.devops@email.com');
  console.log('Freelancer: lisa.video@email.com');
  console.log('Freelancer: tom.blockchain@email.com');
  console.log('Freelancer: anna.support@email.com');
  console.log('Freelancer: carlos.backend@email.com');
  console.log('Freelancer: lena.frontend@email.com');
  console.log('');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
