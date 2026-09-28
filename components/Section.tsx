import type { ReactNode } from "react";

export function Section({
  id,
  children,
  className = "",
  bordered = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 py-16 md:py-24 ${bordered ? "border-t border-line-soft" : ""} ${className}`}
    >
      <div className="shell">{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  align = "left",
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}
    >
      <p className="eyebrow">
        <span className="h-px w-6 bg-brand-500" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-[clamp(1.55rem,3.6vw,2.35rem)] text-fog-100">{title}</h2>
      {lead ? <p className="mt-4 text-[16.5px] leading-relaxed text-fog-400">{lead}</p> : null}
    </div>
  );
}
