import { REMINDER_DAYS } from "./types";
import type { DueReminder } from "./db";
import type { Locale, ReminderKind } from "./types";

/**
 * The text a household actually receives. Deliberately short: it is read on a
 * phone, usually in a WhatsApp list among fifty other chats, and its whole job
 * is to get one tap.
 */
const TEMPLATE: Record<Locale, (v: {
  household: string; couple: string; days: number; link: string; venue: string;
}) => string> = {
  de: (v) =>
    `Liebe ${v.household}, wir freuen uns sehr auf die Hochzeit von ${v.couple}. ` +
    `In ${v.days} Tagen brauchen wir eure Rückmeldung — es dauert keine Minute: ${v.link}` +
    (v.venue ? `\n\n${v.venue}` : ""),
  tr: (v) =>
    `Sayın ${v.household}, ${v.couple} çiftinin düğününü sabırsızlıkla bekliyoruz. ` +
    `${v.days} gün içinde yanıtınıza ihtiyacımız var — bir dakika bile sürmez: ${v.link}` +
    (v.venue ? `\n\n${v.venue}` : ""),
  en: (v) =>
    `Dear ${v.household}, we are looking forward to ${v.couple}'s wedding. ` +
    `We need your reply in ${v.days} days — it takes less than a minute: ${v.link}` +
    (v.venue ? `\n\n${v.venue}` : ""),
};

export function reminderText(due: DueReminder, link: string): string {
  const couple = `${due.invite.partnerAName} & ${due.invite.partnerBName}`.trim();
  return TEMPLATE[due.invite.locale]({
    household: due.guest.household || couple,
    couple,
    days: REMINDER_DAYS[due.kind as ReminderKind],
    link,
    venue: due.org?.name ?? due.invite.organizerName ?? "",
  });
}

/** A click-to-send WhatsApp link, which is how small venues actually send. */
export function whatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
