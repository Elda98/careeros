/**
 * A single labeled number in a bordered surface tile — extracted from
 * Settings' renewal-recap grid (its first caller, as `RecapStat`) when
 * Progress needed the identical treatment a second time for its own
 * completion-metrics grid.
 */
export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3">
      <p className="text-title text-foreground">{value}</p>
      <p className="mt-0.5 text-caption text-muted-foreground">{label}</p>
    </div>
  );
}
