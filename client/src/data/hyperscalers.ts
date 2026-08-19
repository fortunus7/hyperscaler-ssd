/**
 * Signal Ledger data model — 공개 출처 기반의 비교 가능한 스토리지 최적화 프로파일만 보관한다.
 * 미공개 속성은 추정하지 않고 null 또는 '공개 없음'으로 유지한다.
 */
export type Region = "US" | "CN";

export type Source = {
  id: number;
  label: string;
  url: string;
  publisher: string;
};

export type HyperscalerProfile = {
  id: string;
  provider: string;
  region: Region;
  country: string;
  profile: string;
  cpu: string;
  architecture: string;
  vcpu: number | null;
  memoryGiB: number | null;
  drives: number | null;
  driveCapacity: string;
  localStorage: string;
  totalStorageTB: number | null;
  readIopsM: number | null;
  writeIopsM: number | null;
  readThroughput: string;
  writeThroughput: string;
  networkGbps: number | null;
  networkLabel: string;
  ioPath: string;
  persistence: string;
  workload: string[];
  planningSignal: string;
  coverage: "A" | "B" | "C";
  sourceIds: number[];
  /** 공개 인스턴스 자료를 드라이브 단위로 정규화한 비교용 참고값이다. null은 공개되지 않았음을 뜻한다. */
  candidateReference: {
    capacityGb: number | null;
    readIops: number | null;
    writeIops: number | null;
    readMBps: number | null;
    writeMBps: number | null;
    pcieGen: string | null;
    dwpd: number | null;
  };
  /** 서버 후보와의 비교에 쓰는 공개값이다. 물리 호스트 또는 랙 정보가 비공개면 null로 보존한다. */
  serverReference: {
    rackUnits: number | null;
    powerCapacityW: number | null;
    cpuCores: number | null;
    memoryGiB: number | null;
    networkGbps: number | null;
    ssdFormFactor: string | null;
    ssdInterface: string | null;
    ssdProtocol: string | null;
    ssdCount: number | null;
    ssdCapacityPerDriveGb: number | null;
    ssdAggregateIops: number | null;
    ssdReadIops: number | null;
    ssdWriteIops: number | null;
    ssdAggregateMBps: number | null;
    ssdReadMBps: number | null;
    ssdWriteMBps: number | null;
  };
};

export const sources: Source[] = [
  {
    id: 1,
    label: "Amazon EC2 I4i Instances",
    url: "https://aws.amazon.com/ec2/instance-types/i4i/",
    publisher: "AWS",
  },
  {
    id: 2,
    label: "Storage-optimized machine family for Compute Engine",
    url: "https://docs.cloud.google.com/compute/docs/storage-optimized-machines",
    publisher: "Google Cloud",
  },
  {
    id: 3,
    label: "Lsv3 size series",
    url: "https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/storage-optimized/lsv3-series",
    publisher: "Microsoft Azure",
  },
  {
    id: 4,
    label: "Instance families with local SSDs (i series)",
    url: "https://www.alibabacloud.com/help/en/ecs/user-guide/instance-families-with-local-ssds",
    publisher: "Alibaba Cloud",
  },
  {
    id: 5,
    label: "Tencent Cloud CVM Instance Specifications",
    url: "https://www.tencentcloud.com/document/product/213/11518",
    publisher: "Tencent Cloud",
  },
  {
    id: 6,
    label: "Baidu Cloud BCC Instance specification",
    url: "https://intl.cloud.baidu.com/en/doc/BCC/s/wjwvynogv-intl-en",
    publisher: "Baidu AI Cloud",
  },
];

