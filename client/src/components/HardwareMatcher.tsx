import { useMemo, useState } from "react";
import {
  ExternalLink,
  HardDrive,
  RotateCcw,
  Search,
  ServerCog,
} from "lucide-react";
import {
  catalogStats,
  serverCatalog,
  ssdCatalog,
  type CatalogProvenance,
  type ServerCatalogItem,
  type SsdCatalogItem,
  type WorkloadClass,
} from "@/data/hardwareCatalog";
import {
  analyzeHardwareMatch,
  formatTerabytes,
  type HardwareCheckStatus,
  type HardwareMatchVerdict,
} from "@shared/hardwareMatch";

const ALL = "all";

export function formatCatalogDate(date: string) {
  return date.replaceAll("-", ".");
}

const confidenceStyle: Record<CatalogProvenance["sourceConfidence"], string> = {
  A: "border-[#315E54]/25 bg-[#315E54]/10 text-[#315E54]",
  B: "border-[#7E5F24]/25 bg-[#7E5F24]/10 text-[#7E5F24]",
  C: "border-[#17202A]/20 bg-[#17202A]/6 text-[#59636B]",
};

const checkStyle: Record<HardwareCheckStatus, string> = {
  pass: "border-[#315E54]/20 bg-[#315E54]/8 text-[#315E54]",
  review: "border-[#7E5F24]/20 bg-[#7E5F24]/8 text-[#7E5F24]",
  fail: "border-[#C94A24]/25 bg-[#C94A24]/8 text-[#A83B1D]",
  unknown: "border-[#17202A]/15 bg-[#17202A]/5 text-[#59636B]",
};

const verdictCopy: Record<
  HardwareMatchVerdict,
  { eyebrow: string; title: string; detail: string; style: string }
> = {
  compatible: {
    eyebrow: "공개 기준 충족",
    title: "물리·링크 기준 호환",
    detail: "공개된 폼팩터와 PCIe 세대 기준으로 연결 가능한 조합입니다.",
    style: "border-[#315E54] bg-[#315E54]/8 text-[#315E54]",
  },
  review: {
    eyebrow: "확인 필요",
    title: "구성 검토 필요",
    detail: "연결은 가능하지만 링크 제한 또는 미공개 값이 있습니다.",
    style: "border-[#7E5F24] bg-[#7E5F24]/8 text-[#7E5F24]",
  },
  incompatible: {
    eyebrow: "규격 불일치",
    title: "물리 규격 불일치",
    detail: "선택한 SSD 폼팩터가 서버의 공개 지원 목록에 없습니다.",
    style: "border-[#C94A24] bg-[#C94A24]/8 text-[#A83B1D]",
  },
};

const workloadLabels: Record<WorkloadClass, string> = {
  "read-intensive": "읽기 중심",
  "mixed-use": "혼합 사용",
  "write-intensive": "쓰기 중심",
};

const powerBasisLabels: Record<SsdCatalogItem["powerBasis"], string> = {
  typical: "typical 합산",
  maximum: "maximum 합산",
  unspecified: "측정 기준 미명시",
};

function includesSearch(values: Array<string | null>, search: string) {
  if (!search) return true;
  return values.join(" ").toLowerCase().includes(search);
}

export function pinActiveItem<T extends { id: string }>(
  visibleItems: T[],
  activeItem: T
): T[] {
  if (!visibleItems.some(item => item.id === activeItem.id)) {
    return visibleItems;
  }
  return [
    activeItem,
    ...visibleItems.filter(item => item.id !== activeItem.id),
  ];
}

