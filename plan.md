# JP Menus 구현 계획

## 1. 문서 목적

이 문서는 일본 식당과 여행 현장의 메뉴·표현을 한자·읽기·한국어 뜻으로 반복 학습하는 모바일 웹 앱의 제품 요구사항과 구현 순서를 정의한다. 후속 Codex 작업은 루트의 `AGENTS.md`와 이 문서를 먼저 읽고 진행한다.

현재 상태: SolidJS + TypeScript + Vite + Tailwind CSS 4 기반 일본 메뉴 학습 앱 구현 완료. 기존 스시 317개와 `../jp/` Markdown에서 가져온 1,259개를 합쳐 12개 메뉴 탭, 1,576개 항목을 제공한다.

## 2. 제품 목표

- 스시야에서 실제로 접하는 메뉴 표기를 보고 읽음과 뜻을 외울 수 있게 한다.
- 학습자가 한자·표기, 후리가나, 한국어 뜻 중 원하는 열을 가리고 스스로 회상하게 한다.
- 외운 단어는 행 단위로 흐리게 표시하여 미암기 단어에 시선이 머물게 한다.
- 모바일 전용 UI로 설계하고, 데스크톱에서도 모바일 폭의 앱 캔버스만 가운데 보여 준다.
- 공부에 불필요한 장식, 모달, 게임화 요소를 최소화한다.

## 3. 비목표

첫 버전에서는 다음을 만들지 않는다.

- 로그인, 계정 동기화, 데이터베이스, 관리자 화면
- SSR/하이드레이션, Axum/Actix 서버, API
- 복잡한 라우팅, 다중 가게 탐색
- 음성 합성, 스페이스드 리피티션 스케줄러
- 초기 필수 기능과 관계없는 UI 프레임워크

## 4. 핵심 UX

### 4.1 화면 프레임

- 앱 캔버스: `width: min(100%, 480px)`, `min-height: 100dvh`.
- 480px 이하에서는 전체 화면을 사용한다.
- 넓은 화면에서는 바디 배경 위에 캔버스를 수평 가운데 배치한다. 테두리나 그림자는 매우 약하게만 사용한다.
- 320px 폭에서도 가로 스크롤이 생기지 않아야 한다.
- iOS safe area를 `env(safe-area-inset-*)`로 반영한다.

### 4.2 상단 요약

- 작은 제목, 현재 카테고리, `외운 수 / 전체 수`만 표시한다.
- 카테고리 필터는 한 줄 가로 스크롤 칩으로 제공한다. 기본값은 `전체`다.
- `외운 항목 숨기기`는 보조 필터로 제공하되 기본은 끄짐이다.
- 검색은 데이터가 많은 점을 고려해 제공하되, 상단을 복잡하게 만들지 않도록 한 줄 입력창으로 둔다. 일본어 표기, 읽음, 한국어 뜻, 별칭을 모두 검색한다.

### 4.3 학습 테이블

실제 `<table>` 시맨틱을 사용한다.

| 열 | 제안 폭 | 내용 |
| --- | ---: | --- |
| 한자·표기 | 31% | 메뉴에서 흔히 보는 일본어 표기 |
| 후리가나 | 28% | 히라가나 중심의 읽음 |
| 한국어 뜻 | 나머지 | 짧고 자연스러운 메뉴 번역 |
| 암기 상태 | 40px | 텍스트와 분리된 아이콘 버튼 |

- `<thead>`와 각 `<th>`에 `position: sticky; top: 0`을 적용하고, 불투명 배경과 적절한 `z-index`를 둔다.
- 앞의 세 개 헤더는 전체가 버튼이다. 터치하면 해당 열의 **본문 값만** 숨긴다.
- 숨김은 `hiddenColumns` 상태에 따라 내부 텍스트 노드만 조건부 렌더링한다. 고정 크기 셀과 텍스트 래퍼는 DOM에 유지하여 열 폭과 행 높이가 전혀 변하지 않게 한다.
- 헤더 라벨은 항상 보이게 두어 다시 터치하면 표시할 수 있게 한다. 가려진 상태는 작은 눈 아이콘/상태점과 `aria-pressed`로 알린다.
- 세 개 학습 열은 독립적으로 가릴 수 있다. 새로고침 시에는 모두 보이는 상태로 돌아온다.
- 카테고리 구분 행은 스티키로 만들지 않는다. 작은 화면에서 스티키 요소가 본문을 과도하게 가리지 않게 하기 위함이다.

### 4.4 암기 완료 처리

