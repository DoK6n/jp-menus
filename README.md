# JP Menus

일본 식당과 여행 현장에서 자주 보는 일본어 표기, 읽기, 한국어 뜻을 외우는 모바일 학습 앱입니다. 12개 메뉴 탭의 1,576개 단어와 별도 상용한자 화면의 2,136자를 제공합니다. SolidJS, TypeScript, Vite, Tailwind CSS 4로 구성됩니다.

상단의 **메뉴 단어 / 상용한자** 버튼으로 전환합니다. 상용한자는 초등 1–6학년·중학교 이상으로 나누어 검색, 열 가리기, 암기 표시, 전체 값 확인·복사를 지원합니다. 진도 집계와 초기화는 화면별로 독립적이며, 기존 메뉴 진도는 그대로 유지됩니다.

배포 주소: <https://dok6n.github.io/jp-menus/>

## 준비

```powershell
npm install
```

## 개발

```powershell
npm run dev
```

Vite가 출력한 로컬 주소에서 확인할 수 있습니다.

## 검증

```powershell
npm run check
npm run build
npm run test:e2e
```

- `npm run check`: TypeScript 검사와 데이터 계약 테스트
- `npm run build`: 프로덕션 정적 번들 생성
- `npm run test:e2e`: 프로덕션 빌드 후 Playwright 행동·레이아웃 테스트

## 데이터 편집

기존 스시 메뉴 원본은 `data/sushi.json`, 확장 단어장 원본은 `data/additional_catalogs.json`입니다. 확장 데이터는 상위 `jp/` 디렉터리의 Markdown 단어 1,259개를 메뉴·소제목 구조 그대로 옮겼습니다. ID는 브라우저에 저장되는 암기 상태와 연결되므로 배포 후에는 유지해야 합니다. 데이터 작성 규칙은 `plan.md`와 `AGENTS.md`를 참고하세요.

상용한자는 `data/joyo_kanji.json`에 내장됩니다. 일본어 음독·훈독은 KANJIDIC2의 사전 읽기이며 공식 상용한자표의 읽기만으로 한정하지 않습니다. 데이터 출처·한국어 뜻 변환·라이선스는 [자료 설명](data/joyo-sources.md)과 [사용자용 이용 조건](public/joyo-sources.html)을 참고하세요.
