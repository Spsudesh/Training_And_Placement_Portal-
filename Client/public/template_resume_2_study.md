# Template Resume 2 Study

This document captures the actual structure observed in `template_resume_2.docx` and defines how generated student data must be placed.

## Template identity

- Base asset: `template_resume_2.docx`
- Layout style: centered single-column resume
- Page intent: single-column classic placement resume with strong top header and section separators
- Visual identity: centered name, photo integrated into header area, emoji-led contact lines, horizontal separators

## Structural observations from the template

### Header block

- Student name is centered at the top in large text.
- Profile photo is placed inside the top header area and visually aligned with the name block.
- The line below the name shows department/headline.
- Contact content is stacked in multiple centered lines instead of a compressed one-line row.

### Contact ordering

Observed structure:

1. Location line
2. Email and phone line
3. LinkedIn line
4. GitHub line

### Micro-position notes

- Photo is visually embedded into the top header zone and offset from the centered name block.
- The name remains the strongest centered item and must not be displaced by the image.
- Contact information is intentionally stacked in multiple centered lines instead of being collapsed into one dense row.
- Each main section is separated by a horizontal line, creating a strict top-to-bottom reading path.
- This template relies more on vertical rhythm than column balancing.

### Main content flow

The template uses one main column with horizontal separators between sections.

Observed section order:

1. `EDUCATION`
2. `EXPERIENCE`
3. `TECHNICAL SKILLS`
4. `PROJECTS`
5. `CERTIFICATES`
6. `EXTRACURRICULAR ACTIVITIES`

### Section spacing contract

- Every section must follow this visual rhythm:
  1. section heading
  2. horizontal separator line
  3. small vertical gap
  4. section content
- After finishing one section, leave a controlled gap before the next heading starts.
- The separator line is mandatory because this template relies on line-separated vertical flow.
- Avoid overcrowding content immediately below the line.
- Avoid adding large empty gaps that break the compact resume rhythm.

## Required data mapping

### Header

- `student_personal.first_name + middle_name + last_name`
  Purpose: centered title
- `student_personal.profile_photo_url`
  Purpose: header photo block
- `student_education.department`
  Purpose: headline under the name
- `student_personal.city`, `student_personal.state`
  Purpose: location line
- `student_personal.personal_email` or `student_personal.college_email`
  Purpose: email line
- `student_personal.mobile`
  Purpose: phone line
- `student_personal.linkedin_url`
  Purpose: dedicated LinkedIn line
- `student_personal.github_url`
  Purpose: dedicated GitHub line

Placement notes:
- Name must stay centered.
- Photo should remain in the header block but not break the centered text hierarchy.
- Contact lines should remain stacked and centered.
- LinkedIn and GitHub should stay on separate support lines if the template structure expects that.

### Education section

- `student_education.department`
- `student_education.passing_year`
- `student_education.current_cgpa`
- `student_education.percentage`
- `student_education.diploma_institute`
- `student_education.diploma_marks`
- `student_education.diploma_year`
- `student_education.twelfth_marks`
- `student_education.twelfth_year`
- `student_education.tenth_marks`
- `student_education.tenth_year`

Rule:
- Keep one academic item per block
- Use institute/title emphasis first, academic facts second
- This section opens the main document flow.

### Experience section

- Source table: `student_experience`
- Fields:
  - `type`
  - `company_name`
  - `role`
  - `duration_summary` or `duration`
  - `description`

Rule:
- Experience heading line should contain role/type + company + duration
- Description follows as compact narrative or short broken lines
- Experience follows directly after education.

### Technical Skills section

- Source table: `student_skills`
- Group by `skill_type`

Expected rendering groups:
- Programming Languages
- Tools & Software Developer Tools
- Web Technologies
- Databases
- Core Concepts
- Soft Skills if available and meaningful

Rule:
- Each group is a labeled line
- Avoid turning skills into bullets unless the template itself changes
- Technical skills remain a classic labeled-list section.

### Projects section

- Source table: `student_projects`
- Fields:
  - `title`
  - `description`
  - `tech_stack`
  - `github_link`
  - `live_link`

Rule:
- Project title first
- Tech stack inline with title if it fits naturally
- Description below as 1-2 compact lines or bullets
- Links after description only if useful
- Projects appear after technical skills in the current template flow.

### Certificates section

- Source table: `student_certifications`
- Fields:
  - `name`
  - `platform`

Rule:
- Group into one compact section
- Can be line-by-line rather than one bullet per certificate if space requires
- Certificates stay as a compact lower-page section.

### Extracurricular Activities section

- Source table: `student_activities`
- Fields:
  - `title`
  - `description`
  - `link`

Rule:
- Activity title first
- Description on next line
- Link on its own line only if meaningful
- This is the final visible section in the current template.

## Implementation constraints

- This template is not two-column.
- Header must remain centered in tone even if the photo is offset inside the block.
- Horizontal separators are part of the visual structure and should be preserved.
- Section spacing must clearly show the pattern: heading -> line -> gap -> content.
- Content should read like a classic resume, not a dashboard card layout.

## Generator contract for Template 2

- Use the template as a fixed skeleton.
- Replace only student-specific values.
- Keep section labels exactly aligned with the template intent.
- Preserve:
  - centered name block
  - stacked contact lines
  - separator-driven vertical flow
  - single-column reading order

## Section-to-table mapping summary

- Header:
  - `student_personal`
  - `student_education`
- Education:
  - `student_education`
- Experience:
  - `student_experience`
- Technical Skills:
  - `student_skills`
- Projects:
  - `student_projects`
- Certificates:
  - `student_certifications`
- Extracurricular Activities:
  - `student_activities`

## Future adjustment checklist

- If placement feels wrong:
  - fix header alignment first
  - then fix section order
  - then tune paragraph spacing
- If content overflows:
  - reduce spacing before reducing meaning
  - shorten repeated wording before shortening core details
- If template changes:
  - update this study file first
  - then update generator mapping