- 각 행 오른쪽에 40px 고정 폭의 상태 열을 둔다. 시각적 버튼은 작아도 터치 영역은 최소 44×444px을 확보한다.
- 버튼은 체크 아이콘과 `aria-label`(`외운 단어로 표시` / `다시 학습`)을 사용한다. 문자 셀 위에 겹치지 않는다.
- 완료 행은 배경과 텍스트를 함께 낮은 강도로 dim 처리하되, 내용을 다시 확인할 수는 있어야 한다. 삭제하거나 정렬 순서를 바꾸지 않는다.
- 암기 완료 ID 집합은 브라우저 `localStorage`에 즉시 저장하고 다음 방문에 복원한다.
- 초기화는 상단의 낮은 강도 메뉴에 두고, 전체 상태를 지우기 전 확인 단계를 거친다.

### 4.5 점진적 렌더링

- 현재 메뉴 탭의 필터 결과는 처음 60개만 렌더링하고, 스크롤이 하단에 가까워지면 60개씩 추가한다.
- 메뉴 탭, 카테고리, 검색어, 외운 항목 숨기기 필터가 바뀌면 첫 묶음부터 다시 렌더링한다.
- 점진적 렌더링은 원본 JSON 순서와 카테고리 구분을 유지해야 한다.

### 4.6 시각 원칙

- 일본어 표기가 가장 먼저 읽히도록 약간 큰 글자를 사용한다. 권장 크기: 한자·표기 20px, 후리가나 14–15px, 한국어 15–16px.
- 행 높이를 일정하게 유지하고 텍스트는 한 줄 말줄임으로 표시한다. 긴 값은 셀을 눌러 하단 상세 시트에서 전체 내용을 확인한다.
- 오프화이트 배경, 짙은 먹색 텍스트, 낮은 채도의 주색 한 개만 사용한다. 강한 테두리와 그라데이션은 사용하지 않는다.
- 웹폰트 네트워크 의존성은 추가하지 않고 `system-ui`, `Yu Gothic`, `Hiragino Kaku Gothic ProN`, `Noto Sans JP`, `Apple SD Gothic Neo`, sans-serif 순의 시스템 스택을 사용한다.
- 아이콘은 인라인 SVG 또는 CSS로 처리하고 아이콘 패키지를 추가하지 않는다.
- `prefers-reduced-motion`을 준수하고, 필수 피드백 외의 애니메이션은 넣지 않는다.

## 5. 메뉴 데이터

### 5.1 관리 방식

- 기존 스시 원본은 `data/sushi.json`, 메뉴별 확장 단어장은 `data/additional_catalogs.json`에서 관리한다.
- 최상위 카탈로그는 메뉴 탭, 카탈로그 안의 카테고리는 세부 필터로 표시한다.
- 런타임 HTTP 로딩 대신 Vite의 정적 JSON import로 JavaScript 번들에 포함한다. 데이터 변경은 재빌드를 통해 반영한다.
- TypeScript 도메인 타입으로 앱 경계를 검증하고, Node 내장 테스트에서 원본 JSON 계약을 별도로 검사한다.
- JSON 순서가 화면 기본 순서이다. 별도 정렬은 사용자가 요청하기 전에 추가하지 않는다.

### 5.2 제안 스키마

```json
{
  "schema_version": 1,
  "venue_type": "sushi",
  "categories": [
    {
      "id": "tuna",
      "label_ja": "鮪",
      "label_ko": "참치",
      "items": [
        {
          "id": "sushi-maguro-akami",
          "term": "赤身",
          "reading": "あかみ",
          "meaning_ko": "참치 속살",
          "aliases": ["まぐろ赤身"],
          "note_ko": "기름이 적은 참치 붉은살",
          "commonness": "core"
        }
      ]
    }
  ]
}
```

필드 규칙:

- `id`: 번역이나 표기가 바뀌어도 유지되는 영문 kebab-case 영구 ID. `localStorage`의 키로 쓰이므로 배포 후 함부로 바꾸지 않는다.
- `term`: 일본 메뉴에서 흔한 표기. 일반적인 한자가 없거나 실제 메뉴에서 가나를 더 많이 쓰면 가나를 쓴다. 억지로 희귀 한자를 넣지 않는다.
- `reading`: 한자 표기의 자연스러운 메뉴 읽음. 기본은 히라가나로 통일한다.
- `meaning_ko`: 직역보다 한국어 메뉴판에서 이해하기 쉬운 뜻을 우선한다.
- `aliases`: 검색용 대체 표기. 표준 행을 중복 생성하는 용도로 쓰지 않는다.
- `note_ko`: 물고기 부위, 조리법, 유사 어종 구분이 필요할 때만 추가한다. 1차 UI에서는 표시하지 않아도 된다.
- `commonness`: `core`, `common`, `specialty` 중 하나. 후속에 핵심 단어 필터를 만들 수 있게 한다.

