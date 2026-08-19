# 실제 제품 시드 조사 메모

## 조사 원칙

- 제조사 공식 제품 페이지·제품 브리프·QuickSpecs의 공개 수치만 후보 레코드에 입력한다.
- 동일 제품군이라도 용량·폼팩터·내구성 SKU에 따라 수치가 달라질 수 있으므로, 입력값은 **대표 최대 공개 수치**임을 메모와 출처 URL에 명시한다.
- 공개되지 않거나 SKU 의존성이 높은 입력값은 `null`로 둔다. 특히 VM 카탈로그의 물리 랙·PSU 값은 추정하지 않는다.

## 확인된 서버

| 제품 | 확정 입력 항목 | 출처 |
|---|---|---|
| HPE ProLiant DL380 Gen11 | 2U 랙; 12 EDSFF NVMe 전면 섀시(최대 36 EDSFF); PCIe 5.0; 1600W Flex Slot Platinum PSU 옵션; 4th/5th Gen Intel Xeon Scalable 지원 | https://www.hpe.com/us/en/collaterals/collateral.a50004307enw.html |

HPE Store의 공식 제품 페이지는 DL380 Gen11을 2U 2P 서버로 설명하고, 최대 20 EDSFF drive 및 PCIe Gen5 I/O를 명시한다. QuickSpecs의 12 EDSFF/24 SFF 섀시 선택지와 1600W PSU 옵션은 구성 단위의 상세 근거로 사용한다. 두 문서는 `실제 장비군`은 교차 검증하지만, 데이터베이스에 넣은 두 행은 배포된 시스템의 BOM이 아니라 QuickSpecs 기반 참조 구성임을 유지한다.

## 확인된 SSD

| 제조사·제품 | 공개 사양(대표 최대/제품군) | 출처 |
|---|---|---|
| Samsung PM1743 E3.S 15.36TB | E3.S; PCIe 5.0 x4; 15,360GB; 최대 14,000/7,100 MB/s read/write; 최대 2,500K/360K random read/write IOPS; 1 DWPD/5년; PLP·Opal 2.01 공개 | https://semiconductor.samsung.com/ssd/enterprise-ssd/ |
| Micron 9550 PRO E3.S 15.36TB | E3.S 7.5mm; PCIe Gen5 x4 NVMe 2.0; 15,360GB; 최대 14,000/10,000 MB/s read/write; 최대 3,000K/400K random read/write IOPS; 1 DWPD; sequential-read peak 18W. 공식 브리프 2쪽의 제품군 성능 표와 3쪽의 PRO 15.36TB 사양 열에서 대조했다. | https://www.micron.com/content/dam/micron/global/public/products/product-flyer/9550-nvme-ssd-product-brief.pdf |
| KIOXIA CM7-V E3.S 3.2TB (KCM71VJE3T20) | E3.S; PCIe 5.0 NVMe 2.0; 3,200GB; sustained 14,000 MB/s read, 3,500 MB/s write; 2,700K random-read IOPS, 600K random-write IOPS; 21W typ. active; 3 DWPD. 공식 제품 페이지와 공식 제품 브리프의 3.2TB 열을 교차 확인했다. | https://americas.kioxia.com/en-us/business/ssd/enterprise-ssd/cm7-v-e3s.html · https://www.kioxia.com/content/dam/kioxia/shared/business/ssd/enterprise-ssd/asset/productbrief/eSSD-CM7-V-E3.S-product-brief.pdf |
| SanDisk DC SN861 | PCIe Gen5; NVMe 2.0; 제품군의 폼팩터·용량·내구성은 SKU 의존. 공식 제품 페이지/데이터시트에서 7.68TB U.2 1 DWPD SKU를 확인할 예정 | https://www.sandisk.com/products/ssd/enterprise-ssd/sandisk-dc-sn861-ssd |
| DapuStor Haishen3 H3100 1.6TB | U.2; PCIe 3.0 x4 NVMe 1.3; 1,600GB; 3,500 MB/s read, 2,700 MB/s write; 820K random-read IOPS, 240K random-write IOPS; 7.5W typ./10W max; 3 DWPD. 공식 제품 페이지와 공식 Haishen3 브리프 2쪽의 H3100 1.6TB 열을 교차 확인했다. | https://en.dapustor.com/product/5.html · https://en.dapustor.com/uploads/pdf/DapuStor%20-%20Haishen3(EN)_v1.12.pdf |
| SK hynix PE8110 U.2/U.3 7.68TB | U.2/U.3 15mm; PCIe Gen4 x4; 7,680GB; 최대 6,500 MB/s read, 3,700 MB/s write; 최대 1,100K random-read IOPS, 145K random-write IOPS; 17W @ 7.68TB; 1 DWPD. 공식 PE8000 제품 페이지의 U.2/U.3 대표 SKU 값이다. | https://product.skhynix.com/products/ssd/essd/pe8000.go |
| SanDisk DC SN861 U.2 1.6TB (0TS2531) | U.2; PCIe Gen5 x4; NVMe 2.0; 1,600GB; 13,700/3,600 MB/s read/write; 2,100K/330K random read/write IOPS; 3 DWPD; SE/ISE/TCG Opal 옵션. SKU 페이지와 공식 U.2 데이터시트 표를 교차 확인했다. | https://www.sandisk.com/products/ssd/enterprise-ssd/sandisk-dc-sn861-ssd?sku=0TS2531 · https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/internal-drives/sn861-nvme-ssd/data-sheet-sandisk-sn861-nvme-ssd-u2.pdf |

