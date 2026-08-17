use leptos::prelude::*;

use crate::features::study::{
    components::mastery_button::MasteryButton,
    model::{MenuItem, StudyColumn},
    state::StudyState,
};

#[derive(Clone, Copy)]
enum CellKind {
    Term,
    Reading,
    Meaning,
}

impl CellKind {
    fn key(self) -> &'static str {
        match self {
            Self::Term => "term",
            Self::Reading => "reading",
            Self::Meaning => "meaning",
        }
    }

    fn fit_level(self, display_width: usize) -> &'static str {
        let (normal_max, compact_max) = match self {
            Self::Term => (6, 10),
            Self::Reading => (10, 16),
            Self::Meaning => (12, 18),
        };

        if display_width <= normal_max {
            "normal"
        } else if display_width <= compact_max {
            "compact"
        } else {
            "tight"
        }
    }
}

fn estimated_display_width(value: &str) -> usize {
    value
        .chars()
        .map(|character| {
            if character.is_ascii() || character.is_whitespace() {
                1
            } else {
                2
            }
        })
        .sum()
}

#[component]
fn StudyCell(
    value: String,
    label: &'static str,
    column: StudyColumn,
    kind: CellKind,
) -> impl IntoView {
    let state = expect_context::<StudyState>();
    let value_for_detail = value.clone();
    let title = value.clone();
    let aria_label = format!("{label} 전체 내용 보기: {value}");
    let display_width = estimated_display_width(&value);
    let fit_level = kind.fit_level(display_width);
    let kind_key = kind.key();

    view! {
        <button
            type="button"
            class="block w-full min-w-0 overflow-hidden rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-default"
            disabled=move || state.is_column_hidden(column)
            aria-label=aria_label
            title=title
            on:click=move |_| state.open_cell_detail(label, value_for_detail.clone())
        >
            <span
                class="cell-content study-cell-text"
                data-column=kind_key
                data-fit=fit_level
                data-display-width=display_width
                data-concealed=move || state.is_column_hidden(column).to_string()
                aria-hidden=move || state.is_column_hidden(column).to_string()
            >
                {value}
            </span>
        </button>
    }
}

#[component]
pub fn MenuRow(item: MenuItem) -> impl IntoView {
    let state = expect_context::<StudyState>();
    let item_id_for_class = item.id.clone();

    view! {
        <tr class=("opacity-35", move || state.is_mastered(&item_id_for_class)) class="border-b border-line/80 bg-surface transition-opacity last:border-b-0">
            <td class="h-16 px-2 py-2 align-middle sm:px-2.5">
                <StudyCell value=item.term.clone() label="한자·표기" column=StudyColumn::Term kind=CellKind::Term />
            </td>
            <td class="h-16 px-1 py-2 align-middle sm:px-1.5">
                <StudyCell value=item.reading label="후리가나" column=StudyColumn::Reading kind=CellKind::Reading />
            </td>
            <td class="h-16 px-1.5 py-2 align-middle sm:px-2">
                <StudyCell value=item.meaning_ko label="한국어 뜻" column=StudyColumn::Meaning kind=CellKind::Meaning />
            </td>
            <td class="h-16 w-11 p-0 align-middle">
                <MasteryButton item_id=item.id term=item.term />
            </td>
        </tr>
    }
}

#[cfg(test)]
mod tests {
    use super::{CellKind, estimated_display_width};

    #[test]
    fn estimates_full_width_scripts_more_heavily_than_ascii() {
        assert_eq!(estimated_display_width("鮪"), 2);
        assert_eq!(estimated_display_width("ABC"), 3);
        assert_eq!(estimated_display_width("참치 A"), 6);
    }

    #[test]
    fn chooses_fit_level_by_column_and_display_width() {
        assert_eq!(CellKind::Term.fit_level(6), "normal");
        assert_eq!(CellKind::Term.fit_level(8), "compact");
        assert_eq!(CellKind::Term.fit_level(12), "tight");
        assert_eq!(CellKind::Reading.fit_level(12), "compact");
        assert_eq!(CellKind::Meaning.fit_level(20), "tight");
    }
}
