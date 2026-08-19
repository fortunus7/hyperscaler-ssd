/**
 * Candidate Workbench — user-owned SSD records are created from manual entry or CSV/TSV import,
 * then compared only against normalized values that were publicly disclosed for each profile.
 */
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleAlert, FileDown, FileUp, Save, ShieldCheck, Trash2 } from "lucide-react";
import { profiles } from "@/data/hyperscalers";
import { addLocalSsdCandidates, readLocalSsdCandidates, removeLocalSsdCandidate, writeLocalSsdCandidates, type LocalSsdCandidate } from "@/lib/localSsdCandidates";
import { compareCandidateToReference, type MetricAssessment, type SsdCandidateMetrics } from "@shared/ssdComparison";
import { SsdFitAnalysisPanel } from "@/components/SsdFitAnalysisPanel";

const manufacturers = ["Samsung", "SK hynix", "Micron", "KIOXIA", "SanDisk", "DapuStor"] as const;
type Manufacturer = (typeof manufacturers)[number];
type Assurance = "verified" | "not_verified" | "unknown";

type CandidateDraft = {
  manufacturer: Manufacturer;
  model: string;
  formFactor: string;
  capacityGb: string;
  pcieGen: string;
  nvmeVersion: string;
  readIops: string;
  writeIops: string;
  readMBps: string;
  writeMBps: string;
  dwpd: string;
  enduranceTbw: string;
  powerActiveW: string;
  powerLossProtection: Assurance;
  encryption: Assurance;
  sourceFileName: string;
  sourceUrl: string;
  notes: string;
};

const blankDraft = (): CandidateDraft => ({
  manufacturer: "Samsung",
  model: "",
  formFactor: "",
  capacityGb: "",
  pcieGen: "",
  nvmeVersion: "",
  readIops: "",
  writeIops: "",
  readMBps: "",
  writeMBps: "",
  dwpd: "",
  enduranceTbw: "",
  powerActiveW: "",
  powerLossProtection: "unknown",
  encryption: "unknown",
  sourceFileName: "",
  sourceUrl: "",
  notes: "",
});

const nullableNumber = (value: string) => value.trim() === "" ? null : Number(value);
const nullableText = (value: string) => value.trim() === "" ? null : value.trim();

function toInput(draft: CandidateDraft) {
  return {
    manufacturer: draft.manufacturer,
    model: draft.model.trim(),
    formFactor: nullableText(draft.formFactor),
    capacityGb: Number(draft.capacityGb),
    pcieGen: nullableText(draft.pcieGen),
    nvmeVersion: nullableText(draft.nvmeVersion),
    readIops: nullableNumber(draft.readIops),
    writeIops: nullableNumber(draft.writeIops),
    readMBps: nullableNumber(draft.readMBps),
    writeMBps: nullableNumber(draft.writeMBps),
    dwpd: nullableNumber(draft.dwpd),
    enduranceTbw: nullableNumber(draft.enduranceTbw),
    powerActiveW: nullableNumber(draft.powerActiveW),
    powerLossProtection: draft.powerLossProtection,
    encryption: draft.encryption,
    sourceFileName: nullableText(draft.sourceFileName),
    sourceUrl: nullableText(draft.sourceUrl),
    notes: nullableText(draft.notes),
  };
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) { cells.push(cell.trim()); cell = ""; }
    else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[\s_\-/().]/g, "");
}

function normalizeAssurance(value: string): Assurance {
  const normalized = value.trim().toLowerCase();
  if (["yes", "true", "verified", "확인", "예"].includes(normalized)) return "verified";
  if (["no", "false", "notverified", "미확인", "아니오"].includes(normalized)) return "not_verified";
  return "unknown";
}

function getMappedValue(row: Record<string, string>, aliases: string[]) {
  const key = aliases.find((alias) => row[alias] !== undefined);
  return key ? row[key] : "";
}