## 입력 대상 후보

사용자가 지정한 Samsung, SK hynix, Micron, KIOXIA, SanDisk, DapuStor 각각에서 공식 사양이 확인되는 실제 제품을 1개 이상 입력한다. 성능은 공급사 일반 홍보 수치가 아니라 제품·용량·폼팩터가 명확한 SKU 또는 제품 브리프의 최고 공개 수치만 사용한다.

## 교차 확인 기록

- **Samsung PM1743:** 공식 PM1743 상세 제품 페이지와 Samsung Enterprise SSD 제품 표가 같은 PCIe 5.0, E3.S/2.5-inch, 최대 15.36TB·14,000/7,100 MB/s·2,500K/360K IOPS·1 DWPD를 제시한다.
- **Micron 9550 PRO E3.S 15.36TB:** 공식 9550 제품 브리프 2쪽은 14,000/10,000 MB/s와 최대 3,300K/380K 제품군 홍보 수치를, 3쪽 표는 15.36TB PRO 열의 14,000/10,000 MB/s·3,000K/400K IOPS·1 DWPD를 제시한다. 후보 행에는 SKU 열 수치를 사용했다.
- **KIOXIA CM7-V E3.S 3.2TB:** 공식 웹 사양표와 공식 2쪽 제품 브리프 모두 14,000/3,500 MB/s, 2,700K/600K IOPS, 21W typ., 3 DWPD를 제시한다.
- **SanDisk DC SN861 U.2 1.6TB:** 공식 SKU 페이지가 0TS2531의 1.6TB U.2·ISE와 PCIe Gen5 제품군을, 공식 U.2 데이터시트 2쪽의 1.60TB/3 DWPD 열이 13,700/3,600 MB/s·2,100K/330K IOPS·NVMe 2.0을 제시한다.
- **HPE DL380 Gen11:** 공식 제품 페이지가 2U 2P·EDSFF 및 PCIe Gen5 I/O를, QuickSpecs가 12 EDSFF/24 SFF 섀시와 1600W Flex Slot Platinum PSU 옵션을 제시한다.
- **DapuStor H3100:** 공식 제품 페이지와 공식 Haishen3 브리프 2쪽의 H3100 1.6TB 열이 3,500/2,700 MB/s·820K/240K IOPS·7.5W typ.·3 DWPD를 제시해 교차 확인했다.
- **SK hynix PE8110:** 공식 PE8000 제품 페이지는 U.2/U.3 대표 SKU에 6,500/3,700 MB/s·1,100K/145K IOPS·17W·1 DWPD를 제시한다. SK hynix가 배포한 PE8110 E1.S 백서 8쪽은 별도 E1.S 15mm 변형의 PCIe Gen4 x4/NVMe 1.4, 1.92/3.84/7.68TB, 6,000/4,000 MiB/s, 1,000K/155K IOPS, 20W, 1 DWPD를 제시한다. 폼팩터 차이로 이 후보 행의 U.2 값은 제품 페이지 값만 유지하고, 백서는 PE8110 제품군의 인터페이스·내구성·E1.S 변형 교차 근거로 기록한다.

> **DapuStor Haishen3 브리프 2쪽 표 전사(공식 PDF 시각 확인):** H3100의 1.6TB 열은 `U.2`, `PCIe 3.0 x4, NVMe 1.3`, `3,500 MB/s` sequential read, `2,700 MB/s` sequential write, `820K IOPS` random read, `240K IOPS` random write, `7.5W / 10W` (typ./max) power, `3 DWPD` endurance를 표시한다. 이는 제품 페이지의 H3100 1.6TB 열과 일치한다.
