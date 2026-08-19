# 공개 사양 조사 노트 — 2026-08-13

## 조사 범위와 비교 원칙

이 대시보드는 개별 하이퍼스케일러가 공개한 **클라우드 노출형 서버/스토리지 최적화 인스턴스**를 비교 단위로 사용한다. 이는 실제 내부 서버 BOM이나 SSD 공급 계약을 직접 나타내지 않으며, 특히 NAND 종류, 컨트롤러, DWPD, 폼팩터와 PCIe 세대는 많은 사업자가 공개하지 않는다. 화면에서는 미공개 항목을 빈 값으로 추정하지 않고 `공개 없음`으로 표시한다.

성능 수치는 각 사업자가 고지한 최대치 또는 인스턴스 상한이며, I/O 크기·읽기/쓰기 혼합·큐뎁스·캐시 상태·지역 가용성 및 네트워크 한계가 일치하지 않는다. 따라서 절대 순위가 아니라 **밀도, 인터페이스, 오프로드, 내구성/데이터 경로의 요구 패턴**을 확인하는 용도로 사용한다.

| 비교 축 | 정규화 방식 | 주의 사항 |
|---|---|---|
| 컴퓨팅 플랫폼 | CPU 세대, vCPU, 메모리 | vCPU 정의와 SMT 정책이 사업자별로 다름 |
| 로컬 SSD | 드라이브 수 × 단일 용량, 총 용량 | GB/TB와 GiB/TiB를 원문 단위로 유지 |
| 성능 | 공개된 최대 읽기/쓰기 IOPS 및 처리량 | 워크로드·블록 크기·테스트 조건을 직접 비교하지 않음 |
| 데이터 경로 | NVMe, 오프로드, RDMA, 가상화/분리 | SSD 자체 사양과 호스트 플랫폼을 분리해 해석 |
| 운영성 | 일시성, 장애·복구, 암호화 | 로컬 SSD는 대부분 복제/분산 내구성을 전제로 함 |

## 정규화된 공개 사양 레코드

