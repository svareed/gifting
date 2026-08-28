"use client";

/**
 * Marks a field whose value is still the worked example we put there. Purely
 * informational: a control here would sit inside the field's <label> and take
 * over the input's accessible name. Emptying happens through the one button
 * above the form, or by typing over it.
 */
function SeedMark({ label }: { label: string }) {
  return <span className="b-seed">{label}</span>;
}

export function Text({
  label, value, onChange, type = "text", seeded, seedLabel, ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  seeded?: boolean;
  seedLabel?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <label className="field">
      <span className="label">
        {label}
        {seeded && " "}
        {seeded && <SeedMark label={seedLabel ?? "example"} />}
      </span>
      <input className={`input ${seeded ? "is-seed" : ""}`} type={type} value={value}
             onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}

export function Area({
  label, value, onChange, rows = 3, seeded, seedLabel, ...rest
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
  seeded?: boolean; seedLabel?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>,
         "value" | "onChange" | "rows">) {
  return (
    <label className="field">
      <span className="label">
        {label}
        {seeded && " "}
        {seeded && <SeedMark label={seedLabel ?? "example"} />}
      </span>
      <textarea className={`textarea ${seeded ? "is-seed" : ""}`} rows={rows} value={value}
                onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}

export function Select<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <select className="select" value={value}
              onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked}
             onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Section({
  id, title, summary, children, open, onToggle, complete,
}: {
  id?: string;
  title: string;
  summary: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Undefined for sections that are never required, so they show no state. */
  complete?: boolean;
}) {
  return (
    <section className="b-section" id={id}>
      <button type="button" className="b-head" aria-expanded={open} onClick={onToggle}>
        {/* Always rendered so every header keeps the same four grid columns;
            sections that are never required show an empty, invisible slot. */}
        <span
          className={`b-tick ${complete === undefined ? "is-none" : complete ? "is-on" : ""}`}
          aria-hidden="true"
        >
          {complete ? "\u2713" : ""}
        </span>
        <span className="b-head-title">{title}</span>
        {/* An honest count, rather than a progress bar that overstates things. */}
        <span className="b-head-sum">{summary}</span>
        <span className="b-head-chev" aria-hidden="true">{open ? "\u2013" : "+"}</span>
      </button>
      {open && <div className="b-body">{children}</div>}
    </section>
  );
}
