// Profile content. Stats with a `live` key are filled from the GitHub API at build time.

/** Career start (Softvence IT LTD, June 2025); experience is counted from here. */
export const careerStart = '2025-06-01';

/** Whole years since `start`. The hourly build keeps this current. */
export function yearsSince(start: string, now = new Date()) {
  const s = new Date(start);
  let years = now.getFullYear() - s.getFullYear();
  if (now.getMonth() < s.getMonth() || (now.getMonth() === s.getMonth() && now.getDate() < s.getDate())) years--;
  return years;
}
const years = yearsSince(careerStart);

export const profile = {
  handle: 'mdeibrahim11',
  name: 'Md Eibrahim Molla',
  wordmark: 'ebrahim',
  about: {
    facts: [
      { label: 'Role', value: 'Software Engineer' },
      { label: 'Based in', value: 'Uttara, Dhaka' },
      { label: 'Experience', value: `${years}+ Years` },
      { label: 'Status', value: 'Open to work', status: true },
    ],
    bio: 'Passionate Python Developer and Software Engineer with expertise in building robust backend systems, scalable RESTful APIs, and efficient web applications. Focused on writing clean, maintainable code and solving complex technical challenges.',
    stats: [
      { value: String(years), suffix: '+', label: 'Years shipping' },
      { live: 'repos', label: 'Repositories' },
      { live: 'contributions', label: 'Total Contributions' },
    ] as { value?: string; suffix?: string; label: string; live?: 'repos' | 'contributions' }[],
  },
};

export const site = 'https://github.com/mdeibrahim11';

export const proficiencies = {
  intro: 'The stack I reach for, and the craft around backend and software engineering.',
  groups: [
    { label: 'Skills', items: ['Software Architecture', 'RESTful API Design', 'Database Modeling', 'Backend Development'] },
    { label: 'Tech stack', items: ['Python / Django', 'FastAPI / Flask', 'MySQL / PostgreSQL', 'JavaScript / HTML / CSS', 'Docker / Linux'] },
    { label: 'Tools', items: ['Git / GitHub', 'VS Code', 'Postman', 'Linux Terminal'] },
    { label: 'Languages', items: ['Bengali (Native)', 'English (Professional)'] },
  ],
  // simple-icons export names; two marquee rows scrolling in opposite directions.
  marquee: [
    ['siPython', 'siDjango', 'siFastapi', 'siFlask', 'siPostgresql', 'siMysql', 'siSqlite', 'siDocker', 'siGit'],
    ['siJavascript', 'siHtml5', 'siCss', 'siTailwindcss', 'siBootstrap', 'siRedis', 'siGithub', 'siPostman', 'siLinux'],
  ],
};

export const work = {
  intro: "It's been a pleasure to contribute to innovative tech teams and companies.",
  roles: [
    {
      company: 'Amio Uddokta',
      country: 'BD',
      title: 'Software Engineer',
      type: 'Full-time',
      period: '2026 — Present',
      current: true,
      summary: 'Architecting and engineering scalable backend solutions, REST APIs, and business automation software for digital entrepreneurs and enterprises.',
      tags: ['Python', 'Django', 'FastAPI', 'Backend Architecture', 'APIs'],
    },
    {
      company: 'Softvence IT LTD',
      country: 'BD',
      title: 'Co-Leader of Code-Hydra Team & Python Developer',
      type: 'Full-time',
      period: 'Jun 2025 — May 2026',
      summary: 'Engineered robust backend services, integrated database schemas, and developed high-performance REST APIs using Python and modern web frameworks in Mohakhali, Dhaka.',
      tags: ['Python', 'Django', 'REST APIs', 'MySQL', 'Git'],
    },
  ] as { company: string; country: string; title: string; type: string; period: string; current?: boolean; summary: string; tags: string[] }[],
};

export const honors = [
  { year: '2026', title: 'GitHub Achievements', badge: 'Pull Shark', detail: 'Silver tier Pull Shark (x3) and Pair Extraordinaire' },
  { year: '2025', title: 'Python Development', badge: 'Certified', detail: 'Full-Stack Software Engineering & Problem Solving' },
];

export const projects = [
  { slug: 'event-management', name: 'Event Management Application', summary: 'Interactive event ticketing and attendee management web application.', tags: ['Web', 'HTML/CSS', 'JavaScript'] },
  { slug: 'employee-management', name: 'Employee Management System', summary: 'Comprehensive organization system for managing staff records, departments, and payroll.', tags: ['Python', 'Database', 'OOP'] },
  { slug: 'prayer-time-locker', name: 'Prayer Time Locker Software', summary: 'Automated utility software built with Python for tracking and managing schedules.', tags: ['Python', 'Automation', 'Utility'] },
  { slug: 'oop-python', name: 'OOP Project by Python', summary: 'Object-Oriented Programming design patterns and practical architectural implementations.', tags: ['Python', 'OOP', 'Clean Code'] },
  { slug: 'portfolio', name: 'Developer Portfolio', summary: 'Personal developer portfolio showcasing projects, experience, and skills.', tags: ['HTML', 'CSS', 'Portfolio'] },
  { slug: 'restaurant-app', name: 'Restaurant Digital System', summary: 'Digital restaurant menu and dining platform showcasing food items and customer experience.', tags: ['Web', 'Frontend', 'CSS'] },
];

export const contact = {
  email: 'eibrahim11.dev@gmail.com',
  links: [
    { id: 'mail', label: 'Mail', href: 'mailto:eibrahim11.dev@gmail.com' },
    { id: 'site', label: 'Portfolio', href: 'https://github.com/mdeibrahim11' },
    { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/md-eibrahim11/' },
    { id: 'github', label: 'GitHub', href: 'https://github.com/mdeibrahim11' },
    { id: 'resume', label: 'Resume', href: 'https://github.com/mdeibrahim11' },
  ],
};
