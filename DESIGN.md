# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-08-19
- Primary product surfaces: `/` 단일 페이지의 하드웨어 매처, 하이퍼스케일러 공개 프로파일, 내부 서버/SSD 후보 작업대, 프로파일 기반 SSD 검증표, 통합 출처 레지스터
- Evidence reviewed: `client/src/pages/Home.tsx`, `client/src/components/{HardwareMatcher,ServerWorkbench,CandidateWorkbench,SsdFitAnalysisPanel}.tsx`, `client/src/data/{hardwareCatalog,hyperscalers}.ts`, `client/src/lib/profileComparisonExport.ts`, `client/src/index.css`, `shared/*Comparison.ts`, `research_notes.md`, `product_seed_research.md`

## Brand

- Personality: 차분한 인프라 리서치 도구, 수치보다 근거를 먼저 보여주는 기술 원장
- Trust signals: 제조사 원문 링크, 공개 최대값/SKU 값 구분, 미공개 값의 명시적 `N/D`, 출처 신뢰도
- Avoid: 출처 없는 단일 순위, 과장된 AI 문구, 장식용 그래프, 비공개 하이퍼스케일러 BOM을 아는 것처럼 보이는 표현

## Product goals

- Goals: 다양한 제조사·폼팩터·PCIe 세대의 서버와 SSD를 한 번씩 클릭해 물리·링크·용량·전력 적합성을 즉시 파악한다. 공개 프로파일을 SSD 검증 항목과 수용 기준으로 변환하고, 상세 근거와 전체 참고 문서를 같은 화면에서 추적하며 비교·검증표는 로컬 파일로 가져갈 수 있다.
- Non-goals: 조달 승인, 실제 출하 BOM 보증, 서로 다른 벤치마크 조건의 절대 성능 순위, 실시간 제조사 크롤러
- Success signals: 첫 화면에서 선택 대상과 결론이 보임, 3회 이하의 조작으로 조합 변경, 모든 데이터에 원문/신뢰도 표시, 모바일 390px에서도 핵심 결과가 한 열로 읽힘

## Personas and jobs

- Primary personas: 데이터센터 인프라 기획자, 서버/SSD 제품기획·FAE, 사전 조달 검토자
- User jobs: 서버 플랫폼 후보 탐색, SSD 폼팩터·PCIe 세대 확인, 베이 기준 용량/전력 추정, 상세 공개 근거 확인
- Key contexts of use: 데스크톱 회의 화면, 노트북 비교 검토, 모바일에서 빠른 사양 확인

## Information architecture

- Primary navigation: `매처 → 클라우드 기준 → 상세 분석 → 내부 후보 → SSD 검증표 → 출처`
- Core routes/screens: 단일 `/` 화면. 최상단 매처가 기본 작업 화면이고 기존 장문 리서치 섹션은 후속 근거 화면이다.
- Content hierarchy: 즉시 판정과 핵심 수치 → 선택 가능한 실제 제품 목록 → 판정 근거 → 공개 프로파일 → 입력/CSV 전문가 작업대 → 선택 프로파일 기반 SSD 검증표 → 검색 가능한 전체 출처

## Design principles

- 한 화면, 한 결론: 현재 선택 조합의 결론을 상단 고정 영역에 한 문장으로 표현한다.
- 숫자에는 조건을 붙인다: 최대 구성, 제품군 대표값, SKU 값, 미공개를 시각적으로 구분한다.
- 카드 요약은 해독하지 않아도 읽혀야 한다: 범례 없는 막대·점·색상 인코딩 대신 `항목 · 값 · 조건`을 직접 표기한다.
- 정적 조언은 작업 산출물로 바꾼다: SSD Lens는 선택 프로파일의 공개값·누락값을 제안서 요구와 확인 기준으로 변환하고 CSV로 내보낸다.
- 출처는 완전성과 범위를 보여준다: 클라우드·서버·SSD·교차검증 문서를 URL 기준으로 중복 제거하되 어떤 레코드를 뒷받침하는지 표시한다.
- 대량 출처는 고밀도 목록으로 읽는다: 문서마다 큰 카드를 만들지 않고 `안정 ID / 분류·발행처 / 문서명 / 연결 수`를 같은 열에 정렬한다.
- 클릭 결과를 같은 뷰포트에서 보여준다: 선택 직후 먼 하단으로 보내지 않는다.
- 깊이는 선택적으로 연다: 빠른 비교는 기본 노출하고 입력 폼·방법론은 후속 섹션에 둔다.
- Tradeoffs: 실시간 자동 수집보다 검증 가능한 정적 카탈로그를 우선한다. 레코드 수보다 필드의 출처·의미 보존을 우선한다.

## Visual language

- Color: Ink `#17202A`, Paper `#F4F0E7`, Surface `#FFFDF8`, Signal `#C94A24`(작은 텍스트/액션에서 기존 오렌지보다 높은 대비), Info `#315A7D`, Positive `#315E54`, Review `#7E5F24`
- Typography: 제목 Space Grotesk/Noto Sans KR, 본문 Noto Sans KR, 수치·메타데이터 IBM Plex Mono. 본문 최소 12px, 조작 텍스트 최소 12px.
- Spacing/layout rhythm: 4/8px 배수. 최대 폭 1380px. 결과 영역은 데스크톱 12열, 모바일 단일 열.
- Shape/radius/elevation: 작은 4–8px radius, 얇은 잉크 경계, 선택 영역에만 절제된 그림자
- Motion: 160–240ms 상태 전환. `prefers-reduced-motion`에서 비필수 애니메이션 제거.
- Imagery/iconography: 저장소에 없는 `/manus-storage/*` 이미지를 사용하지 않는다. Lucide 아이콘과 CSS 패턴만 사용한다.

