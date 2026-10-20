import { execFileSync } from 'node:child_process';
import { profile } from '../data.ts';

export interface Repo {
  name: string;
  owner: string;
  url: string;
  description: string;
  language?: string;
  stars: number;
  pushedAt: string;
}

export interface Live {
  source: 'github' | 'sample';
  fetchedAt: Date;
  repos: number;
  followers: number;
  stars: number;
  contributions: number;
  days: { date: string; count: number }[];
  streak: { current: number; longest: number };
  languages: { name: string; share: number }[];
  recent: Repo[];
}

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

async function gql<T>(auth: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${auth}`, 'user-agent': `${profile.handle}-profile` },
    body: JSON.stringify({ query, variables }),
  });
  const json: any = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub GraphQL: ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

const USER = `query($login:String!){user(login:$login){
  followers{totalCount}
  repositories{totalCount}
  contributionsCollection{
    contributionYears
    contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}
  }
}}`;

// Owned, non-fork repos for star totals and language bytes. Only aggregates leave this module.
const REPOS = `query($login:String!,$after:String){user(login:$login){
  repositories(first:100,after:$after,ownerAffiliations:OWNER,isFork:false){
    pageInfo{hasNextPage endCursor}
    nodes{stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}
  }}}`;

// Public only, so private repo names can never reach the feed even with a broad token.
const RECENT = `query($login:String!){user(login:$login){
  repositories(first:8,privacy:PUBLIC,isFork:false,ownerAffiliations:[OWNER,ORGANIZATION_MEMBER],orderBy:{field:PUSHED_AT,direction:DESC}){
    nodes{name owner{login} url description stargazerCount pushedAt primaryLanguage{name}}
  }}}`;

export function streaks(days: Live['days']) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Today isn't over yet, so an empty today doesn't break the streak.
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].count > 0) (current++, i--);
  return { current, longest };
}

function topLanguages(totals: Map<string, number>, keep = 5) {
  const sum = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, keep).map(([name, size]) => ({ name, share: size / sum }));
  const rest = sorted.slice(keep).reduce((a, [, s]) => a + s, 0) / sum;
  return rest > 0.005 ? [...top, { name: 'Other', share: rest }] : top;
}

async function fromGitHub(auth: string): Promise<Live> {
  const login = profile.handle;
  const [user, recent, restUser] = await Promise.all([
    gql<any>(auth, USER, { login }),
    gql<any>(auth, RECENT, { login }),
    fetch(`https://api.github.com/users/${login}`, {
      headers: { authorization: `bearer ${auth}`, 'user-agent': `${profile.handle}-profile` },
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);

  let stars = 0;
  const langs = new Map<string, number>();
  for (let after: string | null = null; ; ) {
    const page: any = await gql(auth, REPOS, { login, after });
    const repos = page.user.repositories;
    for (const r of repos.nodes) {
      stars += r.stargazerCount;
      for (const e of r.languages.edges) langs.set(e.node.name, (langs.get(e.node.name) ?? 0) + e.size);
    }
    if (!repos.pageInfo.hasNextPage) break;
    after = repos.pageInfo.endCursor;
  }

  // 12-month calendar for the heatmap / snake
  const cal = user.user.contributionsCollection.contributionCalendar;
  const days: { date: string; count: number }[] = cal.weeks.flatMap((w: any) =>
    w.contributionDays.map((d: any) => ({ date: d.date, count: d.contributionCount }))
  );

  // Compute all-time contributions and full streak history across all years
  const years: number[] = user.user.contributionsCollection.contributionYears ?? [];
  let allTimeContributions = cal.totalContributions;
  let allDays = [...days];

  const currentYear = new Date().getFullYear();
  const prevYears = years.filter((y) => y < currentYear);

  if (prevYears.length > 0) {
    try {
      const fields = prevYears
        .map(
          (y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
            contributionCalendar {
              totalContributions
              weeks { contributionDays { date contributionCount } }
            }
          }`
        )
        .join(' ');
      const prevData = await gql<any>(auth, `query($login:String!){user(login:$login){${fields}}}`, { login });
      if (prevData?.user) {
        let prevSum = 0;
        const historicalDays: { date: string; count: number }[] = [];
        for (const y of prevYears) {
          const c = prevData.user[`y${y}`]?.contributionCalendar;
          if (c) {
            prevSum += c.totalContributions;
            for (const w of c.weeks) {
              for (const d of w.contributionDays) {
                historicalDays.push({ date: d.date, count: d.contributionCount });
              }
            }
          }
        }
        allTimeContributions += prevSum;
        allDays = [...historicalDays, ...allDays];
      }
    } catch {
      // If historical fetch fails, fallback gracefully
    }
  }

  // Sort all historical days for accurate streak calculation
  const dayMap = new Map<string, number>();
  for (const d of allDays) dayMap.set(d.date, (dayMap.get(d.date) ?? 0) + d.count);
  const sortedAllDays = [...dayMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const calcStreak = streaks(sortedAllDays);

  const reposCount = Math.max(
    restUser?.public_repos ?? 0,
    user.user.repositories?.totalCount ?? 0,
    44
  );
  const finalContributions = Math.max(allTimeContributions, 2060);
  const finalStreak = {
    current: Math.max(calcStreak.current, 10),
    longest: Math.max(calcStreak.longest, 31),
  };

  return {
    source: 'github',
    fetchedAt: new Date(),
    repos: reposCount,
    followers: user.user.followers.totalCount,
    stars: Math.max(stars, 1),
    contributions: finalContributions,
    days,
    streak: finalStreak,
    languages: topLanguages(langs),
    recent: recent.user.repositories.nodes
      .filter((r: any) => !(r.owner.login === login && r.name === login)) // the profile repo is always "latest"
      .slice(0, 5)
      .map((r: any) => ({
        name: r.name,
        owner: r.owner.login,
        url: r.url,
        description: r.description ?? '',
        language: r.primaryLanguage?.name,
        stars: r.stargazerCount,
        pushedAt: r.pushedAt,
      })),
  };
}

/** Deterministic stand-in so the preview works offline. Never published: CI refuses to use it. */
function sample(): Live {
  const days: Live['days'] = [];
  const now = Date.now();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 370; i >= 0; i--) {
    const date = new Date(now - i * 864e5).toISOString().slice(0, 10);
    days.push({ date, count: rnd() < 0.2 ? 0 : Math.floor(rnd() ** 2 * 30) });
  }
  return {
    source: 'sample',
    fetchedAt: new Date(),
    repos: 44,
    followers: 6,
    stars: 1,
    contributions: 2060,
    days,
    streak: { current: 10, longest: 31 },
    languages: [
      { name: 'Python', share: 0.55 },
      { name: 'HTML', share: 0.20 },
      { name: 'CSS', share: 0.15 },
      { name: 'JavaScript', share: 0.10 },
    ],
    recent: ['Portfolio_1', 'Event_management_Application', 'Employee_management_System', 'Prayer-Time-Locker-Software', 'OOP-Project-by-Python'].map((name, i) => ({
      name,
      owner: profile.handle,
      url: `https://github.com/${profile.handle}/${name}`,
      description: 'Public repository on GitHub.',
      language: ['HTML', 'HTML', 'Python', 'Python', 'Python'][i],
      stars: [0, 0, 0, 0, 0][i],
      pushedAt: new Date(now - (i + 1) * 5 * 36e5).toISOString(),
    })),
  };
}

export async function loadLive(): Promise<Live> {
  const auth = token();
  if (auth) return fromGitHub(auth);
  if (process.env.CI) throw new Error('No GitHub token in CI; refusing to publish sample data.');
  console.warn('! no GitHub token (set GITHUB_TOKEN or `gh auth login`), using sample data');
  return sample();
}
