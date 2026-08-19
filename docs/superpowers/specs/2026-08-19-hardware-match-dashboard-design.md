# Hardware Match Dashboard Design

## Problem

현재 화면은 공개 근거와 상세 분석은 충실하지만 핵심 결론이 장문 페이지의 아래쪽에 흩어져 있다. 사용자는 어떤 서버와 SSD를 선택해야 하는지, 선택 후 무엇이 바뀌었는지 첫 화면에서 바로 알기 어렵다. 실제 제품 데이터 입력 경로도 로그인·수동 폼·CSV 중심이라 단순 탐색에는 진입 비용이 높다.

## Chosen approach

기존 evidence-first 대시보드를 유지하고 `Home` 히어로 바로 아래에 정적 공식 제품 카탈로그 기반 `HardwareMatcher`를 추가한다. 별도 라우트나 새 백엔드 저장소는 만들지 않는다. 매처는 서버 16종, SSD 14종을 검색·필터·클릭으로 바꾸고, 순수 함수가 물리 폼팩터, PCIe 세대, 베이 수, 예상 raw 용량, SSD active power, 워크로드 등급을 즉시 계산한다.

대안으로 검토한 별도 비교 라우트는 기존 단일 페이지의 근거 흐름을 끊고, 전체 화면 교체는 이미 유용한 하이퍼스케일러·후보 CRUD 기능을 위험하게 만든다. 따라서 상단 결정 레이어 + 하단 근거 레이어가 가장 작은 변경으로 목표를 충족한다.

## Data contract

### Server catalog record

- 식별: `id`, `manufacturer`, `model`, `generation`
- 공개 최대 구성: `rackUnits`, `cpu`, `cpuSockets`, `maxMemoryTb`, `pcieGen`, `nvmeBays`, `driveFormFactors`, `maxStorageTb`, `gpuSummary`, `psuSummary`
- 사용 맥락: `workloads`, `summary`
- 출처: `sourceUrl`, `sourceLabel`, `sourceConfidence`, `sourceRetrievedAt`, `valueScope`

`valueScope`는 모든 서버 레코드에서 `제품군 공개 최대값`으로 표시한다. 이 값은 실제 출하 BOM이 아니다.

### SSD catalog record

- 식별: `id`, `manufacturer`, `model`, `marketClass`, `workloadClass`
- SKU/제품군 값: `formFactor`, `capacityTb`, `pcieGen`, `nvmeVersion`, `readMBps`, `writeMBps`, `readIops`, `writeIops`, `dwpd`, `activePowerW`
- 사용 맥락: `workloads`, `summary`
- 출처: 서버와 동일하며 `valueScope`는 `제품군 대표 최대값` 또는 `명시 SKU 값`

성능 시험 조건이 동일하지 않으므로 서로 다른 SSD의 절대 순위를 제공하지 않는다. 값이 확인되지 않은 필드는 `null`로 둔다.

## Compatibility model

`analyzeHardwareMatch(server, ssd)`는 다음을 반환한다.

- `verdict`: `compatible | review | incompatible`
- `formFactor`: exact match 여부. 공통 폼팩터가 없으면 `incompatible`.
- `pcie`: 같은 세대는 native, SSD가 낮으면 backward-compatible, SSD가 높으면 host bottleneck 검토.
- `rawCapacityTb`: `server.nvmeBays * ssd.capacityTb`
- `estimatedDrivePowerW`: SSD power가 공개된 경우 `server.nvmeBays * activePowerW`
- `workloadFit`: 서버/SSD 태그 교집합과 SSD endurance class에 따른 설명형 참고 신호
- `checks`: 색 외에 아이콘·상태명·근거 문장을 포함한 행 목록

전체 점수는 만들지 않는다. 공개 최대 구성과 SSD 제품군 대표값을 단일 백분율로 합치면 정밀해 보이는 오해를 만들기 때문이다.

## User experience

1. 상단 요약은 데이터 수, 제조사 수, 업데이트 날짜를 짧게 보여준다.
2. 서버 선택기는 검색과 제조사 필터를 제공하고 카드 클릭 시 `aria-pressed`가 갱신된다.
3. 중앙 결과는 같은 뷰포트에서 결론, 물리 규격, PCIe 링크, raw 용량, 전력 추정을 갱신한다.
4. SSD 선택기는 워크로드 등급과 핵심 성능을 스캔 가능한 카드로 표시한다.
5. 각 선택 제품의 공식 원문과 A/B/C 신뢰도, 값 범위를 항상 표시한다.
6. 상세 하이퍼스케일러·내부 후보 기능은 `상세 근거 보기` 링크 아래에 그대로 남는다.

## Accessibility and responsive behavior

- 카드 전체를 실제 `button`으로 만들고 `aria-pressed`를 제공한다.
- 검색 input에 가시적인 label과 focus ring을 제공한다.
- 결과 컨테이너는 `aria-live="polite"`로 선택 변경을 전달한다.
- 1024px 이상은 선택기/결론/선택기 3열, 그 아래는 단일 열이다.
- 390px에서 핵심 수치가 2열 이하로 줄고 터치 목표는 44px 이상이다.
- 기존 모바일 이중 탐색 중 하단 6개 dock을 제거하고 상단 메뉴 하나만 유지한다.
- `maximum-scale=1`을 제거한다.

## Existing dashboard repairs in scope

- 저장소에 없는 `/manus-storage/*` 이미지를 제거하고 CSS 기반 배경으로 대체한다.
- 프로파일 카드의 비클릭 `프로파일 보기`를 실제 버튼 영역과 통합한다.
- 필터/비교 버튼에 `aria-pressed`, 모바일 메뉴에 `aria-expanded`를 추가한다.
- 검색 0건 상태와 결과 수를 추가한다.
- 하단 fixed 모바일 dock을 제거해 콘텐츠 가림과 중복 탐색을 없앤다.
- 섹션 번호를 매처 이후의 실제 정보 흐름에 맞춘다.

## Testing

- 카탈로그가 최소 서버 16종/SSD 14종이고 모든 레코드에 공식 URL·범위·신뢰도가 있는지 테스트한다.
- 폼팩터 불일치, PCIe native/backward/bottleneck, null power, raw 용량 계산을 RED-GREEN 순서로 테스트한다.
- 타입체크, 전체 Vitest, 프로덕션 빌드를 실행한다.
- 가능하면 1440px과 390px에서 로컬 렌더를 확인하고 콘솔 오류·가로 overflow를 점검한다.

## Boundaries

- 제조사 사이트 실시간 크롤링, 가격/가용성, 로그인 사용자 DB 자동 시딩, DB 마이그레이션은 포함하지 않는다.
- 카탈로그 값은 2026-08-19 조사 스냅샷이며 문서 개정 시 갱신해야 한다.
- 하이퍼스케일러 공개 VM 프로파일은 물리 서버 BOM으로 재해석하지 않는다.