### 5.3 범위

최소 250개, 권장 280–320개의 중복 없는 항목을 목표로 한다. 단순 어류 도감이 아니라 스시야에서 메뉴로 만날 가능성을 기준으로 한다.

1. 스시 형태·주문 단위: 니기리, 군칸, 마키, 테마키, 오마카세 등
2. 참치 및 부위: 아카미, 주토로, 오토로, 네기토로 등
3. 흰살·붉은살 생선: 도미, 광어, 농어, 방어, 부시리, 보리멸 등
4. 등푸른 생선: 전갱이, 고등어, 정어리, 청어, 학공치 등
5. 연어·송어류
6. 조개·패류: 가리비, 피조개, 백합, 전복, 북방대합 등
7. 새우·게·갯가재류
8. 오징어·문어류와 상세 종류
9. 어란·군칸: 연어알, 날치알, 성게알, 생선 내장류
10. 장어·붕장어
11. 롤·김초밥·유부초밥
12. 덮밥·치라시·사시미 모둠
13. 구이·아부리·튀김·계란 요리
14. 국·촛물·샐러드·일품요리
15. 차·사케·소주·맥주·무알콜 음료·디저트

데이터 검수 체크리스트:

- 모든 `id`는 유일한가?
- `term`, `reading`, `meaning_ko`가 비어 있지 않은가?
- 같은 메뉴의 한자/가나 변형이 중복 행이 아니라 `aliases`로 묶였는가?
- 읽음에 한자가 남아 있지 않은가?
- 희귀 한자가 실제 일본 메뉴의 흔한 표기처럼 잘못 제시되지 않았는가?
- 한국 유통명과 생물학적 종명이 다른 경우 `note_ko`에 보충했는가?
- 부위명과 어종명, 조리법과 재료명을 혼동하지 않았는가?

## 6. 기술 결정

### 6.1 스택

- SolidJS `1.9.x`: 세밀한 반응형 업데이트를 사용하는 CSR UI
- TypeScript `7.x`: strict 모드의 도메인·컴포넌트 타입 검사
- Vite `8.x` + `vite-plugin-solid`: 개발 서버와 프로덕션 정적 번들
- 브라우저 `localStorage`: 기존 저장 키와 스키마를 유지한 암기 상태 저장
- Tailwind CSS 4 + `@tailwindcss/vite`: CSS-first 테마 토큰과 utility class

초기에는 라우터, 별도 상태 관리 패키지, 아이콘 패키지를 추가하지 않는다. Tailwind 커스텀 CSS는 테마, base rule, 고정 셀 치수처럼 utility로 표현하기 어려운 행동에만 사용한다.

### 6.2 렌더링 전략

이 앱은 브라우저 로컬 데이터와 로컬 상태만 사용하는 개인 학습 도구이므로 CSR이 적합하다. SSR의 SEO/초기 HTML 이점보다 빠른 반복 개발, 정적 호스팅, 서버 없는 배포가 더 중요하다.

### 6.3 상태 모델

`StudyState`는 학습 화면의 단일 상태 진입점이다. SolidJS `createSignal`과 파생 함수를 사용하고 필요한 하위 컴포넌트에 context로 제공한다.

```text
StudyState
├─ hidden_columns: Set<StudyColumn>       # 세션만, 초기값 비어 있음
├─ mastered_ids: Set<MenuItemId>         # localStorage 영속
├─ selected_category: Option<CategoryId> # 기본 전체
├─ query: String                         # 검색어
└─ hide_mastered: bool                   # 기본 false
```

- 파생 목록과 진행률은 별도 원본 상태로 저장하지 않고 `Memo`로 계산한다.
- 저장 키: `jp-menus.study.v1.sushi`.
- 저장 값은 `schema_version` + `mastered_ids`로 구성한다. 파싱 실패 시 앱은 panic 대신 빈 상태로 시작하고 개발 로그를 남긴다.
- 저장 I/O는 UI 컴포넌트에 직접 퍼뜨리지 않고 `storage.ts`로 격리한다.

## 7. 아키텍처와 폴더 구조

작은 CSR 앱에 맞는 **feature-first + 얇은 shared layer**를 사용한다. 컴포넌트, 상태, 저장 코드를 전역 폴더에 종류별로 모두 쌓지 않고 `study`라는 기능 안에 같이 둔다.

