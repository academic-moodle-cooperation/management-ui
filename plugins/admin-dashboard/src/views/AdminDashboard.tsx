import {
  Activity,
  GitBranch,
  GitCommit,
  LineChart,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { useAppConfig } from "@workspace/query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib/utils";

import { fetchGitHubStats, type GitHubStatsPoint } from "../services/github-stats";

type StatsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "processing"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; points: GitHubStatsPoint[]; lastUpdated: Date };

type AdminDashboardPluginConfig = {
  github?: {
    repo?: string;
    token?: string;
  };
  githubRepo?: string;
  repo?: string;
  defaultRangeWeeks?: number;
};

const STORAGE_KEY = "admin-dashboard:github-repo";
const RANGE_OPTIONS = [4, 8, 12, 24, 52];

const numberFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const weekFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const normalizeRepoInput = (value: string) => {
  let repo = value.trim();
  repo = repo.replace(/^https?:\/\/github\.com\//i, "");
  repo = repo.replace(/\.git$/i, "");
  repo = repo.replace(/\/+$/, "");
  return repo;
};

const formatWeekLabel = (week: number) => weekFormatter.format(new Date(week * 1000));
const formatFullDate = (week: number) => fullDateFormatter.format(new Date(week * 1000));

const calculateTotals = (points: GitHubStatsPoint[]) => {
  return points.reduce(
    (acc, point) => {
      const deletions = Math.abs(point.deletions);
      acc.commits += point.commits;
      acc.additions += point.additions;
      acc.deletions += deletions;
      return acc;
    },
    { commits: 0, additions: 0, deletions: 0 },
  );
};

const StatusBadge = ({ state }: { state: StatsState }) => {
  if (state.status === "ready") {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
        Live data
      </Badge>
    );
  }
  if (state.status === "loading") {
    return <Badge variant="secondary">Loading</Badge>;
  }
  if (state.status === "processing") {
    return <Badge variant="secondary">Processing</Badge>;
  }
  if (state.status === "error") {
    return <Badge variant="destructive">Needs attention</Badge>;
  }
  return <Badge variant="outline">Not configured</Badge>;
};

