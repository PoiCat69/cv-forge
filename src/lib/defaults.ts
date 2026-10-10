import type { AppState, CVData, Customization, Density } from '../types/cv';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyCV: CVData = {
  personal: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    avatar: '',
    avatarZoom: 1,
    avatarOffsetX: 0,
    avatarOffsetY: 0,
    showAvatar: true,
  },
  summary: '',
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  skills: [],
  honors: [],
  sectionVisibility: {
    summary: true,
    experience: true,
    projects: true,
    education: true,
    certifications: true,
    skills: true,
    honors: true,
  },
};

export const sampleCV: CVData = {
  personal: {
    fullName: 'Alex Rivera',
    title: 'Senior Full-Stack Engineer',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 012-3456',
    location: 'San Francisco, CA',
    website: 'alexrivera.dev',
    linkedin: 'linkedin.com/in/alexrivera',
    github: 'github.com/alexrivera',
    avatar: '',
    avatarZoom: 1,
    avatarOffsetX: 0,
    avatarOffsetY: 0,
    showAvatar: true,
  },
  summary:
    'Full-stack engineer with 8+ years shipping high-traffic web products. Specializes in React, TypeScript and Node, with a track record of cutting load times by 40% and leading teams of 5+ engineers.',
  experience: [
    {
      id: uid(),
      company: 'Nimbus Labs',
      role: 'Senior Full-Stack Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2021',
      endDate: '',
      current: true,
      bullets: [
        'Rebuilt the checkout flow in React + TypeScript, lifting conversion by 23% and cutting p95 latency from 1.8s to 0.9s.',
        'Led a team of 5 engineers delivering a design-system migration across 40+ screens on schedule.',
        'Introduced E2E testing (Playwright) raising release confidence and reducing production hotfixes by 60%.',
      ],
      visible: true,
    },
    {
      id: uid(),
      company: 'Orbit Software',
      role: 'Full-Stack Engineer',
      location: 'Remote',
      startDate: 'Jun 2017',
      endDate: 'Dec 2020',
      current: false,
      bullets: [
        'Built a real-time analytics dashboard serving 12k daily users with sub-200ms query response.',
        'Migrated a monolith to a modular service architecture, improving deploy frequency 4x.',
      ],
      visible: true,
    },
  ],
  projects: [
    {
      id: uid(),
      title: 'OpenGraph Studio',
      tech: ['React', 'Node', 'Canvas API'],
      link: 'github.com/alexrivera/og-studio',
      description: 'Drag-and-drop social-card generator used by 3k+ developers.',
      achievements: ['Hit #2 on Product Hunt', '3k+ GitHub stars'],
      visible: true,
    },
  ],
  education: [
    {
      id: uid(),
      institution: 'UC Berkeley',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2013',
      endDate: '2017',
      details: 'GPA 3.8 / 4.0 — Dean’s List',
      visible: true,
    },
  ],
  certifications: [
    {
      id: uid(),
      name: 'AWS Solutions Architect — Associate',
      issuer: 'Amazon Web Services',
      date: '2022',
      visible: true,
    },
  ],
  skills: [
    { id: uid(), category: 'Languages', skills: ['TypeScript', 'JavaScript', 'Python', 'Go'] },
    { id: uid(), category: 'Frontend', skills: ['React', 'Next.js', 'Tailwind', 'Vite'] },
    { id: uid(), category: 'Backend', skills: ['Node', 'PostgreSQL', 'Redis', 'GraphQL'] },
    { id: uid(), category: 'Soft Skills', skills: ['Team leadership', 'Mentoring', 'Communication'] },
  ],
  honors: [
    {
      id: uid(),
      title: 'ICPC Regional Finalist',
      issuer: 'ACM-ICPC',
      date: '2016',
      description: 'Top 10 of 200+ teams.',
      visible: true,
    },
  ],
  sectionVisibility: {
    summary: true,
    experience: true,
    projects: true,
    education: true,
    certifications: true,
    skills: true,
    honors: true,
  },
};

export const defaultCustomization: Customization = {
  template: 'modern',
  accent: '#6366f1',
  font: 'inter',
  density: 'normal',
};

export const defaultState: AppState = {
  cv: sampleCV,
  customization: defaultCustomization,
};

// Density -> scale tokens consumed by the preview via CSS variables.
export const densityTokens: Record<Density, { line: number; gap: number; section: number }> = {
  compact: { line: 1.3, gap: 0.3, section: 0.75 },
  normal: { line: 1.5, gap: 0.5, section: 1 },
  relaxed: { line: 1.7, gap: 0.75, section: 1.4 },
};
