import { Router, type IRouter, type Request } from "express";
import { RunIntelligenceBody, RunIntelligenceResponse } from "@workspace/api-zod";

type Input = {
  company: string;
  competitors: string[];
  technology: string;
  period: "7d" | "30d" | "90d" | "1y";
  demoMode?: boolean;
};

type Finding = {
  id: string;
  category: "research" | "patent" | "news";
  title: string;
  company: string;
  date: string;
  impact: number;
  classification: "opportunity" | "threat" | "neutral";
  whyItMatters: string;
  action: string;
  source: string;
  sourceType: string;
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceCount: number;
};

type ToolCall = {
  id: string;
  name: string;
  reason: string;
  query: string;
  resultCount: number;
  status: "not_selected" | "running" | "completed" | "unavailable" | "empty";
  selected: boolean;
  timestamp: string;
  source: string | null;
  error: string | null;
};

type AgentPlan = {
  objective: string;
  subtasks: string[];
  selectedTools: string[];
  reasoningSummary: string[];
};

const router: IRouter = Router();
const timeoutMs = 6500;

const periodDays: Record<Input["period"], number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

function queryText(input: Input) {
  return [input.company, ...input.competitors, input.technology]
    .filter(Boolean)
    .join(" ");
}

function sinceDate(period: Input["period"]) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - periodDays[period]);
  return date.toISOString().slice(0, 10);
}