```text
jp-menus/
├─ AGENTS.md
├─ plan.md
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ vite.config.ts
├─ index.html
├─ data/
│  └─ sushi.json
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ main.tsx                # 스타일 import와 App mount만 수행
│  ├─ app.tsx                 # 앱 쉘 진입점
│  ├─ data/
│  │  └─ catalogs.ts         # 정적 JSON import와 카탈로그 조회
│  ├─ features/
│  │  └─ study/
│  │     ├─ model.ts          # MenuCatalog, Category, MenuItem 타입
│  │     ├─ state.ts          # StudyState, 필터, 토글, 파생 상태
│  │     ├─ storage.ts        # 암기 상태 복원/저장
│  │     ├─ view.tsx          # StudyPage 조립
│  │     └─ components/
│  │        ├─ study-header.tsx
│  │        ├─ category-filter.tsx
│  │        ├─ menu-table.tsx
│  │        ├─ menu-row.tsx
│  │        ├─ mastery-button.tsx
│  │        └─ cell-detail-sheet.tsx
├─ styles/
│  └─ tailwind.css            # Tailwind import, CSS-first 테마, base/최소 커스텀 rule
├─ scripts/
│  ├─ serve-dist.mjs          # E2E용 정적 서버
│  └─ run-e2e.mjs             # 정적 서버와 Playwright 생명주기 관리
└─ tests/
   ├─ data-contract.test.mjs  # JSON 규칙·중복·최소 개수
   └─ e2e/                    # Playwright 행동·레이아웃 테스트
```

구조 원칙:

- `main.tsx`에 로직을 넣지 않는다.
- 파싱된 메뉴 데이터는 불변 도메인 데이터로 다룬다.
- UI 이벤트는 `StudyState`의 명시적인 메서드(`toggleColumn`, `toggleMastered`, `resetProgress`)를 호출한다.
- 작은 컴포넌트에 조기 추상화를 만들지 않는다. 두 곳 이상에서 실제로 공유될 때만 `shared` 모듈로 옮긴다.
- 새 가게 유형이 추가되기 전까지 라우터와 저장소 추상화를 미리 만들지 않는다.

## 8. 구현 단계

### Phase 0 — 프로젝트 스캐폴딩

- [x] Node.js, npm, Vite 사용 가능 여부 확인
- [x] SolidJS + TypeScript CSR 프로젝트 구성
- [x] `main.tsx`/`app.tsx`, Tailwind CSS 진입점, 기본 앱 캔버스 구성
- [x] `npm run build` 성공과 정적 미리보기 확인

### Phase 1 — 데이터 계약과 스시 사전

- [x] TypeScript 모델과 JSON 스키마 구현
- [x] 16개 카테고리, 317개 항목 작성
- [x] ID 유일성, 필수 문자열, 읽음 문자 규칙, 중복 항목 테스트
- [x] 중복/별칭/희귀 한자/어종 번역 1차 검수

### Phase 2 — 핵심 학습 UI

- [x] 모바일 중앙 캔버스와 상단 요약 구현
- [x] 시맨틱 테이블과 스티키 컬럼 헤더 구현
- [x] 세 개 컬럼 독립 가리기/보이기
- [x] 행 암기 버튼과 dim 상태
- [x] 카테고리, 검색, 외운 항목 숨기기 필터

### Phase 3 — 영속성과 접근성

- [x] `localStorage` 복원/저장/스키마 오류 폴백
- [x] 키보드 조작, 포커스 표시, `aria-pressed`, 정확한 `aria-label`
- [x] 숨겨진 학습 값의 스크린리더 처리
- [x] 진행 초기화 확인 UI
- [x] `prefers-reduced-motion`, 고대비 포커스, 최소 화면 폭 검증

### Phase 4 — 검증과 배포 준비

- [x] TypeScript 검사, 데이터 계약 테스트, Vite production 빌드 통과
- [x] 320px, 375px, 430px, 480px, 1440px 뷰포트 자동/시각 확인
- [x] 스티키 헤더, 열 숨김, dim, 저장 복원 E2E 검증
- [x] release 빌드 후 `dist/`를 로컬 정적 호스트에서 확인
- [x] README에 설치, 개발, 테스트, 데이터 편집 방법 작성

### Phase 5 — 전체 메뉴 단어장 확장

- [x] 상위 `jp/` Markdown 11개 파일의 단어 1,259개를 내장 JSON으로 추가
- [x] 기존 스시를 포함한 12개 메뉴 탭과 탭별 세부 카테고리 구현
- [x] 탭 전환 시 카테고리 초기화, 전체 검색·암기 상태 호환 유지
- [x] 전체 카탈로그 수량·ID·필수 필드 계약 테스트 추가
- [x] 필터 결과를 60개 단위로 점진 렌더링하는 무한 스크롤 추가

