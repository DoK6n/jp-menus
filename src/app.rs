use leptos::prelude::*;

use crate::{data::sushi::load_library, features::study::view::StudyPage};

#[component]
pub fn App() -> impl IntoView {
    match load_library() {
        Ok(library) => view! { <StudyPage library /> }.into_any(),
        Err(error) => view! {
            <main class="mx-auto flex min-h-dvh w-full max-w-[480px] items-center justify-center bg-paper px-6 text-center text-ink">
                <section aria-labelledby="load-error-title">
                    <p class="mb-2 text-xs font-bold tracking-[0.18em] text-accent uppercase">"JP Menus"</p>
                    <h1 id="load-error-title" class="text-xl font-bold">"메뉴를 불러오지 못했어요"</h1>
                    <p class="mt-3 text-sm leading-6 text-muted">{error.to_string()}</p>
                </section>
            </main>
        }.into_any(),
    }
}
