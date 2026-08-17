# JP Menus

스시야 메뉴의 일본어 표기, 후리가나, 한국어 뜻을 외우는 모바일 학습 앱입니다. Leptos CSR, Tailwind CSS 4, Trunk로 구성됩니다.

배포 주소: <https://dok6n.github.io/jp-menus/>

## 준비

```powershell
rustup target add wasm32-unknown-unknown
cargo install --locked trunk
```

## 개발

```powershell
trunk serve
```

`http://127.0.0.1:3000`에서 확인할 수 있습니다. Trunk가 Tailwind CSS를 함께 빌드합니다.

## 검증

```powershell
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all
cargo check --target wasm32-unknown-unknown
trunk build --release
npm install
npm run test:e2e
```

## 데이터 편집

스시 메뉴의 원본은 `data/sushi.json`입니다. ID는 브라우저에 저장되는 암기 상태와 연결되므로 배포 후에는 유지해야 합니다. 데이터 작성 규칙은 `plan.md`와 `AGENTS.md`를 참고하세요.
