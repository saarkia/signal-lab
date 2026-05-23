"use client";

import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Gauge,
  GitBranch,
  Mail,
  MousePointer2,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ScenarioKey = "retention" | "winback" | "launch" | "recovery";
type ChannelKey = "push" | "email" | "inApp";

type Scenario = {
  label: string;
  description: string;
  trigger: string;
  commercialGoal: string;
  baselineRate: number;
  intent: number;
  urgency: number;
  sensitivity: number;
  orderValue: number;
  accent: string;
};

type JourneyStage = {
  label: string;
  share: number;
  icon: LucideIcon;
};

type EventLog = {
  id: number;
  label: string;
  detail: string;
  tone: "green" | "blue" | "amber" | "rose";
};

const scenarios: Record<ScenarioKey, Scenario> = {
  retention: {
    label: "Retention save",
    description: "Predict churn risk and choose the lowest-pressure save path.",
    trigger: "Subscription renewal window",
    commercialGoal: "Protect recurring revenue without over-messaging loyal users.",
    baselineRate: 0.084,
    intent: 0.72,
    urgency: 0.54,
    sensitivity: 0.41,
    orderValue: 82,
    accent: "text-teal-700",
  },
  winback: {
    label: "Win-back sprint",
    description: "Re-activate dormant customers with channel-aware incentives.",
    trigger: "No purchase in 90 days",
    commercialGoal: "Recover lapsed revenue while avoiding blanket discounts.",
    baselineRate: 0.052,
    intent: 0.48,
    urgency: 0.61,
    sensitivity: 0.66,
    orderValue: 64,
    accent: "text-indigo-700",
  },
  launch: {
    label: "Product launch",
    description: "Sequence early access, education and urgency for a new offer.",
    trigger: "New collection availability",
    commercialGoal: "Build demand early and steer high-intent users to purchase.",
    baselineRate: 0.112,
    intent: 0.79,
    urgency: 0.72,
    sensitivity: 0.35,
    orderValue: 96,
    accent: "text-violet-700",
  },
  recovery: {
    label: "Service recovery",
    description: "Repair poor experiences before they become public churn signals.",
    trigger: "Delivery delay or failed payment",
    commercialGoal: "Reduce support load and recover trust with timely updates.",
    baselineRate: 0.069,
    intent: 0.58,
    urgency: 0.83,
    sensitivity: 0.52,
    orderValue: 74,
    accent: "text-rose-700",
  },
};

const channelConfig: Record<
  ChannelKey,
  {
    label: string;
    icon: LucideIcon;
    lift: number;
    cost: number;
    fatigue: number;
    colour: string;
  }
> = {
  push: {
    label: "Push",
    icon: Smartphone,
    lift: 0.022,
    cost: 0.004,
    fatigue: 0.034,
    colour: "bg-teal-600",
  },
  email: {
    label: "Email",
    icon: Mail,
    lift: 0.018,
    cost: 0.002,
    fatigue: 0.018,
    colour: "bg-blue-600",
  },
  inApp: {
    label: "In-app",
    icon: BellRing,
    lift: 0.026,
    cost: 0.006,
    fatigue: 0.012,
    colour: "bg-amber-500",
  },
};

const channelKeys: ChannelKey[] = ["push", "email", "inApp"];

const stages: JourneyStage[] = [
  { label: "Detect", share: 1, icon: Radio },
  { label: "Score", share: 0.86, icon: Gauge },
  { label: "Decide", share: 0.68, icon: GitBranch },
  { label: "Send", share: 0.49, icon: Zap },
  { label: "Learn", share: 0.37, icon: Activity },
];

const baseEvents: EventLog[] = [
  {
    id: 1,
    label: "Streaming signal",
    detail: "Viewed product detail twice in one session",
    tone: "blue",
  },
  {
    id: 2,
    label: "Decision split",
    detail: "High intent routed to push and in-app confirmation",
    tone: "green",
  },
  {
    id: 3,
    label: "Guardrail",
    detail: "Suppressed users with two messages in the last 24 hours",
    tone: "amber",
  },
  {
    id: 4,
    label: "Attribution",
    detail: "Holdout group updated for incrementality read",
    tone: "rose",
  },
];

