---
name: Secure Clinic
description: Clinic appointment system printed on prescription safety paper.
colors:
  safety-mint: "#e2ede6"
  sheet-mint: "#eef5f0"
  sheet-mint-deep: "#e6efe9"
  carbon-ink: "#1c2a66"
  carbon-ink-deep: "#111b4a"
  carbon-ink-soft: "#3c4a83"
  carbon-ink-faint: "#67749b"
  form-rule: "#a3b8ad"
  form-rule-strong: "#5d7c6e"
  stamp-red: "#b02a1d"
  void-grey: "#646a77"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 4.4vw, 4.4rem)"
    fontWeight: 720
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 108"
  headline:
    fontFamily: "Archivo Variable, Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 2.4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 104"
  title:
    fontFamily: "Archivo Variable, Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.1
  letterhead:
    fontFamily: "Archivo Variable, Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 125"
  body:
    fontFamily: "Archivo Variable, Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum'"
  label:
    fontFamily: "Archivo Variable, Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 650
    letterSpacing: "0.09em"
    fontVariation: "'wdth' 82"
rounded:
  sheet: "2px"
  stamp: "3px"
  seal: "999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
  s9: "96px"
  row: "40px"
components:
  button-primary:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.sheet-mint}"
    rounded: "{rounded.sheet}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.carbon-ink-deep}"
    textColor: "{colors.sheet-mint}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.sheet}"
    padding: "10px 20px"
  button-stamp:
    backgroundColor: "transparent"
    textColor: "{colors.stamp-red}"
    rounded: "{rounded.sheet}"
    padding: "10px 20px"
  field-ruled:
    backgroundColor: "transparent"
    textColor: "{colors.carbon-ink}"
    height: "{spacing.row}"
  sheet:
    backgroundColor: "{colors.sheet-mint}"
    rounded: "{rounded.sheet}"
  chip-slot-selected:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.sheet-mint}"
    rounded: "{rounded.sheet}"
---

# Design System: Secure Clinic

## Overview

**Creative North Star: "The Prescription Safety Pad"**

Every screen is a sheet of the clinic's own security stationery. The ground is pale mint safety paper with a faint guilloche field. All text is carbon-blue ink. Forms are ruled lines rather than boxes, and sheets carry a microprinted border rule. Booking means filling a slip and tearing off its stub along a perforation. Statuses land as rubber stamps.

The security of the product is shown the way security paper shows it: in the material. Guilloche, microprint, serials and seals are the decoration, and each one also says "this document is controlled". Explanations of the real security controls ride on thin red leader lines pinned to the exact field they protect.

Density follows the screen's job. The public landing page is generous and lets the booking slip lead. The role screens (visits, appointment book, accounts, audit log) are ruled ledgers: tight rows, tabular figures, one ink colour.

**Key Characteristics:**
- Mint safety paper with a guilloche field, never white cards on grey.
- One ink (carbon blue) for all text and rules; stamp red is reserved for stamps, security notes and errors.
- Ruled form lines, perforations, microprint and serial numbers as the structural vocabulary.
- Self-hosted Archivo with its width axis doing the hierarchy: expanded for letterhead, condensed for printed labels.

## Colors

One ink on tinted paper, plus a stamp colour that only ever appears as something pressed onto the page.

### Primary
- **Carbon Ink** (carbon-ink): every heading, body line, rule and primary button. Deep and soft variants (carbon-ink-deep, carbon-ink-soft) handle hover and secondary text; carbon-ink-faint is for placeholders and large type only.

### Secondary
- **Stamp Red** (stamp-red): rubber stamps, leader-line security notes, the slip's serial, destructive actions and errors. It is never a fill for large areas.

### Neutral
- **Safety Mint** (safety-mint): the page ground, under a guilloche tile at low strength.
- **Sheet Mint** (sheet-mint, sheet-mint-deep): sheets, slips and ledgers lifted off the ground.
- **Form Rule** (form-rule, form-rule-strong): ruled lines, dividers, input baselines and chip borders.
- **Void Grey** (void-grey): cancelled and void stamps only.

### Named Rules
**The One Ink Rule.** Text and rules are carbon blue. Success messages are ink too; the only second hue on a page is stamp red (stamps, pinned notes, errors) or void grey (cancelled).

**The Stamp Is Pressed, Not Painted Rule.** Stamp red appears as outlines, small type and hairlines; never as a large filled block.

## Typography

**Display Font:** Archivo Variable (with Segoe UI, system-ui)
**Body Font:** Archivo Variable
**Label Font:** Archivo Variable at condensed width

**Character:** One grotesk family that behaves like a print shop's type case: expanded wide caps for the letterhead and slip title, tight condensed caps for printed field captions, a confident medium-width display for headlines.

### Hierarchy
- **Display** (720, clamp(2.4rem, 4.4vw, 4.4rem), 1.02): the landing hook only.
- **Headline** (700, clamp(1.6rem, 2.4vw, 2.25rem), 1.1): page and section titles.
- **Title** (700, 1.2rem, 1.1): sheet headings and group headings.
- **Letterhead** (800, 17px, 0.16em, expanded 125%, uppercase): the brand name and the "Appointment slip" title.
- **Body** (400, 16px, 1.5, tabular figures): prose and data; ledes run 46 to 62ch.
- **Label** (650, 12px, 0.09em, condensed 82%, uppercase): field captions and ledger headers, like the printed captions on a paper form.

