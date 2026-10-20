# 상용한자 자료와 재생성

`joyo_kanji.json`은 2010년 일본 상용한자 2,136자를 학습용으로 결합한 사전 자료다. 이 파생 데이터는 **CC BY-SA 4.0**으로 배포한다. 앱 코드와 기존 메뉴 데이터의 라이선스를 변경하지 않는다. 웹 배포물에는 [자료·라이선스 안내](../public/joyo-sources.html)가 포함된다.

## 범위와 표시 규칙

- 글자 집합: 문화청 [常用漢字表（平成22年内閣告示第2号）](https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/)의 2,136자. 공식 표기 `剝`, `𠮟`, `塡`, `頰`를 본문으로 쓰고 `剥`, `叱`, `填`, `頬`는 검색 별칭으로만 둔다.
- 전체 집합 검증: 서로 독립된 KANJIDIC2의 `grade ∈ {1,2,3,4,5,6,8}` 집합과 Unicode Unihan의 `kJoyoKanji == 2010` 집합이 문자 단위로 정확히 일치해야 가져오기가 성공한다. 총개수만 확인하는 방식이 아니다. `joyo-repertoire.txt`는 Unihan에서 추출한 검증용 글자 집합이다.
- 학년: 2020학년도 적용 교육한자 1,026자와 그 밖의 상용한자 1,110자. 1~6학년 각각 **80, 160, 200, 202, 193, 191자**다. [문부과학성 교육과정 개정 안내](https://www.mext.go.jp/a_menu/shotou/new-cs/1385768.htm), [국어 해설](https://www.mext.go.jp/content/20220606-mxt_kyoiku02-100002607_002.pdf)을 참고한다. `중학교 이상`은 KANJIDIC grade 8이며 일본의 학년 8학년을 뜻하지 않는다.
- 순서: 학년 그룹 안에서 Unicode 코드포인트 오름차순이다. 공식 표의 인쇄 순서나 출현 빈도 순위가 아니다.
- 일본어 읽기: **KANJIDIC2 사전의 음독·훈독**이며 공식 상용한자표에 허용된 음훈만으로 제한한 목록이 아니다. 드물거나 옛 읽기도 포함될 수 있다. 인명 읽기(`nanori`)는 제외했다. 음독도 히라가나로 변환하고, 오쿠리가나 경계의 `.`와 접사 경계의 `-`는 화면에서 제거했다. 음독·훈독 배열의 순서는 원본 사전 순서다.
- 한국어: **한국 한자의 훈음 중심**이다. 일본어 단어 문맥에 대한 완전한 번역 사전이 아니다. 한자의 다른 한국 표기가 필요하면 검증한 구자체/이체자와 연결했다. 일본 고유 의미나 뜻 차이가 뚜렷한 11자는 KANJIDIC2 영어 뜻을 한국어로 번역했다.
- ID는 `joyo-u` + 소문자 16진수 Unicode 코드포인트다. 이미 배포한 ID는 단순한 문구 수정이나 자료 갱신으로 변경하지 않는다.

## 사용 자료

### KANJIDIC2

저작권: James William Breen 및 Electronic Dictionary Research and Development Group (EDRDG).

This project uses the KANJIDIC2 dictionary file. This file is the property of the Electronic Dictionary Research and Development Group, and is used in conformance with the Group's licence.

- [프로젝트 문서](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project)
- [원본 다운로드](https://www.edrdg.org/kanjidic/kanjidic2.xml.gz)
- [EDRDG 일반 사전 라이선스](https://www.edrdg.org/edrdg/licence.html)
- [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

2026-10-17 작성본, 데이터베이스 `2026-290`에서 글자, 학년, 일본어 음독·훈독, 아래 11자 번역의 영어 뜻만 이용했다. SKIP 코드나 다른 별도 제한 코드 데이터는 사용하지 않았다. 출처 표기, CC BY-SA 라이선스 링크와 변경 내역을 유지해야 한다. 사전 자료를 배포하는 웹사이트는 EDRDG 갱신 조건에 맞게 **월 1회 이상 최신 사전을 확인하고 재생성·검증 후 재배포**한다. 자동 스케줄은 이 저장소 작업으로 생성하지 않았다.

### libhangul 한자 훈음

- 원본: [libhangul `data/hanja/hanja.txt`](https://github.com/libhangul/libhangul/blob/717409ce61524bb3d8426060a384822f21354c62/data/hanja/hanja.txt)
- 고정 커밋: `717409ce61524bb3d8426060a384822f21354c62`
- 저작권: Copyright (c) 2005,2006 Choe Hwanjin. All rights reserved.
- 라이선스: **파일 자체의 BSD 3-Clause**. 저장소 전체의 LGPL과 구분한다. 원문 저작권 고지·조건·면책은 웹 배포용 `public/joyo-sources.html`에도 그대로 포함했다.

단일 한자 항목의 실제 훈음 문자열만 사용한다. 여러 음의 항목은 중복을 제거해 `/`로 연결한다. `同字`, `俗字` 등 순수 이체자 참조 구절은 화면 뜻에서 제거하고, 뜻이 사라지는 항목은 아래의 명시적 표기로 연결한다. 이 출처의 오래된 훈이나 다의적 뜻이 포함될 수 있다.

### Unicode Unihan 18.0.0

- [원본 배포 ZIP](https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip)
- [Unihan 문서](https://www.unicode.org/reports/tr38/)
- [Unicode License V3](https://www.unicode.org/license.txt)

`kJoyoKanji`로 전체 상용한자 집합을 독립 검증한다. 한국 훈음이 없는 일본 표기는 `kJapaneseOldVariant`, `kTraditionalVariant`, `kZVariant` 순서로 대응하는 한국 사전 표기를 찾는다. 무제한 의미 유사어 탐색은 하지 않는다. `咲 → 笑`나 `丼 → 井`처럼 일본어에서 의미가 다른 대응을 자동 적용하지 않는다. Unicode 고지 전문은 웹 배포용 안내에 포함했다.

## 명시적으로 검토한 대응과 번역

자동 이체자 연결에 없는 한국 표기:

```text
閲→閱 既→旣 教→敎 歳→歲 舎→舍 尚→尙 清→淸 青→靑
闘→鬪 舗→鋪 毀→毁
```

원본이 순수 참조만 제공하는 항목의 뜻 연결:

```text
並→竝 仮→假 即→卽 塩→鹽 弥→彌 潜→潛 窃→竊 装→裝 駄→馱
```

프로젝트에서 작성한 KANJIDIC2 뜻의 한국어 번역:

| 글자 | 원본 영어 뜻 중 번역 근거 | 한국어 |
| --- | --- | --- |
| 込 | crowded, included | 붐비다·안으로 들어가다 |
| 咲 | blossom, bloom | 꽃이 피다 |
| 捗 | make progress | 일이 진척되다 |
| 働 | work | 일하다 |
| 枠 | frame, framework, bounding-box | 틀·테두리 |
| 丼 | bowl, bowl of food | 사발·덮밥 |
| 欧 | Europe | 유럽 |
| 姫 | princess | 공주 |
| 娘 | daughter, girl | 딸·소녀 |
| 机 | desk, table | 책상·탁자 |
| 沖 | open sea, offing | 먼바다 |

최초 가져오기 결과는 직접 훈음 1,835자, 일본 구자체 연결 256자, 명시적 표기 연결 20자, 번체 연결 6자, Z-variant 연결 8자, 프로젝트 번역 11자다.

## 재생성 및 검증

앱 빌드와 실행은 다운로드를 하지 않는다. 자료를 갱신할 때만 Python 표준 라이브러리로 가져온다. 추가 패키지 설치는 필요 없다.

```powershell
python scripts/import-joyo.py --source-dir "$env:TEMP/jp-menus-joyo" --download
npm run check
npm run build
npm run test:e2e
```

동일한 원본 파일 세 개를 보관하고 있다면 `--download` 없이 실행해 재현할 수 있다. 원본 SHA-256, KANJIDIC 버전, 학년별 개수, 연결 방법별 개수는 `joyo-source-manifest.json`에 기록된다. 최신 사전의 개정이 있을 수 있으므로 갱신할 때 JSON 차이와 계약 테스트 결과를 검토한다.

검증용 전체 글자 집합의 SHA-256은 `3fa93c1d4f65fd4dc43b8b608110743bb29eb6759cc513a7ad24bb684b2bc2ea`다. **숫자 코드포인트 순서**로 정렬한 2,136자를 구분자·마지막 줄바꿈 없이 UTF-8로 인코딩해 계산한다. JavaScript 기본 UTF-16 정렬은 사용하지 않는다. 검증용 TXT 파일 자체에는 마지막 줄바꿈이 있다.

## 글자 모양 분해: KanjiVG

`joyo_components.json`은 모든 상용한자 **2,136자**의 모양 구성 요소를 제공한다. 글자가 역사적으로 만들어진 과정이나 어원 설명이 아니다. 구성 요소의 한국어 뜻 역시 그 모양의 사전 뜻이며, 해당 요소가 글자의 뜻을 실제로 결정했다는 주장을 하지 않는다.

### 원본과 라이선스

- 프로젝트: [KanjiVG (Kanji Vector Graphics)](https://kanjivg.tagaini.net/)
- 저작권: **© 2009–2026 Ulrich Apel**. 원본 SVG의 고지는 `Copyright (C) 2009/2010/2011 Ulrich Apel.`이다.
- 원본 라이선스: [Creative Commons Attribution-ShareAlike 3.0 Unported](https://creativecommons.org/licenses/by-sa/3.0/)
- 고정 소스: [KanjiVG 커밋 `70a0b7ae0c18ceb5cb358274b029cce0234a43bc`](https://github.com/KanjiVG/kanjivg/tree/70a0b7ae0c18ceb5cb358274b029cce0234a43bc), 2026-09-30
- [SVG 구성 요소 형식](https://kanjivg.tagaini.net/svg-format.html), [부수·이체자 표기](https://kanjivg.tagaini.net/radicals.html), [손글씨와 인쇄 글꼴의 차이](https://kanjivg.tagaini.net/faq.html)

This project uses KanjiVG by Ulrich Apel, available at https://kanjivg.tagaini.net/ under CC BY-SA 3.0. The original SVG group data has been transformed into component trees, position labels have been translated into Korean, and Korean dictionary meanings have been attached. No SVG drawings or stroke paths are included in the derived dataset.

결합·변형한 구성 요소 데이터는 **CC BY-SA 4.0**으로 배포한다. KanjiVG 원본 저작권과 CC BY-SA 3.0 고지를 유지하며, 파생 데이터의 변경 내역과 CC BY-SA 4.0 링크도 함께 제공한다. 원본 3.0 라이선스 [제4조 (b)](https://creativecommons.org/licenses/by-sa/3.0/legalcode.en#s4b)는 같은 라이선스 요소를 사용하는 이후 버전으로 파생물을 배포할 수 있도록 한다. 기존 libhangul·Unihan·KANJIDIC의 고지도 그대로 적용된다.

### 추출·뜻 연결 규칙

1. 각 글자 코드포인트의 기본 SVG 파일 하나만 사용한다. 변형 SVG 파일을 임의로 대신 쓰지 않는다. 2,136자 모두 대응하는 원본 파일이 있다.
2. `kvg:element`를 눈에 보이는 구성 요소 모양으로 사용하고, SVG 그룹에 실제로 포함된 하위 그룹만 따라간다. 다른 글자의 SVG를 재귀 호출해 분해를 만들어내지 않는다.
3. `kvg:original`이 다른 글자를 명시하면 `original`에 보존하고 **원형 글자의 뜻**을 연결한다. 예: `亻`는 원형 `人`의 `사람 인`이다. 이는 KanjiVG가 표시한 대응을 전달하는 것이며 자체 어원 추론이 아니다.
4. 뜻은 기존 `joyo_kanji.json`의 검토된 뜻·단일 글자 별칭을 우선한다. 그 밖에는 위에 고정한 libhangul의 실제 뜻, 명시적 사전 이체자 참조, Unihan의 `kJapaneseOldVariant`·`kTraditionalVariant`·`kZVariant`만 따라간다. 일반적인 의미 유사성으로 뜻을 추측하지 않는다. 사전 연결은 방문한 글자를 기록하고 6단계 이내로 제한하여 순환을 차단한다.
5. `kvg:partial`이나 `kvg:part`가 있으면 `partial: true`로 표시한다. 획순 때문에 나뉘어 기록된 같은 모양은 `part` 번호를 유지한다. 예: `国`의 `囗` 1부분과 2부분을 두 개의 완전한 `囗`로 해석하면 안 된다.
6. 이름 없는 SVG 그룹과 문자가 아닌 `CDP-8BC4`·`CDP-8CB8` 표식은 투명한 묶음으로 취급한다. 실제 글자로 표시된 하위 요소는 순서대로 유지하고, 이름 붙지 않은 획 수도 보존한다. 없는 글자 모양을 만들어 표시하지 않는다.
7. 분해 트리는 SVG에 있는 유한한 그룹만 읽는다. 최대 원본 그룹 깊이 12를 넘으면 가져오기를 실패시킨다. 같은 글자가 여러 부분에 다시 나타나는 것은 자료의 일부이며, 참조 그래프의 순환이 아니다.
8. 한국어 뜻을 확인할 수 없는 구성 요소는 `meaning_ko`를 생략한다. 화면은 `뜻 정보 없음`으로 표시해야 하며 공백이나 만들어낸 뜻으로 대체하지 않는다. 원본의 `マ`·`つ`처럼 가나와 닮은 모양 표기도 임의의 한자로 치환하지 않는다.

KanjiVG는 일본어 손글씨의 모양을 바탕으로 하므로 화면 시스템 글꼴의 인쇄 모양과 차이가 있을 수 있다. 위치 표시는 원본에 명시된 경우만 한국어로 옮긴다. 구성 요소의 목록을 글자의 정확한 덧셈식으로 제시하지 않는다.

### 데이터 스키마와 획수

```typescript
interface ComponentNode {
  character: string;           // 한 Unicode 코드포인트: 한자, 부수, 드물게 가나 모양
  meaning_ko?: string;         // 확인된 한국어 뜻; 미제공이면 생략
  original?: string;           // 원본이 명시한, 표시 모양과 다른 원형
  position_ko?: string;        // 형제 요소 사이의 상대 위치
  partial?: boolean;          // 전체가 아닌 일부 모양/획순상 나뉜 부분
  part?: number;              // 원본 kvg:part 번호
  stroke_count: number;       // 이 그룹의 전체 획 수
  ungrouped_strokes: number;  // 바로 아래 이름 있는 요소에 속하지 않은 획 수
  children?: ComponentNode[]; // 실제 하위 요소가 있을 때만 존재
}

interface ComponentEntry {
  components: ComponentNode[]; // 빈 배열: 원본이 더 작은 이름 있는 요소로 나누지 않음
  stroke_count: number;
  ungrouped_strokes: number;
}

// joyo_components.json
// { schema_version: 1, entries: Record<string, ComponentEntry> }
```

모든 항목과 노드에서 `stroke_count = ungrouped_strokes + 직계 하위 요소들의 stroke_count 합`을 만족한다. 잎 노드의 모든 획은 그 노드에서 `ungrouped_strokes`에 들어간다. 이것은 자료가 누락되었다는 뜻이 아니라, **더 작은 이름 있는 하위 요소로 묶이지 않았다**는 뜻이다. 하위 요소가 없는 `一`와 `生`도 정상 항목이다.

초기 추출 결과:

- 2,136개 항목: 이름 있는 하위 요소가 있는 글자 2,070개, 더 나누지 않는 글자 66개
- 구성 요소 노드 10,699개, 최대 표시 트리 깊이 7
- 한국어 뜻이 있는 노드 10,256개; 뜻 미제공 443개 노드, 95종 모양
- 일부 모양 노드 1,217개
- 최소 JSON 표현 1,370,174바이트, gzip 압축 104,110바이트

예시로 `休`는 `亻`(원형 `人`, 2획)와 `木`(4획), `森`은 위의 `木`(4획)와 아래의 `林`(8획)이며 `林` 아래에 `木` 두 개가 있다. `鬱`은 총 29획이다. 세부 통계, 모든 원본 SVG의 SHA-256, 원본 ZIP·사전의 SHA-256, 입력 상용한자 파일과 결과 파일 해시는 `joyo-component-source-manifest.json`에 기록한다.

### 구성 요소 자료 재생성

```powershell
python scripts/import-kanji-components.py --source-dir "$env:TEMP/jp-menus-components" --download
npm run check
npm run build
npm run test:e2e
```

Python 표준 라이브러리만 사용한다. 고정한 세 원본 파일을 이미 보관하고 있다면 `--download`를 생략한다. 원본 파일 해시가 고정값과 다르면 가져오기를 중단한다. 가져오기는 `joyo_components.json`과 구성 요소 manifest만 작성하며 **기존 `joyo_kanji.json`은 변경하지 않는다**. 원본 KanjiVG 버전을 올릴 때는 고정 커밋·해시와 원본 차이를 함께 검토한다.
