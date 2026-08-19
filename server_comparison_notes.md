# 서버 비교 확장 기준

## 비교 필드 및 단위

| 비교 축 | 입력 단위 | 공개 하이퍼스케일러 프로파일 처리 | 해석 원칙 |
|---|---:|---|---|
| 랙 크기 | U | 대체로 `공개 없음` | VM/인스턴스 카탈로그는 물리 호스트 랙 규격을 보장하지 않음 |
| 서버 전력 용량 | W | 대체로 `공개 없음` | 후보 입력값은 PSU 또는 서버 전력 예산임을 메모에 명시 |
| SSD 폼팩터 | 텍스트 | 공개 시 표기, 미공개 시 `공개 없음` | U.2, U.3, E1.S, E3.S, M.2 등을 후보 사양으로 비교 |
| SSD 인터페이스 | 텍스트 | NVMe/SCSI 등 공개 시 표기 | PCIe 세대·레인 정보가 별도로 없으면 추정하지 않음 |
| SSD 프로토콜 | 텍스트 | NVMe 등 공개 시 표기 | 게스트 접근 프로토콜과 물리 장치 프로토콜의 구분을 메모로 보존 |
| SSD 용량 | GB/drive | 공개 단위 보존 후 GB 환산 | 드라이브당 용량과 총 용량을 구분 |
| SSD 개수 | 개 | 공개 시 표기 | 인스턴스 당 연결된 로컬 SSD 수 |
| SSD 성능 | IOPS, MB/s | 공개 시 집계값 사용 | 시험 조건이 다르면 조달 승인으로 해석하지 않음 |

## 공개 근거

AWS I4i 공식 페이지는 AWS Nitro SSD가 NVMe 기반이며, i4i.32xlarge에 `8 × 3,750 GB` 로컬 SSD 구성을 공개한다. 랙 크기·서버 전력 용량·SSD 폼팩터는 해당 인스턴스 제품 페이지에서 공개하지 않는다. [AWS I4i](https://aws.amazon.com/ec2/instance-types/i4i/)

Google Cloud Local SSD 문서는 Z3 Titanium SSD가 호스트 내 컴퓨트 인스턴스에 직접 연결되며, Z3의 각 Titanium SSD가 3 TiB이고 인스턴스당 디스크 수·IOPS·처리량을 공개한다. 일반 Local SSD는 NVMe 또는 SCSI 인터페이스를 사용할 수 있다고 명시한다. [Google Cloud Local SSD](https://docs.cloud.google.com/compute/docs/disks/local-ssd)

Alibaba Cloud i-series 문서는 로컬 NVMe SSD, 인스턴스별 로컬 SSD 개수·용량·IOPS·처리량을 공개한다. i5.32xlarge 예시는 `8 × 3,839 GB`, 600,000 baseline IOPS, 32 Gbit/s disk baseline bandwidth를 제시한다. 랙·전력·폼팩터는 공개 범위에 포함되지 않는다. [Alibaba Cloud i-series](https://www.alibabacloud.com/help/en/ecs/user-guide/instance-families-with-local-ssds)

## 설계 원칙

공개되지 않은 랙 크기, 전력 용량, 폼팩터 및 PCIe 세대는 `공개 없음`으로 표시하며, 내부 후보의 입력값과 자동으로 우열을 판정하지 않는다. 비교 점수는 공개값이 있고 단위가 호환되는 항목만 사용한다. 이 기능은 공개 기준 대비 갭 정리용이며, 벤치마크·조달 승인·공급사 인증을 대체하지 않는다.