### Named Rules
**The Width Axis Rule.** Hierarchy comes from width and weight in one family, not from a second typeface. Expanded means "issued by the clinic"; condensed means "printed caption".

**The Tabular Figures Rule.** Times, dates, serials, fees and counts always use tabular figures.

## Layout

A centred column (max 1240px) with a fluid side gutter (clamp(16px, 4vw, 48px)). Spacing runs on a 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96), and form rows sit on a 40px ruled baseline.

The landing page splits 5:7 between the hook and the booking slip above 1000px, and stacks below it. App screens are a page head (title, lede, primary action on the right) over ledgers or sheets. A secondary column of 300px sits beside forms on profile, record and hours screens and drops below them under 900px. Ledgers scroll sideways inside their sheet. The landing role matrix turns into one block per action under 600px.

Leader-line notes sit outside the sheet above 1180px (on the free side), and fall inline under their field, behind a dashed red rule, below that width.

## Elevation & Depth

Paper on a desk: sheets lift slightly off the ground with a soft, offset shadow. Nothing else floats.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 0 rgba(28,42,102,0.05), 0 18px 40px -24px rgba(17,27,74,0.45)`): every sheet, slip and ledger.
- **Torn stub** (`box-shadow: 0 16px 30px -18px rgba(17,27,74,0.5)`): the stub after it tears away from the slip.

### Named Rules
**The Paper Only Rule.** Depth comes from sheets of paper and nothing else: no glass, no glow, no hard offset blocks.

## Shapes

Nearly square corners (2px) on sheets, buttons and chips: cut paper, not pills. Stamps get 3px corners and a slight -2.5° rotation. The round seal (999px) is used only for the "sealed" and "active" stamps and the step numbers on the slip. Perforations are a hairline with punched circular holes in the ground colour, plus half-circle notches at each edge.

## Components

### Buttons
- **Shape:** cut-paper corners (2px), 44px tall (34px small).
- **Primary:** carbon ink fill with sheet-mint text, 10px 20px padding, slightly expanded type (104%).
- **Hover / Focus:** deepens to carbon-ink-deep; presses down 1px on active; 2px ink focus ring offset 3px.
- **Line:** transparent with a 1.5px ink border, for secondary actions.
- **Stamp:** transparent with stamp-red border and text, for cancel and deactivate.

### Inputs / Fields
- **Style:** no box. A 1.5px ruled baseline (form-rule-strong) under 17px text, with a 12px condensed caption above. Textareas show ruled lines every 40px.
- **Focus:** the baseline turns carbon ink and doubles in weight.
- **Error:** the baseline turns stamp red and the message sits under it with a warning icon.

### Chips (day and time pickers)
- **Style:** small cut-paper tiles with a form-rule-strong border on translucent sheet mint.
- **Selected:** filled carbon ink with sheet-mint text. The day strip fades at its right edge to show it scrolls.

### Navigation
- **Letterhead bar:** the clinic seal and expanded brand name on the left, role tabs on the right, a microprint rule underneath.
- **Tabs:** soft ink text with a 2px ink underline when active; they scroll sideways under 960px.

### Stamps (signature)
Rubber-stamp statuses in condensed, tracked capitals. Each status has its own stamp form so colour is never the only signal: scheduled is dashed red, confirmed solid red, completed double-ruled red, no-show dotted red with hatching, cancelled grey with a strike-through, and sealed or active round in ink. A new stamp lands once with a short press (420ms).

### Appointment Slip (signature)
The booking form as stationery: an expanded "Appointment slip" title with the form code and red serial top right; numbered steps (doctor, day, time, reason); then a perforation; then the patient stub, which mirrors the choices live. Booking tears the stub away (640ms, settling 18px lower at 1.4°) and stamps it. This is the system's one authored motion.

### Leader-Line Note (signature)
A security explanation pinned to the field it protects: a red dot on the field edge, a red hairline, then a 13px note with a condensed red heading. It sits outside the sheet when there's room and inline under a dashed red rule when there isn't.

## Do's and Don'ts

### Do:
- **Do** put every surface on a sheet of safety paper (sheet-mint with the guilloche tile) on the safety-mint ground.
- **Do** use ruled baselines (1.5px, form-rule-strong) for inputs instead of boxed fields.
- **Do** show status with a stamp whose form differs per status, not colour alone.
- **Do** pin security explanations to the exact field they protect, and only state controls that exist in the code.
- **Do** self-host fonts and assets; the Content Security Policy allows fonts and scripts from the app's own origin only.

### Don't:
- **Don't** put a small caption or kicker line above a heading; form codes belong beside the serial or in the sheet's small print.
- **Don't** use stamp red as a background fill or for decoration.
- **Don't** add a second typeface; vary Archivo's width and weight instead.
- **Don't** animate anything beyond the stub tear and the stamp press.
- **Don't** use white cards, glass, glow or hard offset shadows.
