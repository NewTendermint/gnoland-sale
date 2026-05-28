import { Icon } from "./Icon"

type MetricStatProps = { icon: string; value: string; label: string; tone?: "default" | "contrast" }

/** Icon + big mono value + uppercase label, used for position/sale metrics. */
export function MetricStat({ icon, value, label, tone = "default" }: MetricStatProps) {
  const labelColor = tone === "contrast" ? "text-on-contrast-muted" : "text-muted"
  return (
    <div>
      <Icon name={icon} className="h-5 w-5 text-mint" />
      <dd className="mt-3 font-mono text-2xl font-bold tabular-nums md:text-3xl">{value}</dd>
      <dt className={`mt-1 text-xs uppercase tracking-widest ${labelColor}`}>{label}</dt>
    </div>
  )
}
