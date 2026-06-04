export function ExternalUnavailableBanner() {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4 text-sm text-[var(--color-muted)]"
      role="status"
    >
      Wyszukiwanie zewnętrznych przepisów jest chwilowo niedostępne (brak konfiguracji API lub limit
      serwisu). Pozostałe funkcje aplikacji działają normalnie.
    </div>
  )
}