function parseCsv(text: string, sourceFileName: string): CandidateDraft[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) throw new Error("헤더와 최소 한 개의 후보 행이 필요합니다.");
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = parseDelimitedLine(lines[0], delimiter).map(normalizeHeader);
  const records = lines.slice(1).map((line) => {
    const cells = parseDelimitedLine(line, delimiter);
    return headers.reduce<Record<string, string>>((record, header, index) => ({ ...record, [header]: cells[index] ?? "" }), {});
  });
  return records.map((row, index) => {
    const rawManufacturer = getMappedValue(row, ["manufacturer", "vendor", "제조사"]);
    const manufacturer = manufacturers.find((value) => value.toLowerCase() === rawManufacturer.trim().toLowerCase());
    const model = getMappedValue(row, ["model", "partnumber", "partno", "모델"]);
    const capacityGb = getMappedValue(row, ["capacitygb", "capacity", "용량gb"]);
    if (!manufacturer || !model || !capacityGb || !Number.isFinite(Number(capacityGb))) {
      throw new Error(`${index + 2}행: manufacturer, model, capacityGb는 필수이며 제조사는 지원 목록과 일치해야 합니다.`);
    }
    return {
      manufacturer,
      model,
      formFactor: getMappedValue(row, ["formfactor", "form", "폼팩터"]),
      capacityGb,
      pcieGen: getMappedValue(row, ["pciegen", "pcie"]),
      nvmeVersion: getMappedValue(row, ["nvmeversion", "nvme"]),
      readIops: getMappedValue(row, ["readiops", "readiops4k"]),
      writeIops: getMappedValue(row, ["writeiops", "writeiops4k"]),
      readMBps: getMappedValue(row, ["readmbps", "readthroughputmbs"]),
      writeMBps: getMappedValue(row, ["writembps", "writethroughputmbs"]),
      dwpd: getMappedValue(row, ["dwpd"]),
      enduranceTbw: getMappedValue(row, ["endurancetbw", "tbw"]),
      powerActiveW: getMappedValue(row, ["poweractivew", "activepowerw"]),
      powerLossProtection: normalizeAssurance(getMappedValue(row, ["powerlossprotection", "plp"])),
      encryption: normalizeAssurance(getMappedValue(row, ["encryption"])),
      sourceFileName,
      sourceUrl: getMappedValue(row, ["sourceurl", "url"]),
      notes: getMappedValue(row, ["notes", "note", "비고"]),
    };
  });
}

function metricLabel(key: MetricAssessment["key"]) {
  const labels: Record<MetricAssessment["key"], string> = { capacityGb: "용량 / drive", readIops: "Read IOPS", writeIops: "Write IOPS", readMBps: "Read MB/s", writeMBps: "Write MB/s", pcieGen: "PCIe", dwpd: "DWPD" };
  return labels[key];
}

function formatMetric(metric: MetricAssessment, value: MetricAssessment["candidate"] | MetricAssessment["reference"]) {
  if (value === null) return "—";
  if (metric.key === "capacityGb") return `${Number(value).toLocaleString()} GB`;
  if (metric.key === "readIops" || metric.key === "writeIops") return Number(value).toLocaleString();
  if (metric.key === "readMBps" || metric.key === "writeMBps") return `${Number(value).toLocaleString()} MB/s`;
  if (metric.key === "dwpd") return `${value} DWPD`;
  return String(value);
}

function statusText(status: MetricAssessment["status"]) {
  return { meets: "공개 기준 이상", gap: "갭 확인", candidate_missing: "후보 입력 필요", public_undisclosed: "공개 없음" }[status];
}

function statusStyle(status: MetricAssessment["status"]) {
  return { meets: "bg-[#5F8E84]/12 text-[#315e54]", gap: "bg-[#E65B32]/12 text-[#B84826]", candidate_missing: "bg-[#B79754]/14 text-[#7E5F24]", public_undisclosed: "bg-[#17202A]/7 text-[#6B6D69]" }[status];
}

