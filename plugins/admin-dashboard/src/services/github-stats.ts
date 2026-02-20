export interface GitHubStatsPoint {
  week: number; // Unix timestamp (seconds) for week start
  additions: number;
  deletions: number; // Negative from GitHub API
  commits: number;
}

export type GitHubStatsResult =
  | { status: "ready"; points: GitHubStatsPoint[] }
  | { status: "processing"; message: string }
  | { status: "error"; message: string };

interface FetchOptions {
  token?: string;
  signal?: AbortSignal;
}

const GITHUB_API_BASE = "https://api.github.com";

const normalizeRepo = (repo: string) => repo.replace(/^\/+/, "").replace(/\/+$/, "");

const createHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const fetchJson = async <T>(url: string, options: FetchOptions) => {
  const response = await fetch(url, {
    headers: createHeaders(options.token),
    signal: options.signal ?? null,
  });

  if (response.status === 202) {
    return { status: "processing" as const };
  }

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    return { status: "error" as const, message };
  }

  const data = (await response.json()) as T;
  return { status: "ok" as const, data };
};

export const fetchGitHubStats = async (
  repo: string,
  options: FetchOptions = {},
): Promise<GitHubStatsResult> => {
  const normalizedRepo = normalizeRepo(repo);
  if (!normalizedRepo) {
    return { status: "error", message: "Repository is required." };
  }

  const baseUrl = `${GITHUB_API_BASE}/repos/${normalizedRepo}`;

  const [commitActivity, codeFrequency] = await Promise.all([
    fetchJson<{ week: number; total: number; days: number[] }[]>(
      `${baseUrl}/stats/commit_activity`,
      options,
    ),
    fetchJson<[number, number, number][]>(`${baseUrl}/stats/code_frequency`, options),
  ]);

  if (commitActivity.status === "processing" || codeFrequency.status === "processing") {
    return {
      status: "processing",
      message: "GitHub is generating statistics for this repository. Try again shortly.",
    };
  }

  if (commitActivity.status === "error" && codeFrequency.status === "error") {
    return {
      status: "error",
      message: `GitHub stats unavailable. ${commitActivity.message}. ${codeFrequency.message}.`,
    };
  }

  const commitsByWeek = new Map<number, number>();
  if (commitActivity.status === "ok") {
    commitActivity.data.forEach((entry) => {
      commitsByWeek.set(entry.week, entry.total ?? 0);
    });
  }

  if (codeFrequency.status === "ok") {
    const points: GitHubStatsPoint[] = codeFrequency.data.map(([week, additions, deletions]) => ({
      week,
      additions,
      deletions,
      commits: commitsByWeek.get(week) ?? 0,
    }));

    return { status: "ready", points };
  }

  // If we only have commit activity, synthesize points for timeline
  if (commitActivity.status === "ok") {
    const points: GitHubStatsPoint[] = commitActivity.data.map((entry) => ({
      week: entry.week,
      additions: 0,
      deletions: 0,
      commits: entry.total ?? 0,
    }));
    return { status: "ready", points };
  }

  return {
    status: "error",
    message: "Unable to load GitHub statistics.",
  };
};