function SourceCard({
  label,
  record,
}: {
  label: string;
  record: CatalogProvenance;
}) {
  return (
    <div className="border border-[#17202A]/13 bg-[#FFFDF8] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono-ui text-[9px] tracking-[0.12em] text-[#6B6D69]">
          {label} · OFFICIAL SOURCE
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 font-mono-ui text-[9px] ${confidenceStyle[record.sourceConfidence]}`}
        >
          신뢰도 {record.sourceConfidence}
        </span>
      </div>
      <a
        href={record.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 flex items-start justify-between gap-3 text-xs font-semibold leading-5 text-[#315A7D] underline-offset-2 hover:underline"
      >
        <span>{record.sourceLabel}</span>
        <ExternalLink
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
          aria-hidden="true"
        />
      </a>
      <p className="mt-2 text-[10px] leading-4 text-[#6B6D69]">
        값 범위: {record.valueScope} · 확인 {record.sourceRetrievedAt}
      </p>
    </div>
  );
}

function ServerButton({
  item,
  selected,
  onSelect,
}: {
  item: ServerCatalogItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const optionSummary = item.storageOptions
    .map(option => {
      const interfaces = option.interfaces.length
        ? option.interfaces.join("/")
        : "인터페이스 N/D";
      const bays =
        option.bayCount === null ? "베이 N/D" : `${option.bayCount} bays`;
      return `${option.envelope}·${interfaces}·${bays}`;
    })
    .join(" / ");
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`min-h-24 w-full border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315A7D] ${
        selected
          ? "border-[#C94A24] bg-[#C94A24]/7 shadow-[0_5px_18px_rgba(201,74,36,.10)]"
          : "border-[#17202A]/13 bg-[#FFFDF8] hover:border-[#17202A]/45"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-[10px] text-[#6B6D69]">
            {item.manufacturer}
          </span>
          <span className="mt-0.5 block text-sm font-semibold leading-5">
            {item.model}
          </span>
        </span>
        <span className="font-mono-ui text-[9px] text-[#6B6D69]">
          {item.rackUnits === null ? "N/D" : `${item.rackUnits}U`}
        </span>
      </span>
      <span className="mt-3 flex flex-wrap gap-1.5 font-mono-ui text-[9px] text-[#59636B]">
        <span>{optionSummary}</span>
      </span>
    </button>
  );
}

function SsdButton({
  item,
  selected,
  onSelect,
}: {
  item: SsdCatalogItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`min-h-24 w-full border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315A7D] ${
        selected
          ? "border-[#C94A24] bg-[#C94A24]/7 shadow-[0_5px_18px_rgba(201,74,36,.10)]"
          : "border-[#17202A]/13 bg-[#FFFDF8] hover:border-[#17202A]/45"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-[10px] text-[#6B6D69]">
            {item.manufacturer}
          </span>
          <span className="mt-0.5 block text-sm font-semibold leading-5">
            {item.model}
          </span>
        </span>
        <span className="font-mono-ui text-[9px] text-[#6B6D69]">
          {item.envelope} · {item.interfaces.join("/")}
        </span>
      </span>
      <span className="mt-3 flex flex-wrap gap-1.5 font-mono-ui text-[9px] text-[#59636B]">
        <span>{formatTerabytes(item.capacityTb)}</span>
        <span aria-hidden="true">·</span>
        <span>PCIe {item.pcieGen === null ? "N/D" : `Gen${item.pcieGen}`}</span>
        <span aria-hidden="true">·</span>
        <span>{workloadLabels[item.workloadClass]}</span>
      </span>
    </button>
  );
}

export function HardwareMatcher() {
  const [serverId, setServerId] = useState(serverCatalog[0]?.id ?? "");
  const [ssdId, setSsdId] = useState(ssdCatalog[0]?.id ?? "");
  const [serverSearch, setServerSearch] = useState("");
  const [serverVendor, setServerVendor] = useState(ALL);
  const [ssdSearch, setSsdSearch] = useState("");
  const [ssdVendor, setSsdVendor] = useState(ALL);
  const [workloadClass, setWorkloadClass] = useState<
    typeof ALL | WorkloadClass
  >(ALL);

  const serverVendors = useMemo(
    () =>
      Array.from(new Set(serverCatalog.map(item => item.manufacturer))).sort(),
    []
  );
  const ssdVendors = useMemo(
    () => Array.from(new Set(ssdCatalog.map(item => item.manufacturer))).sort(),
    []
  );
  const visibleServers = useMemo(() => {
    const search = serverSearch.trim().toLowerCase();
    return serverCatalog.filter(
      item =>
        (serverVendor === ALL || item.manufacturer === serverVendor) &&
        includesSearch(
          [item.manufacturer, item.model, item.cpu, item.workloads.join(" ")],
          search
        )
    );
  }, [serverSearch, serverVendor]);
  const visibleSsds = useMemo(() => {
    const search = ssdSearch.trim().toLowerCase();
    return ssdCatalog.filter(
      item =>
        (ssdVendor === ALL || item.manufacturer === ssdVendor) &&
        (workloadClass === ALL || item.workloadClass === workloadClass) &&
        includesSearch(
          [
            item.manufacturer,
            item.model,
            item.envelope,
            item.interfaces.join(" "),
            item.workloads.join(" "),
          ],
          search
        )
    );
  }, [ssdSearch, ssdVendor, workloadClass]);

  const activeServer =
    serverCatalog.find(item => item.id === serverId) ?? serverCatalog[0];
  const activeSsd = ssdCatalog.find(item => item.id === ssdId) ?? ssdCatalog[0];
  if (!activeServer || !activeSsd) return null;

  const displayedServers = pinActiveItem(visibleServers, activeServer);
  const displayedSsds = pinActiveItem(visibleSsds, activeSsd);
  const serverSelectionOutsideFilter = !visibleServers.some(
    item => item.id === activeServer.id
  );
  const ssdSelectionOutsideFilter = !visibleSsds.some(
    item => item.id === activeSsd.id
  );
  const result = analyzeHardwareMatch(activeServer, activeSsd);
  const verdict = verdictCopy[result.verdict];
  const requiredChecks = result.checks.filter(item => item.key !== "workload");
  const powerLabel =
    result.estimatedDrivePowerW === null
      ? "N/D"
      : `${Number(result.estimatedDrivePowerW.toFixed(1))} W`;
  const selectedOption = result.selectedStorageOption;
  const resetServerFilters = () => {
    setServerSearch("");
    setServerVendor(ALL);
  };
  const resetSsdFilters = () => {
    setSsdSearch("");
    setSsdVendor(ALL);
    setWorkloadClass(ALL);
  };

  return (
    <section
      id="matcher"
      className="scroll-mt-16 border-y border-[#17202A]/13 bg-[#EAE5DB]/55 px-4 py-9 sm:px-7 lg:px-10 lg:py-12"
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono-ui text-[10px] font-medium tracking-[0.16em] text-[#C94A24]">
              01 · HARDWARE MATCHER
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              서버와 SSD를 클릭해 공개 규격을 맞춥니다.
            </h2>
          </div>
          <div className="max-w-xl text-xs leading-5 text-[#59636B] lg:text-right">
            <p>
              서버 {catalogStats.serverCount}종 · SSD {catalogStats.ssdCount}종
              · 제조사 {catalogStats.serverVendors + catalogStats.ssdVendors}개
              범위 · 데이터 기준 {formatCatalogDate(catalogStats.updatedAt)}.
              결과는 실제 출하 BOM이나 조달 승인을 보증하지 않습니다.
            </p>
            <a
              href="#profiles"
              className="mt-2 inline-flex min-h-11 items-center font-semibold text-[#315A7D] underline underline-offset-4"
            >
              상세 근거 보기
            </a>
            <div
              aria-label="출처 신뢰도 등급 안내"
              className="mt-2 flex flex-wrap justify-start gap-x-3 gap-y-1 text-[10px] text-[#59636B] lg:justify-end"
            >
              <span>
                <strong>A</strong> 개별 공식 사양
              </span>
              <span>
                <strong>B</strong> 공식 제품군 자료
              </span>
              <span>
                <strong>C</strong> 공식 자료의 제한적 값
              </span>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`sticky top-16 z-10 mt-4 border-l-4 px-3 py-2 shadow-[0_5px_18px_rgba(23,32,42,.10)] lg:hidden ${verdict.style}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold">{verdict.title}</p>
            <p className="font-mono-ui text-[9px]">
              {formatTerabytes(result.rawCapacityTb)} · {powerLabel}
            </p>
          </div>
          <p className="mt-1 truncate text-[10px] text-[#34414D]">
            {activeServer.model} × {activeSsd.model}
          </p>
        </div>

        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {activeServer.manufacturer} {activeServer.model}와{" "}
          {activeSsd.manufacturer} {activeSsd.model}. 판정: {verdict.title}.{" "}
          {requiredChecks
            .map(item => `${item.label} ${item.statusLabel}`)
            .join(", ")}
          . Raw 용량 {formatTerabytes(result.rawCapacityTb)}, SSD active power{" "}
          {powerLabel}.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(240px,3fr)_minmax(320px,4fr)_minmax(240px,3fr)] lg:items-start">
          <div className="border border-[#17202A]/14 bg-[#F7F4ED] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                <ServerCog
                  className="h-4 w-4 text-[#C94A24]"
                  aria-hidden="true"
                />{" "}
                서버 선택
              </h3>
              <span className="font-mono-ui text-[9px] text-[#6B6D69]">
                {visibleServers.length} / {serverCatalog.length}
              </span>
            </div>
            <label className="mt-3 flex min-h-11 items-center gap-2 border border-[#17202A]/16 bg-[#FFFDF8] px-3 focus-within:border-[#315A7D]">
              <Search className="h-4 w-4 text-[#6B6D69]" aria-hidden="true" />
              <span className="sr-only">서버 검색</span>
              <input
                value={serverSearch}
                onChange={event => setServerSearch(event.target.value)}
                placeholder="제품·CPU·워크로드 검색"
                className="w-full bg-transparent text-xs outline-none placeholder:text-[#8B8D89]"
              />
            </label>
            <label className="mt-2 block">
              <span className="sr-only">서버 제조사 필터</span>
              <select
                value={serverVendor}
                onChange={event => setServerVendor(event.target.value)}
                className="min-h-11 w-full border border-[#17202A]/16 bg-[#FFFDF8] px-3 text-xs outline-none focus:border-[#315A7D]"
              >
                <option value={ALL}>모든 서버 제조사</option>
                {serverVendors.map(vendor => (
                  <option key={vendor}>{vendor}</option>
                ))}
              </select>
            </label>
            {serverSelectionOutsideFilter && visibleServers.length > 0 && (
              <p
                className="mt-2 text-[10px] leading-4 text-[#7E5F24]"
                role="status"
              >
                현재 선택한 서버는 필터 결과 밖에서 유지됩니다.
              </p>
            )}
            <div className="mt-3 max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {displayedServers.map(item => (
                <ServerButton
                  key={item.id}
                  item={item}
                  selected={item.id === activeServer.id}
                  onSelect={() => setServerId(item.id)}
                />
              ))}
              {visibleServers.length === 0 && (
                <div
                  role="status"
                  className="border border-dashed border-[#17202A]/20 bg-[#FFFDF8] p-5 text-center"
                >
                  <p className="text-sm font-semibold">
                    일치하는 서버가 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={resetServerFilters}
                    className="mt-3 min-h-11 px-3 text-xs font-semibold text-[#315A7D] underline underline-offset-4"
                  >
                    서버 필터 초기화
                  </button>
                </div>
              )}
            </div>
            {(serverSearch || serverVendor !== ALL) &&
              visibleServers.length > 0 && (
                <button
                  type="button"
                  onClick={resetServerFilters}
                  className="mt-3 flex min-h-11 items-center gap-2 text-xs font-semibold text-[#315A7D]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> 서버
                  필터 초기화
                </button>
              )}
          </div>

          <div className="lg:sticky lg:top-4">
            <div className="border border-[#17202A]/16 bg-[#FFFDF8] p-4 shadow-[0_12px_34px_rgba(23,32,42,.08)] sm:p-5">
              <div className={`border-l-4 p-4 ${verdict.style}`}>
                <p className="font-mono-ui text-[9px] font-medium tracking-[0.14em]">
                  {verdict.eyebrow}
                </p>
                <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">
                  {verdict.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#34414D]">
                  {verdict.detail}
                </p>
                {selectedOption && (
                  <p className="mt-2 font-mono-ui text-[9px] leading-4 text-[#59636B]">
                    자동 선택 구성: {selectedOption.envelope} ·{" "}
                    {selectedOption.interfaces.length
                      ? selectedOption.interfaces.join("/")
                      : "인터페이스 N/D"}{" "}
                    ·{" "}
                    {selectedOption.bayCount === null
                      ? "베이 N/D"
                      : `${selectedOption.bayCount} bays`}{" "}
                    · PCIe{" "}
                    {selectedOption.pcieGen === null
                      ? "N/D"
                      : `Gen${selectedOption.pcieGen}`}
                  </p>
                )}
              </div>
              <p className="mt-4 text-center text-xs font-semibold leading-5 text-[#34414D]">
                {activeServer.manufacturer} {activeServer.model}
                <span className="mx-2 text-[#C94A24]">×</span>
                {activeSsd.manufacturer} {activeSsd.model}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {requiredChecks.map(item => (
                  <div
                    key={item.key}
                    className={`border p-3 ${checkStyle[item.status]}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#17202A]">
                        {item.label}
                      </span>
                      <span className="font-mono-ui text-[9px] font-semibold">
                        {item.icon} {item.statusLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-[#59636B]">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-px border border-[#17202A]/14 bg-[#17202A]/14">
                <div className="bg-[#F7F4ED] p-3">
                  <p className="font-mono-ui text-[9px] tracking-[0.1em] text-[#6B6D69]">
                    RAW CAPACITY
                  </p>
                  <p className="font-display mt-1 text-xl font-semibold">
                    {formatTerabytes(result.rawCapacityTb)}
                  </p>
                </div>
                <div className="bg-[#F7F4ED] p-3">
                  <p className="font-mono-ui text-[9px] tracking-[0.1em] text-[#6B6D69]">
                    SSD ACTIVE POWER
                  </p>
                  <p className="font-display mt-1 text-xl font-semibold">
                    {powerLabel}
                  </p>
                  <p className="mt-1 text-[9px] text-[#6B6D69]">
                    {powerBasisLabels[activeSsd.powerBasis]}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <SourceCard label="SERVER" record={activeServer} />
                <SourceCard label="SSD" record={activeSsd} />
              </div>
              <p className="mt-3 text-[10px] leading-4 text-[#6B6D69]">
                워크로드 참고: {result.workloadFit.detail}
              </p>
            </div>
          </div>

          <div className="border border-[#17202A]/14 bg-[#F7F4ED] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                <HardDrive
                  className="h-4 w-4 text-[#C94A24]"
                  aria-hidden="true"
                />{" "}
                SSD 선택
              </h3>
              <span className="font-mono-ui text-[9px] text-[#6B6D69]">
                {visibleSsds.length} / {ssdCatalog.length}
              </span>
            </div>
            <label className="mt-3 flex min-h-11 items-center gap-2 border border-[#17202A]/16 bg-[#FFFDF8] px-3 focus-within:border-[#315A7D]">
              <Search className="h-4 w-4 text-[#6B6D69]" aria-hidden="true" />
              <span className="sr-only">SSD 검색</span>
              <input
                value={ssdSearch}
                onChange={event => setSsdSearch(event.target.value)}
                placeholder="제품·폼팩터·워크로드 검색"
                className="w-full bg-transparent text-xs outline-none placeholder:text-[#8B8D89]"
              />
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block">
                <span className="sr-only">SSD 제조사 필터</span>
                <select
                  value={ssdVendor}
                  onChange={event => setSsdVendor(event.target.value)}
                  className="min-h-11 w-full border border-[#17202A]/16 bg-[#FFFDF8] px-3 text-xs outline-none focus:border-[#315A7D]"
                >
                  <option value={ALL}>모든 SSD 제조사</option>
                  {ssdVendors.map(vendor => (
                    <option key={vendor}>{vendor}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="sr-only">SSD 워크로드 필터</span>
                <select
                  value={workloadClass}
                  onChange={event =>
                    setWorkloadClass(
                      event.target.value as typeof ALL | WorkloadClass
                    )
                  }
                  className="min-h-11 w-full border border-[#17202A]/16 bg-[#FFFDF8] px-3 text-xs outline-none focus:border-[#315A7D]"
                >
                  <option value={ALL}>모든 워크로드 등급</option>
                  {(
                    Object.entries(workloadLabels) as Array<
                      [WorkloadClass, string]
                    >
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {ssdSelectionOutsideFilter && visibleSsds.length > 0 && (
              <p
                className="mt-2 text-[10px] leading-4 text-[#7E5F24]"
                role="status"
              >
                현재 선택한 SSD는 필터 결과 밖에서 유지됩니다.
              </p>
            )}
            <div className="mt-3 max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {displayedSsds.map(item => (
                <SsdButton
                  key={item.id}
                  item={item}
                  selected={item.id === activeSsd.id}
                  onSelect={() => setSsdId(item.id)}
                />
              ))}
              {visibleSsds.length === 0 && (
                <div
                  role="status"
                  className="border border-dashed border-[#17202A]/20 bg-[#FFFDF8] p-5 text-center"
                >
                  <p className="text-sm font-semibold">
                    일치하는 SSD가 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={resetSsdFilters}
                    className="mt-3 min-h-11 px-3 text-xs font-semibold text-[#315A7D] underline underline-offset-4"
                  >
                    SSD 필터 초기화
                  </button>
                </div>
              )}
            </div>
            {(ssdSearch || ssdVendor !== ALL || workloadClass !== ALL) &&
              visibleSsds.length > 0 && (
                <button
                  type="button"
                  onClick={resetSsdFilters}
                  className="mt-3 flex min-h-11 items-center gap-2 text-xs font-semibold text-[#315A7D]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> SSD
                  필터 초기화
                </button>
              )}
          </div>
        </div>
      </div>
    </section>
  );
}
