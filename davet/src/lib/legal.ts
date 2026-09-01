import { OPERATOR } from "./config";
import type { Locale } from "./types";

/**
 * Impressum and Datenschutzerklärung.
 *
 * These live here rather than in the message catalogues because they are not
 * interface chrome: they are documents, they are long, and they change for
 * legal reasons rather than for product ones.
 *
 * The German text is the authoritative one, it is German law that requires
 * these, and the other two are translations offered as a courtesy.
 *
 * Everything the privacy notice claims is checked against what the code
 * actually does: an RSVP stores a name, a yes or no, a headcount and an
 * optional message; the IP address is hashed one way and kept apart from the
 * reply, only to rate-limit abuse; the one cookie stores the chosen interface
 * language. There is no analytics and no tracking anywhere in this codebase.
 * If that stops being true, this file is wrong and must change with it.
 */

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; sections: LegalSection[] };

/** Bump when the substance changes, not when a typo is fixed. */
const UPDATED = "2026-09-01";

const address = `${OPERATOR.name}\n${OPERATOR.street}\n${OPERATOR.city}\n${OPERATOR.country}`;

function imprintDe(): LegalDoc {
  return {
    title: "Impressum",
    updated: UPDATED,
    sections: [
      { heading: "Angaben gemäß § 5 DDG", body: [address] },
      { heading: "Vertreten durch", body: [OPERATOR.represented] },
      {
        heading: "Kontakt",
        body: [`E-Mail: ${OPERATOR.email}`, `Telefon: ${OPERATOR.phone}`],
      },
      { heading: "Umsatzsteuer-Identifikationsnummer", body: [OPERATOR.vatId] },
      {
        heading: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
        body: [address],
      },
      {
        heading: "Streitbeilegung",
        body: [
          "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: https://ec.europa.eu/consumers/odr",
          "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
    ],
  };
}

function privacyDe(): LegalDoc {
  return {
    title: "Datenschutzerklärung",
    updated: UPDATED,
    sections: [
      { heading: "Verantwortlicher", body: [address, `E-Mail: ${OPERATOR.email}`] },
      {
        heading: "Welche Daten wir verarbeiten",
        body: [
          "Wenn du auf einer Einladung zusagst oder absagst, speichern wir deinen Namen, deine Zu- oder Absage, die Anzahl der Personen und – falls du eine schreibst – deine Nachricht an das Paar.",
          "Beim Absenden wird deine IP-Adresse einmalig und nicht umkehrbar zu einer Prüfsumme verarbeitet. Diese Prüfsumme dient ausschließlich dazu, massenhaftes automatisiertes Absenden zu unterbinden. Sie wird getrennt von deiner Antwort abgelegt und ist der Antwort nicht zuzuordnen.",
          "Ein einziges Cookie speichert die von dir gewählte Anzeigesprache. Es ist technisch notwendig und enthält keine Kennung.",
          "Wir setzen keine Analyse-, Tracking- oder Werbedienste ein. Es gibt keine Zählpixel und keine Einbindung sozialer Netzwerke.",
        ],
      },
      {
        heading: "Zweck und Rechtsgrundlage",
        body: [
          "Deine Rückmeldung wird verarbeitet, damit das Paar planen kann. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit ein Vertragsverhältnis besteht, im Übrigen Art. 6 Abs. 1 lit. f DSGVO – das berechtigte Interesse der Gastgeber an einer belastbaren Gästezahl.",
          "Die Missbrauchsabwehr stützt sich auf Art. 6 Abs. 1 lit. f DSGVO, das berechtigte Interesse am sicheren Betrieb des Dienstes.",
        ],
      },
      {
        heading: "Empfänger",
        body: [
          "Deine Rückmeldung sehen ausschließlich das Paar und die Stelle, die die Einladung erstellt hat.",
          `Für Hosting und Datenbank setzen wir Auftragsverarbeiter nach Art. 28 DSGVO ein. Die Daten werden in ${OPERATOR.hostingRegion} verarbeitet. Entsprechende Auftragsverarbeitungsverträge liegen vor und werden auf Anfrage vorgelegt.`,
          "Eine Übermittlung in ein Drittland findet nicht statt.",
        ],
      },
      {
        heading: "Speicherdauer",
        body: [
          "Rückmeldungen werden gelöscht, sobald die Veranstaltung stattgefunden hat und die Einladung von der erstellenden Stelle entfernt wird, spätestens jedoch drei Monate nach dem letzten Termin der Einladung.",
          "Die Prüfsummen zur Missbrauchsabwehr werden nach 24 Stunden gelöscht.",
        ],
      },
      {
        heading: "Deine Rechte",
        body: [
          "Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie das Recht, der Verarbeitung zu widersprechen (Art. 21 DSGVO).",
          `Wende dich dafür formlos an ${OPERATOR.email}. Wir antworten innerhalb eines Monats.`,
          "Außerdem steht dir ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu, in der Regel bei der Behörde deines Wohnsitzlandes.",
        ],
      },
    ],
  };
}

function imprintEn(): LegalDoc {
  return {
    title: "Legal notice",
    updated: UPDATED,
    sections: [
      { heading: "Details under § 5 DDG", body: [address] },
      { heading: "Represented by", body: [OPERATOR.represented] },
      { heading: "Contact", body: [`Email: ${OPERATOR.email}`, `Phone: ${OPERATOR.phone}`] },
      { heading: "VAT identification number", body: [OPERATOR.vatId] },
      { heading: "Responsible for content under § 18 (2) MStV", body: [address] },
      {
        heading: "Dispute resolution",
        body: [
          "The European Commission provides a platform for online dispute resolution: https://ec.europa.eu/consumers/odr",
          "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.",
        ],
      },
    ],
  };
}

function privacyEn(): LegalDoc {
  return {
    title: "Privacy notice",
    updated: UPDATED,
    sections: [
      { heading: "Controller", body: [address, `Email: ${OPERATOR.email}`] },
      {
        heading: "What we process",
        body: [
          "When you accept or decline an invitation we store your name, your answer, the number of people and, if you write one, your message to the couple.",
          "On submission your IP address is processed once into a one-way checksum. It exists solely to stop bulk automated submissions, is stored separately from your reply, and cannot be linked back to it.",
          "A single cookie stores your chosen interface language. It is strictly necessary and contains no identifier.",
          "We use no analytics, tracking or advertising services. There are no counting pixels and no social network embeds.",
        ],
      },
      {
        heading: "Purpose and legal basis",
        body: [
          "Your reply is processed so the couple can plan. The legal basis is Art. 6(1)(b) GDPR where a contract exists, and otherwise Art. 6(1)(f) GDPR, the hosts' legitimate interest in a reliable headcount.",
          "Abuse prevention rests on Art. 6(1)(f) GDPR, the legitimate interest in operating the service safely.",
        ],
      },
      {
        heading: "Recipients",
        body: [
          "Your reply is seen only by the couple and by whoever created the invitation.",
          `We use processors under Art. 28 GDPR for hosting and the database. Data is processed in ${OPERATOR.hostingRegion}. Data-processing agreements are in place and provided on request.`,
          "No transfer to a third country takes place.",
        ],
      },
      {
        heading: "Retention",
        body: [
          "Replies are deleted once the event has taken place and the invitation is removed by whoever created it, and at the latest three months after the invitation's final event.",
          "Abuse-prevention checksums are deleted after 24 hours.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You have the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and the right to object (Art. 21 GDPR).",
          `Write to ${OPERATOR.email}; no particular form is needed. We answer within one month.`,
          "You also have the right to lodge a complaint with a data protection supervisory authority, normally the one where you live.",
        ],
      },
    ],
  };
}

function imprintTr(): LegalDoc {
  return {
    title: "Künye",
    updated: UPDATED,
    sections: [
      { heading: "§ 5 DDG uyarınca bilgiler", body: [address] },
      { heading: "Temsil eden", body: [OPERATOR.represented] },
      { heading: "İletişim", body: [`E-posta: ${OPERATOR.email}`, `Telefon: ${OPERATOR.phone}`] },
      { heading: "KDV kimlik numarası", body: [OPERATOR.vatId] },
      { heading: "§ 18 (2) MStV uyarınca içerikten sorumlu", body: [address] },
      {
        heading: "Uyuşmazlık çözümü",
        body: [
          "Avrupa Komisyonu çevrimiçi uyuşmazlık çözümü platformu sunar: https://ec.europa.eu/consumers/odr",
          "Tüketici hakem heyeti önünde uyuşmazlık çözümü sürecine katılmaya istekli ve yükümlü değiliz.",
        ],
      },
    ],
  };
}

function privacyTr(): LegalDoc {
  return {
    title: "Gizlilik bildirimi",
    updated: UPDATED,
    sections: [
      { heading: "Veri sorumlusu", body: [address, `E-posta: ${OPERATOR.email}`] },
      {
        heading: "Hangi verileri işliyoruz",
        body: [
          "Bir davetiyeyi kabul ettiğinizde veya reddettiğinizde adınızı, yanıtınızı, kişi sayısını ve yazdıysanız çifte mesajınızı saklarız.",
          "Gönderim sırasında IP adresiniz bir kez ve geri döndürülemez biçimde bir sağlama toplamına dönüştürülür. Yalnızca toplu otomatik gönderimi engellemeye yarar, yanıtınızdan ayrı tutulur ve yanıtınızla ilişkilendirilemez.",
          "Tek bir çerez seçtiğiniz arayüz dilini saklar. Teknik olarak zorunludur ve herhangi bir tanımlayıcı içermez.",
          "Hiçbir analiz, izleme veya reklam hizmeti kullanmıyoruz. Sayaç pikseli ve sosyal ağ gömülü içeriği yoktur.",
        ],
      },
      {
        heading: "Amaç ve hukuki dayanak",
        body: [
          "Yanıtınız, çiftin planlama yapabilmesi için işlenir. Sözleşme ilişkisi bulunduğunda hukuki dayanak GDPR m. 6(1)(b), aksi hâlde GDPR m. 6(1)(f), ev sahiplerinin güvenilir bir misafir sayısına ilişkin meşru menfaatidir.",
          "Kötüye kullanımın önlenmesi, hizmetin güvenli işletilmesine ilişkin meşru menfaate, GDPR m. 6(1)(f)'ye dayanır.",
        ],
      },
      {
        heading: "Alıcılar",
        body: [
          "Yanıtınızı yalnızca çift ve davetiyeyi oluşturan taraf görür.",
          `Barındırma ve veritabanı için GDPR m. 28 uyarınca veri işleyenlerden yararlanıyoruz. Veriler ${OPERATOR.hostingRegion} bölgesinde işlenir. Veri işleme sözleşmeleri mevcuttur ve talep üzerine sunulur.`,
          "Üçüncü bir ülkeye aktarım yapılmaz.",
        ],
      },
      {
        heading: "Saklama süresi",
        body: [
          "Yanıtlar, etkinlik gerçekleştikten ve davetiye oluşturan tarafça kaldırıldıktan sonra, en geç davetiyenin son etkinliğinden üç ay sonra silinir.",
          "Kötüye kullanım sağlama toplamları 24 saat sonra silinir.",
        ],
      },
      {
        heading: "Haklarınız",
        body: [
          "Erişim (m. 15), düzeltme (m. 16), silme (m. 17), işlemenin kısıtlanması (m. 18), veri taşınabilirliği (m. 20) ve itiraz (GDPR m. 21) haklarına sahipsiniz.",
          `Bunun için ${OPERATOR.email} adresine yazmanız yeterlidir. Bir ay içinde yanıt veririz.`,
          "Ayrıca bir veri koruma denetim makamına, genellikle ikamet ettiğiniz ülkedekine şikâyette bulunma hakkınız vardır.",
        ],
      },
    ],
  };
}

export function imprint(locale: Locale): LegalDoc {
  return { de: imprintDe, en: imprintEn, tr: imprintTr }[locale]();
}

export function privacy(locale: Locale): LegalDoc {
  return { de: privacyDe, en: privacyEn, tr: privacyTr }[locale]();
}
