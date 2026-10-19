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
