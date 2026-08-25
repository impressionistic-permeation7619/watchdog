import {
  GuideSection,
  Specimen,
  Swatch,
} from "@/routes/_protected/ui/-guide-chrome";

const CONFIDENCE_SWATCHES = [
  { name: "confirmed", className: "bg-confidence-confirmed" },
  { name: "possible", className: "bg-confidence-possible" },
  { name: "unverified", className: "bg-confidence-unverified" },
] as const;

const STATUS_SWATCHES = [
  { name: "queued", className: "bg-status-queued" },
  { name: "running", className: "bg-status-running" },
  { name: "succeeded", className: "bg-status-succeeded" },
  { name: "failed", className: "bg-status-failed" },
  { name: "cancelled", className: "bg-status-cancelled" },
  { name: "pending", className: "bg-status-pending" },
  { name: "accepted", className: "bg-status-accepted" },
  { name: "rejected", className: "bg-status-rejected" },
  { name: "current", className: "bg-status-current" },
  { name: "former", className: "bg-status-former" },
  { name: "unknown", className: "bg-status-unknown" },
  { name: "contested", className: "bg-status-contested" },
  { name: "retracted", className: "bg-status-retracted" },
  { name: "disproved", className: "bg-status-disproved" },
] as const;

const KIND_SWATCHES = [
  { name: "person", className: "bg-kind-person" },
  { name: "org", className: "bg-kind-org" },
  { name: "infra", className: "bg-kind-infra" },
  { name: "email", className: "bg-kind-email" },
  { name: "handle", className: "bg-kind-handle" },
  { name: "phone", className: "bg-kind-phone" },
  { name: "crypto", className: "bg-kind-crypto" },
  { name: "pgp", className: "bg-kind-pgp" },
  { name: "url", className: "bg-kind-url" },
  { name: "domain", className: "bg-kind-domain" },
  { name: "ip", className: "bg-kind-ip" },
  { name: "credential", className: "bg-kind-credential" },
  { name: "file", className: "bg-kind-file" },
  { name: "url_archive", className: "bg-kind-url_archive" },
  { name: "attestation", className: "bg-kind-attestation" },
  { name: "observation", className: "bg-kind-observation" },
  { name: "assessment", className: "bg-kind-assessment" },
  { name: "allegation", className: "bg-kind-allegation" },
  { name: "other", className: "bg-kind-other" },
] as const;

const SEMANTIC_SWATCHES = [
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "destructive", className: "bg-destructive" },
  { name: "signal", className: "bg-signal" },
  { name: "muted", className: "bg-muted" },
  { name: "primary", className: "bg-primary" },
] as const;

const TYPE_ROLES = [
  { name: "text-heading-page", className: "text-heading-page" },
  { name: "text-heading-dossier", className: "text-heading-dossier" },
  { name: "text-heading-section", className: "text-heading-section" },
  { name: "text-label", className: "text-label" },
  { name: "text-label-sm", className: "text-label-sm" },
  { name: "text-label-meta", className: "text-label-meta" },
  { name: "text-label-mono", className: "text-label-mono" },
  { name: "text-label-mono-sm", className: "text-label-mono-sm" },
  { name: "text-copy", className: "text-copy" },
  { name: "text-copy-sm", className: "text-copy-sm" },
  { name: "text-meta", className: "text-meta" },
  { name: "text-chip", className: "text-chip" },
] as const;

export function FoundationsSection() {
  return (
    <GuideSection
      id="foundations"
      title="Foundations"
      blurb="Semantic tokens and type roles from styles.css. Prefer these utilities over freestyle palette classes."
    >
      <Specimen label="Semantic">
        {SEMANTIC_SWATCHES.map((s) => (
          <Swatch key={s.name} name={s.name} className={s.className} />
        ))}
      </Specimen>

      <Specimen label="Confidence">
        {CONFIDENCE_SWATCHES.map((s) => (
          <Swatch key={s.name} name={s.name} className={s.className} />
        ))}
      </Specimen>

      <Specimen label="Status">
        {STATUS_SWATCHES.map((s) => (
          <Swatch key={s.name} name={s.name} className={s.className} />
        ))}
      </Specimen>

      <Specimen label="Kind">
        {KIND_SWATCHES.map((s) => (
          <Swatch key={s.name} name={s.name} className={s.className} />
        ))}
      </Specimen>

      <Specimen label="Type roles" className="md:col-span-2">
        <div className="flex w-full flex-col gap-2">
          {TYPE_ROLES.map((role) => (
            <div
              key={role.name}
              className="border-border flex flex-wrap items-baseline gap-3 border-b border-dashed py-1 last:border-b-0"
            >
              <span className="text-label-mono-sm text-muted-foreground w-44 shrink-0">
                {role.name}
              </span>
              <span className={role.className}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </Specimen>
    </GuideSection>
  );
}
