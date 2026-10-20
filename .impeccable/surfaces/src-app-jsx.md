---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# Surface brief: Secure Clinic web app (landing + role screens)

## Scope and mode
- Landing (`/`): Persuade. Login/register: Persuade-adjacent forms in the same world.
- Patient, doctor, admin screens: Operate, inheriting the world with restraint.

## Audience, job, action
- Course instructor and classmates watching a live demo; the in-product roles are patient, doctor, admin.
- Primary action: book a visit with a real doctor in a real open slot, from the first viewport.
- Proof: the security controls that exist in this codebase, pinned to the fields they protect.
- Constraints: CSP self-only scripts and fonts (self-hosted fonts only), token in memory, no invented claims.

## Direction contract
THESIS: The site is the clinic's security stationery. Every screen is a sheet of prescription safety paper; booking is filling and tearing off a slip. Refuses the category default of a white hero with a stock doctor photo, teal button, and a row of feature cards.

OWN-WORLD: Pale mint safety paper ground with a faint fine-line guilloche/pantograph field; carbon-blue ink for all text and rules; microprinted "SECURE CLINIC" running along border rules; perforated tear edges (dotted rule with punched semicircles); serial numbers in tabular figures; rubber-stamp statuses in stamp red, distinguished also by stamp form (solid box, double ring, struck-through outline). Ruled form lines instead of boxed inputs.

STORY: A visitor sees a live booking slip and real doctors with open times, understands that booking is quick, sees why it is safe through annotations pinned to fields, and books or signs in.

FIRST VIEWPORT: Left ~40%: letterhead (clinic mark, name, serial) and a one-line hook "Book a doctor. Your records stay sealed." with sign-in links. Right ~60%: the pad itself, a large booking slip at real-form scale with doctor picker, day strip, slot grid and reason line, the "Book this visit" action at the slip foot above its perforation. Two leader-line annotations pinned to slip fields.

FORM: Prescription safety pad, position 7 on the grounded list. seed:018139044ebec8a9. Signature interaction: on booking, the slip tears along its perforation and drops into the stub list with its serial. Motion: one tear, stamps landing with a single press, nothing else animated. Raise (from tensegrity column): security notes ride leader lines pinned to the exact field they protect. Raise (from emission-line rail): status is carried by stamp form, not hue alone. Raise (from oscilloscope bench): every element registers to the pad's ruled baseline grid.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- No real clinic address or hours exist; do not invent them.
