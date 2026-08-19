/**
 * Server Workbench — imports user-owned physical server data, then compares it only
 * with values publicly disclosed for the selected hyperscaler VM profile.
 */
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleAlert, FileDown, FileUp, Save, ServerCog, Trash2 } from "lucide-react";
import { profiles } from "@/data/hyperscalers";
import { addLocalServerCandidates, readLocalServerCandidates, removeLocalServerCandidate, writeLocalServerCandidates, type LocalServerCandidate } from "@/lib/localServerCandidates";
import { compareServerToReference, type ServerCandidateMetrics, type ServerMetricAssessment } from "@shared/serverComparison";

type ServerDraft = {
  manufacturer: string; model: string; rackUnits: string; powerCapacityW: string; powerSupplyCount: string;
  cpuModel: string; cpuSockets: string; cpuCores: string; memoryGiB: string; networkGbps: string;
  ssdFormFactor: string; ssdInterface: string; ssdProtocol: string; ssdCount: string; ssdCapacityPerDriveGb: string;
  ssdAggregateIops: string; ssdReadIops: string; ssdWriteIops: string; ssdAggregateMBps: string; ssdReadMBps: string; ssdWriteMBps: string;
  sourceFileName: string; sourceUrl: string; notes: string;
};

const blankDraft = (): ServerDraft => ({
  manufacturer: "", model: "", rackUnits: "", powerCapacityW: "", powerSupplyCount: "", cpuModel: "", cpuSockets: "", cpuCores: "", memoryGiB: "", networkGbps: "",
  ssdFormFactor: "", ssdInterface: "", ssdProtocol: "", ssdCount: "", ssdCapacityPerDriveGb: "", ssdAggregateIops: "", ssdReadIops: "", ssdWriteIops: "", ssdAggregateMBps: "", ssdReadMBps: "", ssdWriteMBps: "",
  sourceFileName: "", sourceUrl: "", notes: "",
});

const nullableNumber = (value: string) => value.trim() === "" ? null : Number(value);
const nullableText = (value: string) => value.trim() === "" ? null : value.trim();

function toInput(draft: ServerDraft) {
  return {
    manufacturer: draft.manufacturer.trim(), model: draft.model.trim(), rackUnits: nullableNumber(draft.rackUnits), powerCapacityW: nullableNumber(draft.powerCapacityW), powerSupplyCount: nullableNumber(draft.powerSupplyCount),
    cpuModel: nullableText(draft.cpuModel), cpuSockets: nullableNumber(draft.cpuSockets), cpuCores: nullableNumber(draft.cpuCores), memoryGiB: nullableNumber(draft.memoryGiB), networkGbps: nullableNumber(draft.networkGbps),
    ssdFormFactor: nullableText(draft.ssdFormFactor), ssdInterface: nullableText(draft.ssdInterface), ssdProtocol: nullableText(draft.ssdProtocol), ssdCount: nullableNumber(draft.ssdCount), ssdCapacityPerDriveGb: nullableNumber(draft.ssdCapacityPerDriveGb),
    ssdAggregateIops: nullableNumber(draft.ssdAggregateIops), ssdReadIops: nullableNumber(draft.ssdReadIops), ssdWriteIops: nullableNumber(draft.ssdWriteIops), ssdAggregateMBps: nullableNumber(draft.ssdAggregateMBps), ssdReadMBps: nullableNumber(draft.ssdReadMBps), ssdWriteMBps: nullableNumber(draft.ssdWriteMBps),
    sourceFileName: nullableText(draft.sourceFileName), sourceUrl: nullableText(draft.sourceUrl), notes: nullableText(draft.notes),
  };
}

function cells(line: string, delimiter: string) {
  const result: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') { if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted; }
    else if (char === delimiter && !quoted) { result.push(cell.trim()); cell = ""; } else cell += char;
  }
  result.push(cell.trim()); return result;
}

const normalized = (header: string) => header.toLowerCase().replace(/[\s_\-/().]/g, "");
const valueFor = (row: Record<string, string>, aliases: string[]) => row[aliases.find((alias) => row[alias] !== undefined) ?? ""] ?? "";

