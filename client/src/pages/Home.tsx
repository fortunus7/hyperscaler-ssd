/**
 * Signal Ledger dashboard — asymmetric research canvas, evidence-first data presentation,
 * with regional filters, selectable comparison profiles and source-forward detail views.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Filter,
  Gauge,
  HardDrive,
  Info,
  Layers3,
  Menu,
  Network,
  Plus,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  profiles,
  requirementLens,
  sources,
  type HyperscalerProfile,
  type Region,
} from "@/data/hyperscalers";
import { CandidateWorkbench } from "@/components/CandidateWorkbench";
import { HardwareMatcher } from "@/components/HardwareMatcher";
import { ServerWorkbench } from "@/components/ServerWorkbench";
import { updateProfileSelection } from "@shared/profileSelection";

type MetricKey = "all" | "density" | "iops" | "network" | "coverage";

const regionStyle: Record<Region, string> = {
  US: "border-[#315A7D]/25 bg-[#315A7D]/10 text-[#244660]",
  CN: "border-[#5F8E84]/25 bg-[#5F8E84]/10 text-[#315e54]",
};

function sourceLabel(ids: number[]) {
  return ids.map(id => `[${id}]`).join(" ");
}

function coverageStyle(coverage: HyperscalerProfile["coverage"]) {
  if (coverage === "A") return "bg-[#5F8E84] text-white";
  if (coverage === "B") return "bg-[#B79754] text-[#17202A]";
  return "bg-[#A2A6A2] text-white";
}

function metricValue(profile: HyperscalerProfile, metric: MetricKey) {
  if (metric === "density") return profile.totalStorageTB ?? -1;
  if (metric === "iops")
    return Math.max(profile.readIopsM ?? -1, profile.writeIopsM ?? -1);
  if (metric === "network") return profile.networkGbps ?? -1;
  if (metric === "coverage")
    return profile.coverage === "A" ? 3 : profile.coverage === "B" ? 2 : 1;
  return profile.totalStorageTB ?? -1;
}

export function profileDetailScrollBehavior(
  reducedMotion: boolean
): ScrollBehavior {
  return reducedMotion ? "auto" : "smooth";
}

export default function Home() {
  const [region, setRegion] = useState<"ALL" | Region>("ALL");
  const [metric, setMetric] = useState<MetricKey>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "aws-i4i",
    "gcp-z3",
    "alibaba-i5",
  ]);
  const [activeProfileId, setActiveProfileId] = useState("gcp-z3");
  const [profileRevealRequest, setProfileRevealRequest] = useState(0);
  const profileDetailRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [comparisonNotice, setComparisonNotice] = useState("");

  const visibleProfiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return profiles
      .filter(profile => region === "ALL" || profile.region === region)
      .filter(profile => {
        if (!normalizedSearch) return true;
        return [
          profile.provider,
          profile.profile,
          profile.cpu,
          profile.workload.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
  }, [region, metric, search]);

  const selectedProfiles = profiles.filter(profile =>
    selectedIds.includes(profile.id)
  );
  const activeProfile =
    profiles.find(profile => profile.id === activeProfileId) ?? profiles[0];
  const toggleProfile = (id: string) => {
    setSelectedIds(current => {
      const result = updateProfileSelection(current, id, 3);
      setComparisonNotice(
        result.blocked
          ? "비교는 최대 3개까지 가능합니다. 기존 선택을 먼저 해제하세요."
          : ""
      );
      return result.ids;
    });
  };
  const revealProfile = (id: string) => {
    setActiveProfileId(id);
    setProfileRevealRequest(current => current + 1);
  };

  useEffect(() => {
    if (profileRevealRequest === 0) return;
    const detail = profileDetailRef.current;
    if (!detail) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    detail.focus({ preventScroll: true });
    detail.scrollIntoView({
      behavior: profileDetailScrollBehavior(reducedMotion),
      block: "start",
    });
  }, [activeProfileId, profileRevealRequest]);

  return (
    <div className="min-h-screen bg-[#F4F0E7] text-[#17202A] lg:flex">
      <aside className="hidden h-screen w-[248px] shrink-0 flex-col bg-[#17202A] px-5 py-6 text-[#FFFDF8] lg:sticky lg:top-0 lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <span className="signal-mark signal-mark-dark" aria-hidden="true" />
          <div>
            <p className="font-display text-[15px] font-bold tracking-tight">
              SIGNAL LEDGER
            </p>
            <p className="font-mono-ui mt-0.5 text-[9px] tracking-[0.14em] text-[#B7C6D1]">
              SSD INTELLIGENCE
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-1.5" aria-label="분석 영역">
          <a
            href="#overview"
            className="flex items-center gap-3 rounded-sm bg-white/10 px-3 py-2.5 text-sm font-medium"
          >
            <Activity className="h-4 w-4 text-[#E65B32]" />
            Overview
          </a>
          <a
            href="#matcher"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[#C9D3D9] transition hover:bg-white/8 hover:text-white"
          >
            <HardDrive className="h-4 w-4" />
            Matcher
          </a>
          <a
            href="#comparison"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[#C9D3D9] transition hover:bg-white/8 hover:text-white"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Compare
          </a>
          <a
            href="#servers"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[#C9D3D9] transition hover:bg-white/8 hover:text-white"
          >
            <ServerCog className="h-4 w-4" />
            Servers
          </a>
          <a
            href="#candidates"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[#C9D3D9] transition hover:bg-white/8 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Candidates
          </a>
          <a
            href="#requirements"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[#C9D3D9] transition hover:bg-white/8 hover:text-white"
          >
            <HardDrive className="h-4 w-4" />
            SSD Lens
          </a>
          <a
            href="#sources"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[#C9D3D9] transition hover:bg-white/8 hover:text-white"
          >
            <Layers3 className="h-4 w-4" />
            Sources
          </a>
        </nav>

        <div className="mt-auto rounded-sm border border-white/10 bg-[#202D39] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] tracking-[0.14em] text-[#9FB3C1]">
              EVIDENCE STATUS
            </span>
            <span className="h-2 w-2 rounded-full bg-[#E65B32] signal-dot" />
          </div>
          <p className="mt-3 text-sm font-semibold leading-5">
            공개 문서만 사용
          </p>
          <p className="mt-1 text-xs leading-5 text-[#B7C6D1]">
            내부 BOM·공급계약은 추정하지 않습니다.
          </p>
          <p className="font-mono-ui mt-4 text-[10px] text-[#7F97A8]">
            UPDATED · 2026.08.13
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#17202A]/10 bg-[#F4F0E7]/90 px-4 backdrop-blur-lg lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="signal-mark" aria-hidden="true" />
          <div>
            <p className="font-display text-sm font-bold">SIGNAL LEDGER</p>
            <p className="font-mono-ui text-[8px] tracking-[0.14em] text-[#6B6D69]">
              SSD INTELLIGENCE
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMenuOpen(value => !value)}
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-[#17202A]/15 bg-white/60 p-2"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {isMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="모바일 분석 영역"
          className="fixed inset-x-0 top-16 z-40 border-b border-[#17202A]/10 bg-[#FFFDF8] p-4 shadow-lg lg:hidden"
        >
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
            <a
              onClick={() => setIsMenuOpen(false)}
              href="#overview"
              className="flex min-h-11 items-center rounded-sm bg-[#F4F0E7] px-3 py-3"
            >
              Overview
            </a>
            <a
              onClick={() => setIsMenuOpen(false)}
              href="#matcher"
              className="flex min-h-11 items-center rounded-sm bg-[#F4F0E7] px-3 py-3"
            >
              Matcher
            </a>
            <a
              onClick={() => setIsMenuOpen(false)}
              href="#comparison"
              className="flex min-h-11 items-center rounded-sm bg-[#F4F0E7] px-3 py-3"
            >
              Compare
            </a>
            <a
              onClick={() => setIsMenuOpen(false)}
              href="#servers"
              className="flex min-h-11 items-center rounded-sm bg-[#F4F0E7] px-3 py-3"
            >
              Servers
            </a>
            <a
              onClick={() => setIsMenuOpen(false)}
              href="#candidates"
              className="flex min-h-11 items-center rounded-sm bg-[#F4F0E7] px-3 py-3"
            >
              Candidates
            </a>
            <a
              onClick={() => setIsMenuOpen(false)}
              href="#requirements"
              className="flex min-h-11 items-center rounded-sm bg-[#F4F0E7] px-3 py-3"
            >
              SSD Lens
            </a>
            <a
              onClick={() => setIsMenuOpen(false)}
              href="#sources"
              className="flex min-h-11 items-center rounded-sm bg-[#F4F0E7] px-3 py-3"
            >
              Sources
            </a>
          </div>
        </nav>
      )}

      <main className="min-w-0 flex-1">
        <section
          id="overview"
          className="relative overflow-hidden bg-[#F4F0E7] px-4 pb-10 pt-10 text-[#17202A] sm:px-7 sm:pt-14 lg:px-10 lg:pt-16"
        >
          <div
            className="hero-grid absolute inset-y-0 right-0 w-full lg:w-[56%]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#F4F0E7_5%,rgba(244,240,231,.96)_43%,rgba(244,240,231,.62)_74%,rgba(244,240,231,.18)_100%)]" />
          <div className="relative mx-auto max-w-[1380px]">
            <div className="mb-6 hidden items-center gap-3 lg:flex">
              <span className="signal-mark" aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-bold tracking-tight">
                  SIGNAL LEDGER
                </p>
                <p className="font-mono-ui mt-0.5 text-[9px] tracking-[0.14em] text-[#6B6D69]">
                  HYPERSCALER SSD INTELLIGENCE
                </p>
              </div>
              <span className="ml-2 h-px w-10 bg-[#E65B32]" />
              <span className="font-mono-ui text-[9px] tracking-[.12em] text-[#6B6D69]">
                PUBLIC EVIDENCE WORKSTATION
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono-ui text-[10px] tracking-[0.14em] text-[#59636B]">
              <span className="rounded-full border border-[#17202A]/15 bg-white/65 px-2.5 py-1">
                PUBLIC-SPEC INDEX
              </span>
              <span className="h-px w-7 bg-[#E65B32]" />
              <span>US + CHINA · STORAGE OPTIMIZED</span>
            </div>
            <div className="mt-7 max-w-3xl">
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                서버가 요구하는
                <br />
                <span className="text-[#E65B32]">SSD의 기준</span>을 읽다.
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-[#59636B] sm:text-base">
                미국·중국 주요 하이퍼스케일러가 공개한 스토리지 최적화 서버
                프로파일을 정규화했습니다. 장치 스펙뿐 아니라, I/O
                오프로드·네트워크·내구성 책임이 어떻게 분리되는지 한 화면에서
                확인하세요.
              </p>
            </div>
            <div className="mt-9 grid max-w-4xl grid-cols-2 gap-px overflow-hidden border border-[#17202A]/16 bg-[#17202A]/16 sm:grid-cols-4">
              {[
                ["06", "PUBLIC PROFILES"],
                ["03 / 03", "US · CN COVERAGE"],
                ["9.0M", "MAX PUBLISHED IOPS"],
                ["320G", "MAX HOST NETWORK"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="relative bg-[#FFFDF8]/90 px-4 py-4 backdrop-blur-sm"
                >
                  <span className="absolute left-0 top-0 h-1 w-9 bg-[#E65B32]" />
                  <p className="font-display text-2xl font-semibold tracking-tight">
                    {value}
                  </p>
                  <p className="font-mono-ui mt-1 text-[9px] tracking-[0.12em] text-[#6B6D69]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HardwareMatcher />

        <section
          id="profiles"
          className="mx-auto max-w-[1380px] scroll-mt-16 px-4 py-8 sm:px-7 lg:px-10 lg:py-10"
        >
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono-ui text-[10px] font-medium tracking-[0.16em] text-[#E65B32]">
                02 · PUBLIC PROFILE INDEX
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                규모가 아닌, 경로를 비교합니다.
              </h2>
            </div>
            <p className="max-w-sm text-xs leading-5 text-[#6B6D69]">
              메트릭을 선택하면 공개 값이 있는 범위에서 카드 순서가 달라집니다.
              미공개 수치는 0으로 취급하지 않습니다.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-y border-[#17202A]/13 py-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="mr-1 h-4 w-4 text-[#E65B32]" />
              {(["ALL", "US", "CN"] as const).map(value => (
                <button
                  key={value}
                  onClick={() => setRegion(value)}
                  aria-pressed={region === value}
                  aria-controls="profile-results"
                  className={`min-h-11 rounded-full border px-3 py-2 font-mono-ui text-[10px] tracking-[0.08em] transition ${region === value ? "border-[#17202A] bg-[#17202A] text-white" : "border-[#17202A]/15 bg-[#FFFDF8] text-[#59636b] hover:border-[#17202A]/50"}`}
                >
                  {value === "ALL"
                    ? "ALL REGIONS"
                    : value === "US"
                      ? "US / AMERICA"
                      : "CN / CHINA"}
                </button>
              ))}
              <span className="ml-1 hidden h-4 w-px bg-[#17202A]/15 sm:block" />
              {(
                [
                  ["all", "대표값"],
                  ["density", "용량 밀도"],
                  ["iops", "IOPS"],
                  ["network", "네트워크"],
                  ["coverage", "공개성"],
                ] as [MetricKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  aria-pressed={metric === key}
                  aria-controls="profile-results"
                  className={`min-h-11 rounded-full px-3 py-2 text-xs transition ${metric === key ? "bg-[#E65B32] text-white" : "text-[#59636b] hover:bg-[#EAE5DB]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex h-9 items-center gap-2 rounded-sm border border-[#17202A]/14 bg-[#FFFDF8] px-3 focus-within:border-[#E65B32] xl:w-72">
              <span className="sr-only">공개 프로파일 검색</span>
              <Search className="h-4 w-4 text-[#6B6D69]" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                aria-controls="profile-results"
                placeholder="사업자 · CPU · 워크로드 검색"
                className="w-full bg-transparent text-xs outline-none placeholder:text-[#9B9C98]"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium" role="status" aria-live="polite">
              검색 결과 {visibleProfiles.length}개
            </p>
            <p
              className="min-h-5 text-xs font-medium text-[var(--signal-action)]"
              aria-live="polite"
            >
              {comparisonNotice}
            </p>
          </div>

          <div
            id="profile-results"
            className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            {visibleProfiles.map((profile, index) => {
              const selected = selectedIds.includes(profile.id);
              const comparisonAtLimit = selectedIds.length >= 3 && !selected;
              return (
                <article
                  key={profile.id}
                  className={`rise-in group relative overflow-hidden border bg-[#FFFDF8] transition duration-200 ${selected ? "border-[#E65B32] shadow-[0_10px_30px_rgba(230,91,50,.13)]" : "border-[#17202A]/12 hover:-translate-y-0.5 hover:border-[#17202A]/35"}`}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <div className="flex items-start justify-between gap-4 p-5 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono-ui text-[9px] tracking-[0.1em] ${regionStyle[profile.region]}`}
                        >
                          {profile.region}
                        </span>
                        <span className="font-mono-ui text-[10px] text-[#6B6D69]">
                          {sourceLabel(profile.sourceIds)}
                        </span>
                      </div>
                      <h3 className="font-display mt-3 text-xl font-semibold tracking-tight">
                        {profile.provider}
                      </h3>
                      <p className="mt-1 text-xs text-[#59636b]">
                        {profile.profile}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleProfile(profile.id)}
                      aria-label={
                        selected
                          ? `${profile.provider} 비교 선택 해제`
                          : comparisonAtLimit
                            ? `${profile.provider} 비교 선택 불가: 최대 3개 선택됨`
                            : `${profile.provider} 비교 선택`
                      }
                      aria-pressed={selected}
                      aria-controls="comparison"
                      title={
                        comparisonAtLimit
                          ? "최대 3개까지 비교할 수 있습니다. 기존 선택을 먼저 해제하세요."
                          : undefined
                      }
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${selected ? "border-[var(--signal-action)] bg-[var(--signal-action)] text-white" : "border-[#17202A]/18 text-[#59636b] hover:border-[var(--signal-action)] hover:text-[var(--signal-action)]"}`}
                    >
                      {selected ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-base leading-none">+</span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => revealProfile(profile.id)}
                    aria-controls="profile-detail"
                    className="w-full border-t border-[#17202A]/10 px-5 py-3 text-left transition hover:bg-[#F6F2E9]"
                  >
                    <div
                      className="mb-3 flex items-center gap-1.5"
                      aria-label="프로토콜 리본"
                    >
                      <span className="h-px w-5 bg-[#17202A]/30" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E65B32]" />
                      {Array.from({ length: 7 }).map((_, ribbonIndex) => (
                        <span
                          key={ribbonIndex}
                          className={`h-1 flex-1 ${ribbonIndex < Math.min(profile.drives ?? 2, 7) ? (profile.region === "US" ? "bg-[#315A7D]" : "bg-[#5F8E84]") : "bg-[#17202A]/10"}`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="font-mono-ui text-[9px] tracking-[.08em] text-[#7A7D79]">
                          LOCAL SSD
                        </p>
                        <p className="font-display mt-1 text-lg font-semibold">
                          {profile.totalStorageTB
                            ? `${profile.totalStorageTB.toFixed(profile.totalStorageTB >= 100 ? 0 : 1)} TB`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono-ui text-[9px] tracking-[.08em] text-[#7A7D79]">
                          READ IOPS
                        </p>
                        <p className="font-display mt-1 text-lg font-semibold">
                          {profile.readIopsM ? `${profile.readIopsM}M` : "N/D"}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono-ui text-[9px] tracking-[.08em] text-[#7A7D79]">
                          NETWORK
                        </p>
                        <p className="font-display mt-1 text-lg font-semibold">
                          {profile.networkGbps
                            ? `${profile.networkGbps}G`
                            : "N/D"}
                        </p>
                      </div>
                    </div>
                    <span className="mt-3 flex items-center justify-between border-t border-[#17202A]/10 pt-3">
                      <span className="font-mono-ui text-[9px] tracking-[0.12em] text-[#7A7D79]">
                        EVIDENCE{" "}
                        <span
                          className={`ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] ${coverageStyle(profile.coverage)}`}
                        >
                          {profile.coverage}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#315A7D]">
                        프로파일 보기 <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </button>
                </article>
              );
            })}
            {visibleProfiles.length === 0 && (
              <div className="border border-[#17202A]/14 bg-[#FFFDF8] p-6 md:col-span-2 xl:col-span-3">
                <p className="font-display text-lg font-semibold">
                  일치하는 공개 프로파일이 없습니다.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#59636b]">
                  검색어와 리전 필터를 함께 적용한 결과입니다. 조건을 초기화하면
                  전체 프로파일을 다시 볼 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setRegion("ALL");
                    setMetric("all");
                  }}
                  className="mt-4 min-h-11 rounded-sm bg-[var(--signal-action)] px-4 py-2 text-sm font-semibold text-white"
                >
                  검색과 필터 초기화
                </button>
              </div>
            )}
          </div>
        </section>

        <section
          id="comparison"
          className="scroll-mt-16 border-y border-[#17202A]/12 bg-[#EAE5DB]/55 px-4 py-9 sm:px-7 lg:px-10 lg:py-12"
        >
          <div className="mx-auto max-w-[1380px]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono-ui text-[10px] font-medium tracking-[0.16em] text-[#E65B32]">
                  03 · SIDE-BY-SIDE COMPARISON
                </p>
                <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  선택한 프로파일을 같은 문장으로 읽습니다.
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-sm border border-[#17202A]/13 bg-[#FFFDF8] px-3 py-2 text-xs text-[#59636b]">
                <Info className="h-4 w-4 text-[#E65B32]" />
                최대 3개까지 비교 · 빈 값은 미공개
              </div>
            </div>

            <div className="mt-6 overflow-x-auto border border-[#17202A]/14 bg-[#FFFDF8] surface-shadow">
              <table className="min-w-[850px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#17202A]/12 bg-[#F7F4ED]">
                    <th className="w-[200px] px-5 py-4 font-mono-ui text-[10px] font-medium tracking-[0.14em] text-[#6B6D69]">
                      COMPARISON AXIS
                    </th>
                    {selectedProfiles.length ? (
                      selectedProfiles.map(profile => (
                        <th
                          key={profile.id}
                          className="min-w-[205px] border-l border-[#17202A]/10 px-5 py-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-display text-base font-semibold">
                                {profile.provider}
                              </p>
                              <p className="mt-0.5 text-[11px] font-normal text-[#6B6D69]">
                                {profile.profile}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleProfile(profile.id)}
                              className="rounded-sm p-1 text-[#7A7D79] hover:bg-[#EAE5DB] hover:text-[#E65B32]"
                              aria-label={`${profile.provider} 비교에서 제외`}
                              aria-pressed="true"
                              aria-controls="comparison"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </th>
                      ))
                    ) : (
                      <th className="px-5 py-4 text-sm font-normal text-[#6B6D69]">
                        상단 카드에서 비교할 프로파일을 선택하세요.
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["SERVER PLATFORM", (p: HyperscalerProfile) => p.cpu],
                    [
                      "HOST / I-O PATH",
                      (p: HyperscalerProfile) => p.architecture,
                    ],
                    [
                      "LOCAL SSD LAYOUT",
                      (p: HyperscalerProfile) => p.localStorage,
                    ],
                    [
                      "READ / WRITE IOPS",
                      (p: HyperscalerProfile) =>
                        `${p.readIopsM ? `${p.readIopsM}M` : "공개 없음"} / ${p.writeIopsM ? `${p.writeIopsM}M` : "공개 없음"}`,
                    ],
                    [
                      "THROUGHPUT",
                      (p: HyperscalerProfile) =>
                        `${p.readThroughput} · ${p.writeThroughput}`,
                    ],
                    [
                      "NETWORK CEILING",
                      (p: HyperscalerProfile) => p.networkLabel,
                    ],
                    [
                      "PERSISTENCE MODEL",
                      (p: HyperscalerProfile) => p.persistence,
                    ],
                  ].map(([label, render]) => (
                    <tr
                      key={label as string}
                      className="border-b border-[#17202A]/9 last:border-0"
                    >
                      <td className="bg-[#FBF9F3] px-5 py-4 font-mono-ui text-[10px] font-medium tracking-[0.1em] text-[#6B6D69]">
                        {label as string}
                      </td>
                      {selectedProfiles.map(profile => (
                        <td
                          key={profile.id}
                          className="border-l border-[#17202A]/10 px-5 py-4 text-xs leading-5 text-[#34414D]"
                        >
                          {(render as (p: HyperscalerProfile) => string)(
                            profile
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <ServerWorkbench />

        <CandidateWorkbench />

        <section
          id="profile-detail"
          ref={profileDetailRef}
          tabIndex={-1}
          aria-labelledby="profile-detail-heading"
          className="mx-auto grid max-w-[1380px] scroll-mt-16 gap-6 px-4 py-10 outline-none sm:px-7 lg:grid-cols-[minmax(0,7fr)_minmax(310px,3fr)] lg:px-10 lg:py-12"
        >
          <div className="border border-[#17202A]/13 bg-[#FFFDF8] surface-shadow">
            <div className="flex flex-col gap-5 border-b border-[#17202A]/10 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono-ui text-[9px] tracking-[.1em] ${regionStyle[activeProfile.region]}`}
                  >
                    {activeProfile.region}
                  </span>
                  <span className="font-mono-ui text-[10px] text-[#6B6D69]">
                    SOURCE {sourceLabel(activeProfile.sourceIds)}
                  </span>
                </div>
                <h2
                  id="profile-detail-heading"
                  className="font-display mt-3 text-2xl font-semibold tracking-tight"
                >
                  {activeProfile.provider}
                  <span className="mx-2 text-[#E65B32]">/</span>
                  {activeProfile.profile}
                </h2>
                <p className="mt-1 text-sm text-[#59636b]">
                  {activeProfile.cpu} · {activeProfile.architecture}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start rounded-sm bg-[#F4F0E7] px-3 py-2 font-mono-ui text-[10px] tracking-[.08em]">
                <span
                  className={`h-2 w-2 rounded-full ${activeProfile.coverage === "A" ? "bg-[#5F8E84]" : activeProfile.coverage === "B" ? "bg-[#B79754]" : "bg-[#A2A6A2]"}`}
                />
                COVERAGE {activeProfile.coverage}
              </div>
            </div>
            <div className="grid divide-y divide-[#17202A]/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-5">
                <p className="font-mono-ui text-[10px] tracking-[.12em] text-[#6B6D69]">
                  LOCAL STORAGE CONFIGURATION
                </p>
                <div className="mt-5 flex items-end gap-5">
                  <div>
                    <p className="font-display text-4xl font-semibold tracking-tight">
                      {activeProfile.totalStorageTB
                        ? `${activeProfile.totalStorageTB.toFixed(activeProfile.totalStorageTB > 99 ? 0 : 1)}`
                        : "—"}
                      <span className="ml-1 text-lg">TB</span>
                    </p>
                    <p className="mt-1 text-xs text-[#6B6D69]">
                      대표 공개 프로파일 기준
                    </p>
                  </div>
                  <HardDrive className="mb-1 h-10 w-10 text-[#E65B32]" />
                </div>
                <p className="mt-5 border-t border-[#17202A]/10 pt-4 text-sm leading-6 text-[#34414D]">
                  {activeProfile.localStorage}
                </p>
              </div>
              <div className="p-5">
                <p className="font-mono-ui text-[10px] tracking-[.12em] text-[#6B6D69]">
                  STORAGE PLANNING SIGNAL
                </p>
                <p className="mt-5 text-sm leading-7 text-[#34414D]">
                  {activeProfile.planningSignal}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {activeProfile.workload.map(item => (
                    <span
                      key={item}
                      className="rounded-full border border-[#315A7D]/16 bg-[#315A7D]/8 px-2.5 py-1 text-[10px] font-medium text-[#315A7D]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-px border-t border-[#17202A]/10 bg-[#17202A]/10 sm:grid-cols-3">
              <div className="bg-[#FFFDF8] p-5">
                <Gauge className="h-4 w-4 text-[#E65B32]" />
                <p className="font-mono-ui mt-5 text-[10px] tracking-[.1em] text-[#6B6D69]">
                  PUBLISHED IOPS
                </p>
                <p className="font-display mt-1 text-xl font-semibold">
                  {activeProfile.readIopsM
                    ? `${activeProfile.readIopsM}M / ${activeProfile.writeIopsM ?? "—"}M`
                    : "NOT DISCLOSED"}
                </p>
              </div>
              <div className="bg-[#FFFDF8] p-5">
                <Network className="h-4 w-4 text-[#E65B32]" />
                <p className="font-mono-ui mt-5 text-[10px] tracking-[.1em] text-[#6B6D69]">
                  NETWORK LIMIT
                </p>
                <p className="font-display mt-1 text-xl font-semibold">
                  {activeProfile.networkGbps
                    ? `${activeProfile.networkGbps} Gbps`
                    : "SKU-DEPENDENT"}
                </p>
              </div>
              <div className="bg-[#FFFDF8] p-5">
                <ShieldCheck className="h-4 w-4 text-[#E65B32]" />
                <p className="font-mono-ui mt-5 text-[10px] tracking-[.1em] text-[#6B6D69]">
                  DATA MODEL
                </p>
                <p className="mt-1 text-xs leading-5 text-[#34414D]">
                  {activeProfile.persistence}
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden border border-[#17202A]/13 bg-[#17202A] p-6 text-[#FFFDF8] surface-shadow">
            <div
              className="hardware-pattern absolute bottom-0 right-0 h-[62%] w-[70%]"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="font-mono-ui text-[10px] tracking-[.14em] text-[#F3A58C]">
                FIELD NOTE · 04
              </p>
              <h3 className="font-display mt-3 max-w-[250px] text-2xl font-semibold leading-tight tracking-tight">
                장치 사양만으로는 부족합니다.
              </h3>
              <p className="mt-4 max-w-[290px] text-sm leading-6 text-[#C8D2D7]">
                SSD 선정서는 p99 지연, 오프로드, 전력/열, 펌웨어 관측성, 장애 후
                재빌드 책임까지 포함해야 합니다.
              </p>
              <a
                href="#requirements"
                className="mt-7 inline-flex items-center gap-2 border-b border-[#E65B32] pb-1 text-xs font-semibold text-white"
              >
                요구사항 렌즈 보기{" "}
                <ArrowUpRight className="h-3.5 w-3.5 text-[#E65B32]" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="requirements"
          className="scroll-mt-16 border-y border-[#17202A]/12 bg-[#17202A] px-4 py-10 text-[#FFFDF8] sm:px-7 lg:px-10 lg:py-12"
        >
          <div className="mx-auto max-w-[1380px]">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:items-end">
              <div>
                <p className="font-mono-ui text-[10px] tracking-[.16em] text-[#F3A58C]">
                  06 · SSD REQUIREMENT LENS
                </p>
                <h2 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  조달표에 추가해야 할<br />네 가지 질문.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-[#C8D2D7]">
                아래 항목은 비공개 하이퍼스케일러 조달 조건을 주장하지 않습니다.
                공개 프로파일에서 확인되는 플랫폼 신호를 SSD 제안·검증 항목으로
                번역한 프레임입니다.
              </p>
            </div>
            <div className="mt-8 grid gap-px overflow-hidden border border-white/14 bg-white/14 sm:grid-cols-2">
              {requirementLens.map((lens, index) => (
                <article
                  key={lens.label}
                  className="bg-[#17202A] p-6 transition hover:bg-[#20303D]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-ui text-[10px] text-[#F3A58C]">
                      0{index + 1}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#E65B32]" />
                  </div>
                  <h3 className="font-display mt-8 text-xl font-semibold">
                    {lens.label}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#C8D2D7]">
                    {lens.desc}
                  </p>
                  <p className="font-mono-ui mt-7 border-t border-white/12 pt-3 text-[10px] leading-5 tracking-[.03em] text-[#8FA6B3]">
                    {lens.emphasis}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1380px] gap-6 px-4 py-10 sm:px-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:px-10 lg:py-12">
          <div>
            <p className="font-mono-ui text-[10px] font-medium tracking-[0.16em] text-[#E65B32]">
              07 · OBSERVED PATTERNS
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              서로 다른 숫자, 같은 설계 압력.
            </h2>
            <div className="mt-6 space-y-3">
              {[
                [
                  "01",
                  "용량 확장과 데이터 지속성은 별개",
                  "Tencent·AWS·Azure의 대형 로컬 NVMe 프로파일은 호스트 장애 시의 데이터 책임을 애플리케이션 복제 또는 분산 아키텍처에 명확히 둡니다.",
                ],
                [
                  "02",
                  "I/O 오프로드가 SSD의 체감 성능을 좌우",
                  "AWS Nitro, Google Titanium, Alibaba CIPU처럼 CPU 밖의 데이터 경로가 지연, 격리, 네트워크 병목을 함께 다룹니다.",
                ],
                [
                  "03",
                  "공개 수치는 검증 범위를 말해준다",
                  "Google처럼 읽기·쓰기 IOPS와 처리량을 함께 제시한 경우와 미공개인 경우를 구분해 조달 PoC의 측정 항목을 정할 수 있습니다.",
                ],
              ].map(([num, title, text]) => (
                <article
                  key={num}
                  className="flex gap-4 border-t border-[#17202A]/13 py-4"
                >
                  <span className="font-mono-ui pt-0.5 text-[10px] text-[#E65B32]">
                    {num}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#59636b]">
                      {text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="relative min-h-[330px] overflow-hidden border border-[#17202A]/13 bg-[#F9F7F1] p-6">
            <div
              className="thermal-pattern absolute inset-0"
              aria-hidden="true"
            />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E65B32] signal-dot" />
                <span className="font-mono-ui text-[10px] tracking-[.14em] text-[#34414D]">
                  PLANNING BOUNDARY
                </span>
              </div>
              <div className="max-w-[420px] bg-[#FFFDF8]/93 p-5 backdrop-blur-sm">
                <p className="font-display text-xl font-semibold leading-7">
                  “로컬 SSD는 빠르다”는 문장은, 장애·펌웨어·열·복구의 소유권이
                  명확할 때만 완성됩니다.
                </p>
                <p className="mt-3 text-xs leading-5 text-[#59636b]">
                  정량 비교는 가능하지만, 각 사업자의 측정 조건과 운영 경계를
                  제거한 단일 순위는 제시하지 않습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="sources"
          className="scroll-mt-16 border-t border-[#17202A]/12 bg-[#EAE5DB]/55 px-4 py-10 sm:px-7 lg:px-10"
        >
          <div className="mx-auto max-w-[1380px]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono-ui text-[10px] font-medium tracking-[0.16em] text-[#E65B32]">
                  08 · SOURCE REGISTER
                </p>
                <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  수치의 출발점.
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B6D69]">
                <CircleAlert className="h-4 w-4 text-[#E65B32]" />
                문서·리전·SKU 변경 시 재검증 필요
              </div>
            </div>
            <div className="mt-6 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {sources.map(source => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-[104px] flex-col justify-between border border-[#17202A]/12 bg-[#FFFDF8] p-4 transition hover:-translate-y-0.5 hover:border-[#315A7D]/55 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono-ui text-[11px] text-[#E65B32]">
                      [{source.id}]
                    </span>
                    <ExternalLink className="h-4 w-4 text-[#7A7D79] transition group-hover:text-[#315A7D]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6D69]">{source.publisher}</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-[#17202A]">
                      {source.label}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-6 flex flex-col justify-between gap-3 border-t border-[#17202A]/12 pt-5 text-xs leading-5 text-[#6B6D69] sm:flex-row">
              <p>
                방법론: 공개된 스토리지 최적화 인스턴스를 대표 프로파일로
                정규화했습니다. 총 용량은 원문 단위를 보존하되, 카드 순서를 위한
                TB 수치는 화면용 환산값입니다.
              </p>
              <p className="font-mono-ui whitespace-nowrap text-[10px] tracking-[.08em]">
                SIGNAL LEDGER · RESEARCH VIEW
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