## Components

- Existing components to reuse: Lucide icons, 기존 하이퍼스케일러 카드/비교표, `ServerWorkbench`, `CandidateWorkbench`, `SsdFitAnalysisPanel`
- New/changed components: `HardwareMatcher`, 제조사·워크로드 `CatalogPicker`, `MatchVerdict`, `SpecMetric`, `SourceConfidenceBadge`, 공개 프로파일 카드의 문장형 `로컬 SSD 구성` 요약, 비교표 `Excel로 저장` 액션, 프로파일 기반 `SSD 검증표`, 필터·검색 가능한 고밀도 `Source Register` 목록
- Variants and states: 선택/미선택, 호환/검토/불일치, 공개 기준 있음/검증 필요/문서 요청, A/B/C 출처 신뢰도, 검색 결과 있음/없음
- Token/component ownership: `index.css`가 역할 토큰과 공통 focus/상태 스타일을 소유하고, 매처 컴포넌트는 하드코딩된 상태 색을 최소화한다.

## Accessibility

- Target standard: WCAG 2.2 AA에 맞춘 조작·텍스트 대비와 키보드 흐름
- Keyboard/focus behavior: 모든 카드 선택은 실제 `button`; `aria-pressed`, 명확한 `focus-visible` ring, 선택 후 결과 제목에 상태 업데이트
- Contrast/readability: Signal Orange는 `#C94A24`를 사용하고 작은 텍스트에서 아이보리/기존 `#E65B32` 조합을 피한다.
- Screen-reader semantics: 결과는 `aria-live="polite"`, 오류는 `role="alert"`, 메뉴는 `aria-expanded`/`aria-controls`
- Reduced motion and sensory considerations: 색만으로 상태를 전달하지 않고 아이콘·문구를 함께 사용한다.

## Responsive behavior

- Supported breakpoints/devices: 320px 이상, 390/768/1024/1440 기준 확인
- Layout adaptations: 매처는 1024px 이상 3열(서버/결론/SSD), 그 아래는 선택기→결론→선택기 단일 열. 비교 축은 모바일에서 label/value stack. Source Register는 데스크톱에서 고정 열 목록, 모바일에서 ID·분류와 문서명·연결 수를 2행으로 재배치한다.
- Touch/hover differences: 최소 44×44px 터치 영역, hover 없이도 선택 상태와 CTA가 분명해야 한다.

## Interaction states

- Loading: 정적 카탈로그는 즉시 표시. 로그인 기반 후보는 기존 skeleton/status를 유지한다.
- Empty: 검색 결과 수와 초기화 버튼을 노출한다.
- Error: 데이터셋 자체 오류는 전체 화면을 막지 않고 해당 선택기에서 설명한다.
- Success: `호환`, `검토 필요`, `물리 규격 불일치` 중 하나를 문장으로 표시한다. 비교표 또는 SSD 검증표 저장 후 대상 프로파일과 파일 형식을 상태 문구로 알린다.
- Disabled: 선택 불가능한 항목은 사유를 제공하며 단순 회색 처리만 하지 않는다.
- Offline/slow network: 정적 카탈로그 비교는 네트워크 없이 동작하고 외부 원문 링크만 오프라인에서 제한된다.

## Content voice

- Tone: 짧고 단정한 한국어, 영문 제품명·인터페이스는 원문 유지
- Terminology: `호환`은 물리/링크 기준, `적합성`은 워크로드 참고, `공개 최대값`은 구성 가능한 최대치로 정의
- Microcopy rules: “최고/최적” 대신 “공개 기준 충족/확인 필요”; `N/D` 옆에는 미공개 또는 SKU 의존 사유를 제공. Lens는 추상 질문이 아니라 `공개 기준 / 제안서 요구 / 확인 기준` 순서로 쓴다.

## Implementation constraints

- Framework/styling system: React 19, TypeScript, Vite, Tailwind 4, 기존 Radix/shadcn 의존성
- Design-token constraints: 새 UI는 의미 토큰과 기존 팔레트만 사용한다. 새 UI 프레임워크를 추가하지 않는다.
- Performance constraints: 정적 카탈로그는 클라이언트 번들에 포함하되 100개 미만 레코드, 계산은 순수 함수와 `useMemo`로 제한한다.
- Export constraints: 화면 비교축·SSD 검증축과 각 내보내기 축은 하나의 정의를 공유한다. 별도 스프레드시트 의존성 없이 Excel이 직접 여는 UTF-8 BOM CSV를 생성하고, 셀 수식 주입 문자는 이스케이프한다.
- Source constraints: 화면에서 사실·사양·교차검증에 사용한 모든 외부 URL을 중앙 레지스터에 포함한다. 동일 URL은 한 번만 표시하고 관련 제품/프로파일 수를 보존한다.
- Compatibility constraints: 기존 tRPC/DB 스키마와 로그인 후보 CRUD를 깨지 않는다.
- Test/screenshot expectations: 매처 순수 로직 단위 테스트, 타입체크, 전체 테스트, 프로덕션 빌드, 1440/390 시각 스모크 확인

## Open questions

- [ ] 제조사 데이터 자동 갱신 파이프라인은 별도 목표로 설계한다 / 제품 책임자 / 문서 개정 추적과 운영 비용에 영향
- [ ] 출하 SKU 단위의 가격·가용성은 현재 범위에서 제외한다 / 조달 담당 / 지역·계약별 비공개 데이터 필요
