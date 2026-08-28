"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Invite as Renderer } from "@/components/invite/Invite";
import { Area, Section, Select, Text, Toggle } from "./Fields";
import { WheelDate } from "./WheelDate";
import { messages, LOCALE_NAMES } from "@/lib/i18n";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { THEME_LIST } from "@/lib/themes";
import { EVENT_PRESETS, PRESET_KEYS, eventName } from "@/lib/presets";
import { versesFor } from "@/lib/verses";
import { utcIsoToWallTime, wallTimeToUtcIso } from "@/lib/datetime";
import { isSlugAvailableShape } from "@/lib/slug";
import { isFamilyNameLinked, setPartnerName } from "@/lib/linked";
import { isSeedValue, isUntouchedExample } from "@/lib/seed";
import { LOCALES, OPENER_IDS, TRADITIONS } from "@/lib/types";
import type { Invite, Locale, OpenerId, SectionKey, ThemeId, Tradition } from "@/lib/types";

const TIMEZONES = [
  "Europe/Berlin", "Europe/Istanbul", "Europe/London", "Europe/Amsterdam",
  "Europe/Paris", "Asia/Kolkata", "Asia/Dubai", "America/New_York", "UTC",
];

const OPENER_LABEL: Record<OpenerId, Record<Locale, string>> = {
  veil: { en: "Veil", de: "Schleier", tr: "Perde" },
  foil: { en: "Scratch foil", de: "Rubbelfolie", tr: "Kazı kazan" },
  envelope: { en: "Envelope", de: "Umschlag", tr: "Zarf" },
  direct: { en: "Straight in", de: "Direkt", tr: "Doğrudan" },
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function Builder({
  initial, siteUrl, uiLocale,
}: {
  initial: Invite;
  siteUrl: string;
  /**
   * The language the builder speaks. Deliberately not `invite.locale`: a
   * German couple may well be writing a Turkish invitation, and the form
   * should not flip language when they choose one for their guests.
   */
  uiLocale: Locale;
}) {
  const [invite, setInvite] = useState<Invite>(initial);
  // Held apart from `invite`: the server owns the address while it follows the
  // names, and echoing its value back into `invite` would retrigger autosave.
  const [slug, setSlug] = useState(initial.slug);
  const [slugLocked, setSlugLocked] = useState(initial.slugLocked);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>("couple");
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const m = messages(uiLocale);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  /** Autosave. There is no Save button, so nothing can be lost by forgetting. */
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      setSaving(true);
      const { id, ownerId, updatedAt, heroImage, inviteCard, slug: _s, ...rest } = invite;
      void id; void ownerId; void updatedAt; void heroImage; void inviteCard; void _s;
      // Only send an address when the owner has taken control of it.
      const body = slugLocked ? { ...rest, slugLocked: true, slug } : { ...rest, slugLocked: false };
      try {
        const res = await fetch(`/api/invite/${invite.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        setSlugError(res.ok ? null : (data?.error ?? "save_failed"));
        const derived = data?.invite?.slug;
        if (res.ok && derived && derived !== slug) setSlug(derived);
      } catch {
        setSlugError("save_failed");
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [invite, slug, slugLocked]);

  const set = useCallback(<K extends keyof Invite>(key: K, value: Invite[K]) => {
    setInvite((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Couple names flow into the family blocks until someone edits them there. */
  const setName = (side: "a" | "b", value: string) =>
    setInvite((p) => setPartnerName(p, side, value));

  const setSection = (key: SectionKey, on: boolean) =>
    setInvite((p) => ({ ...p, sections: { ...p.sections, [key]: on } }));

  /**
   * Reported at publish time rather than as red fields while still typing.
   * Each blocker names the section it lives in, so the strip at the top can
   * open that section instead of leaving the reader to hunt for it.
   */
  const blockers = useMemo(() => {
    const out: { label: string; section: string }[] = [];
    if (!invite.partnerAName.trim() || !invite.partnerBName.trim()) {
      out.push({ label: m.b.sections.couple, section: "couple" });
    }
    if (invite.events.length === 0) {
      out.push({ label: m.b.sections.events, section: "events" });
    }
    if (invite.events.some((e) => !e.venueName.trim())) {
      out.push({ label: m.b.f.venueName, section: "events" });
    }
    return out;
  }, [invite, m]);

  /** Three required checks, so "2 / 3" means the same thing every time. */
  const REQUIRED = 3;
  const doneCount = REQUIRED - blockers.length;
  const coupleDone = Boolean(invite.partnerAName.trim() && invite.partnerBName.trim());
  const eventsDone =
    invite.events.length > 0 && invite.events.every((e) => e.venueName.trim());

  const stillExample = isUntouchedExample(invite);

  /** Matches the ceiling the PATCH route enforces, so the UI never over-adds. */
  const MAX_VERSES = 8;
  /** The couple's own words: everything that is not a library pick. */
  const customVerses = invite.verses.filter((v) => v.libraryKey === null);

  const patchVerse = useCallback(
    (id: string, patch: Partial<Invite["verses"][number]>) =>
      setInvite((p) => ({
        ...p,
        verses: p.verses.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      })),
    [],
  );

  /** Opens the section a blocker belongs to and brings it into view. */
  const jumpTo = useCallback((key: string) => {
    setOpen(key);
    requestAnimationFrame(() => {
      document.getElementById(`sec-${key}`)?.scrollIntoView({
        behavior: "smooth", block: "start",
      });
    });
  }, []);

  /** Empties every field still holding our worked example, in one go. */
  const clearExample = useCallback(() => {
    setInvite((p) => ({
      ...p,
      partnerAName: isSeedValue(p.partnerAName) ? "" : p.partnerAName,
      partnerBName: isSeedValue(p.partnerBName) ? "" : p.partnerBName,
      infoWeather: isSeedValue(p.infoWeather) ? "" : p.infoWeather,
      infoDress: isSeedValue(p.infoDress) ? "" : p.infoDress,
      infoParking: isSeedValue(p.infoParking) ? "" : p.infoParking,
      events: p.events.map((e) => ({
        ...e,
        venueName: isSeedValue(e.venueName) ? "" : e.venueName,
        venueAddress: isSeedValue(e.venueAddress) ? "" : e.venueAddress,
        note: isSeedValue(e.note) ? "" : e.note,
      })),
      families: p.families.map((f) => ({
        ...f,
        personName: isSeedValue(f.personName) ? "" : f.personName,
        parents: isSeedValue(f.parents) ? "" : f.parents,
      })),
    }));
  }, []);

  const url = `${siteUrl}/${slug}`;
  const published = invite.status === "published";

  async function togglePublish() {
    if (!published && blockers.length) return;
    set("status", published ? "draft" : "published");
  }

  const summary = {
    couple: `${invite.partnerAName} & ${invite.partnerBName}`,
    style: m.ui.themes[invite.theme]?.name ?? "",
    events: invite.events.length
      ? String(invite.events.length)
      : m.b.notAdded,
    families: invite.families.length ? String(invite.families.length) : m.b.notAdded,
    verses: invite.verses.length ? String(invite.verses.length) : m.b.notAdded,
    rsvp: invite.sections.rsvp ? "on" : "off",
    info: invite.sections.info ? "on" : "off",
    organizer: invite.organizerName || m.b.notAdded,
  };

  const toggle = (k: string) => setOpen((cur) => (cur === k ? null : k));

  return (
    <div className="builder">
      <div className="b-form">
        <header className="b-topbar">
          <a className="b-back" href="/dashboard">← {m.b.dashboard}</a>
          <span className="b-topbar-right">
            <span className="b-save">{saving ? `${m.b.saving}…` : m.b.saved}</span>
            <LocaleSwitch value={uiLocale} label={m.ui.language} />
          </span>
        </header>

        {/* Orientation: what is left, and where it lives. */}
        <div className="b-progress" aria-live="polite">
          <div className="b-progress-bar" aria-hidden="true">
            <span style={{ width: `${(doneCount / REQUIRED) * 100}%` }} />
          </div>
          {blockers.length === 0 ? (
            <p className="b-progress-text is-ready">✓ {m.b.ready}</p>
          ) : (
            <p className="b-progress-text">
              <span className="b-progress-count">{doneCount}/{REQUIRED} {m.b.done}</span>
              {" · "}
              {m.b.missing}:{" "}
              {blockers.map((b, i) => (
                <span key={`${b.section}-${b.label}`}>
                  {i > 0 && ", "}
                  <button type="button" className="b-jump" onClick={() => jumpTo(b.section)}>
                    {b.label}
                  </button>
                </span>
              ))}
            </p>
          )}
        </div>

        {stillExample && (
          <div className="b-example">
            <p>{m.b.exampleLede}</p>
            <button type="button" className="b-linkbtn" onClick={clearExample}>
              {m.b.clearAll}
            </button>
          </div>
        )}

        <Section id="sec-couple" title={m.b.sections.couple} summary={summary.couple}
                 complete={coupleDone}
                 open={open === "couple"} onToggle={() => toggle("couple")}>
          <Text label={m.b.f.partnerA} value={invite.partnerAName}
                seeded={isSeedValue(invite.partnerAName)} seedLabel={m.b.example}
                onChange={(v) => setName("a", v)} />
          <Text label={m.b.f.partnerB} value={invite.partnerBName}
                seeded={isSeedValue(invite.partnerBName)} seedLabel={m.b.example}
                onChange={(v) => setName("b", v)} />
          <Select label={m.b.f.language} value={invite.locale}
                  onChange={(v) => set("locale", v)}
                  options={LOCALES.map((l) => ({ value: l, label: LOCALE_NAMES[l] }))} />
          <Select label={m.b.f.timezone} value={invite.timezone}
                  onChange={(v) => set("timezone", v)}
                  options={TIMEZONES.map((t) => ({ value: t, label: t.replace("_", " ") }))} />
          <div className="b-address">
            <span className="label">{m.b.f.slug}</span>
            {slugLocked ? (
              <input
                className="input" value={slug} inputMode="url"
                aria-invalid={!isSlugAvailableShape(slug)}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
            ) : (
              <p className="b-address-preview">/{slug}</p>
            )}
            <p className="note">
              {published
                ? m.b.f.addressFrozen
                : slugLocked
                  ? ""
                  : m.b.f.addressFollowsNames}
            </p>
            {!slugLocked && !published && (
              <button type="button" className="b-linkbtn" onClick={() => setSlugLocked(true)}>
                {m.b.f.editAddress}
              </button>
            )}
          </div>
        </Section>

        <Section id="sec-style" title={m.b.sections.style} summary={summary.style}
                 open={open === "style"} onToggle={() => toggle("style")}>
          <span className="label">{m.b.f.theme}</span>
          <div className="theme-grid">
            {THEME_LIST.map((t) => (
              <button key={t.id} type="button"
                      className={`theme-card ${invite.theme === t.id ? "is-on" : ""}`}
                      aria-pressed={invite.theme === t.id}
                      onClick={() => set("theme", t.id as ThemeId)}>
                <span className="theme-swatch" style={{ background: t.palette.bg }}>
                  <span style={{ background: t.palette.accent }} />
                  <span style={{ background: t.palette.rule }} />
                  <span style={{ background: t.palette.ink }} />
                </span>
                <span className="theme-name">{m.ui.themes[t.id].name}</span>
                <span className="theme-blurb">{m.ui.themes[t.id].blurb}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <Select label={m.b.f.opener} value={invite.opener}
                    onChange={(v) => set("opener", v)}
                    options={OPENER_IDS.map((o) => ({
                      value: o, label: OPENER_LABEL[o][uiLocale],
                    }))} />
          </div>
        </Section>

        <Section id="sec-events" title={m.b.sections.events} summary={summary.events}
                 complete={eventsDone}
                 open={open === "events"} onToggle={() => toggle("events")}>
          {invite.events.map((e, i) => (
            <div className="b-item" key={e.id}>
              <Select label={m.b.f.eventName} value={e.presetKey ?? "custom"}
                      onChange={(v) => {
                        const events = [...invite.events];
                        events[i] = v === "custom"
                          ? { ...e, presetKey: null, customName: e.customName ?? "" }
                          : { ...e, presetKey: v, customName: null };
                        set("events", events);
                      }}
                      options={[
                        ...PRESET_KEYS.map((k) => ({ value: k, label: EVENT_PRESETS[k][invite.locale] })),
                        { value: "custom", label: "…" },
                      ]} />
              {e.presetKey === null && (
                <Text label={m.b.f.eventName} value={e.customName ?? ""}
                      onChange={(v) => {
                        const events = [...invite.events];
                        events[i] = { ...e, customName: v };
                        set("events", events);
                      }} />
              )}
              <Text label={m.b.f.venueName} value={e.venueName}
                    seeded={isSeedValue(e.venueName)} seedLabel={m.b.example}
                    onChange={(v) => {
                      const events = [...invite.events];
                      events[i] = { ...e, venueName: v };
                      set("events", events);
                    }} />
              <Text label={m.b.f.venueAddress} value={e.venueAddress}
                    seeded={isSeedValue(e.venueAddress)} seedLabel={m.b.example}
                    onChange={(v) => {
                      const events = [...invite.events];
                      events[i] = { ...e, venueAddress: v };
                      set("events", events);
                    }} />
              <Text label={m.b.f.startsAt} type="datetime-local"
                    value={utcIsoToWallTime(e.startsAt, invite.timezone)}
                    onChange={(v) => {
                      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return;
                      const events = [...invite.events];
                      events[i] = { ...e, startsAt: wallTimeToUtcIso(v, invite.timezone) };
                      set("events", events);
                    }} />
              <Text label={m.b.f.note} value={e.note}
                    seeded={isSeedValue(e.note)} seedLabel={m.b.example}
                    onChange={(v) => {
                      const events = [...invite.events];
                      events[i] = { ...e, note: v };
                      set("events", events);
                    }} />
              <Text label={m.b.f.mapsUrl} value={e.mapsUrl} inputMode="url"
                    onChange={(v) => {
                      const events = [...invite.events];
                      events[i] = { ...e, mapsUrl: v };
                      set("events", events);
                    }} />
              <button type="button" className="b-remove"
                      onClick={() => set("events", invite.events
                .filter((x) => x.id !== e.id)
                .map((x, n) => ({ ...x, sort: n })))}>
                {m.b.f.remove}
              </button>
            </div>
          ))}
          {invite.events.length < 10 && (
            <button type="button" className="b-add" onClick={() => set("events", [
              ...invite.events,
              {
                // Renumbered below, so removing a middle event cannot make two
                // events share a sort value.
                id: uid(), sort: invite.events.length, presetKey: "reception",
                customName: null, venueName: "", venueAddress: "", mapsUrl: "",
                startsAt: invite.events.at(-1)?.startsAt ?? new Date().toISOString(),
                note: "",
              },
            ].map((x, n) => ({ ...x, sort: n })))}>+ {m.b.f.addEvent}</button>
          )}
        </Section>

        <Section id="sec-families" title={m.b.sections.families} summary={summary.families}
                 open={open === "families"} onToggle={() => toggle("families")}>
          <Toggle label={m.b.f.showSection} checked={invite.sections.families}
                  onChange={(v) => setSection("families", v)} />
          {invite.families.map((f, i) => (
            <div className="b-item" key={f.id}>
              <Select label={m.b.f.side} value={f.side}
                      onChange={(v) => {
                        const families = [...invite.families];
                        families[i] = { ...f, side: v };
                        set("families", families);
                      }}
                      options={[
                        { value: "a" as const, label: m.families.groom },
                        { value: "b" as const, label: m.families.bride },
                      ]} />
              <Text label={m.b.f.personName} value={f.personName}
                    seeded={isSeedValue(f.personName)} seedLabel={m.b.example}
                    onChange={(v) => {
                      const families = [...invite.families];
                      families[i] = { ...f, personName: v };
                      set("families", families);
                    }} />
              {isFamilyNameLinked(invite, f.id) && (
                <p className="note" style={{ marginTop: "-.6rem", marginBottom: "1rem" }}>
                  {m.b.f.followsCouple}
                </p>
              )}
              <Area label={m.b.f.parents} value={f.parents} rows={2}
                    seeded={isSeedValue(f.parents)} seedLabel={m.b.example}
                    onChange={(v) => {
                      const families = [...invite.families];
                      families[i] = { ...f, parents: v };
                      set("families", families);
                    }} />
              <Area label={m.b.f.grandparents} value={f.grandparents} rows={2}
                    onChange={(v) => {
                      const families = [...invite.families];
                      families[i] = { ...f, grandparents: v };
                      set("families", families);
                    }} />
              <button type="button" className="b-remove"
                      onClick={() => set("families", invite.families.filter((x) => x.id !== f.id))}>
                {m.b.f.remove}
              </button>
            </div>
          ))}
          {invite.families.length < 6 && (
            <button type="button" className="b-add" onClick={() => set("families", [
              ...invite.families,
              { id: uid(), side: "a", personName: "", parents: "", grandparents: "" },
            ])}>+ {m.b.f.addFamily}</button>
          )}
        </Section>

        <Section id="sec-verses" title={m.b.sections.verses} summary={summary.verses}
                 open={open === "verses"} onToggle={() => toggle("verses")}>
          <Toggle label={m.b.f.showSection} checked={invite.sections.verses}
                  onChange={(v) => setSection("verses", v)} />
          <Select label={m.b.f.tradition} value={invite.tradition}
                  onChange={(t: Tradition) =>
                    // Verses from the other tradition are dropped: keeping them
                    // would render a heading that contradicts its contents.
                    setInvite((p) => {
                      const kept = p.verses.filter((x) =>
                        !x.libraryKey || versesFor(t).some((lv) => lv.key === x.libraryKey),
                      );
                      // Never leave the section empty after a switch: seed the
                      // new tradition's first two so the preview stays whole.
                      const seeded = kept.length
                        ? kept
                        : versesFor(t).slice(0, 2).map((lv, i) => ({
                            id: uid(), sort: i, libraryKey: lv.key,
                            customArabic: null, customText: null, customRef: null,
                          }));
                      return { ...p, tradition: t, verses: seeded };
                    })}
                  options={TRADITIONS.map((t) => ({
                    value: t, label: m.verses.source[t],
                  }))} />
          <span className="label" style={{ marginTop: "1rem", display: "block" }}>
            {m.b.f.libraryVerses}
          </span>
          <div className="verse-list">
            {versesFor(invite.tradition).map((v) => {
              const chosen = invite.verses.some((x) => x.libraryKey === v.key);
              return (
                <button key={v.key} type="button"
                        className={`verse-pick ${chosen ? "is-on" : ""}`}
                        aria-pressed={chosen}
                        onClick={() => set("verses", chosen
                          ? invite.verses.filter((x) => x.libraryKey !== v.key)
                          : [...invite.verses, {
                              id: uid(), sort: invite.verses.length, libraryKey: v.key,
                              customArabic: null, customText: null, customRef: null,
                            }])}>
                  <span className="verse-ref">{v.ref[invite.locale]}</span>
                  <span className="verse-text">{v.text[invite.locale]}</span>
                </button>
              );
            })}
          </div>

          {/* Anything the couple writes themselves. The renderer already
              prefers these over the library entry, so they only need somewhere
              to be typed. Stored per invitation, never translated: they are
              the couple's own words. */}
          <span className="label" style={{ marginTop: "1.5rem", display: "block" }}>
            {m.b.f.customVerses}
          </span>
          {customVerses.map((v) => (
            <div className="b-item" key={v.id}>
              <Area label={m.b.f.verseText} rows={3} value={v.customText ?? ""}
                    onChange={(val) => patchVerse(v.id, { customText: val })} />
              <Text label={m.b.f.verseRef} value={v.customRef ?? ""}
                    onChange={(val) => patchVerse(v.id, { customRef: val })} />
              {invite.tradition === "islamic" && (
                <Area label={m.b.f.verseOriginal} rows={2} value={v.customArabic ?? ""}
                      dir="rtl"
                      onChange={(val) => patchVerse(v.id, { customArabic: val })} />
              )}
              <button type="button" className="b-remove"
                      onClick={() => set("verses", invite.verses.filter((x) => x.id !== v.id))}>
                {m.b.f.remove}
              </button>
            </div>
          ))}
          {invite.verses.length < MAX_VERSES && (
            <button type="button" className="b-add" onClick={() => set("verses", [
              ...invite.verses,
              {
                id: uid(), sort: invite.verses.length, libraryKey: null,
                customArabic: null, customText: "", customRef: null,
              },
            ])}>+ {m.b.f.addVerse}</button>
          )}
        </Section>

        <Section id="sec-rsvp" title={m.b.sections.rsvp} summary={summary.rsvp}
                 open={open === "rsvp"} onToggle={() => toggle("rsvp")}>
          <Toggle label={m.b.f.showSection} checked={invite.sections.rsvp}
                  onChange={(v) => setSection("rsvp", v)} />
          <WheelDate label={m.b.f.rsvpDeadline} value={invite.rsvpDeadline}
                     locale={uiLocale}
                     onChange={(v) => set("rsvpDeadline", v)}
                     t={{
                       done: m.ui.done, cancel: m.ui.cancel, clear: m.ui.clear,
                       noDate: m.ui.noDate, pickDate: m.ui.pickDate,
                     }} />
        </Section>

        <Section id="sec-organizer" title={m.b.sections.organizer}
                 summary={summary.organizer}
                 open={open === "organizer"} onToggle={() => toggle("organizer")}>
          <Text label={m.b.f.organizerName} value={invite.organizerName}
                seeded={isSeedValue(invite.organizerName)} seedLabel={m.b.example}
                onChange={(v) => set("organizerName", v)} />
          <Text label={m.b.f.organizerUrl} value={invite.organizerUrl} inputMode="url"
                onChange={(v) => set("organizerUrl", v)} />
          <Text label={m.b.f.organizerPhone} value={invite.organizerPhone} inputMode="tel"
                onChange={(v) => set("organizerPhone", v)} />
        </Section>

        <Section id="sec-info" title={m.b.sections.info} summary={summary.info}
                 open={open === "info"} onToggle={() => toggle("info")}>
          <Toggle label={m.b.f.showSection} checked={invite.sections.info}
                  onChange={(v) => setSection("info", v)} />
          <Area label={m.b.f.weather} value={invite.infoWeather}
                seeded={isSeedValue(invite.infoWeather)} seedLabel={m.b.example}
                onChange={(v) => set("infoWeather", v)} />
          <Area label={m.b.f.dress} value={invite.infoDress}
                seeded={isSeedValue(invite.infoDress)} seedLabel={m.b.example}
                onChange={(v) => set("infoDress", v)} />
          <Area label={m.b.f.parking} value={invite.infoParking}
                seeded={isSeedValue(invite.infoParking)} seedLabel={m.b.example}
                onChange={(v) => set("infoParking", v)} />
        </Section>

        <div className="b-publish">
          {blockers.length > 0 && !published && (
            <p className="b-missing">
              {m.b.missing}: {blockers.map((b) => b.label).join(", ")}
            </p>
          )}
          {slugError && <p className="b-missing">{slugError}</p>}
          <button className="btn b-publish-btn" onClick={togglePublish}
                  disabled={!published && blockers.length > 0}>
            {published ? m.b.unpublish : m.b.publish}
          </button>
          {published && (
            <div className="b-share">
              <code>{url}</code>
              <button type="button" onClick={() => {
                navigator.clipboard?.writeText(url).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }).catch(() => {});
              }}>{copied ? m.b.copied : m.b.copyLink}</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${invite.partnerAName} & ${invite.partnerBName} — ${url}`)}`}
                 target="_blank" rel="noopener noreferrer">{m.b.shareWhatsapp}</a>
            </div>
          )}
        </div>
      </div>

      <aside className={`b-preview ${showPreview ? "is-open" : ""}`}>
        <div className="phone">
          <Renderer invite={invite} live={false} scoped />
        </div>
      </aside>

      <button className="b-preview-toggle btn" onClick={() => setShowPreview((v) => !v)}>
        {showPreview ? m.b.closePreview : m.b.preview}
      </button>
    </div>
  );
}
