-- Adds du/Sie (sen/siz) as a property of the invitation.
--
-- German and Turkish force the choice in every sentence addressed to a guest.
-- Until now the renderer only spoke informally, which is right for the
-- couple's friends and wrong for an employer or a great-aunt.
--
-- Existing invitations keep the behaviour they were published with: the
-- default is 'informal', which is what every string in the catalogues was.

alter table public.invites
  add column if not exists address_form text not null default 'informal';

alter table public.invites
  drop constraint if exists invites_address_form_check;

alter table public.invites
  add constraint invites_address_form_check
  check (address_form in ('informal', 'formal'));