async function fetchJson(url: string) {
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json", "User-Agent": "IntelPulseAI/1.0" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}

function safeDate(value: unknown) {
  if (typeof value !== "string") return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? new Date().toISOString().slice(0, 10)
    : parsed.toISOString().slice(0, 10);
}

function safeUrl(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function classify(title: string, company: string): Finding["classification"] {
  const lower = `${title} ${company}`.toLowerCase();
  if (/(launch|announce|acquire|partner|fund|breakthrough|patent)/.test(lower)) {
    return "threat";
  }
  if (/(open|efficient|benchmark|grant|collaborat|research)/.test(lower)) {
    return "opportunity";
  }
  return "neutral";
}

function score(title: string, category: Finding["category"], input: Input) {
  const lower = title.toLowerCase();
  const directMatch = [input.company, ...input.competitors]
    .some((name) => lower.includes(name.toLowerCase()));
  const categoryWeight = category === "patent" ? 8 : category === "news" ? 6 : 4;
  return Math.min(98, 54 + categoryWeight + (directMatch ? 18 : 0) + (/(launch|breakthrough|acquire|patent)/.test(lower) ? 12 : 0));
}

function makeFinding(
  input: Input,
  category: Finding["category"],
  title: string,
  company: string,
  date: string,
  source: string,
  sourceType: string,
  evidenceCount = 1,
): Finding {
  const impact = score(title, category, input);
  const classification = classify(title, company);
  const severity = impact >= 88 ? "CRITICAL" : impact >= 76 ? "HIGH" : impact >= 62 ? "MEDIUM" : "LOW";
  return {
    id: `${category}-${Math.random().toString(36).slice(2, 9)}`,
    category,
    title: title.slice(0, 220),
    company: company || "Industry",
    date: safeDate(date),
    impact,
    severity,
    classification,
    whyItMatters:
      classification === "threat"
        ? `Signals movement that could change ${input.technology} positioning or competitive timing.`
        : classification === "opportunity"
          ? `Creates a potential opening to improve ${input.technology} capability, partnerships, or differentiation.`
          : `Adds context to the direction and maturity of ${input.technology}.`,
    action:
      classification === "threat"
        ? "Brief the strategy team and validate exposure against the current roadmap."
        : classification === "opportunity"
          ? "Assign an owner to validate the signal and estimate a fast-follow path."
          : "Watch for corroborating signals before changing priorities.",
    source,
    sourceType,
    confidence: evidenceCount > 1 ? "high" : "medium",
    confidenceScore: evidenceCount > 1 ? 91 : 72,
    evidenceCount,
  };
}

function selectTools(input: Input) {
  const text = `${input.technology} ${input.company} ${input.competitors.join(" ")}`.toLowerCase();
  const isNews = /\b(news|announcement|announcements|launch|press|market|activity)\b/.test(text);
  const isResearch = /\b(research|paper|papers|scientific|architecture|trend|technology)\b/.test(text);
  const isPatent = /\b(patent|filing|inventor|intellectual property|ip)\b/.test(text);
  const isGithub = /\b(github|developer|developers|repository|repo|open source|contributor|code)\b/.test(text);
  const broad = /\b(analy[sz]e|competitive|position|landscape|monitor|comprehensive|compare)\b/.test(text);
  const selected = {
    news: isNews || broad,
    research: isResearch || broad,
    patent: isPatent || broad,
    github: isGithub || broad && /\b(developer|ecosystem|platform|software)\b/.test(text),
  };
  if (!Object.values(selected).some(Boolean)) selected.research = true;
  const reasoningSummary = [
    selected.news ? "News is relevant for recent announcements, market movement, and competitor activity." : "News is not required because the question does not emphasize current market events.",
    selected.research ? "Research is relevant for scientific direction and technology momentum." : "Research is not required for this focused investigation.",
    selected.patent ? "Patent intelligence is relevant for durable technology investment and IP intent." : "Patent intelligence is not required because IP activity was not requested.",
    selected.github ? "GitHub is relevant for public developer adoption and software ecosystem activity." : "GitHub is not required because developer activity was not requested.",
  ];
  return {
    selected,
    selectedTools: Object.entries(selected).filter(([, value]) => value).map(([key]) => key),
    reasoningSummary,
    subtasks: [
      "Collect evidence from the selected external sources",
      "Cross-check entities, recency, and source coverage",
      "Prioritize threats, opportunities, and next actions",
    ],
  };
}

function unselectedToolCall(id: string, name: string, reason: string): ToolCall {
  return { id, name, reason, query: "Not called for this objective", resultCount: 0, status: "not_selected", selected: false, timestamp: new Date().toISOString(), source: null, error: null };
}

async function researchTool(input: Input): Promise<{ findings: Finding[]; call: ToolCall }> {
  const query = encodeURIComponent(`${input.technology} ${input.company}`);
  const url = `https://api.crossref.org/works?query=${query}&filter=from-pub-date:${sinceDate(input.period)},type:journal-article&rows=5&select=title,author,published,URL,container-title`;
  const timestamp = new Date().toISOString();
  try {
    const data = await fetchJson(url);
    const message = (data.message ?? {}) as { items?: Array<Record<string, unknown>> };
    const items = Array.isArray(message.items) ? message.items : [];
    const findings = items.slice(0, 5).map((item) => {
      const titles = Array.isArray(item.title) ? item.title : [];
      const containers = Array.isArray(item["container-title"]) ? item["container-title"] : [];
      return makeFinding(
        input,
        "research",
        String(titles[0] ?? "Research publication"),
        String(containers[0] ?? "Research community"),
        safeDate((item.published as { "date-parts"?: number[][] } | undefined)?.["date-parts"]?.[0]?.join("-")),
        safeUrl(item.URL, "https://api.crossref.org/"),
        "Crossref",
      );
    });
    return {
      findings,
      call: { id: "research-search", name: "Research Search", reason: "The technology area implies a need to detect new scientific work and methods.", query: decodeURIComponent(query), resultCount: findings.length, status: findings.length ? "completed" : "empty", selected: true, timestamp, source: "Crossref", error: null },
    };
  } catch (error) {
    return { findings: [], call: { id: "research-search", name: "Research Search", reason: "The technology area implies a need to detect new scientific work and methods.", query: decodeURIComponent(query), resultCount: 0, status: "unavailable", selected: true, timestamp, source: "Crossref", error: error instanceof Error ? error.message : "Search unavailable" } };
  }
}

async function newsTool(input: Input): Promise<{ findings: Finding[]; call: ToolCall }> {
  const query = encodeURIComponent(`(${input.company} OR ${input.competitors.join(" OR ")}) ${input.technology}`);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=5&format=json&sort=HybridRel`;
  const timestamp = new Date().toISOString();
  try {
    const data = await fetchJson(url);
    const articles = Array.isArray(data.articles) ? data.articles as Array<Record<string, unknown>> : [];
    const findings = articles.slice(0, 5).map((article) =>
      makeFinding(input, "news", String(article.title ?? "Industry development"), String(article.domain ?? "Industry source"), String(article.seendate ?? ""), safeUrl(article.url, "https://www.gdeltproject.org/"), "GDELT"),
    );
    return {
      findings,
      call: { id: "news-search", name: "News & Industry Search", reason: "Competitor names and a monitoring period require current market and announcement signals.", query: decodeURIComponent(query), resultCount: findings.length, status: findings.length ? "completed" : "empty", selected: true, timestamp, source: "GDELT", error: null },
    };
  } catch (error) {
    return { findings: [], call: { id: "news-search", name: "News & Industry Search", reason: "Competitor names and a monitoring period require current market and announcement signals.", query: decodeURIComponent(query), resultCount: 0, status: "unavailable", selected: true, timestamp, source: "GDELT", error: error instanceof Error ? error.message : "Search unavailable" } };
  }
}

async function patentTool(input: Input): Promise<{ findings: Finding[]; call: ToolCall }> {
  const query = encodeURIComponent(`"${input.technology}"`);
  const url = `https://api.patentsview.org/patents/query?q={"_and":[{"_text_any":{"patent_title":"${input.technology}"}},{"_gte":{"patent_date":"${sinceDate(input.period)}"}}]}&f=["patent_number","patent_title","patent_date","assignees"]&o={"size":5}`;
  const timestamp = new Date().toISOString();
  try {
    const data = await fetchJson(url);
    const patents = Array.isArray(data.patents) ? data.patents as Array<Record<string, unknown>> : [];
    const findings = patents.slice(0, 5).map((patent) => {
      const assignees = Array.isArray(patent.assignees) ? patent.assignees as Array<Record<string, unknown>> : [];
      const company = String(assignees[0]?.assignee_organization ?? "Patent applicant");
      return makeFinding(input, "patent", String(patent.patent_title ?? "Patent filing"), company, String(patent.patent_date ?? ""), safeUrl(`https://patents.google.com/patent/${String(patent.patent_number ?? "")}/en`, "https://patents.google.com/"), "PatentsView");
    });
    return {
      findings,
      call: { id: "patent-search", name: "Patent Search", reason: "The investigation covers technology positioning, so filing activity can reveal durable competitive intent.", query: decodeURIComponent(query), resultCount: findings.length, status: findings.length ? "completed" : "empty", selected: true, timestamp, source: "PatentsView", error: null },
    };
  } catch (error) {
    return { findings: [], call: { id: "patent-search", name: "Patent Search", reason: "The investigation covers technology positioning, so filing activity can reveal durable competitive intent.", query: decodeURIComponent(query), resultCount: 0, status: "unavailable", selected: true, timestamp, source: "PatentsView", error: error instanceof Error ? error.message : "Search unavailable" } };
  }
}

async function githubTool(input: Input): Promise<{ findings: Finding[]; call: ToolCall }> {
  const query = encodeURIComponent(`${input.technology} ${input.company}`);
  const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=5`;
  const timestamp = new Date().toISOString();
  try {
    const data = await fetchJson(url);
    const repos = Array.isArray(data.items) ? data.items as Array<Record<string, unknown>> : [];
    const findings = repos.slice(0, 5).map((repo) =>
      makeFinding(input, "news", `Developer signal: ${String(repo.full_name ?? "public repository")} (${String(repo.stargazers_count ?? 0)} stars)`, String(repo.owner && typeof repo.owner === "object" ? (repo.owner as Record<string, unknown>).login ?? "Open source" : "Open source"), String(repo.updated_at ?? ""), safeUrl(repo.html_url, "https://github.com/"), "GitHub"),
    );
    return {
      findings,
      call: { id: "github-search", name: "GitHub Developer Intelligence", reason: "The investigation calls for public developer ecosystem activity and repository momentum.", query: decodeURIComponent(query), resultCount: findings.length, status: findings.length ? "completed" : "empty", selected: true, timestamp, source: "GitHub", error: null },
    };
  } catch (error) {
    return { findings: [], call: { id: "github-search", name: "GitHub Developer Intelligence", reason: "The investigation calls for public developer ecosystem activity and repository momentum.", query: decodeURIComponent(query), resultCount: 0, status: "unavailable", selected: true, timestamp, source: "GitHub", error: error instanceof Error ? error.message : "Search unavailable" } };
  }
}

function demoFindings(input: Input): Finding[] {
  const competitor = input.competitors[0] ?? "Market leader";
  return [
    makeFinding(input, "news", `${competitor} signals a new efficiency push in ${input.technology}`, competitor, new Date().toISOString(), "https://www.gdeltproject.org/", "DEMO DATA", 2),
    makeFinding(input, "research", `New research direction targets lower-cost ${input.technology}`, "Research ecosystem", new Date().toISOString(), "https://api.crossref.org/", "DEMO DATA"),
    makeFinding(input, "patent", `${input.company} and peers expand filing activity around ${input.technology}`, input.company, new Date().toISOString(), "https://patents.google.com/", "DEMO DATA"),
  ];
}

function report(input: Input, findings: Finding[], toolCalls: ToolCall[], mode: "live" | "demo", plan: AgentPlan) {
  const sorted = [...findings].sort((a, b) => b.impact - a.impact);
  const threats = sorted.filter((finding) => finding.classification === "threat").length;
  const opportunities = sorted.filter((finding) => finding.classification === "opportunity").length;
  const overall = Math.min(99, Math.max(38, Math.round(sorted.reduce((sum, finding) => sum + finding.impact, 0) / Math.max(sorted.length, 1))));
  const trendLabels = [...new Set(sorted.map((finding) => finding.category === "patent" ? "Patent momentum" : finding.category === "research" ? "Research velocity" : "Competitor movement"))];
  return {
    runId: `run-${Date.now().toString(36)}`,
    mode,
    input,
    executiveSummary: `${input.company} intelligence scan surfaced ${sorted.length} signals across ${new Set(sorted.map((finding) => finding.company)).size} organizations. ${threats ? `${threats} competitive threat${threats === 1 ? "" : "s"} require attention.` : "No critical competitive threats were detected in this window."} ${opportunities ? `${opportunities} opportunity signal${opportunities === 1 ? "" : "s"} merit validation.` : "Continue monitoring for corroborating opportunity signals."}`,
    criticalAlerts: sorted.filter((finding) => finding.impact >= 76).slice(0, 4),
    findings: sorted,
    trends: trendLabels.slice(0, 4).map((label, index) => ({ label, value: Math.max(18, 86 - index * 17), direction: index === 2 ? "flat" : "up", description: mode === "demo" ? "Simulated signal for product demonstration." : "Observed across the selected evidence sources." })),
    recommendations: [
      { priority: "now", title: "Validate the highest-impact signal", detail: "Have strategy and technical leads verify the top alert against internal roadmap assumptions.", owner: "Strategy" },
      { priority: "next", title: "Map competitor response options", detail: `Compare the signal against ${input.company}'s current differentiation in ${input.technology}.`, owner: "Product & R&D" },
      { priority: "watch", title: "Keep the evidence trail warm", detail: "Schedule another scan and require a second source before making an irreversible decision.", owner: "Research ops" },
    ],
    toolCalls,
    plan,
    intelligenceScore: {
      overall,
      marketMomentum: Math.min(99, overall + 2),
      researchMomentum: Math.min(99, overall + (sorted.some((finding) => finding.category === "research") ? 7 : -4)),
      patentActivity: Math.min(99, overall + (sorted.some((finding) => finding.category === "patent") ? 5 : -6)),
      developerEcosystem: Math.min(99, overall + (toolCalls.some((call) => call.id === "github-search") ? 4 : -8)),
      threatLevel: threats > 1 ? "HIGH" : threats === 1 ? "MEDIUM" : "LOW",
      opportunityLevel: opportunities > 1 ? "HIGH" : opportunities === 1 ? "MEDIUM" : "LOW",
    },
    metrics: { sources: new Set(toolCalls.filter((call) => call.status === "completed").map((call) => call.source)).size, verified: sorted.filter((finding) => finding.evidenceCount > 1).length, competitors: input.competitors.length, opportunityCount: opportunities, threatCount: threats },
  };
}

