"use client";
import { useState } from "react";
import { THEMES, themeVars } from "@/lib/themes";
import { messagesFor, HTML_LANG } from "@/lib/i18n";
import { eventName } from "@/lib/presets";
import { VERSES_BY_KEY, BISMILLAH } from "@/lib/verses";
import { formatEventDate, formatEventTime, formatShortDate } from "@/lib/datetime";
import type { Invite as InviteData } from "@/lib/types";
import { Ornament, Rule } from "./Ornament";
import { Reveal } from "./Reveal";
import { Countdown } from "./Countdown";
import { Opener } from "./Opener";
import { RsvpForm, MusicToggle } from "./Forms";
import { Blossom } from "./Blossom";
import { ScrollChrome, type NavSection } from "./ScrollChrome";

export type InviteProps = {
  invite: InviteData;
  /** False inside the builder and draft previews: forms render but never post. */
  live?: boolean;
  /** Scopes fixed positioning so the renderer can sit inside a phone frame. */
  scoped?: boolean;
  /** Set when the visitor followed their household's own link. */
  household?: { token: string; name: string; seats: number } | null;
};

export function Invite({
  invite, live = true, scoped = false, household = null,
}: InviteProps) {
  const theme = THEMES[invite.theme] ?? THEMES["ivory-gold"];
  const m = messagesFor(invite.locale, invite.addressForm);
  const [opened, setOpened] = useState(invite.opener === "direct");
  /**
   * True only when the gate animation just ran. The photograph was filling the
   * screen a moment ago and the cover shows it at plate size, so without this
   * the two states cut against each other; with it, the plate settles out of
   * the same push-in and the whole thing reads as one movement.
   */
  const [arrived, setArrived] = useState(false);

  const tz = invite.timezone;
  const primary = invite.events[0];
  const names = { a: invite.partnerAName, b: invite.partnerBName };

  /** The supplier's wordmark, set in the invitation's own display face. */
  const mark = invite.sections.brand ? invite.organizerName.trim() : "";

  /* The dot navigation only lists sections that are actually rendered, so a
     guest never taps a dot that goes nowhere. */
  const navSections: NavSection[] = [
    { id: "top", label: m.nav.home },
    ...(invite.sections.verses && invite.verses.length ? [{ id: "verses", label: m.nav.quote }] : []),
    ...(invite.sections.families && invite.families.length ? [{ id: "couple", label: m.nav.couple }] : []),
    ...(invite.sections.events && invite.events.length ? [{ id: "events", label: m.nav.events }] : []),
    ...(invite.sections.rsvp ? [{ id: "rsvp", label: m.nav.rsvp }] : []),
    ...(invite.sections.info ? [{ id: "info", label: m.nav.info }] : []),
  ];

  return (
    <div
      className={`invite surface-${theme.surface} ${scoped ? "preview-scope" : ""}`}
      lang={HTML_LANG[invite.locale]}
      data-chrome={theme.chrome ?? "framed"}
      style={themeVars(theme) as React.CSSProperties}
    >
      <div className="invite-body">
      {!opened ? (
        <Opener
          opener={invite.opener}
          theme={theme}
          names={names}
          dateLabel={primary ? formatEventDate(primary.startsAt, invite.locale, tz) : undefined}
          heroImage={invite.heroImage}
          film={invite.openerFilm ?? null}
          filmPoster={invite.openerFilmPoster ?? null}
          filmMobile={invite.openerFilmMobile ?? null}
          filmMobilePoster={invite.openerFilmMobilePoster ?? null}
          mark={mark}
          m={m}
          onOpen={() => {
            if (invite.opener === "tor") setArrived(true);
            setOpened(true);
          }}
        />
      ) : (
        <>
          <header className={`cover ${arrived ? "cover-arrive" : ""}`} id="top">
            <div>
              {/* Set in type rather than as an uploaded logo: a wordmark in the
                  invitation's own display face belongs to the page, where a
                  pasted bitmap always looks stuck on. */}
              {mark && <p className="studio-mark">{mark}</p>}

              {/* A mounted plate rather than a full-bleed backdrop: the couple
                  can upload any photograph and the names stay legible, and a
                  print in a mat is what a studio actually hands over. */}
              {invite.heroImage && (
                <figure className="plate">
                  <img src={invite.heroImage} alt={`${names.a} & ${names.b}`} />
                </figure>
              )}

              <p className="eyebrow">{m.hero.theWeddingOf}</p>
              <h1 className="cover-names display gilt">
                {names.a}<span className="cover-amp">&amp;</span>{names.b}
              </h1>
              <Rule id={theme.ornament} />
              {primary && (
                <>
                  <p className="cover-date">
                    {formatEventDate(primary.startsAt, invite.locale, tz)}
                  </p>
                  <p className="eyebrow cover-place">{primary.venueAddress}</p>
                  <div className="cover-cd">
                    <p className="eyebrow cover-cd-label">{m.hero.seeYouIn}</p>
                    <Countdown targetIso={primary.startsAt} m={m} />
                  </div>
                </>
              )}
            </div>
          </header>

          {invite.sections.verses && invite.verses.length > 0 && (
            <section className="section" id="verses">
              <div className="wrap center">
                <Reveal>
                  {invite.tradition === "islamic" && (
                    <p className="arabic bismillah" dir="rtl" lang="ar">
                      {BISMILLAH}
                    </p>
                  )}
                  <p className="eyebrow">{m.verses.sub[invite.tradition]}</p>
                  <h2 className="section-title">{m.verses.heading[invite.tradition]}</h2>
                  <Rule id={theme.ornament} />
                  <div className="stack">
                    {invite.verses.map((v) => {
                      const lib = v.libraryKey ? VERSES_BY_KEY.get(v.libraryKey) : undefined;
                      const original = v.customArabic ?? lib?.original ?? "";
                      const text = v.customText ?? lib?.text[invite.locale] ?? "";
                      const ref = v.customRef ?? lib?.ref[invite.locale] ?? "";
                      const rtl = invite.tradition === "islamic";
                      return (
                        <blockquote className="card quote" key={v.id}>
                          {original && (
                            <p className="arabic" dir={rtl ? "rtl" : "ltr"} lang={rtl ? "ar" : undefined}>
                              {original}
                            </p>
                          )}
                          {text && <p className="quote-line">{text}</p>}
                          {ref && <p className="eyebrow quote-src">{ref}</p>}
                        </blockquote>
                      );
                    })}
                  </div>
                </Reveal>
              </div>
            </section>
          )}

          {invite.sections.families && invite.families.length > 0 && (
            <section className="section" id="couple">
              <div className="wrap center">
                <Reveal>
                  <h2 className="section-title">{m.families.heading}</h2>
                  <Rule id={theme.ornament} />
                  <div className="grid-2">
                    {invite.families.map((f) => (
                      <div className="card center" key={f.id}>
                        <p className="eyebrow">{f.side === "a" ? m.families.groom : m.families.bride}</p>
                        <p className="display family-name">{f.personName}</p>
                        {f.parents && <p className="family-parents">{f.parents}</p>}
                        {f.grandparents && <p className="note family-grand">{f.grandparents}</p>}
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            </section>
          )}

          {invite.sections.events && invite.events.length > 0 && (
            <section className="section" id="events">
              <div className="wrap center">
                <Reveal>
                  <p className="eyebrow">{m.events.sub}</p>
                  <h2 className="section-title">{m.events.heading}</h2>
                  <Rule id={theme.ornament} />
                  <div className="stack">
                    {invite.events.map((e) => (
                      <article className="card center" key={e.id}>
                        <p className="display event-name">
                          {eventName(e.presetKey, e.customName, invite.locale)}
                        </p>
                        <p className="event-venue">{e.venueName}</p>
                        <p className="note event-place">{e.venueAddress}</p>
                        <Rule id={theme.ornament} size={16} />
                        <p className="event-when">{formatEventDate(e.startsAt, invite.locale, tz)}</p>
                        <p className="event-when">
                          {formatEventTime(e.startsAt, invite.locale, tz)}{e.note ? ` — ${e.note}` : ""}
                        </p>
                        {e.mapsUrl && (
                          <p className="event-link">
                            <a className="btn btn-ghost" href={e.mapsUrl} target="_blank" rel="noopener noreferrer">
                              {m.events.viewLocation}
                            </a>
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </Reveal>
              </div>
            </section>
          )}

          {/* One photograph at full width, with nothing set over it but the
              studio's mark. It sits here because this is where a guest has
              finished reading and is deciding whether to come. */}
          {invite.inviteCard && (
            <figure className="band">
              <img src={invite.inviteCard} alt="" />
              {mark && <figcaption className="band-mark">{mark}</figcaption>}
            </figure>
          )}

          {invite.sections.rsvp && (
            <section className="section" id="rsvp">
              <div className="wrap">
                <Reveal className="center">
                  <h2 className="section-title">{m.rsvp.heading}</h2>
                  <Rule id={theme.ornament} />
                  <div className="rsvp-body">
                    <RsvpForm
                      inviteId={invite.id}
                      m={m}
                      live={live}
                      deadlineLabel={
                        invite.rsvpDeadline
                          ? formatShortDate(`${invite.rsvpDeadline}T12:00:00.000Z`, invite.locale, tz)
                          : null
                      }
                      household={household}
                    />
                  </div>
                </Reveal>
              </div>
            </section>
          )}

          {invite.sections.info && (
            <section className="section" id="info">
              <div className="wrap center">
                <Reveal>
                  <h2 className="section-title">{m.info.heading}</h2>
                  <Rule id={theme.ornament} />
                  <div className="stack">
                    {([
                      [m.info.weather, invite.infoWeather],
                      [m.info.dress, invite.infoDress],
                      [m.info.parking, invite.infoParking],
                    ] as const)
                      .filter(([, body]) => Boolean(body))
                      .map(([label, body]) => (
                        <div className="card" key={label}>
                          <p className="eyebrow">{label}</p>
                          <p className="info-body">{body}</p>
                        </div>
                      ))}
                  </div>
                </Reveal>
              </div>
            </section>
          )}

          <footer className="section center">
            <div className="wrap">
              <Ornament id={theme.ornament} size={26} />
              <p className="display foot-names">
                {names.a} &amp; {names.b}
              </p>
              {primary && (
                <p className="eyebrow foot-date">
                  {formatShortDate(primary.startsAt, invite.locale, tz)}
                </p>
              )}
              <p className="note foot-love">{m.footer.withLove[invite.tradition]}</p>

              {/* The venue's line. Every guest scrolls to the end, which makes
                  this the most-read square inch of the whole invitation. */}
              {invite.organizerName.trim() && (
                <div className="organizer">
                  <p className="eyebrow">{m.organizer.hostedAt}</p>
                  <p className="organizer-name">
                    {invite.organizerUrl.trim() ? (
                      <a href={invite.organizerUrl} target="_blank" rel="noopener noreferrer">
                        {invite.organizerName}
                      </a>
                    ) : (
                      invite.organizerName
                    )}
                  </p>
                  {invite.organizerPhone.trim() && (
                    <p className="organizer-contact">
                      <a href={`tel:${invite.organizerPhone.replace(/[^+\d]/g, "")}`}>
                        {m.organizer.call} {invite.organizerPhone}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* Paper is still how a German wedding invitation arrives, so
                  this is an action rather than something left to the browser
                  menu. Only on the published page: inside the builder it would
                  print the editor around the preview. */}
              {live && (
                <p className="invite-actions">
                  <button type="button" className="print-btn" onClick={() => window.print()}>
                    {m.actions.print}
                  </button>
                </p>
              )}

              {/* Required on every publicly reachable German page, invitations
                  included. Absent, the couple's link is an Abmahnung risk that
                  lands on whoever's name is at the foot of it. */}
              <p className="legal-links">
                <a href="/impressum">{m.legal.imprint}</a>
                <span aria-hidden="true"> · </span>
                <a href="/datenschutz">{m.legal.privacy}</a>
              </p>
            </div>
          </footer>
        </>
      )}
      </div>
      {/* Outside .invite-body: containment would break fixed positioning. */}
      {opened && invite.sections.music && <MusicToggle m={m} />}
      {/* Mounted before the gate is opened too: the closed gate was the one
          screen with nothing moving on it. */}
      {invite.sections.blossom && <Blossom />}
      {opened && !scoped && navSections.length > 2 && (
        <ScrollChrome sections={navSections} m={m} />
      )}
    </div>
  );
}
