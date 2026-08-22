import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRunIntelligence } from '@workspace/api-client-react';
import type {
  Finding,
  IntelligenceInput,
  IntelligenceReport,
  Recommendation,
  ToolCall,
  Trend,
} from '@workspace/api-client-react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Command,
  Copy,
  Crosshair,
  ExternalLink,
  FlaskConical,
  Layers3,
  Lightbulb,
  LoaderCircle,
  Menu,
  Network,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Telescope,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import './index.css';

const queryClient = new QueryClient();

const stages = [
  { label: 'Planning investigation', detail: 'Mapping the question to evidence sources', icon: Crosshair },
  { label: 'Discovering signals', detail: 'Searching research, news, and patent intelligence', icon: Search },
  { label: 'Verifying evidence', detail: 'Cross-checking entities, dates, and claims', icon: ShieldCheck },
  { label: 'Prioritizing impact', detail: 'Scoring competitive relevance and urgency', icon: Target },
  { label: 'Recommending action', detail: 'Turning verified signals into decisions', icon: Lightbulb },
];

const demoPreview = {
  company: 'Northstar Systems',
  competitors: ['Horizon Labs', 'Axiom Works', 'Cinder AI'],
  technology: 'On-device foundation models for industrial robotics',
  period: '30d',
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={Workspace} />
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Workspace() {
  const [company, setCompany] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [technology, setTechnology] = useState('');
  const [period, setPeriod] = useState<IntelligenceInput['period']>('30d');
  const [demoMode, setDemoMode] = useState(false);
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [activeSection, setActiveSection] = useState('Overview');
  const runIntelligence = useRunIntelligence();

  const isWorking = runIntelligence.isPending;
  const hasInput = company.trim().length > 1 && technology.trim().length > 1;
  const filledCompetitors = useMemo(
    () => competitors.split(',').map((item) => item.trim()).filter(Boolean),
    [competitors],
  );

  function resetWorkspace() {
    runIntelligence.reset();
    setReport(null);
    setCompany('');
    setCompetitors('');
    setTechnology('');
    setPeriod('30d');
    setDemoMode(false);
    setActiveSection('Overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function run(payload: IntelligenceInput) {
    runIntelligence.mutate(
      { data: payload },
      { onSuccess: (result) => { setReport(result); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasInput || isWorking) return;
    run({
      company: company.trim(),
      competitors: filledCompetitors,
      technology: technology.trim(),
      period,
      demoMode,
    });
  }

  function loadDemo() {
    setCompany(demoPreview.company);
    setCompetitors(demoPreview.competitors.join(', '));
    setTechnology(demoPreview.technology);
    setPeriod('30d');
    setDemoMode(true);
    run({ ...demoPreview, period: '30d', demoMode: true });
  }

  function jumpTo(label: string, target: string) {
    setActiveSection(label);
    setMobileNav(false);
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="noise min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[242px] flex-col bg-[#25283b] text-[#f7f4ec] lg:flex">
        <SidebarContent activeSection={activeSection} jumpTo={jumpTo} resetWorkspace={resetWorkspace} />
      </aside>

      <div className="lg:pl-[242px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#ded8ca] bg-[rgba(247,244,236,.9)] px-5 backdrop-blur-md sm:px-8 lg:px-11">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-[#5f6270] hover:bg-[#ebe7db] lg:hidden"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Open navigation"
              data-testid="button-open-navigation"
            >
              <Menu size={20} />
            </button>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[.2em] text-[#77796f]">Workspace /</span>
            <span className="hidden font-display text-sm font-semibold sm:inline">Decision intelligence</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 text-[11px] text-[#77796f] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#4eaf86]" />
              Systems operational
            </div>
            <button className="flex h-9 items-center gap-2 rounded-full border border-[#ded8ca] bg-[#fbf9f3] px-3 text-xs font-semibold hover:border-[#4eaf86]" data-testid="button-user-menu">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eb7b3f] text-[10px] font-bold text-[#25283b]">AR</span>
              <span className="hidden sm:inline">Avery Reed</span>
              <ChevronDown size={13} className="text-[#77796f]" />
            </button>
          </div>
        </header>

        {mobileNav && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button className="absolute inset-0 bg-[#25283b]/40" onClick={() => setMobileNav(false)} aria-label="Close navigation" data-testid="button-close-navigation" />
            <aside className="relative h-full w-[270px] bg-[#25283b] text-[#f7f4ec]">
              <SidebarContent activeSection={activeSection} jumpTo={jumpTo} resetWorkspace={resetWorkspace} />
            </aside>
          </div>
        )}

        <main className="mx-auto max-w-[1440px] px-5 pb-20 sm:px-8 lg:px-11">
          {!report && !isWorking && !runIntelligence.isError && (
            <EmptyWorkspace
              company={company}
              competitors={competitors}
              technology={technology}
              period={period}
              demoMode={demoMode}
              hasInput={hasInput}
              onCompany={setCompany}
              onCompetitors={setCompetitors}
              onTechnology={setTechnology}
              onPeriod={setPeriod}
              onDemo={setDemoMode}
              onSubmit={handleSubmit}
              onLoadDemo={loadDemo}
            />
          )}

          {isWorking && <InvestigationLoading input={{ company, competitors: filledCompetitors, technology, period, demoMode }} />}

          {runIntelligence.isError && (
            <ErrorState onRetry={() => handleSubmit({ preventDefault: () => {} } as FormEvent<HTMLFormElement>)} onReset={resetWorkspace} />
          )}

          {report && !isWorking && <ReportView report={report} onNew={resetWorkspace} />}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  activeSection,
  jumpTo,
  resetWorkspace,
}: {
  activeSection: string;
  jumpTo: (label: string, target: string) => void;
  resetWorkspace: () => void;
}) {
  const nav = [
    { label: 'Overview', icon: Radar, target: 'overview' },
    { label: 'Findings', icon: Layers3, target: 'findings' },
    { label: 'Signals', icon: TrendingUp, target: 'signals' },
    { label: 'Recommendations', icon: Lightbulb, target: 'recommendations' },
    { label: 'Tool calls', icon: Network, target: 'tool-calls' },
  ];
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <button className="mb-12 flex items-center gap-3 text-left" onClick={resetWorkspace} data-testid="button-brand-home">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#4eaf86] text-[#25283b]">
          <span className="absolute h-4 w-4 rounded-full border-2 border-[#25283b]" />
          <span className="absolute h-1.5 w-1.5 rounded-full bg-[#25283b]" />
        </span>
        <span>
          <span className="block font-display text-[17px] font-bold tracking-[-.03em]">IntelPulse</span>
          <span className="font-mono text-[9px] uppercase tracking-[.19em] text-[#9da899]">AI workspace</span>
        </span>
      </button>
      <div className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.2em] text-[#7e847d]">Investigation</div>
      <nav className="space-y-1">
        {nav.map(({ label, icon: Icon, target }) => (
          <button
            key={label}
            onClick={() => jumpTo(label, target)}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${activeSection === label ? 'bg-[#363b4d] font-semibold text-[#f7f4ec]' : 'text-[#aeb2a8] hover:bg-[#2d3244] hover:text-[#f7f4ec]'}`}
            data-testid={`button-nav-${label.toLowerCase().replace(' ', '-')}`}
          >
            <Icon size={16} className={activeSection === label ? 'text-[#5ac092]' : 'text-[#7e847d]'} />
            {label}
            {label === 'Tool calls' && <span className="ml-auto rounded-full bg-[#485063] px-1.5 py-0.5 font-mono text-[9px] text-[#cdd3c9]">live</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t border-[#3b4051] pt-5">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#7e847d]">Signal quality</span>
          <span className="text-[11px] font-semibold text-[#5ac092]">Nominal</span>
        </div>
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-[#3b4051]"><div className="h-full w-[86%] rounded-full bg-[#4eaf86]" /></div>
        <div className="flex items-center gap-2 rounded-lg bg-[#2d3244] p-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4eaf86]/20 text-[#63c397]"><Command size={14} /></span>
          <div><div className="text-[11px] font-semibold">Analyst console</div><div className="font-mono text-[9px] text-[#8d938b]">v2.4.0 / ready</div></div>
        </div>
      </div>
    </div>
  );
}

function EmptyWorkspace({
  company, competitors, technology, period, demoMode, hasInput, onCompany, onCompetitors, onTechnology, onPeriod, onDemo, onSubmit, onLoadDemo,
}: {
  company: string; competitors: string; technology: string; period: IntelligenceInput['period']; demoMode: boolean; hasInput: boolean;
  onCompany: (value: string) => void; onCompetitors: (value: string) => void; onTechnology: (value: string) => void; onPeriod: (value: IntelligenceInput['period']) => void;
  onDemo: (value: boolean) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onLoadDemo: () => void;
}) {
  return (
    <section className="signal-grid relative overflow-hidden border-x border-[#ded8ca] px-5 pb-16 pt-12 sm:px-10 sm:pt-16 lg:px-16 lg:pt-20">
      <div className="pointer-events-none absolute right-[-70px] top-[120px] hidden h-[310px] w-[310px] rounded-full border border-[#4eaf86]/20 sm:block">
        <div className="absolute inset-[35px] rounded-full border border-[#4eaf86]/20" /><div className="absolute inset-[84px] rounded-full border border-[#4eaf86]/30" />
        <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 rounded-full bg-[#eb7b3f]" />
      </div>
      <div className="relative max-w-[790px]">
        <div className="reveal mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#4eaf86]"><span className="h-1.5 w-1.5 rounded-full bg-[#4eaf86]" />Autonomous intelligence / ready</div>
        <h1 className="reveal reveal-delay-1 max-w-[720px] font-display text-[clamp(42px,6vw,76px)] font-semibold leading-[.94] tracking-[-.065em] text-[#25283b]">
          Find the signal<br /><span className="text-[#4eaf86]">before it moves.</span>
        </h1>
        <p className="reveal reveal-delay-2 mt-7 max-w-[560px] text-[15px] leading-7 text-[#686a72]">IntelPulse turns a strategic question into a verified map of market movement, competitive intent, and the decision waiting underneath.</p>
      </div>

      <form onSubmit={onSubmit} className="reveal reveal-delay-3 relative mt-12 max-w-[940px] rounded-2xl border border-[#ded8ca] bg-[#fbf9f3] p-4 shadow-[0_18px_50px_rgba(37,40,59,.07)] sm:p-6" data-testid="form-investigation">
        <div className="mb-5 flex items-center justify-between border-b border-[#e8e3d8] pb-4">
          <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#dceee3] text-[#3d956f]"><Telescope size={15} /></span><span className="text-sm font-semibold">Frame an investigation</span></div>
          <span className={`font-mono text-[9px] uppercase tracking-[.16em] ${demoMode ? 'text-[#eb7b3f]' : 'text-[#8b8b82]'}`}>{demoMode ? 'Demo mode enabled' : 'Live sources'}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company under watch" hint="Required">
            <input value={company} onChange={(event) => onCompany(event.target.value)} placeholder="e.g. Northstar Systems" className="intel-input" data-testid="input-company" />
          </Field>
          <Field label="Competitors" hint="Optional · comma separated">
            <input value={competitors} onChange={(event) => onCompetitors(event.target.value)} placeholder="e.g. Horizon Labs, Axiom Works" className="intel-input" data-testid="input-competitors" />
          </Field>
          <Field label="Technology or strategic question" hint="Required" wide>
            <textarea value={technology} onChange={(event) => onTechnology(event.target.value)} placeholder="What technology, market shift, or capability should we investigate?" className="intel-input min-h-[88px] resize-none leading-6" data-testid="input-technology" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monitoring period">
              <select value={period} onChange={(event) => onPeriod(event.target.value as IntelligenceInput['period'])} className="intel-input appearance-none" data-testid="select-period">
                <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="1y">Last year</option>
              </select>
            </Field>
            <div className="flex flex-col justify-end">
              <button type="button" onClick={() => onDemo(!demoMode)} className={`flex h-[43px] items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-colors ${demoMode ? 'border-[#e7a17d] bg-[#fff0e7] text-[#bb5e31]' : 'border-[#ded8ca] bg-[#f3f0e7] text-[#686a72] hover:border-[#eb7b3f]'}`} data-testid="button-toggle-demo">
                <FlaskConical size={14} /> {demoMode ? 'Demo on' : 'Try demo mode'}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#e8e3d8] pt-5 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-[11px] text-[#83847d]"><ShieldCheck size={14} className="text-[#4eaf86]" /> Every claim is source-linked and confidence scored.</p>
          <button type="submit" disabled={!hasInput} className="group flex h-11 items-center justify-center gap-3 rounded-lg bg-[#25283b] px-5 text-xs font-bold text-[#f7f4ec] transition-all hover:bg-[#3b4051] disabled:cursor-not-allowed disabled:opacity-35" data-testid="button-run-investigation">
            Run investigation <Send size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </form>

      <div className="reveal reveal-delay-4 mt-16 grid max-w-[940px] gap-4 border-t border-[#ded8ca] pt-6 sm:grid-cols-3">
        <MiniPrinciple number="01" title="Discover" detail="Agent plans the right evidence trail." icon={Search} />
        <MiniPrinciple number="02" title="Verify" detail="Claims earn confidence through triangulation." icon={ShieldCheck} />
        <MiniPrinciple number="03" title="Decide" detail="Signals resolve into owned next moves." icon={Zap} />
      </div>
      <div className="mt-12 flex max-w-[940px] items-center justify-between rounded-xl border border-dashed border-[#cfc9bc] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1dfd3] text-[#d56f3b]"><Sparkles size={14} /></span><span className="text-xs text-[#686a72]">Not ready with a question yet?</span></div>
        <button onClick={onLoadDemo} className="flex items-center gap-1.5 text-xs font-bold text-[#3d956f] hover:text-[#25283b]" data-testid="button-load-demo">Load a live demo <ArrowRight size={14} /></button>
      </div>
    </section>
  );
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`block ${wide ? 'md:col-span-2' : ''}`}><span className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[.1em] text-[#686a72]"><span>{label}</span>{hint && <span className="font-mono text-[9px] font-normal normal-case tracking-normal text-[#a1a198]">{hint}</span>}</span>{children}</label>;
}

function MiniPrinciple({ number, title, detail, icon: Icon }: { number: string; title: string; detail: string; icon: typeof Search }) {
  return <div className="flex gap-3"><span className="font-mono text-[10px] text-[#4eaf86]">{number}</span><div><Icon size={15} className="mb-2 text-[#25283b]" /><div className="text-[13px] font-bold">{title}</div><p className="mt-1 text-[11px] leading-5 text-[#85857e]">{detail}</p></div></div>;
}

function InvestigationLoading({ input }: { input: IntelligenceInput }) {
  const [active] = useState(() => Math.floor(Math.random() * 2) + 1);
  return (
    <section className="signal-grid min-h-[calc(100dvh-72px)] border-x border-[#ded8ca] px-5 py-12 sm:px-10 sm:py-20 lg:px-16">
      <div className="mx-auto max-w-[980px]">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#4eaf86]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4eaf86]" />Investigation in progress</div><h1 className="font-display text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Following the signal.</h1></div><span className="rounded-full border border-[#e7a17d] bg-[#fff0e7] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-[#bb5e31]">{input.demoMode ? 'Demo run' : 'Live run'}</span></div>
        <div className="mt-4 max-w-[580px] truncate text-sm text-[#77796f]">{input.company} · {input.technology}</div>
        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-[#ded8ca] bg-[#fbf9f3] p-5 sm:p-8">
            {stages.map((stage, index) => { const Icon = stage.icon; const complete = index < active; const current = index === active; return <div key={stage.label} className={`relative flex gap-4 pb-9 ${index === stages.length - 1 ? 'pb-1' : ''}`}><div className="relative flex w-7 shrink-0 justify-center"><span className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border ${complete ? 'border-[#4eaf86] bg-[#dceee3] text-[#3d956f]' : current ? 'border-[#eb7b3f] bg-[#fff0e7] text-[#bb5e31]' : 'border-[#ded8ca] bg-[#f3f0e7] text-[#aaa99f]'}`}>{complete ? <Check size={14} /> : current ? <LoaderCircle size={14} className="animate-spin" /> : <Icon size={13} />}</span>{index < stages.length - 1 && <span className={`absolute top-7 h-full w-px ${complete ? 'bg-[#4eaf86]' : 'bg-[#ded8ca]'}`} />}</div><div className="pt-0.5"><div className={`text-sm font-bold ${current ? 'text-[#bb5e31]' : complete ? 'text-[#25283b]' : 'text-[#9b9b91]'}`}>{stage.label}</div><div className="mt-1 text-xs text-[#85857e]">{stage.detail}</div>{current && <div className="mt-4 h-1 w-[220px] overflow-hidden rounded-full bg-[#eee9de]"><div className="pulse-line h-full w-full rounded-full bg-[#eb7b3f]" /></div>}</div></div>; })}
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-[#ded8ca] bg-[#f3f0e7] p-5"><div className="mb-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.15em] text-[#77796f]"><CircleDot size={12} className="text-[#4eaf86]" />Live telemetry</div><div className="space-y-3 font-mono text-[10px] text-[#77796f]"><div className="flex justify-between"><span>sources.open</span><span className="text-[#4eaf86]">scanning</span></div><div className="flex justify-between"><span>entity.resolve</span><span className="text-[#4eaf86]">queued</span></div><div className="flex justify-between"><span>signal.score</span><span className="text-[#aaa99f]">pending</span></div></div></div>
            <div className="rounded-xl border border-[#ded8ca] bg-[#fbf9f3] p-5"><div className="font-mono text-[9px] uppercase tracking-[.15em] text-[#77796f]">Question shape</div><div className="mt-3 text-xs leading-5 text-[#686a72]">The agent is expanding your question into a source plan, not guessing from a single search.</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ErrorState({ onRetry, onReset }: { onRetry: () => void; onReset: () => void }) {
  return <section className="flex min-h-[calc(100dvh-72px)] items-center justify-center border-x border-[#ded8ca] px-5"><div className="max-w-[440px] text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1dfd3] text-[#c35e35]"><AlertCircle size={26} /></span><h1 className="mt-6 font-display text-3xl font-semibold tracking-[-.04em]">The signal dropped.</h1><p className="mt-3 text-sm leading-6 text-[#77796f]">The investigation could not complete. Your question is still here — try the run again or frame a new one.</p><div className="mt-7 flex justify-center gap-3"><button onClick={onRetry} className="flex items-center gap-2 rounded-lg bg-[#25283b] px-4 py-2.5 text-xs font-bold text-[#f7f4ec]" data-testid="button-retry-investigation"><RefreshCw size={14} /> Retry run</button><button onClick={onReset} className="rounded-lg border border-[#ded8ca] bg-[#fbf9f3] px-4 py-2.5 text-xs font-bold text-[#686a72]" data-testid="button-reset-investigation">New question</button></div></div></section>;
}

function ReportView({ report, onNew }: { report: IntelligenceReport; onNew: () => void }) {
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'opportunity' | 'threat'>('all');
  const findings = report.findings ?? [];
  const filteredFindings = activeTab === 'all' ? findings : findings.filter((finding) => finding.classification === activeTab);
  const metricCards: Array<{ label: string; value: number; Icon: LucideIcon }> = [
    { label: 'Sources', value: report.metrics.sources, Icon: BarChart3 },
    { label: 'Verified', value: report.metrics.verified, Icon: ShieldCheck },
    { label: 'Competitors', value: report.metrics.competitors, Icon: Network },
    { label: 'Threats', value: report.metrics.threatCount, Icon: BellRing },
  ];
  const modeLabel = report.mode === 'demo' ? 'Demo intelligence' : 'Live intelligence';
  async function shareSummary() {
    const text = `${report.input.company} intelligence brief\n\n${report.executiveSummary}`;
    try { await navigator.clipboard.writeText(text); } catch { /* Clipboard can be unavailable in preview contexts. */ }
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="border-x border-[#ded8ca]">
      <section id="overview" className="signal-grid border-b border-[#ded8ca] px-5 pb-11 pt-10 sm:px-10 lg:px-16">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#4eaf86]"><span className="flex items-center gap-1.5"><Check size={12} /> Investigation complete</span><span className="text-[#b4afa2]">/</span><span className={report.mode === 'demo' ? 'text-[#c36a3b]' : ''}>{modeLabel}</span></div><h1 className="font-display text-[clamp(38px,5vw,64px)] font-semibold leading-none tracking-[-.065em]">{report.input.company}<span className="text-[#4eaf86]">.</span></h1><p className="mt-3 max-w-[660px] text-sm text-[#77796f]">{report.input.technology} <span className="mx-1 text-[#b8b2a5]">·</span> {report.input.period} horizon</p></div>
          <div className="flex gap-2"><button onClick={shareSummary} className="flex items-center gap-2 rounded-lg border border-[#ded8ca] bg-[#fbf9f3] px-3 py-2.5 text-xs font-semibold text-[#686a72] hover:border-[#4eaf86]" data-testid="button-share-summary">{copied ? <Check size={14} className="text-[#4eaf86]" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy brief'}</button><button onClick={onNew} className="flex items-center gap-2 rounded-lg bg-[#25283b] px-3.5 py-2.5 text-xs font-bold text-[#f7f4ec] hover:bg-[#3b4051]" data-testid="button-new-investigation"><Plus size={14} /> New investigation</button></div>
        </div>
        <div className="mt-11 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-2xl border border-[#ded8ca] bg-[#fbf9f3] p-5 sm:p-7"><div className="mb-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#77796f]"><Sparkles size={13} className="text-[#eb7b3f]" />Executive readout</div><p className="max-w-[780px] font-display text-[clamp(20px,2.4vw,30px)] font-medium leading-[1.28] tracking-[-.035em] text-[#303348]" data-testid="text-executive-summary">{report.executiveSummary}</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">{metricCards.map(({ label, value, Icon }) => <div key={label} className="rounded-xl border border-[#ded8ca] bg-[#f3f0e7] p-4"><Icon size={14} className="mb-4 text-[#4eaf86]" /><div className="font-display text-2xl font-semibold tracking-[-.04em]">{value}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.13em] text-[#8a8a82]">{label}</div></div>)}</div>
        </div>
        {report.criticalAlerts?.length > 0 && <div className="mt-4 rounded-xl border border-[#edc2aa] bg-[#fff0e7] p-4 sm:p-5"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#a74f2b]"><BellRing size={14} /> Critical alerts <span className="font-mono text-[10px] font-normal text-[#c17759]">/ needs attention</span></div><div className="grid gap-3 md:grid-cols-2">{report.criticalAlerts.map((finding) => <AlertRow key={finding.id} finding={finding} />)}</div></div>}
      </section>

      <section id="findings" className="px-5 py-11 sm:px-10 lg:px-16">
        <SectionHeading eyebrow="Evidence ledger" title="What changed" count={`${findings.length} findings`} />
        <div className="mb-5 flex gap-1 rounded-lg border border-[#ded8ca] bg-[#f3f0e7] p-1 w-fit">{(['all', 'opportunity', 'threat'] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] ${activeTab === tab ? 'bg-[#fbf9f3] text-[#25283b] shadow-sm' : 'text-[#88887f]'}`} data-testid={`button-filter-${tab}`}>{tab}</button>)}</div>
        <div className="overflow-hidden rounded-xl border border-[#ded8ca] bg-[#fbf9f3]">{filteredFindings.length ? filteredFindings.map((finding) => <FindingRow key={finding.id} finding={finding} expanded={expandedFinding === finding.id} onToggle={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)} />) : <div className="p-10 text-center text-sm text-[#85857e]">No findings in this classification.</div>}</div>
      </section>

      <section id="signals" className="border-y border-[#ded8ca] bg-[#f1eee5] px-5 py-11 sm:px-10 lg:px-16">
        <SectionHeading eyebrow="Pattern layer" title="Signals in motion" count="Across the horizon" />
        <div className="grid gap-4 md:grid-cols-3">{(report.trends ?? []).map((trend, index) => <TrendCard key={trend.label} trend={trend} index={index} />)}</div>
      </section>

      <section id="recommendations" className="px-5 py-11 sm:px-10 lg:px-16">
        <SectionHeading eyebrow="Decision layer" title="Moves worth making" count={`${report.recommendations?.length ?? 0} recommendations`} />
        <div className="grid gap-4 lg:grid-cols-3">{(report.recommendations ?? []).map((recommendation, index) => <RecommendationCard key={`${recommendation.title}-${index}`} recommendation={recommendation} index={index} />)}</div>
      </section>

      <section id="tool-calls" className="border-t border-[#ded8ca] bg-[#25283b] px-5 py-11 text-[#f7f4ec] sm:px-10 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#63c397]"><Network size={13} /> Agent trace</div><h2 className="font-display text-3xl font-semibold tracking-[-.05em] sm:text-4xl">How the answer was built</h2></div><span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#92988f]">{report.toolCalls?.length ?? 0} source calls · {report.runId}</span></div>
        <div className="mt-8 divide-y divide-[#3b4051] rounded-xl border border-[#3b4051] bg-[#2b3042]">{(report.toolCalls ?? []).map((tool, index) => <ToolCallRow key={tool.id} tool={tool} index={index} expanded={expandedTool === tool.id} onToggle={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)} />)}</div>
      </section>
      <footer className="flex flex-col justify-between gap-3 border-t border-[#3b4051] bg-[#25283b] px-5 py-5 text-[#8d938b] sm:flex-row sm:px-16"><span className="font-mono text-[9px] uppercase tracking-[.18em]">IntelPulse AI · Decision intelligence workspace</span><span className="font-mono text-[9px] uppercase tracking-[.14em]">Evidence before instinct</span></footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, count }: { eyebrow: string; title: string; count: string }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><div className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#4eaf86]">{eyebrow}</div><h2 className="font-display text-3xl font-semibold tracking-[-.055em] sm:text-4xl">{title}</h2></div><span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#9b9b91]">{count}</span></div>;
}

function AlertRow({ finding }: { finding: Finding }) {
  return <div className="flex gap-3 rounded-lg border border-[#f0d0be] bg-[#fff7f1] p-3"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#eb7b3f]" /><div><div className="text-xs font-bold text-[#383245]">{finding.title}</div><div className="mt-1 text-[11px] leading-5 text-[#876c61]">{finding.whyItMatters}</div></div></div>;
}

function FindingRow({ finding, expanded, onToggle }: { finding: Finding; expanded: boolean; onToggle: () => void }) {
  const classification = finding.classification;
  return <div className="border-b border-[#e8e3d8] last:border-0"><button className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-[#f7f4ec] sm:items-center sm:p-5" onClick={onToggle} data-testid={`button-expand-finding-${finding.id}`}><span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${classification === 'threat' ? 'bg-[#f1dfd3] text-[#c35e35]' : classification === 'opportunity' ? 'bg-[#dceee3] text-[#3d956f]' : 'bg-[#e9e7e0] text-[#77796f]'}`}>{classification === 'threat' ? <ArrowDownRight size={15} /> : classification === 'opportunity' ? <ArrowUpRight size={15} /> : <CircleDot size={14} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[9px] uppercase tracking-[.13em] text-[#99998f]">{finding.category}</span><span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[.08em] ${finding.confidence === 'high' ? 'bg-[#dceee3] text-[#3d956f]' : 'bg-[#f3f0e7] text-[#8c8c84]'}`}>{finding.confidence} confidence</span></div><div className="mt-1 truncate text-sm font-bold text-[#303348]">{finding.title}</div><div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-[#85857e]"><span>{finding.company}</span><span>{finding.date}</span><span>Impact {finding.impact}/10</span></div></div><ChevronDown size={16} className={`mt-2 shrink-0 text-[#aaa99f] transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>{expanded && <div className="grid gap-5 bg-[#f7f4ec] px-14 pb-5 pt-1 text-xs md:grid-cols-[1.2fr_1fr_1fr]"><div><div className="mb-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#99998f]">Why it matters</div><p className="leading-5 text-[#686a72]">{finding.whyItMatters}</p></div><div><div className="mb-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#99998f]">Suggested action</div><p className="leading-5 text-[#686a72]">{finding.action}</p></div><a href={finding.source} target="_blank" rel="noreferrer" className="flex items-start gap-1.5 font-semibold text-[#3d956f] hover:text-[#25283b]" data-testid={`link-source-${finding.id}`}>Open source <ExternalLink size={12} /></a></div>}</div>;
}

function TrendCard({ trend, index }: { trend: Trend; index: number }) {
  const up = trend.direction === 'up';
  const down = trend.direction === 'down';
  return <div className="rounded-xl border border-[#ded8ca] bg-[#fbf9f3] p-5"><div className="flex items-start justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6eee9] text-[#3d956f]">{up ? <ArrowUpRight size={16} /> : down ? <ArrowDownRight size={16} /> : <CircleDot size={15} />}</div><span className="font-mono text-[10px] text-[#aaa99f]">0{index + 1}</span></div><div className="mt-7 flex items-baseline gap-2"><span className="font-display text-4xl font-semibold tracking-[-.07em]">{trend.value}</span><span className={`font-mono text-[10px] uppercase ${up ? 'text-[#3d956f]' : down ? 'text-[#c35e35]' : 'text-[#88887f]'}`}>{trend.direction}</span></div><div className="mt-2 text-sm font-bold">{trend.label}</div><p className="mt-2 text-xs leading-5 text-[#85857e]">{trend.description}</p><div className="mt-5 h-1 overflow-hidden rounded-full bg-[#e9e7e0]"><div className={`h-full rounded-full ${up ? 'bg-[#4eaf86]' : down ? 'bg-[#eb7b3f]' : 'bg-[#9a9d91]'}`} style={{ width: `${Math.min(Math.max(Math.abs(trend.value), 14), 100)}%` }} /></div></div>;
}

function RecommendationCard({ recommendation, index }: { recommendation: Recommendation; index: number }) {
  const tone = recommendation.priority === 'now' ? 'bg-[#fff0e7] text-[#bb5e31]' : recommendation.priority === 'next' ? 'bg-[#dceee3] text-[#3d956f]' : 'bg-[#e9e7e0] text-[#77796f]';
  return <article className="group relative overflow-hidden rounded-xl border border-[#ded8ca] bg-[#fbf9f3] p-5 transition-transform hover:-translate-y-1"><div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full border border-[#ded8ca]" /><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.14em] ${tone}`}>{recommendation.priority}</span><span className="font-mono text-[10px] text-[#aaa99f]">0{index + 1}</span></div><h3 className="mt-8 max-w-[260px] font-display text-xl font-semibold leading-tight tracking-[-.04em]">{recommendation.title}</h3><p className="mt-3 text-xs leading-5 text-[#77796f]">{recommendation.detail}</p><div className="mt-7 flex items-center gap-2 border-t border-[#e8e3d8] pt-4 text-[11px]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25283b] text-[9px] font-bold text-[#f7f4ec]">{recommendation.owner.slice(0, 2).toUpperCase()}</span><span className="text-[#77796f]">Owner</span><span className="font-semibold text-[#303348]">{recommendation.owner}</span></div></article>;
}

function ToolCallRow({ tool, index, expanded, onToggle }: { tool: ToolCall; index: number; expanded: boolean; onToggle: () => void }) {
  const statusTone = tool.status === 'completed' ? 'text-[#63c397]' : tool.status === 'empty' ? 'text-[#d7ad72]' : 'text-[#d98266]';
  return <div><button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#31374a] sm:px-5" data-testid={`button-expand-tool-${tool.id}`}><span className="font-mono text-[10px] text-[#777f7a]">0{index + 1}</span><span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3b4051] text-[#63c397]"><Search size={13} /></span><span className="min-w-0 flex-1 truncate font-mono text-xs text-[#d6dbd0]">{tool.name}</span><span className={`hidden font-mono text-[9px] uppercase tracking-[.13em] sm:block ${statusTone}`}>{tool.status}</span><span className="font-mono text-[10px] text-[#8c938b]">{tool.resultCount} results</span><ChevronRight size={15} className={`text-[#8c938b] transition-transform ${expanded ? 'rotate-90' : ''}`} /></button>{expanded && <div className="grid gap-4 bg-[#23283a] px-14 py-4 text-xs sm:grid-cols-2"><div><div className="mb-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#777f7a]">Reason for call</div><p className="leading-5 text-[#b4bcb0]">{tool.reason}</p></div><div><div className="mb-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#777f7a]">Query executed</div><p className="font-mono text-[11px] leading-5 text-[#d6dbd0]">{tool.query}</p>{tool.source && <a href={tool.source} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[#63c397]" data-testid={`link-tool-source-${tool.id}`}>View source <ExternalLink size={11} /></a>}</div></div>}</div>;
}

export default App;