router.post("/intelligence", async (req: Request, res) => {
  const parsed = RunIntelligenceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a company, technology area, and valid monitoring period." });
  const input = parsed.data as Input;
  const plan = selectTools(input);
  const toolPlan = [
    ["news", "News & Industry Search", "News is not required for this objective."],
    ["research", "Research Search", "Research is not required for this objective."],
    ["patent", "Patent Search", "Patent intelligence is not required for this objective."],
    ["github", "GitHub Developer Intelligence", "GitHub is not required for this objective."],
  ] as const;
  if (input.demoMode) return res.json(RunIntelligenceResponse.parse(report(input, demoFindings(input), [{ id: "demo-router", name: "Demo Evidence", reason: "Demo mode was selected, so no external calls were made.", query: queryText(input), resultCount: 3, status: "completed", selected: true, timestamp: new Date().toISOString(), source: "DEMO DATA", error: null }, ...toolPlan.filter(([id]) => !plan.selected[id as keyof typeof plan.selected]).map(([id, name, reason]) => unselectedToolCall(id, name, reason))], "demo", plan)));

  const calls: Array<Promise<{ findings: Finding[]; call: ToolCall }>> = [];
  if (plan.selected.research) calls.push(researchTool(input));
  if (plan.selected.news) calls.push(newsTool(input));
  if (plan.selected.patent) calls.push(patentTool(input));
  if (plan.selected.github) calls.push(githubTool(input));
  const results = await Promise.all(calls);
  const liveFindings = results.flatMap((result) => result.findings);
  const toolCalls = [...results.map((result) => result.call), ...toolPlan.filter(([id]) => !plan.selected[id as keyof typeof plan.selected]).map(([id, name, reason]) => unselectedToolCall(id, name, reason))];
  if (!liveFindings.length) return res.json(RunIntelligenceResponse.parse(report(input, demoFindings(input), [...toolCalls, { id: "demo-fallback", name: "Demo Fallback", reason: "Live sources returned no usable evidence, so the report is simulated for demonstration.", query: queryText(input), resultCount: 3, status: "completed", selected: true, timestamp: new Date().toISOString(), source: "DEMO DATA", error: null }], "demo", plan)));
  return res.json(RunIntelligenceResponse.parse(report(input, liveFindings, toolCalls, "live", plan)));
});

export default router;