function parseServerCsv(text: string, sourceFileName: string): ServerDraft[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("헤더와 최소 한 개의 서버 후보 행이 필요합니다.");
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = cells(lines[0], delimiter).map(normalized);
  return lines.slice(1).map((line, index) => {
    const row = headers.reduce<Record<string, string>>((record, header, cellIndex) => ({ ...record, [header]: cells(line, delimiter)[cellIndex] ?? "" }), {});
    const manufacturer = valueFor(row, ["manufacturer", "vendor", "servervendor", "제조사"]);
    const model = valueFor(row, ["model", "servermodel", "모델"]);
    if (!manufacturer || !model) throw new Error(`${index + 2}행: manufacturer와 model은 필수입니다.`);
    return {
      manufacturer, model,
      rackUnits: valueFor(row, ["rackunits", "racku", "racksize", "랙u"]), powerCapacityW: valueFor(row, ["powercapacityw", "powerw", "powercapacity", "전력w"]), powerSupplyCount: valueFor(row, ["powersupplycount", "psucount"]),
      cpuModel: valueFor(row, ["cpumodel", "cpu"]), cpuSockets: valueFor(row, ["cpusockets", "sockets"]), cpuCores: valueFor(row, ["cpucores", "cores"]), memoryGiB: valueFor(row, ["memorygib", "memorygb", "memory"]), networkGbps: valueFor(row, ["networkgbps", "network"]),
      ssdFormFactor: valueFor(row, ["ssdformfactor", "formfactor"]), ssdInterface: valueFor(row, ["ssdinterface", "interface"]), ssdProtocol: valueFor(row, ["ssdprotocol", "protocol"]), ssdCount: valueFor(row, ["ssdcount", "drivecount"]), ssdCapacityPerDriveGb: valueFor(row, ["ssdcapacityperdrivegb", "drivecapacitygb"]),
      ssdAggregateIops: valueFor(row, ["ssdaggregateiops", "aggregateiops"]), ssdReadIops: valueFor(row, ["ssdreadiops", "readiops"]), ssdWriteIops: valueFor(row, ["ssdwriteiops", "writeiops"]), ssdAggregateMBps: valueFor(row, ["ssdaggregatembps", "aggregatembps"]), ssdReadMBps: valueFor(row, ["ssdreadmbps", "readmbps"]), ssdWriteMBps: valueFor(row, ["ssdwritembps", "writembps"]),
      sourceFileName, sourceUrl: valueFor(row, ["sourceurl", "url"]), notes: valueFor(row, ["notes", "note", "비고"]),
    };
  });
}

function metricLabel(key: ServerMetricAssessment["key"]) {
  const labels: Record<ServerMetricAssessment["key"], string> = {
    rackUnits: "RACK SIZE", powerCapacityW: "POWER CAPACITY", cpuCores: "CPU CORES", memoryGiB: "MEMORY", networkGbps: "NETWORK", ssdFormFactor: "SSD FORM FACTOR", ssdInterface: "SSD INTERFACE", ssdProtocol: "SSD PROTOCOL", ssdCount: "SSD COUNT", ssdCapacityPerDriveGb: "SSD CAPACITY / DRIVE", ssdAggregateIops: "SSD AGG. IOPS", ssdReadIops: "SSD READ IOPS", ssdWriteIops: "SSD WRITE IOPS", ssdAggregateMBps: "SSD AGG. MB/s", ssdReadMBps: "SSD READ MB/s", ssdWriteMBps: "SSD WRITE MB/s",
  }; return labels[key];
}

function formatMetric(metric: ServerMetricAssessment, value: ServerMetricAssessment["candidate"] | ServerMetricAssessment["reference"]) {
  if (value === null) return "—";
  if (metric.key === "rackUnits") return `${value} U`;
  if (metric.key === "powerCapacityW") return `${Number(value).toLocaleString()} W`;
  if (metric.key === "memoryGiB") return `${Number(value).toLocaleString()} GiB`;
  if (metric.key === "networkGbps") return `${Number(value).toLocaleString()} Gbps`;
  if (metric.key === "ssdCount") return `${value} EA`;
  if (metric.key === "ssdCapacityPerDriveGb") return `${Number(value).toLocaleString()} GB`;
  if (metric.key.includes("Iops")) return Number(value).toLocaleString();
  if (metric.key.includes("MBps")) return `${Number(value).toLocaleString()} MB/s`;
  return String(value);
}

const statusText: Record<ServerMetricAssessment["status"], string> = { meets: "공개 기준 이상", gap: "갭 확인", candidate_missing: "후보 입력 필요", public_undisclosed: "공개 없음", review: "호환성 검토" };
const statusStyle: Record<ServerMetricAssessment["status"], string> = { meets: "bg-[#5F8E84]/12 text-[#315e54]", gap: "bg-[#E65B32]/12 text-[#B84826]", candidate_missing: "bg-[#B79754]/14 text-[#7E5F24]", public_undisclosed: "bg-[#17202A]/7 text-[#6B6D69]", review: "bg-[#315A7D]/10 text-[#315A7D]" };