export const profiles: HyperscalerProfile[] = [
  {
    id: "aws-i4i",
    provider: "AWS",
    region: "US",
    country: "United States",
    profile: "EC2 I4i.32xlarge",
    cpu: "Intel Xeon Ice Lake",
    architecture: "AWS Nitro System · NVMe 1.4 support",
    vcpu: 128,
    memoryGiB: 1024,
    drives: 8,
    driveCapacity: "3,750 GB",
    localStorage: "8 × AWS Nitro SSD · 30 TB",
    totalStorageTB: 30,
    readIopsM: null,
    writeIopsM: null,
    readThroughput: "22,400 MB/s · sequential read",
    writeThroughput: "공개 없음",
    networkGbps: 75,
    networkLabel: "75 Gbps network · 40 Gbps EBS",
    ioPath: "Custom Nitro SSD · always-on encryption · TWP",
    persistence: "Instance-local; workload-level replication required",
    workload: ["OLTP", "NoSQL", "Search", "Analytics"],
    planningSignal: "피크 수치보다 지연 변동성·Torn Write Prevention·클라우드 규모 펌웨어 운영성을 강하게 강조합니다.",
    coverage: "A",
    sourceIds: [1],
    candidateReference: { capacityGb: 3750, readIops: null, writeIops: null, readMBps: 2800, writeMBps: null, pcieGen: null, dwpd: null },
    serverReference: { rackUnits: null, powerCapacityW: null, cpuCores: null, memoryGiB: 1024, networkGbps: 75, ssdFormFactor: null, ssdInterface: "NVMe", ssdProtocol: "NVMe", ssdCount: 8, ssdCapacityPerDriveGb: 3750, ssdAggregateIops: null, ssdReadIops: null, ssdWriteIops: null, ssdAggregateMBps: 22400, ssdReadMBps: 22400, ssdWriteMBps: null },
  },
  {
    id: "gcp-z3",
    provider: "Google Cloud",
    region: "US",
    country: "United States",
    profile: "Z3 highmem-176 standardlssd",
    cpu: "4th Gen Intel Xeon Scalable",
    architecture: "Sapphire Rapids · DDR5 · Titanium offload",
    vcpu: 176,
    memoryGiB: 1406,
    drives: 12,
    driveCapacity: "3,000 GiB",
    localStorage: "12 × Titanium SSD · 36,000 GiB",
    totalStorageTB: 38.65,
    readIopsM: 9,
    writeIopsM: 6,
    readThroughput: "36,000 MiB/s",
    writeThroughput: "30,000 MiB/s",
    networkGbps: 200,
    networkLabel: "100 Gbps default · 200 Gbps Tier_1",
    ioPath: "Titanium I/O offload · NVMe-only disk interface",
    persistence: "Local Titanium SSD; maintenance recovery policy applies",
    workload: ["Vector DB", "Search", "SQL/NoSQL", "Warehouse"],
    planningSignal: "읽기·쓰기 IOPS와 처리량을 함께 공개하며, 스토리지/네트워크 오프로드와 대규모 병렬 I/O를 하나의 설계 단위로 봅니다.",
    coverage: "A",
    sourceIds: [2],
    candidateReference: { capacityGb: 3221, readIops: 750000, writeIops: 500000, readMBps: 3000, writeMBps: 2500, pcieGen: null, dwpd: null },
    serverReference: { rackUnits: null, powerCapacityW: null, cpuCores: null, memoryGiB: 1406, networkGbps: 200, ssdFormFactor: null, ssdInterface: "NVMe", ssdProtocol: "NVMe", ssdCount: 12, ssdCapacityPerDriveGb: 3221, ssdAggregateIops: null, ssdReadIops: 9000000, ssdWriteIops: 6000000, ssdAggregateMBps: null, ssdReadMBps: 36000, ssdWriteMBps: 30000 },
  },
  {
    id: "azure-lsv3",
    provider: "Microsoft Azure",
    region: "US",
    country: "United States",
    profile: "L80s_v3",
    cpu: "Intel Xeon Platinum 8370C",
    architecture: "Ice Lake · directly mapped local NVMe",
    vcpu: 80,
    memoryGiB: 640,
    drives: 10,
    driveCapacity: "1.92 TiB",
    localStorage: "10 × direct-mapped NVMe · 19.2 TiB",
    totalStorageTB: 19.2,
    readIopsM: null,
    writeIopsM: null,
    readThroughput: "공개 없음",
    writeThroughput: "공개 없음",
    networkGbps: 32,
    networkLabel: "32 Gbps · NetVSC / ConnectX",
    ioPath: "Direct local NVMe mapping · host cache not supported",
    persistence: "Local disk; cross-VM replication recommended",
    workload: ["Cassandra", "MongoDB", "NoSQL", "Replication"],
    planningSignal: "로컬 디스크를 데이터 경로의 중심에 놓되, 데이터 지속성은 다중 VM 복제라는 시스템 설계로 해결합니다.",
    coverage: "B",
    sourceIds: [3],
    candidateReference: { capacityGb: 2061, readIops: null, writeIops: null, readMBps: null, writeMBps: null, pcieGen: null, dwpd: null },
    serverReference: { rackUnits: null, powerCapacityW: null, cpuCores: null, memoryGiB: 640, networkGbps: 32, ssdFormFactor: null, ssdInterface: "NVMe", ssdProtocol: "NVMe", ssdCount: 10, ssdCapacityPerDriveGb: 2061, ssdAggregateIops: null, ssdReadIops: null, ssdWriteIops: null, ssdAggregateMBps: null, ssdReadMBps: null, ssdWriteMBps: null },
  },
  {
    id: "alibaba-i5",
    provider: "Alibaba Cloud",
    region: "CN",
    country: "China",
    profile: "ECS i5.32xlarge",
    cpu: "Intel Xeon 6 Granite Rapids",
    architecture: "CIPU architecture · eRDMA",
    vcpu: 128,
    memoryGiB: 1024,
    drives: 8,
    driveCapacity: "3,839 GB",
    localStorage: "8 × local NVMe SSD · 30,712 GB",
    totalStorageTB: 30.712,
    readIopsM: 0.6,
    writeIopsM: null,
    readThroughput: "32 Gbit/s · aggregate disk bandwidth",
    writeThroughput: "32 Gbit/s aggregate limit",
    networkGbps: 320,
    networkLabel: "320 Gbit/s · eRDMA · 50M PPS",
    ioPath: "CIPU-assisted I/O · NVMe local disks",
    persistence: "Local disk; HA architecture at application layer",
    workload: ["RocksDB", "ClickHouse", "Data lake", "Streaming"],
    planningSignal: "SSD만이 아니라 CIPU·eRDMA·대형 패킷 처리량까지 포함한 호스트 데이터 경로 설계가 핵심입니다.",
    coverage: "A",
    sourceIds: [4],
    candidateReference: { capacityGb: 3839, readIops: 75000, writeIops: null, readMBps: 500, writeMBps: null, pcieGen: null, dwpd: null },
    serverReference: { rackUnits: null, powerCapacityW: null, cpuCores: null, memoryGiB: 1024, networkGbps: 320, ssdFormFactor: null, ssdInterface: "NVMe", ssdProtocol: "NVMe", ssdCount: 8, ssdCapacityPerDriveGb: 3839, ssdAggregateIops: 600000, ssdReadIops: null, ssdWriteIops: null, ssdAggregateMBps: 4000, ssdReadMBps: null, ssdWriteMBps: null },
  },
  {
    id: "tencent-ita5",
    provider: "Tencent Cloud",
    region: "CN",
    country: "China",
    profile: "ITA5.128XLARGE2304",
    cpu: "AMD EPYC Bergamo",
    architecture: "StarSea dual-socket server · local NVMe",
    vcpu: 512,
    memoryGiB: 2304,
    drives: 24,
    driveCapacity: "7,140 GB",
    localStorage: "24 × local NVMe SSD · 171,360 GB",
    totalStorageTB: 171.36,
    readIopsM: null,
    writeIopsM: null,
    readThroughput: "공개 없음",
    writeThroughput: "공개 없음",
    networkGbps: 160,
    networkLabel: "160 Gbps · 45M PPS",
    ioPath: "NVMe instance storage · high-I/O host profile",
    persistence: "Local disks may lose data on host failure",
    workload: ["OLTP", "Elasticsearch", "NoSQL", "Clustered DB"],
    planningSignal: "매우 큰 로컬 NVMe 집적도를 공개하지만, 해당 프로파일의 SSD IOPS·처리량은 문서에서 개별 수치로 제시하지 않습니다.",
    coverage: "B",
    sourceIds: [5],
    candidateReference: { capacityGb: 7140, readIops: null, writeIops: null, readMBps: null, writeMBps: null, pcieGen: null, dwpd: null },
    serverReference: { rackUnits: null, powerCapacityW: null, cpuCores: null, memoryGiB: 2304, networkGbps: 160, ssdFormFactor: null, ssdInterface: "NVMe", ssdProtocol: "NVMe", ssdCount: 24, ssdCapacityPerDriveGb: 7140, ssdAggregateIops: null, ssdReadIops: null, ssdWriteIops: null, ssdAggregateMBps: null, ssdReadMBps: null, ssdWriteMBps: null },
  },
  {
    id: "baidu-l7",
    provider: "Baidu AI Cloud",
    region: "CN",
    country: "China",
    profile: "BCC Local SSD L7 family",
    cpu: "SKU/region dependent",
    architecture: "Local SSD family · public beta listing",
    vcpu: null,
    memoryGiB: null,
    drives: null,
    driveCapacity: "공개 SKU별 확인 필요",
    localStorage: "Local SSD family is listed",
    totalStorageTB: null,
    readIopsM: null,
    writeIopsM: null,
    readThroughput: "공개 범위 제한",
    writeThroughput: "공개 범위 제한",
    networkGbps: null,
    networkLabel: "SKU/region-dependent",
    ioPath: "Local SSD and bare-metal families are publicly listed",
    persistence: "최종 SKU 문서에서 재검증 필요",
    workload: ["Local SSD", "Bare metal", "Regional SKU"],
    planningSignal: "공개 범위가 분산되어 있으므로, 견적·조달 단계에서 대상 리전과 SKU의 최신 원문을 확인해야 합니다.",
    coverage: "C",
    sourceIds: [6],
    candidateReference: { capacityGb: null, readIops: null, writeIops: null, readMBps: null, writeMBps: null, pcieGen: null, dwpd: null },
    serverReference: { rackUnits: null, powerCapacityW: null, cpuCores: null, memoryGiB: null, networkGbps: null, ssdFormFactor: null, ssdInterface: null, ssdProtocol: null, ssdCount: null, ssdCapacityPerDriveGb: null, ssdAggregateIops: null, ssdReadIops: null, ssdWriteIops: null, ssdAggregateMBps: null, ssdReadMBps: null, ssdWriteMBps: null },
  },
];

export const requirementLens = [
  {
    label: "일관 지연",
    desc: "p99/p99.9 읽기·쓰기와 장시간 혼합 부하 QoS를 분리해 평가합니다.",
    emphasis: "AWS: latency variability · Google: parallel I/O",
  },
  {
    label: "호스트 데이터 경로",
    desc: "PCIe/NVMe만이 아니라 네트워크, I/O 오프로드, 가상화 경로의 병목을 함께 봅니다.",
    emphasis: "Nitro · Titanium · CIPU · direct mapping",
  },
  {
    label: "시스템 내구성",
    desc: "PLP·암호화·오류 복구와 애플리케이션 복제 책임의 경계를 정의합니다.",
    emphasis: "TWP · encryption · replication",
  },
  {
    label: "밀도·열·운영",
    desc: "드라이브 수·용량 확대가 전력, 열, 펌웨어 운영성에 미치는 영향을 점검합니다.",
    emphasis: "capacity / bay · telemetry · lifecycle",
  },
];