| 지역 | 사업자·대표 공개 프로파일 | 서버 시스템 | 로컬 SSD 구성 | 공개 성능 | 네트워크/오프로드 | SSD 기획 시 읽을 점 | 출처 |
|---|---|---|---|---|---|---|---|
| 미국 | AWS EC2 I4i.32xlarge | Intel Xeon Ice Lake, 128 vCPU, 1,024 GiB, Nitro System | 8 × 3,750 GB AWS Nitro SSD; 총 30 TB | 순차 읽기 22,400 MB/s (128 KiB) | 75 Gbps 네트워크, 40 Gbps EBS | NVMe 기반 커스텀 Nitro SSD, 상시 암호화·TWP·지연 변동성 최소화에 초점. | [AWS I4i 제품 페이지](https://aws.amazon.com/ec2/instance-types/i4i/) · [AWS 발표](https://aws.amazon.com/blogs/aws/new-storage-optimized-amazon-ec2-instances-i4i-powered-by-intel-xeon-scalable-ice-lake-processors/) |
| 미국 | Google Cloud Z3 highmem-176 standardlssd | 4세대 Intel Xeon Scalable (Sapphire Rapids), DDR5, 176 vCPU, 1,406 GB | 12 × 3,000 GiB Titanium SSD; 총 36,000 GiB | 읽기/쓰기 9,000,000/6,000,000 IOPS; 36,000/30,000 MiB/s | 기본 100 Gbps / Tier_1 200 Gbps, Titanium I/O offload | 호스트 CPU가 아닌 오프로드 실리콘과 함께 SSD·네트워크·격리를 설계. 매우 높은 병렬 I/O와 일관성에 초점. | [Google Cloud Z3 문서](https://docs.cloud.google.com/compute/docs/storage-optimized-machines) |
| 미국 | Azure L80s_v3 | Intel Xeon Platinum 8370C (Ice Lake), 80 vCPU, 640 GiB | 10 × 1.92 TiB 직접 매핑 로컬 NVMe SSD; 총 19.2 TiB | 로컬 SSD IOPS/처리량 값은 해당 인스턴스 문서에 개별 공개 없음 | 32 Gbps, NetVSC/ConnectX; 데이터 디스크 호스트 캐시 미지원 | 로컬 디스크를 기본 데이터 경로로 두고 애플리케이션 수준 복제로 영속성을 확보하는 모델. | [Azure Lsv3 문서](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/storage-optimized/lsv3-series) |
| 중국 | Alibaba Cloud ECS i5.32xlarge | Intel Xeon 6 Granite Rapids, 128 vCPU, 1,024 GiB, CIPU | 8 × 3,839 GB 로컬 NVMe SSD; 총 30,712 GB | 디스크 기준 600,000 IOPS, 32 Gbit/s | 네트워크 320 Gbit/s, eRDMA, CIPU | CPU·스토리지·네트워크 오프로드를 CIPU와 결합하며, 고성능 DB·ClickHouse·RocksDB를 명시적 타깃으로 둠. | [Alibaba Cloud i 시리즈 문서](https://www.alibabacloud.com/help/en/ecs/user-guide/instance-families-with-local-ssds) |
| 중국 | Tencent Cloud ITA5.128XLARGE2304 | AMD EPYC Bergamo, 512 vCPU, 2,304 GB, StarSea dual-socket server | 24 × 7,140 GB 로컬 NVMe SSD; 총 171,360 GB | SSD별 IOPS/처리량은 이 프로파일의 공개 표에 명시되지 않음 | 최대 160 Gbps, 45M PPS | 매우 큰 NVMe 매체 집적도 및 네트워크 패킷 처리량을 제공하며, 로컬 디스크 장애 가능성과 모니터링 요구를 함께 고지. | [Tencent Cloud 인스턴스 사양](https://www.tencentcloud.com/document/product/213/11518) |
| 중국 | Baidu AI Cloud BCC Local SSD family | Local SSD L7/L5 계열과 Local SSD bare-metal 계열을 공개 | 개별 SSD 구성은 가용 지역·인스턴스에 따라 별도 제공 | 상단 요약에서 직접 비교 가능한 IOPS/처리량 행은 미확인 | 일반/컴퓨팅 계열에 RDMA 및 최대 160–200 Gbps 계열 존재 | 공개 상세가 분산되어 있어 `공개 범위 제한`으로 표시하고, 구매 단계에서 해당 리전의 SKU 표를 재검증해야 함. | [Baidu BCC 인스턴스 사양](https://intl.cloud.baidu.com/en/doc/BCC/s/wjwvynogv-intl-en) |

## 분석 메모

1. 공개 프로파일상 **SSD 용량 밀도**는 Tencent ITA5가 171,360 GB로 가장 큰 범위이지만, 이는 대형 NVMe 용량 조합이며 실사용 유효 용량·RAID·오버프로비저닝·내구성 규칙은 별도 검증이 필요하다.
2. Google Z3는 9M/6M IOPS와 36,000/30,000 MiB/s처럼 읽기/쓰기 값을 같이 제공하므로, 성능 계획 데이터로서의 투명도가 가장 높다. 다만 값은 Z3 Titanium SSD 및 해당 머신 타입의 상한이다.
3. AWS는 Nitro SSD의 지연 변동성, 상시 암호화, Torn Write Prevention을 전면에 둔다. 장치 최고 벤치마크보다 예측 가능한 데이터베이스 트랜잭션에 집중하는 전략으로 해석할 수 있다.
4. Alibaba는 i5 계열에서 CIPU, eRDMA, 대형 네트워크 대역폭을 함께 명시한다. 따라서 SSD 선정 시 장치 대역폭 외에 네트워크·오프로드 경로 병목을 함께 사양화해야 한다.
5. Azure와 Tencent는 로컬 NVMe의 휘발성/호스트 장애 특성을 직접 고지한다. 해당 프로파일은 SSD 자체의 데이터 영속성보다 복제·재구축·운영 감시를 포함한 시스템 수준 내구성 설계를 요구한다.

## SSD 업체용 요구사항 도출 프레임

다음 값은 특정 하이퍼스케일러의 비공개 조달 사양이 아니라, 위 공개 프로파일을 바탕으로 한 **제안서 검토 프레임**이다.

| 요구 영역 | 설계 질문 | 공개 프로파일에서의 신호 |
|---|---|---|
| 인터페이스·폼팩터 | PCIe 세대, NVMe 버전, U.2/U.3/E1.S/E3.S 중 어떤 랙 밀도·열 설계에 맞는가 | 모든 대표 프로파일이 로컬 NVMe를 전제하나, 장치 폼팩터와 PCIe 세대는 대체로 비공개 |
| 일관 지연 | p99/p99.9 read/write 및 QoS가 장시간 혼합 I/O에서 유지되는가 | AWS가 지연 변동성과 TWP를 명시; Google은 대규모 읽기/쓰기 상한을 공개 |
| 성능 확장성 | 드라이브 수 증가 시 IOPS·처리량이 선형에 가깝게 확대되는가 | Z3, I4i, i5, ITA5 모두 여러 장치로 규모를 확대 |
| 전력·열 | 1U/2U 전면 베이에서 드라이브당 전력, 핫스왑, 열 스로틀링은 허용 범위인가 | 대용량·다수 장치 프로파일일수록 피크 전력·열 데이터가 중요하나 개별 값은 미공개 |
| 운영성·관측성 | NVMe-MI/SMART/Telemetry, 펌웨어 롤백, 안전한 폐기, 장애 예측을 제공하는가 | Nitro의 클라우드 규모 펌웨어, Tencent의 모니터링 경고 고지가 운영성 중요성을 뒷받침 |
| 데이터 보호 | PLP, TWP, 암호화, 키 관리, 미디어 오류 처리, 재빌드 지원은 충분한가 | AWS는 상시 암호화·TWP, Azure/Tencent는 앱 수준 복제 의존을 명시 |

## 출처 신뢰도

모든 수치는 사업자 공식 제품 페이지 또는 공식 기술 문서를 우선한다. 문서 업데이트·리전·SKU 가용성에 따라 변경될 수 있으므로, 본 대시보드는 `최종 조달 사양`이 아니라 `공개 벤치마크 및 사전 기획 도구`로 사용한다.