const StatsBarChart = ({ points }: { points: GitHubStatsPoint[] }) => {
  const maxChurn = Math.max(
    1,
    ...points.map((point) => point.additions + Math.abs(point.deletions)),
  );

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[620px] items-end gap-2">
        {points.map((point) => {
          const additionsHeight = Math.round((point.additions / maxChurn) * 100);
          const deletionsHeight = Math.round((Math.abs(point.deletions) / maxChurn) * 100);
          const churn = point.additions + Math.abs(point.deletions);
          const tooltip = `${formatFullDate(point.week)}\n${numberFormatter.format(
            point.commits,
          )} commits\n+${numberFormatter.format(point.additions)} / -${numberFormatter.format(
            Math.abs(point.deletions),
          )}`;

          return (
            <div key={point.week} className="flex flex-col items-center gap-2">
              <div
                className="flex h-24 w-3 flex-col justify-end overflow-hidden rounded-full bg-muted/40"
                title={tooltip}
              >
                <div className="bg-emerald-500/80" style={{ height: `${additionsHeight}%` }} />
                <div className="bg-rose-500/70" style={{ height: `${deletionsHeight}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {formatWeekLabel(point.week)}
              </span>
              <span className="text-[10px] text-muted-foreground">{compactFormatter.format(churn)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { config } = useAppConfig();
  const pluginConfig = (config.plugins?.["admin-dashboard"] ?? {}) as AdminDashboardPluginConfig;
  const configuredRepo =
    pluginConfig.github?.repo || pluginConfig.githubRepo || pluginConfig.repo || "";
  const configuredToken = pluginConfig.github?.token;
  const defaultRange = RANGE_OPTIONS.includes(pluginConfig.defaultRangeWeeks ?? 0)
    ? (pluginConfig.defaultRangeWeeks as number)
    : 12;

  const getInitialRepo = () => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    }
    return configuredRepo;
  };

  const [repoInput, setRepoInput] = useState<string>(getInitialRepo);
  const [repo, setRepo] = useState<string>(getInitialRepo);
  const [rangeWeeks, setRangeWeeks] = useState<number>(defaultRange);
  const [statsState, setStatsState] = useState<StatsState>({ status: "idle" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (repo || !configuredRepo) return;
    setRepo(configuredRepo);
    setRepoInput(configuredRepo);
  }, [configuredRepo, repo]);

  useEffect(() => {
    if (!repo) {
      setStatsState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    setStatsState({ status: "loading" });

    fetchGitHubStats(repo, { token: configuredToken, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.status === "ready") {
          setStatsState({
            status: "ready",
            points: result.points,
            lastUpdated: new Date(),
          });
        } else if (result.status === "processing") {
          setStatsState({ status: "processing", message: result.message });
        } else {
          setStatsState({ status: "error", message: result.message });
        }
      })
      .catch((error: Error) => {
        if (controller.signal.aborted) return;
        setStatsState({
          status: "error",
          message: error?.message || "Failed to fetch GitHub statistics.",
        });
      });

    return () => controller.abort();
  }, [repo, configuredToken, refreshKey]);

  const trimmedPoints = useMemo(() => {
    const points = statsState.status === "ready" ? statsState.points : [];
    return points.slice(Math.max(0, points.length - rangeWeeks));
  }, [statsState, rangeWeeks]);

  const totals = useMemo(() => calculateTotals(trimmedPoints), [trimmedPoints]);
  const netLines = totals.additions - totals.deletions;
  const churn = totals.additions + totals.deletions;

  const recentPoints = useMemo(
    () => trimmedPoints.slice(-8).reverse(),
    [trimmedPoints],
  );

  const handleApplyRepo = () => {
    const normalized = normalizeRepoInput(repoInput);
    setRepo(normalized);
    if (typeof window !== "undefined") {
      if (normalized) {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const statusMessage = (() => {
    if (statsState.status === "processing") return statsState.message;
    if (statsState.status === "error") return statsState.message;
    return "";
  })();

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-primary/10 via-background to-muted/60">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Admin-only workspace
              </div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription>
                A dedicated control room for operational insights, rollouts, and quality signals.
              </CardDescription>
            </div>
            <StatusBadge state={statsState} />
          </div>
          <Separator />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="github-repo">GitHub repository</Label>
              <Input
                id="github-repo"
                placeholder="owner/repo or https://github.com/owner/repo"
                value={repoInput}
                onChange={(event) => setRepoInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleApplyRepo();
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleApplyRepo}>Load stats</Button>
              <Button
                variant="outline"
                onClick={() => setRefreshKey((prev) => prev + 1)}
                disabled={!repo || statsState.status === "loading"}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          {repo ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="border-primary/40 text-primary">
                {repo}
              </Badge>
              {statsState.status === "ready" && (
                <span>
                  Updated {statsState.lastUpdated.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Add a GitHub repository to activate the statistics feed.
            </div>
          )}
          {statusMessage ? (
            <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
              {statusMessage}
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <Tabs defaultValue="statistics" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardDescription>Commits ({rangeWeeks} weeks)</CardDescription>
                <CardTitle className="text-2xl">
                  {numberFormatter.format(totals.commits)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Weekly activity across the chosen range.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardDescription>Lines added</CardDescription>
                <CardTitle className="text-2xl text-emerald-600">
                  +{numberFormatter.format(totals.additions)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Total insertions from GitHub code frequency.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardDescription>Lines deleted</CardDescription>
                <CardTitle className="text-2xl text-rose-600">
                  -{numberFormatter.format(totals.deletions)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Removal volume over the period.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardDescription>Net lines</CardDescription>
                <CardTitle
                  className={cn(
                    "text-2xl",
                    netLines >= 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {netLines >= 0 ? "+" : ""}
                  {numberFormatter.format(netLines)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Churn balance: {numberFormatter.format(churn)} total lines touched.
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Weekly code change timeline</CardTitle>
                  <CardDescription>
                    Additions (green) and deletions (red) aggregated per week.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Range</Label>
                  <Select
                    value={String(rangeWeeks)}
                    onValueChange={(value) => setRangeWeeks(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent>
                      {RANGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option} weeks
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {trimmedPoints.length > 0 ? (
                  <StatsBarChart points={trimmedPoints} />
                ) : (
                  <div className="rounded-md border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                    No timeline data yet. Select a repository to populate the chart.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signal snapshot</CardTitle>
                <CardDescription>Highlights from the latest range window.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <GitCommit className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Active weeks</div>
                    <div className="text-xs text-muted-foreground">
                      {trimmedPoints.filter((point) => point.commits > 0).length} / {trimmedPoints.length}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Change intensity</div>
                    <div className="text-xs text-muted-foreground">
                      {compactFormatter.format(churn)} lines touched
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Repository focus</div>
                    <div className="text-xs text-muted-foreground">{repo || "Not set"}</div>
                  </div>
                </div>
                <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  File-level change counts will appear once commit-level metrics are enabled.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent weeks</CardTitle>
                <CardDescription>Most recent activity with weekly rollups.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead className="text-right">Commits</TableHead>
                      <TableHead className="text-right">Additions</TableHead>
                      <TableHead className="text-right">Deletions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPoints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          No weekly data yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPoints.map((point) => (
                        <TableRow key={point.week}>
                          <TableCell>{formatFullDate(point.week)}</TableCell>
                          <TableCell className="text-right">
                            {numberFormatter.format(point.commits)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600">
                            +{numberFormatter.format(point.additions)}
                          </TableCell>
                          <TableCell className="text-right text-rose-600">
                            -{numberFormatter.format(Math.abs(point.deletions))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data sources</CardTitle>
                <CardDescription>Current integrations powering this dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">GitHub</div>
                      <div className="text-xs text-muted-foreground">Commit activity + code frequency</div>
                    </div>
                  </div>
                  <Badge variant={repo ? "default" : "secondary"}>{repo ? "Connected" : "Inactive"}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <LineChart className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Prometheus</div>
                      <div className="text-xs text-muted-foreground">Service and system health</div>
                    </div>
                  </div>
                  <Badge variant="outline">Planned</Badge>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Grafana</div>
                      <div className="text-xs text-muted-foreground">Executive dashboards & alerts</div>
                    </div>
                  </div>
                  <Badge variant="outline">Planned</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metrics registry</CardTitle>
              <CardDescription>
                Connect runtime telemetry, error tracking, and infrastructure signals.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <LineChart className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Prometheus</div>
                    <div className="text-xs text-muted-foreground">
                      Capture API latency, job throughput, and storage KPIs.
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="mt-3" disabled>
                  Connect
                </Button>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Grafana</div>
                    <div className="text-xs text-muted-foreground">
                      Surface curated dashboards and alert summaries.
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="mt-3" disabled>
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admin utilities</CardTitle>
              <CardDescription>Quick actions for platform health and governance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Configuration audit</div>
                    <div className="text-xs text-muted-foreground">
                      Snapshot active plugins, themes, and feature flags.
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Service heartbeat</div>
                    <div className="text-xs text-muted-foreground">
                      Track service uptime and recent alerts.
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center gap-3">
                  <GitCommit className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Release log</div>
                    <div className="text-xs text-muted-foreground">
                      Coordinate rollouts and communicate change impact.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
