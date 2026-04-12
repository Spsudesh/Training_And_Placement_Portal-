# Resume Template File Mapping

This folder keeps each resume template in a matched Word and PDF pair using the same base name.

## Template pairs

- `template_resume_1.docx`
- `template_resume_1.pdf`
- `template_resume_1_study.md`
- `template_resume_2.docx`
- `template_resume_2.pdf`
- `template_resume_2_study.md`

## Usage rules

- Use the `*.pdf` file for first-page template preview and full-template viewing in the UI.
- Use the matching `*.docx` file as the structural reference when tuning generated resume layout, spacing, symbols, profile photo placement, and section order.
- Use the matching `*_study.md` file as the implementation contract for exact section placement, field mapping, and replacement rules during resume generation work.
- Always keep the same base name for the PDF and Word version of one template so the pair stays easy to identify.

## Current template intent

- `template_resume_1`: two-column professional layout with photo, compact contact row, profile summary, blue section headers, and dense placement-ready formatting.
- `template_resume_2`: centered single-column layout with image block, emoji-led contact lines, horizontal separators, and classic resume section flow.

## Implementation workflow

1. Study the original `*.docx` structure first.
2. Update the related `*_study.md` file with exact placement observations and data mapping.
3. Only then change the generator code so the output remains a content-replacement version of the template, not a redesign.

## Spacing rule

- While updating a template, always document section spacing in the related `*_study.md`.
- Section spacing should explicitly define whether the template expects:
  - heading
  - separator line
  - small gap
  - content
- If a separator line appears in the source template, it must be treated as structural, not optional styling.
