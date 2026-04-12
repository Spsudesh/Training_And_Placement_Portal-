# Template Resume 1 Study

This document captures the actual structure observed in `template_resume_1.docx` and defines how generated student data must be placed.

## Template identity

- Base asset: `template_resume_1.docx`
- Layout style: two-column placement resume
- Page intent: single-page A4-style resume with dense but readable placement-focused formatting
- Visual identity: blue section headings, profile photo on top-left, compact contact rows, left sidebar + right main content

## Structural observations from the template

### Header block

- Profile photo appears first at the top-left.
- Student full name appears at the top-right in large uppercase text.
- Contact row 1 contains:
  - phone
  - email
  - location
- Contact row 2 contains:
  - LinkedIn
  - GitHub
  - optional portfolio or equivalent link if available

### Micro-position notes

- Page is visually treated like a compact two-column first-page resume.
- Photo is anchored into the upper-left column area before any left-column section content.
- Name baseline begins near the top edge of the right content area, not centered vertically against the photo.
- Contact details sit directly below the name in two compact horizontal lines.
- The first visible section start on the left is `Profile`, placed immediately below the contact block.
- The left column reads as a narrow information rail.
- The right column starts higher than the first major content block, making it the dominant reading column for recruiter-facing details.
- Horizontal rules under section headings are part of the structure, not decorative extras.

### Column behavior

- The page is split into two columns.
- Left column is narrower and acts like a profile/sidebar column.
- Right column is wider and carries the main accomplishment-heavy sections.

### Left column section order

1. `Profile`
2. `Education`
3. `Technical Skills`

### Right column section order

1. `Projects`
2. `Experience`
3. `Achievements`
4. `Certifications`

### Section title styling

- Section headings are blue and visually separated with a horizontal rule underneath.
- Content under each section is compact and placement-oriented.

### Section spacing contract

- Every major section must follow this visual order:
  1. section heading
  2. horizontal separator line
  3. small gap
  4. section content
- After the section content ends, keep a modest gap before the next section starts.
- Do not let one section flow directly into the next without the separator line.
- For this template, the separator line is part of the original structure and should appear after each major section heading.
- Spacing should stay compact because this template is dense, but the line + gap pattern must remain visible.

## Required data mapping

### Header

- `student_personal.first_name + middle_name + last_name`
  Purpose: main uppercase resume title
- `student_personal.profile_photo_url`
  Purpose: profile photo block
- `student_personal.personal_email` or `student_personal.college_email`
  Purpose: email line
- `student_personal.mobile`
  Purpose: phone line
- `student_personal.city`, `student_personal.state`
  Purpose: location line
- `student_personal.linkedin_url`
  Purpose: LinkedIn link
- `student_personal.github_url`
  Purpose: GitHub link
- `student_personal.portfolio_url`
  Purpose: optional portfolio link

Placement notes:
- Name must remain the strongest top-right element.
- Photo must not drift into the main right-column text.
- Contact row 1 should prefer phone, email, then location.
- Contact row 2 should prefer LinkedIn, GitHub, then portfolio.

### Profile section

- `student_profile_summary.summary`
  Primary source for profile paragraph
- Fallback:
  - `student_education.department`
  - selected skills
  - selected projects

Rule:
- This should stay as one compact paragraph, not many broken bullets.
- Do not over-trim aggressively unless the page truly overflows.
- This paragraph belongs only in the left column.

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
- Degree entry first
- Diploma second if present
- 12th/HSC next if present
- 10th/SSC last
- This section belongs in the left column under `Profile`.

### Technical Skills section

- `student_skills` grouped by `skill_type`

Expected rendering groups:
- Programming Languages
- Frameworks / Web Technologies
- Tools
- Core Concepts / Other Skills

Rule:
- Keep label + value pairs
- Do not convert into large paragraphs
- This section remains in the left column after education.

### Projects section

- Source table: `student_projects`
- Fields:
  - `title`
  - `description`
  - `tech_stack`
  - `github_link`
  - `live_link`
  - `include_in_resume`

Rule:
- Title first
- Tech stack inline with title when possible
- Links immediately below heading
- Description should become bullet points
- This is one of the most important right-column sections
- Projects should start at the top of the right column whenever available.

### Experience section

- Source table: `student_experience`
- Fields:
  - `type`
  - `company_name`
  - `role`
  - `duration_summary` or `duration`
  - `description`

Rule:
- Heading format should combine role/type with company
- Duration should stay on the next compact metadata line
- Description should be bullet-based
- Experience remains in the right column after projects.

### Achievements section

- Source table: `student_activities`
- Fields:
  - `title`
  - `description`
  - `link`

Rule:
- Title is the achievement headline
- Description becomes 1-3 bullets
- Link can appear inline or as a short support line when relevant
- Achievements remain in the right column after experience.

### Certifications section

- Source table: `student_certifications`
- Fields:
  - `name`
  - `platform`

Rule:
- Compact list format
- Certification name should remain primary
- Platform should remain secondary
- Certifications remain the closing compact section of the right column.

## Implementation constraints

- The generated output should imitate the template structure, not redesign it.
- The left column must remain lighter and more informational.
- The right column must remain the strongest content column.
- Spacing should preserve the template’s dense placement-ready feel without crushing text.
- Section spacing must preserve the pattern: heading -> line -> small gap -> content -> next section gap.
- Section order must not change unless the template itself changes.

## Generator contract for Template 1

- Use the template as a fixed skeleton.
- Replace only student-specific values.
- Keep all section labels from the template.
- Preserve:
  - photo position
  - uppercase name placement
  - compact two-line contact area
  - left/right section distribution
  - blue section-heading hierarchy

## Section-to-table mapping summary

- Header:
  - `student_personal`
  - `student_education`
- Profile:
  - `student_profile_summary`
  - fallback from `student_education`, `student_skills`, `student_projects`
- Education:
  - `student_education`
- Technical Skills:
  - `student_skills`
- Projects:
  - `student_projects`
- Experience:
  - `student_experience`
- Achievements:
  - `student_activities`
- Certifications:
  - `student_certifications`

## Future adjustment checklist

- If the output feels compressed:
  - first tune margins and column widths
  - then tune line-height
  - only then reduce text length
- If content placement feels wrong:
  - check section order before touching styling
  - check column assignment before shortening content
- If template changes:
  - update this study file first
  - then update generator mapping
