---
"@oc-mui/ui": minor
---

Upgrade `react-day-picker` from 8 to 10 behind `@oc-mui/ui`'s own prop types, so callers no longer depend on the library's types.

- `Calendar` now takes `CalendarProps`, a new exported type: `selected`, `onSelect`, `disabled`, `defaultMonth`, `showOutsideDays`, `autoFocus` and `className`. It selects a single day. The react-day-picker props it used to pass through (`mode`, `classNames`, `components`, `initialFocus`, range and multiple selection) are gone.
- `DatePicker`'s `onDateChange` now receives only the picked date, `(date: Date | undefined) => void`. Its props type is exported as `DatePickerProps`.
- Day buttons carry a full accessible label, e.g. "Thursday, November 5th, 2026, selected". The look stays the same; the selected day now shows the focus ring when the calendar opens.

Released as a minor although the narrower `Calendar` signature is formally breaking: no known plugin passes react-day-picker-specific props. If yours does, replace `initialFocus` with `autoFocus`, drop `mode="single"`, and move any custom `classNames` or `components` into your own wrapper around `react-day-picker`.