const eventRotations: Omit<EventLog, "id">[] = [
  {
    label: "Preference update",
    detail: "Email-only users held back from push delivery",
    tone: "blue",
  },
  {
    label: "Revenue event",
    detail: "Basket value exceeded predicted threshold",
    tone: "green",
  },
  {
    label: "Suppression",
    detail: "Discount blocked for users likely to convert organically",
    tone: "amber",
  },
  {
    label: "Risk signal",
    detail: "Negative support sentiment lowered urgency",
    tone: "rose",
  },
];

const currency = new Intl.NumberFormat("en-GB", {
  currency: "GBP",
  maximumFractionDigits: 0,
  style: "currency",
});

const number = new Intl.NumberFormat("en-GB");

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function percent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function sparklinePath(values: number[]) {
  const width = 260;
  const height = 86;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / spread) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function toneClass(tone: EventLog["tone"]) {
  const classes = {
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rose: "bg-rose-100 text-rose-800 border-rose-200",
  };

  return classes[tone];
}

export function SignalLab() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("retention");
  const [audience, setAudience] = useState(86000);
  const [offer, setOffer] = useState(12);
  const [velocity, setVelocity] = useState(62);
  const [channels, setChannels] = useState<Record<ChannelKey, boolean>>({
    email: true,
    inApp: true,
    push: true,
  });
  const [isRunning, setIsRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<EventLog[]>(baseEvents);

  const scenario = scenarios[scenarioKey];

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
      setEvents((current) => {
        const next = eventRotations[(tick + current.length) % eventRotations.length];
        return [
          { ...next, id: tick + current.length + 5 },
          ...current.slice(0, 5),
        ];
      });
    }, 2200);

    return () => window.clearInterval(interval);
  }, [isRunning, tick]);

  const model = useMemo(() => {
    const activeChannels = channelKeys.filter((key) => channels[key]);
    const channelLift = activeChannels.reduce(
      (sum, key) => sum + channelConfig[key].lift,
      0,
    );
    const fatigue = activeChannels.reduce(
      (sum, key) => sum + channelConfig[key].fatigue,
      0,
    );
    const cost = activeChannels.reduce(
      (sum, key) => sum + channelConfig[key].cost,
      0,
    );
    const offerEffect = (offer / 100) * scenario.sensitivity * 0.42;
    const timingEffect = (velocity / 100) * scenario.urgency * 0.038;
    const liveAdjustment = Math.sin(tick / 2) * 0.006;
    const conversionRate = clamp(
      scenario.baselineRate +
        channelLift +
        offerEffect +
        timingEffect +
        scenario.intent * 0.018 +
        liveAdjustment,
      0.025,
      0.34,
    );
    const fatigueRisk = clamp(
      fatigue + (velocity / 100) * 0.044 + Math.max(offer - 18, 0) * 0.003,
      0.03,
      0.41,
    );
    const qualifiedShare = clamp(
      scenario.intent * 0.62 + velocity / 260 - fatigueRisk / 3,
      0.28,
      0.92,
    );
    const holdoutShare = clamp(0.08 + fatigueRisk / 5, 0.08, 0.18);
    const sends = Math.round(audience * qualifiedShare * activeChannels.length);
    const conversions = Math.round(audience * conversionRate);
    const revenue = conversions * scenario.orderValue * (1 - offer / 100);
    const baselineRevenue =
      audience * scenario.baselineRate * scenario.orderValue;
    const incrementalRevenue = revenue - baselineRevenue - sends * cost;
    const suppressed = Math.round(audience * (1 - qualifiedShare));
    const confidence = clamp(
      0.62 + activeChannels.length * 0.07 + holdoutShare * 0.34 - fatigueRisk / 4,
      0.51,
      0.94,
    );
    const points = Array.from({ length: 14 }, (_, index) => {
      const step = index + tick / 3;
      return clamp(
        conversionRate +
          Math.sin(step * 0.72) * 0.006 +
          Math.cos(step * 0.31) * 0.004,
        0.02,
        0.36,
      );
    });

    return {
      activeChannels,
      confidence,
      conversionRate,
      fatigueRisk,
      holdoutShare,
      incrementalRevenue,
      points,
      qualifiedShare,
      sends,
      suppressed,
    };
  }, [audience, channels, offer, scenario, tick, velocity]);

  const activeChannelCount = model.activeChannels.length || 1;

  function toggleChannel(key: ChannelKey) {
    setChannels((current) => {
      const enabledCount = channelKeys.filter((item) => current[item]).length;
      if (current[key] && enabledCount === 1) {
        return current;
      }

      return { ...current, [key]: !current[key] };
    });
  }

  function advanceCycle() {
    setTick((value) => value + 1);
    setEvents((current) => {
      const next = eventRotations[(tick + current.length) % eventRotations.length];
      return [{ ...next, id: tick + current.length + 7 }, ...current.slice(0, 5)];
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#15171c] text-white">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-teal-700">Signal Lab</p>
                <h1 className="text-2xl font-semibold text-[#15171c] sm:text-3xl">
                  Customer journey command centre
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm sm:flex">
              <StatusPill icon={CheckCircle2} label="Git-ready" />
              <StatusPill icon={ShieldCheck} label="Holdout on" />
              <StatusPill icon={Radio} label="Live stream" active />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard
              icon={TrendingUp}
              label="Forecast incremental revenue"
              value={currency.format(model.incrementalRevenue)}
              detail={`${percent(model.conversionRate)} conversion forecast`}
              tone="green"
            />
            <SummaryCard
              icon={Users}
              label="Audience protected from noise"
              value={number.format(model.suppressed)}
              detail={`${percent(model.qualifiedShare)} qualified for delivery`}
              tone="blue"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Message fatigue risk"
              value={percent(model.fatigueRisk)}
              detail={`${percent(model.confidence)} model confidence`}
              tone="amber"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-lg border border-border bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Scenario controls</h2>
              <p className="mt-1 text-sm text-slate-600">
                Tune the journey and watch the forecast move.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRunning((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label={isRunning ? "Pause simulation" : "Run simulation"}
            >
              {isRunning ? (
                <CirclePause className="h-5 w-5" aria-hidden="true" />
              ) : (
                <CirclePlay className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="mt-5 grid gap-2">
            {(Object.keys(scenarios) as ScenarioKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setScenarioKey(key)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition ${
                  scenarioKey === key
                    ? "border-[#15171c] bg-[#15171c] text-white"
                    : "border-border bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm font-medium">{scenarios[key].label}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-border bg-panel-muted p-3">
            <p className={`text-sm font-semibold ${scenario.accent}`}>
              {scenario.trigger}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {scenario.description}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {scenario.commercialGoal}
            </p>
          </div>

          <ControlSlider
            label="Audience size"
            value={audience}
            min={20000}
            max={240000}
            step={2000}
            display={number.format(audience)}
            onChange={setAudience}
          />
          <ControlSlider
            label="Offer depth"
            value={offer}
            min={0}
            max={30}
            step={1}
            display={`${offer}%`}
            onChange={setOffer}
          />
          <ControlSlider
            label="Decision velocity"
            value={velocity}
            min={20}
            max={95}
            step={1}
            display={`${velocity}/100`}
            onChange={setVelocity}
          />

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-800">Channel mix</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {channelKeys.map((key) => {
                const Icon = channelConfig[key].icon;
                const isEnabled = channels[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleChannel(key)}
                    className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border px-2 py-3 text-sm transition ${
                      isEnabled
                        ? "border-[#15171c] bg-white text-[#15171c]"
                        : "border-border bg-slate-50 text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="font-medium">{channelConfig[key].label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={advanceCycle}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Advance one cycle
          </button>
        </aside>

        <div className="grid gap-4">
          <section className="rounded-lg border border-border bg-panel p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <h2 className="text-lg font-semibold">Journey orchestration</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  A five-stage lifecycle path with qualification, channel
                  selection and incrementality controls.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-slate-700">
                <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Cycle {tick + 1}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-5">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const stageAudience = Math.round(
                  audience *
                    stage.share *
                    model.qualifiedShare *
                    (1 - index * 0.026),
                );
                return (
                  <div
                    key={stage.label}
                    className="relative rounded-md border border-border bg-white p-3"
                  >
                    {index < stages.length - 1 ? (
                      <div className="absolute right-[-10px] top-1/2 hidden h-px w-5 bg-border md:block" />
                    ) : null}
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-slate-600" aria-hidden="true" />
                      <span className="font-mono text-xs text-slate-500">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold">{stage.label}</p>
                    <p className="mt-1 font-mono text-lg text-[#15171c]">
                      {number.format(stageAudience)}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-md bg-slate-100">
                      <div
                        className="h-full bg-teal-600"
                        style={{
                          width: `${clamp(stage.share * model.qualifiedShare * 100, 8, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-md border border-border bg-[#fbfcfe] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Conversion trajectory</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Live forecast across the next orchestration window.
                    </p>
                  </div>
                  <p className="font-mono text-sm text-slate-700">
                    Holdout {percent(model.holdoutShare, 0)}
                  </p>
                </div>
                <svg
                  viewBox="0 0 260 110"
                  role="img"
                  aria-label="Forecast conversion trajectory"
                  className="mt-4 h-44 w-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 96 L 260 96"
                    stroke="#d9e0ea"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={sparklinePath(model.points)}
                    fill="none"
                    stroke="#0f766e"
                    strokeLinecap="round"
                    strokeWidth="4"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={`${sparklinePath(model.points)} L 260 110 L 0 110 Z`}
                    fill="#0f766e"
                    opacity="0.09"
                  />
                </svg>
              </div>

              <div className="rounded-md border border-border bg-[#fbfcfe] p-4">
                <p className="text-sm font-semibold">Channel allocation</p>
                <div className="mt-4 grid gap-4">
                  {channelKeys.map((key) => {
                    const config = channelConfig[key];
                    const share = channels[key]
                      ? Math.round(100 / activeChannelCount)
                      : 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {config.label}
                          </span>
                          <span className="font-mono text-slate-600">{share}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-md bg-slate-100">
                          <div
                            className={`h-full ${config.colour}`}
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-border bg-panel p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Decision model</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Interpretable scoring for propensity, pressure and action.
                  </p>
                </div>
                <Target className="h-5 w-5 text-teal-700" aria-hidden="true" />
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border pb-3 text-sm font-medium text-slate-500">
                  <span>Signal strength</span>
                  <span>Recommended action</span>
                </div>
                <div className="divide-y divide-border">
                  <ModelRow
                    signal="Commercial intent"
                    weight={scenario.intent}
                    read={percent(scenario.intent, 0)}
                    action="Prioritise high-value paths"
                  />
                  <ModelRow
                    signal="Message pressure"
                    weight={model.fatigueRisk}
                    read={percent(model.fatigueRisk)}
                    action="Suppress low-fit audiences"
                  />
                  <ModelRow
                    signal="Urgency window"
                    weight={scenario.urgency}
                    read={`${velocity}/100`}
                    action="Accelerate triggered sends"
                  />
                  <ModelRow
                    signal="Offer sensitivity"
                    weight={scenario.sensitivity}
                    read={`${offer}% incentive`}
                    action="Hold back unnecessary discounting"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-panel p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Event telemetry</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Recent signals feeding the simulation.
                  </p>
                </div>
                <MousePointer2 className="h-5 w-5 text-slate-600" aria-hidden="true" />
              </div>

              <div className="mt-4 divide-y divide-border">
                {events.map((event) => (
                  <div key={event.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {event.label}
                      </p>
                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${toneClass(event.tone)}`}
                      >
                        live
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {event.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatusPill({
  active = false,
  icon: Icon,
  label,
}: {
  active?: boolean;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-slate-700 shadow-sm">
      {active ? (
        <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
      ) : (
        <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function SummaryCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "green";
  value: string;
}) {
  const toneClasses = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
  };

  return (
    <article className="rounded-lg border border-border bg-panel p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#15171c]">
            {value}
          </p>
        </div>
        <div className={`rounded-md p-2 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </article>
  );
}

function ControlSlider({
  display,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  display: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="mt-5 block">
      <span className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="font-mono text-slate-600">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full"
        suppressHydrationWarning
      />
    </label>
  );
}

function ModelRow({
  action,
  read,
  signal,
  weight,
}: {
  action: string;
  read: string;
  signal: string;
  weight: number;
}) {
  return (
    <div className="grid gap-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-slate-800">{signal}</p>
          <p className="shrink-0 font-mono text-slate-700">{read}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-md bg-slate-100">
          <div
            className="h-full bg-teal-600"
            style={{ width: `${clamp(weight * 100, 6, 100)}%` }}
          />
        </div>
      </div>
      <p className="leading-6 text-slate-600 sm:text-right">{action}</p>
    </div>
  );
}