export function ServerWorkbench() {
  const [draft, setDraft] = useState<ServerDraft>(blankDraft); const [targetProfileId, setTargetProfileId] = useState("gcp-z3"); const [activeServerId, setActiveServerId] = useState<number | null>(null); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<LocalServerCandidate[]>(() => readLocalServerCandidates(window.localStorage));
  useEffect(() => { writeLocalServerCandidates(window.localStorage, servers); }, [servers]);
  useEffect(() => { if (activeServerId === null && servers[0]) setActiveServerId(servers[0].id); }, [activeServerId, servers]);
  const activeServer = servers.find((server) => server.id === activeServerId) ?? servers[0]; const targetProfile = profiles.find((profile) => profile.id === targetProfileId) ?? profiles[0];
  const analysis = useMemo(() => { if (!activeServer) return null; const metrics: ServerCandidateMetrics = { rackUnits: activeServer.rackUnits === null ? null : Number(activeServer.rackUnits), powerCapacityW: activeServer.powerCapacityW, cpuCores: activeServer.cpuCores, memoryGiB: activeServer.memoryGiB, networkGbps: activeServer.networkGbps, ssdFormFactor: activeServer.ssdFormFactor, ssdInterface: activeServer.ssdInterface, ssdProtocol: activeServer.ssdProtocol, ssdCount: activeServer.ssdCount, ssdCapacityPerDriveGb: activeServer.ssdCapacityPerDriveGb, ssdAggregateIops: activeServer.ssdAggregateIops, ssdReadIops: activeServer.ssdReadIops, ssdWriteIops: activeServer.ssdWriteIops, ssdAggregateMBps: activeServer.ssdAggregateMBps, ssdReadMBps: activeServer.ssdReadMBps, ssdWriteMBps: activeServer.ssdWriteMBps }; return compareServerToReference(metrics, targetProfile.serverReference); }, [activeServer, targetProfile]);
  const updateDraft = (field: keyof ServerDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const save = () => { setMessage(null); setError(null); if (!draft.manufacturer.trim() || !draft.model.trim()) { setError("서버 제조사와 모델명은 필수입니다."); return; } setServers((current) => addLocalServerCandidates(current, [toInput(draft)])); setDraft(blankDraft()); setMessage("서버 후보를 이 브라우저에 저장했습니다."); };
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setMessage(null); setError(null); try { const parsed = parseServerCsv(await file.text(), file.name); setServers((current) => addLocalServerCandidates(current, parsed.map(toInput))); setMessage(`${parsed.length}개 서버 후보를 이 브라우저에 저장했습니다.`); } catch (parseError) { setError(parseError instanceof Error ? parseError.message : "파일을 해석하지 못했습니다."); } event.target.value = ""; };
  const removeServer = (id: number) => { setServers((current) => removeLocalServerCandidate(current, id)); setActiveServerId((current) => current === id ? null : current); setMessage("서버 후보를 삭제했습니다."); setError(null); };
  const downloadTemplate = () => { const header = "manufacturer,model,rackUnits,powerCapacityW,powerSupplyCount,cpuModel,cpuSockets,cpuCores,memoryGiB,networkGbps,ssdFormFactor,ssdInterface,ssdProtocol,ssdCount,ssdCapacityPerDriveGb,ssdAggregateIops,ssdReadIops,ssdWriteIops,ssdAggregateMBps,ssdReadMBps,ssdWriteMBps,sourceUrl,notes\n"; const url = URL.createObjectURL(new Blob([header], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "signal-ledger-server-candidates-template.csv"; anchor.click(); URL.revokeObjectURL(url); };
  const inputClass = "mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]";
  const field = (label: string, key: keyof ServerDraft, placeholder: string, numeric = false) => <label className="text-xs font-semibold" key={key}>{label}<input value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)} inputMode={numeric ? "numeric" : undefined} placeholder={placeholder} className={inputClass} /></label>;

  return <section id="servers" className="border-y border-[#17202A]/12 bg-[#EAE5DB]/55 px-4 py-10 sm:px-7 lg:px-10 lg:py-12"><div className="mx-auto max-w-[1380px]"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="font-mono-ui text-[10px] font-medium tracking-[0.16em] text-[#E65B32]">04 · SERVER PROFILE WORKBENCH</p><h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">서버와 SSD의 경계를 함께 봅니다.</h2></div><p className="max-w-xl text-xs leading-5 text-[#6B6D69]">랙 크기, 전력 용량, CPU·메모리·네트워크, SSD 폼팩터·인터페이스·프로토콜·개수·용량·성능을 내부 후보 서버와 동일한 축에서 관리합니다.</p></div>
    <div className="mt-6 border border-[#315A7D]/20 bg-[#FFFDF8] p-5"><div className="flex items-center gap-2 text-[#315A7D]"><ServerCog className="h-5 w-5" /><span className="font-mono-ui text-[10px] tracking-[.12em]">PUBLIC · NO LOGIN REQUIRED</span></div><h3 className="font-display mt-2 text-lg font-semibold">로그인 없이 바로 서버 후보를 등록할 수 있습니다.</h3><p className="mt-1 text-sm leading-6 text-[#59636B]">입력한 데이터는 계정이나 서버로 전송하지 않고 현재 브라우저에만 저장됩니다. 브라우저 데이터 삭제 또는 다른 기기에서는 목록이 유지되지 않습니다.</p></div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,.88fr)]"><div className="border border-[#17202A]/14 bg-[#FFFDF8] surface-shadow"><div className="flex flex-col gap-4 border-b border-[#17202A]/10 p-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono-ui text-[10px] tracking-[.13em] text-[#6B6D69]">SERVER INPUT</p><h3 className="font-display mt-1 text-xl font-semibold">서버 사양 등록 또는 CSV 가져오기</h3></div><div className="flex flex-wrap gap-2"><button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-sm border border-[#17202A]/16 px-3 py-2 text-xs font-semibold hover:border-[#315A7D] hover:text-[#315A7D]"><FileDown className="h-3.5 w-3.5" />빈 템플릿</button><label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-[#E65B32] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#cf4e29]"><FileUp className="h-3.5 w-3.5" />CSV/TSV 가져오기<input onChange={handleFile} type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" className="sr-only" /></label></div></div>
        <div className="p-5"><p className="font-mono-ui mb-3 text-[10px] tracking-[.12em] text-[#E65B32]">PHYSICAL PLATFORM</p><div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">{field("서버 제조사 *", "manufacturer", "예: Dell, HPE, ODM")} {field("서버 모델명 *", "model", "예: 내부 구성명")} {field("랙 크기 (U)", "rackUnits", "예: 2", true)} {field("전력 용량 (W)", "powerCapacityW", "예: 1600", true)} {field("PSU 개수", "powerSupplyCount", "예: 2", true)} {field("CPU 모델", "cpuModel", "예: Xeon / EPYC")} {field("CPU 소켓", "cpuSockets", "예: 2", true)} {field("CPU 코어 합계", "cpuCores", "예: 128", true)} {field("메모리 (GiB)", "memoryGiB", "예: 1024", true)} {field("네트워크 (Gbps)", "networkGbps", "예: 200", true)}</div>
          <p className="font-mono-ui mb-3 mt-7 border-t border-[#17202A]/10 pt-5 text-[10px] tracking-[.12em] text-[#E65B32]">LOCAL SSD TOPOLOGY & PERFORMANCE</p><div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">{field("SSD 폼팩터", "ssdFormFactor", "U.2, E3.S, E1.S, M.2")} {field("SSD 인터페이스", "ssdInterface", "PCIe 5.0 x4")} {field("SSD 프로토콜", "ssdProtocol", "NVMe 2.0")} {field("SSD 개수", "ssdCount", "예: 8", true)} {field("드라이브당 용량 (GB)", "ssdCapacityPerDriveGb", "예: 3840", true)} {field("SSD Aggregate IOPS", "ssdAggregateIops", "예: 1200000", true)} {field("SSD Read IOPS", "ssdReadIops", "예: 900000", true)} {field("SSD Write IOPS", "ssdWriteIops", "예: 500000", true)} {field("SSD Aggregate MB/s", "ssdAggregateMBps", "예: 12000", true)} {field("SSD Read MB/s", "ssdReadMBps", "예: 7000", true)} {field("SSD Write MB/s", "ssdWriteMBps", "예: 5000", true)}</div>
          <label className="mt-4 block text-xs font-semibold">출처 URL<input value={draft.sourceUrl} onChange={(event) => updateDraft("sourceUrl", event.target.value)} placeholder="https:// — 내부 구성서 또는 데이터시트" className={inputClass} /></label><label className="mt-4 block text-xs font-semibold">메모<textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="PSU 정격/중복 구성, SSD 시험 조건, 팬·냉각 구성 등" className="mt-1.5 min-h-20 w-full rounded-sm border border-[#17202A]/15 bg-white p-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label></div>
        <div className="flex flex-col gap-3 border-t border-[#17202A]/10 bg-[#FBF9F3] p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#6B6D69]">필수값은 제조사·모델입니다. 랙·전력처럼 공개 클라우드 프로파일에 없는 값은 <strong>공개 없음</strong>으로 보존됩니다.</p><button onClick={save} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-sm bg-[#17202A] px-4 text-sm font-semibold text-white transition hover:bg-[#243241]"><Save className="h-4 w-4 text-[#E65B32]" />서버 저장</button></div></div>
        <div className="border border-[#17202A]/14 bg-[#17202A] p-5 text-[#FFFDF8] surface-shadow"><p className="font-mono-ui text-[10px] tracking-[.13em] text-[#F3A58C]">SERVER CSV CONTRACT</p><h3 className="font-display mt-2 text-xl font-semibold">물리 구성까지 구조화합니다.</h3><p className="mt-3 text-sm leading-6 text-[#C8D2D7]">CSV/TSV는 브라우저에서 파싱되고 현재 브라우저의 서버 후보 목록에 저장됩니다. 원본 파일은 별도 보안 저장소에서 관리하세요.</p><div className="mt-6 border-y border-white/12 py-4 font-mono-ui text-[10px] leading-6 text-[#B7C6D1]">필수 열<br /><span className="text-white">manufacturer · model</span><br /><br />주요 선택 열<br />rackUnits · powerCapacityW · cpuCores · memoryGiB · networkGbps<br />ssdFormFactor · ssdInterface · ssdProtocol · ssdCount · ssdCapacityPerDriveGb · ssdAggregateIops · ssdReadIops · ssdWriteIops · ssdAggregateMBps · ssdReadMBps · ssdWriteMBps</div><div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#DCE4E7]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#E65B32]" />랙·전력·폼팩터는 공개 VM 카탈로그에서 자주 비공개입니다. 이 항목은 내부 후보 검토용이며 자동 적합 판정에 쓰지 않습니다.</div></div></div>
      {message && <p className="mt-4 flex items-center gap-2 rounded-sm border border-[#5F8E84]/25 bg-[#5F8E84]/10 px-4 py-3 text-sm text-[#315e54]"><BadgeCheck className="h-4 w-4" />{message}</p>}{error && <p className="mt-4 flex items-center gap-2 rounded-sm border border-[#E65B32]/28 bg-[#E65B32]/10 px-4 py-3 text-sm text-[#B84826]"><CircleAlert className="h-4 w-4" />{error}</p>}
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)]"><div className="border border-[#17202A]/14 bg-[#FFFDF8] surface-shadow"><div className="flex items-center justify-between border-b border-[#17202A]/10 p-5"><div><p className="font-mono-ui text-[10px] tracking-[.13em] text-[#6B6D69]">LOCAL SERVER LIBRARY</p><h3 className="font-display mt-1 text-xl font-semibold">이 브라우저에 저장된 서버 후보</h3></div><span className="rounded-full bg-[#EAE5DB] px-2.5 py-1 font-mono-ui text-[10px]">{servers.length}</span></div>{servers.length ? <div className="divide-y divide-[#17202A]/10">{servers.map((server) => <div key={server.id} className={`flex items-center gap-3 p-4 transition ${activeServer?.id === server.id ? "bg-[#F5EFE5]" : "hover:bg-[#FBF9F3]"}`}><button onClick={() => setActiveServerId(server.id)} className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><span className="rounded-full border border-[#315A7D]/20 bg-[#315A7D]/8 px-2 py-0.5 font-mono-ui text-[9px] text-[#315A7D]">{server.manufacturer}</span><span className="font-mono-ui text-[10px] text-[#6B6D69]">{server.rackUnits ? `${server.rackUnits}U` : "RACK N/D"}</span></div><p className="mt-2 truncate text-sm font-semibold">{server.model}</p><p className="mt-0.5 truncate text-[11px] text-[#6B6D69]">{server.ssdCount ?? "—"} SSD · {server.ssdFormFactor ?? "폼팩터 미입력"} · {server.powerCapacityW ? `${server.powerCapacityW}W` : "전력 미입력"}</p></button><button onClick={() => removeServer(server.id)} aria-label={`${server.model} 삭제`} className="rounded-sm p-2 text-[#7A7D79] transition hover:bg-[#E65B32]/10 hover:text-[#E65B32]"><Trash2 className="h-4 w-4" /></button></div>)}</div> : <div className="p-6"><p className="font-display text-lg font-semibold">아직 저장된 서버 후보가 없습니다.</p><p className="mt-2 text-sm leading-6 text-[#6B6D69]">수동으로 첫 서버를 등록하거나 CSV/TSV 파일을 가져오세요.</p></div>}</div>
      <div className="border border-[#17202A]/14 bg-[#FFFDF8] surface-shadow"><div className="flex flex-col gap-4 border-b border-[#17202A]/10 p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono-ui text-[10px] tracking-[.13em] text-[#6B6D69]">PUBLIC SERVER GAP</p><h3 className="font-display mt-1 text-xl font-semibold">서버 후보 × 하이퍼스케일러 프로파일</h3></div><label className="text-xs font-semibold">비교 프로파일<select value={targetProfileId} onChange={(event) => setTargetProfileId(event.target.value)} className="mt-1.5 h-9 w-full min-w-[240px] rounded-sm border border-[#17202A]/15 bg-white px-3 text-xs font-normal outline-none focus:border-[#E65B32]">{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.provider} · {profile.profile}</option>)}</select></label></div>{analysis && activeServer ? <div><div className="grid gap-px border-b border-[#17202A]/10 bg-[#17202A]/10 sm:grid-cols-3"><div className="bg-[#FFFDF8] p-5"><p className="font-mono-ui text-[10px] tracking-[.1em] text-[#6B6D69]">SERVER CANDIDATE</p><p className="font-display mt-2 text-lg font-semibold">{activeServer.model}</p><p className="mt-1 text-xs text-[#6B6D69]">{activeServer.manufacturer}</p></div><div className="bg-[#FFFDF8] p-5"><p className="font-mono-ui text-[10px] tracking-[.1em] text-[#6B6D69]">PUBLIC REFERENCE</p><p className="font-display mt-2 text-lg font-semibold">{targetProfile.provider}</p><p className="mt-1 text-xs text-[#6B6D69]">{targetProfile.profile}</p></div><div className="bg-[#17202A] p-5 text-white"><p className="font-mono-ui text-[10px] tracking-[.1em] text-[#F3A58C]">COVERAGE SCORE</p><p className="font-display mt-1 text-3xl font-semibold">{analysis.score === null ? "—" : `${analysis.score}%`}</p><p className="mt-1 text-xs text-[#B7C6D1]">공개·비교 가능 {analysis.comparableCount}개</p></div></div><div className="divide-y divide-[#17202A]/10">{analysis.metrics.map((metric) => <div key={metric.key} className="grid grid-cols-[minmax(88px,.85fr)_minmax(94px,1fr)_minmax(94px,1fr)_auto] items-center gap-2 p-4 text-xs"><span className="font-mono-ui text-[9px] tracking-[.04em] text-[#59636B]">{metricLabel(metric.key)}</span><span className="font-medium text-[#17202A]">{formatMetric(metric, metric.candidate)}</span><span className="text-[#6B6D69]">{formatMetric(metric, metric.reference)}</span><span className={`justify-self-end rounded-full px-2 py-1 text-[10px] font-medium ${statusStyle[metric.status]}`}>{statusText[metric.status]}</span></div>)}</div><div className="border-t border-[#17202A]/10 bg-[#FBF9F3] p-4 text-xs leading-5 text-[#6B6D69]"><strong className="text-[#17202A]">해석 범위.</strong> 점수는 공개된 수치가 있고 단위가 같은 CPU·메모리·네트워크·SSD 수량/용량/성능 값만 반영합니다. 랙·전력·폼팩터는 공개되지 않을 때 우열을 판정하지 않으며, 인터페이스·프로토콜이 다르면 호환성 검토 대상으로 표시합니다.</div></div> : <div className="p-7"><p className="font-display text-xl font-semibold">비교할 서버 후보를 선택하세요.</p><p className="mt-2 text-sm leading-6 text-[#6B6D69]">서버를 저장하면 랙, 전력, SSD 물리 토폴로지와 성능의 공개성·입력 상태·갭을 함께 보여줍니다.</p></div>}</div></div>
    </div></section>;
}