### Phase 6 — SolidJS 마이그레이션

- [x] Leptos/WASM 런타임을 SolidJS + TypeScript CSR로 교체
- [x] 기존 localStorage 키·스키마와 1,576개 영구 ID 호환 유지
- [x] Vite + Tailwind CSS 4 빌드 및 GitHub Pages 워크플로 전환
- [x] 데이터 계약 테스트를 Node 테스트로 이전
- [x] 기존 Playwright 행동·레이아웃 회귀 테스트 전체 통과

## 9. 테스트 전략

### 9.1 정적 검사

```powershell
npm run check
npm run build
npm run test:e2e
```

실제 `package.json`과 잠금 파일에 맞는 명령을 유지한다. 실행하지 않은 명령을 README에 성공한 것처럼 기록하지 않는다.

### 9.2 데이터 계약 테스트

- JSON 파싱이 성공한다.
- `schema_version == 1`, `venue_type == "sushi"`다.
- 최소 15개 카테고리와 250개 항목이 있다.
- 모든 카테고리 ID와 항목 ID가 유일하다.
- 필수 필드는 trim 후 비어 있지 않다.
- `commonness`가 허용된 enum 값이다.

### 9.3 사용자 행동 테스트

- 각 헤더를 터치하면 해당 열의 값만 숨겨지고, 테이블 너비와 행 높이가 그대로다.
- 다시 터치하면 복원된다.
- 세 열을 서로 다른 상태로 두어도 정상 동작한다.
- 2화면 이상 스크롤해도 헤더가 보이고 셀 위에 잘못 겹치지 않는다.
- 암기 버튼을 누르면 해당 행만 dim 처리되고, 새로고침 후에도 유지된다.
- 다시 누르면 dim이 해제된다.
- 검색과 카테고리 필터를 함께 사용해도 진행 수가 정확하다.
- 초기에는 60개 행만 렌더링되고 하단 접근 시 다음 60개가 추가된다.
- 오손된 `localStorage` 값이 있어도 빈 상태로 정상 기동한다.

## 10. 완료 기준

- SolidJS CSR 앱이 `npm run dev`와 Vite production 빌드에서 정상 작동한다.
- 기존 스시 317개와 확장 단어 1,259개가 내장 JSON에 있고 12개 메뉴 탭에서 선택할 수 있다.
- 320–480px에서 가로 오버플로가 없고, 데스크톱에서는 480px 이하 캔버스가 가운데 있다.
- 스크롤 중 컬럼 헤더가 고정되며 각 헤더로 해당 열을 가릴 수 있다.
- 열을 가려도 모든 셀의 공간과 행 높이가 유지된다.
- 암기 버튼이 문자 영역을 침범하지 않고, dim 상태를 즉시 토글할 수 있다.
- 암기 상태는 새로고침 후에도 복원되고, 컬럼 가리기는 초기화된다.
- 터치, 키보드, 포커스, 스크린리더 상태가 명확하다.
- 데이터 계약 테스트와 TypeScript 정적 검사, production 빌드가 통과한다.

## 11. 후속 확장 후보

핵심 버전을 완성한 후 사용 패턴을 보고 검토한다.

- 순서 섞기와 `미암기만` 모드
- 단어별 오답/복습 횟수, 간격 반복
- 음성 파일이나 브라우저 TTS
- 메뉴 탭 즐겨찾기와 마지막 선택 탭 복원
- 카탈로그 규모에 따른 JSON 파일 분할
- 기기 간 진행도 동기화
- PWA/오프라인 설치

## 12. 결정 근거

- Codex는 프로젝트 지침으로 `AGENTS.md`를 읽고, 프로젝트 루트에서 현재 작업 디렉터리까지 계층적으로 탐색한다: <https://learn.chatgpt.com/docs/agent-configuration/agents-md>
- SolidJS는 signals와 context를 사용해 컴포넌트별로 세밀하게 반응형 UI를 갱신한다: <https://docs.solidjs.com/concepts/signals>
- Vite production 빌드는 기존 Trunk 개발 프로세스와 충돌하지 않는 `solid-dist/`에 정적 호스팅 가능한 결과를 생성한다: <https://vite.dev/guide/build>
- Tailwind CSS 4의 Vite 플러그인은 Vite 파이프라인에서 CSS를 직접 처리한다: <https://tailwindcss.com/docs/installation/using-vite>