export function CandidateWorkbench() {
  const [draft, setDraft] = useState<CandidateDraft>(blankDraft);
  const [targetProfileId, setTargetProfileId] = useState("gcp-z3");
  const [activeCandidateId, setActiveCandidateId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<LocalSsdCandidate[]>(() => readLocalSsdCandidates(window.localStorage));
  useEffect(() => { writeLocalSsdCandidates(window.localStorage, candidates); }, [candidates]);

  useEffect(() => {
    if (activeCandidateId === null && candidates[0]) setActiveCandidateId(candidates[0].id);
  }, [activeCandidateId, candidates]);

  const activeCandidate = candidates.find((candidate) => candidate.id === activeCandidateId) ?? candidates[0];
  const targetProfile = profiles.find((profile) => profile.id === targetProfileId) ?? profiles[0];
  const analysis = useMemo(() => {
    if (!activeCandidate) return null;
    const candidateMetrics: SsdCandidateMetrics = {
      capacityGb: activeCandidate.capacityGb,
      readIops: activeCandidate.readIops,
      writeIops: activeCandidate.writeIops,
      readMBps: activeCandidate.readMBps,
      writeMBps: activeCandidate.writeMBps,
      pcieGen: activeCandidate.pcieGen,
      dwpd: activeCandidate.dwpd === null ? null : Number(activeCandidate.dwpd),
    };
    return compareCandidateToReference(candidateMetrics, targetProfile.candidateReference);
  }, [activeCandidate, targetProfile]);

  const updateDraft = (field: keyof CandidateDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const saveDraft = () => {
    setMessage(null); setError(null);
    if (!draft.model.trim() || !draft.capacityGb || !Number.isFinite(Number(draft.capacityGb))) { setError("모델명과 유효한 용량(GB)은 필수입니다."); return; }
    setCandidates((current) => addLocalSsdCandidates(current, [toInput(draft)]));
    setDraft(blankDraft());
    setMessage("후보 SSD를 이 브라우저에 저장했습니다.");
  };
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(null); setError(null);
    try {
      const parsed = parseCsv(await file.text(), file.name);
      setCandidates((current) => addLocalSsdCandidates(current, parsed.map(toInput)));
      setMessage(`${parsed.length}개 후보 SSD를 이 브라우저에 저장했습니다.`);
    } catch (parseError) { setError(parseError instanceof Error ? parseError.message : "파일을 해석하지 못했습니다."); }
    event.target.value = "";
  };
  const removeCandidate = (id: number) => { setCandidates((current) => removeLocalSsdCandidate(current, id)); setActiveCandidateId((current) => current === id ? null : current); setMessage("후보 SSD를 삭제했습니다."); setError(null); };
  const downloadTemplate = () => {
    const header = "manufacturer,model,formFactor,capacityGb,pcieGen,nvmeVersion,readIops,writeIops,readMBps,writeMBps,dwpd,enduranceTbw,powerActiveW,plp,encryption,sourceUrl,notes\n";
    const url = URL.createObjectURL(new Blob([header], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "signal-ledger-ssd-candidates-template.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section id="candidates" className="border-y border-[#17202A]/12 bg-[#F7F4ED] px-4 py-10 sm:px-7 lg:px-10 lg:py-12">
    <div className="mx-auto max-w-[1380px]">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="font-mono-ui text-[10px] font-medium tracking-[0.16em] text-[#E65B32]">05 · INTERNAL CANDIDATE WORKBENCH</p><h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">후보 SSD를, 공개 기준 위에 올립니다.</h2></div><p className="max-w-lg text-xs leading-5 text-[#6B6D69]">Samsung, SK hynix, Micron, KIOXIA, SanDisk, DapuStor의 후보 사양을 현재 브라우저에 저장하고, 공개된 드라이브 기준값과만 비교합니다.</p></div>

      <div className="mt-6 border border-[#315A7D]/20 bg-[#FFFDF8] p-5"><div className="flex items-center gap-2 text-[#315A7D]"><ShieldCheck className="h-5 w-5" /><span className="font-mono-ui text-[10px] tracking-[.12em]">PUBLIC · NO LOGIN REQUIRED</span></div><h3 className="font-display mt-2 text-lg font-semibold">로그인 없이 바로 SSD 후보군을 시작할 수 있습니다.</h3><p className="mt-1 text-sm leading-6 text-[#59636B]">입력 데이터는 계정이나 서버로 전송하지 않고 현재 브라우저에만 저장됩니다. 브라우저 데이터 삭제 또는 다른 기기에서는 목록이 유지되지 않습니다.</p></div>
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
          <div className="border border-[#17202A]/14 bg-[#FFFDF8] surface-shadow"><div className="flex flex-col gap-4 border-b border-[#17202A]/10 p-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono-ui text-[10px] tracking-[.13em] text-[#6B6D69]">CANDIDATE INPUT</p><h3 className="font-display mt-1 text-xl font-semibold">사양 등록 또는 CSV 가져오기</h3></div><div className="flex flex-wrap gap-2"><button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-sm border border-[#17202A]/16 px-3 py-2 text-xs font-semibold hover:border-[#315A7D] hover:text-[#315A7D]"><FileDown className="h-3.5 w-3.5" />빈 템플릿</button><label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-[#E65B32] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#cf4e29]"><FileUp className="h-3.5 w-3.5" />CSV/TSV 가져오기<input onChange={handleFile} type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" className="sr-only" /></label></div></div>
            <div className="grid gap-x-4 gap-y-4 p-5 sm:grid-cols-2">
              <label className="text-xs font-semibold">제조사<select value={draft.manufacturer} onChange={(event) => updateDraft("manufacturer", event.target.value)} className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]">{manufacturers.map((manufacturer) => <option key={manufacturer}>{manufacturer}</option>)}</select></label>
              <label className="text-xs font-semibold">모델명 <span className="text-[#E65B32]">*</span><input value={draft.model} onChange={(event) => updateDraft("model", event.target.value)} placeholder="예: 내부 품번 또는 모델명" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">용량 (GB) <span className="text-[#E65B32]">*</span><input value={draft.capacityGb} onChange={(event) => updateDraft("capacityGb", event.target.value)} inputMode="numeric" placeholder="3840" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">폼팩터<input value={draft.formFactor} onChange={(event) => updateDraft("formFactor", event.target.value)} placeholder="U.2, E3.S, E1.S" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">PCIe<input value={draft.pcieGen} onChange={(event) => updateDraft("pcieGen", event.target.value)} placeholder="PCIe 5.0" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">NVMe 버전<input value={draft.nvmeVersion} onChange={(event) => updateDraft("nvmeVersion", event.target.value)} placeholder="NVMe 2.0" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">Read IOPS<input value={draft.readIops} onChange={(event) => updateDraft("readIops", event.target.value)} inputMode="numeric" placeholder="예: 900000" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">Write IOPS<input value={draft.writeIops} onChange={(event) => updateDraft("writeIops", event.target.value)} inputMode="numeric" placeholder="예: 500000" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">Read MB/s<input value={draft.readMBps} onChange={(event) => updateDraft("readMBps", event.target.value)} inputMode="numeric" placeholder="예: 7000" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">Write MB/s<input value={draft.writeMBps} onChange={(event) => updateDraft("writeMBps", event.target.value)} inputMode="numeric" placeholder="예: 5000" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">DWPD<input value={draft.dwpd} onChange={(event) => updateDraft("dwpd", event.target.value)} inputMode="decimal" placeholder="예: 3" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">Endurance (TBW)<input value={draft.enduranceTbw} onChange={(event) => updateDraft("enduranceTbw", event.target.value)} inputMode="numeric" placeholder="선택 입력" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold">PLP 검증<select value={draft.powerLossProtection} onChange={(event) => updateDraft("powerLossProtection", event.target.value)} className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]"><option value="unknown">확인 전</option><option value="verified">검증됨</option><option value="not_verified">미검증</option></select></label>
              <label className="text-xs font-semibold">암호화 검증<select value={draft.encryption} onChange={(event) => updateDraft("encryption", event.target.value)} className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]"><option value="unknown">확인 전</option><option value="verified">검증됨</option><option value="not_verified">미검증</option></select></label>
              <label className="text-xs font-semibold sm:col-span-2">출처 URL<input value={draft.sourceUrl} onChange={(event) => updateDraft("sourceUrl", event.target.value)} placeholder="https:// — 내부 링크 또는 공식 데이터시트" className="mt-1.5 h-10 w-full rounded-sm border border-[#17202A]/15 bg-white px-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
              <label className="text-xs font-semibold sm:col-span-2">메모<textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="측정 블록 크기, QD, 온도 조건, 펌웨어 등 비교에 필요한 맥락" className="mt-1.5 min-h-20 w-full rounded-sm border border-[#17202A]/15 bg-white p-3 text-sm font-normal outline-none focus:border-[#E65B32]" /></label>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#17202A]/10 bg-[#FBF9F3] p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#6B6D69]">필수값은 제조사·모델·용량입니다. 비어 있는 성능 값은 분석에서 <strong>후보 입력 필요</strong>로 표시됩니다.</p><button onClick={saveDraft} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-sm bg-[#17202A] px-4 text-sm font-semibold text-white transition hover:bg-[#243241]"><Save className="h-4 w-4 text-[#E65B32]" />후보 저장</button></div>
          </div>

          <div className="border border-[#17202A]/14 bg-[#17202A] p-5 text-[#FFFDF8] surface-shadow"><p className="font-mono-ui text-[10px] tracking-[.13em] text-[#F3A58C]">IMPORT CONTRACT</p><h3 className="font-display mt-2 text-xl font-semibold">텍스트 사양을 구조화합니다.</h3><p className="mt-3 text-sm leading-6 text-[#C8D2D7]">CSV/TSV는 브라우저에서 해석한 뒤 후보 레코드로 저장합니다. 원본 파일 자체는 저장하지 않으므로, 내부 데이터시트는 조직의 보안 저장소에서 별도로 관리하세요.</p><div className="mt-6 border-y border-white/12 py-4 font-mono-ui text-[10px] leading-6 text-[#B7C6D1]">필수 열<br /><span className="text-white">manufacturer · model · capacityGb</span><br /><br />선택 열<br />formFactor · pcieGen · nvmeVersion · readIops · writeIops · readMBps · writeMBps · dwpd · enduranceTbw · plp · encryption · sourceUrl · notes</div><div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#DCE4E7]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#E65B32]" />IOPS·처리량은 워크로드 및 블록 크기가 일치할 때만 해석 가능합니다. 점수는 조달 승인이나 벤치마크 결과가 아닙니다.</div></div>
        </div>

        {message && <p className="mt-4 flex items-center gap-2 rounded-sm border border-[#5F8E84]/25 bg-[#5F8E84]/10 px-4 py-3 text-sm text-[#315e54]"><BadgeCheck className="h-4 w-4" />{message}</p>}
        {error && <p className="mt-4 flex items-center gap-2 rounded-sm border border-[#E65B32]/28 bg-[#E65B32]/10 px-4 py-3 text-sm text-[#B84826]"><CircleAlert className="h-4 w-4" />{error}</p>}

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"><div className="border border-[#17202A]/14 bg-[#FFFDF8] surface-shadow"><div className="flex items-center justify-between border-b border-[#17202A]/10 p-5"><div><p className="font-mono-ui text-[10px] tracking-[.13em] text-[#6B6D69]">LOCAL CANDIDATE LIBRARY</p><h3 className="font-display mt-1 text-xl font-semibold">이 브라우저에 저장된 후보</h3></div><span className="rounded-full bg-[#EAE5DB] px-2.5 py-1 font-mono-ui text-[10px]">{candidates.length}</span></div>{candidates.length ? <div className="divide-y divide-[#17202A]/10">{candidates.map((candidate) => <div key={candidate.id} className={`flex items-center gap-3 p-4 transition ${activeCandidate?.id === candidate.id ? "bg-[#F5EFE5]" : "hover:bg-[#FBF9F3]"}`}><button onClick={() => setActiveCandidateId(candidate.id)} className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><span className="rounded-full border border-[#315A7D]/20 bg-[#315A7D]/8 px-2 py-0.5 font-mono-ui text-[9px] text-[#315A7D]">{candidate.manufacturer}</span><span className="font-mono-ui text-[10px] text-[#6B6D69]">{candidate.capacityGb.toLocaleString()} GB</span></div><p className="mt-2 truncate text-sm font-semibold">{candidate.model}</p><p className="mt-0.5 truncate text-[11px] text-[#6B6D69]">{candidate.formFactor ?? "폼팩터 미입력"} · {candidate.pcieGen ?? "PCIe 미입력"} · {candidate.dwpd ?? "DWPD 미입력"}</p></button><button onClick={() => removeCandidate(candidate.id)} aria-label={`${candidate.model} 삭제`} className="rounded-sm p-2 text-[#7A7D79] transition hover:bg-[#E65B32]/10 hover:text-[#E65B32]"><Trash2 className="h-4 w-4" /></button></div>)}</div> : <div className="p-6"><p className="font-display text-lg font-semibold">아직 저장된 후보가 없습니다.</p><p className="mt-2 text-sm leading-6 text-[#6B6D69]">수동으로 첫 후보를 등록하거나 CSV/TSV 파일을 가져오세요.</p></div>}</div>

          <div className="border border-[#17202A]/14 bg-[#FFFDF8] surface-shadow"><div className="flex flex-col gap-4 border-b border-[#17202A]/10 p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono-ui text-[10px] tracking-[.13em] text-[#6B6D69]">PUBLIC REFERENCE GAP</p><h3 className="font-display mt-1 text-xl font-semibold">후보 × 하이퍼스케일러 프로파일</h3></div><label className="text-xs font-semibold">비교 프로파일<select value={targetProfileId} onChange={(event) => setTargetProfileId(event.target.value)} className="mt-1.5 h-9 w-full min-w-[240px] rounded-sm border border-[#17202A]/15 bg-white px-3 text-xs font-normal outline-none focus:border-[#E65B32]">{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.provider} · {profile.profile}</option>)}</select></label></div>
            {analysis && activeCandidate ? <div><div className="grid gap-px border-b border-[#17202A]/10 bg-[#17202A]/10 sm:grid-cols-3"><div className="bg-[#FFFDF8] p-5"><p className="font-mono-ui text-[10px] tracking-[.1em] text-[#6B6D69]">CANDIDATE</p><p className="font-display mt-2 text-lg font-semibold">{activeCandidate.model}</p><p className="mt-1 text-xs text-[#6B6D69]">{activeCandidate.manufacturer}</p></div><div className="bg-[#FFFDF8] p-5"><p className="font-mono-ui text-[10px] tracking-[.1em] text-[#6B6D69]">PUBLIC REFERENCE</p><p className="font-display mt-2 text-lg font-semibold">{targetProfile.provider}</p><p className="mt-1 text-xs text-[#6B6D69]">{targetProfile.profile}</p></div><div className="bg-[#17202A] p-5 text-white"><p className="font-mono-ui text-[10px] tracking-[.1em] text-[#F3A58C]">COVERAGE SCORE</p><p className="font-display mt-1 text-3xl font-semibold">{analysis.score === null ? "—" : `${analysis.score}%`}</p><p className="mt-1 text-xs text-[#B7C6D1]">공개·비교 가능 {analysis.comparableCount}개</p></div></div><div className="divide-y divide-[#17202A]/10">{analysis.metrics.map((metric) => <div key={metric.key} className="grid grid-cols-[minmax(88px,.8fr)_minmax(100px,1fr)_minmax(100px,1fr)_auto] items-center gap-2 p-4 text-xs"><span className="font-mono-ui text-[10px] tracking-[.04em] text-[#59636B]">{metricLabel(metric.key)}</span><span className="font-medium text-[#17202A]">{formatMetric(metric, metric.candidate)}</span><span className="text-[#6B6D69]">{formatMetric(metric, metric.reference)}</span><span className={`justify-self-end rounded-full px-2 py-1 text-[10px] font-medium ${statusStyle(metric.status)}`}>{statusText(metric.status)}</span></div>)}</div><div className="border-t border-[#17202A]/10 bg-[#FBF9F3] p-4 text-xs leading-5 text-[#6B6D69]"><strong className="text-[#17202A]">해석 범위.</strong> 기준값은 공개 인스턴스의 드라이브 단위 수치 또는 균등 환산 참고값입니다. PCIe·DWPD·폼팩터가 공개되지 않은 경우에는 후보가 우수/열세로 판정되지 않습니다.</div></div> : <div className="p-7"><p className="font-display text-xl font-semibold">비교할 후보를 선택하세요.</p><p className="mt-2 text-sm leading-6 text-[#6B6D69]">후보가 저장되면 용량, IOPS, 처리량, PCIe, DWPD의 공개성·입력 상태·갭을 함께 보여줍니다.</p></div>}
          </div></div>
        <SsdFitAnalysisPanel candidate={activeCandidate} />
    </div>
  </section>;
}
