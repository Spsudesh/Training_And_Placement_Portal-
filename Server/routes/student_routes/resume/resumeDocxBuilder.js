const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const BLANK_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAE/wH+N7DbVwAAAABJRU5ErkJggg==',
  'base64'
);

const TEMPLATE_FILE_MAP = {
  resume_01: 'template_resume_1.docx',
  resume_02: 'template_resume_2.docx',
};

// Template generation rule:
// Treat each resume template as a fixed structure and replace student-specific content into
// the same slots. The placement contract for each template is documented in:
// - Client/public/template_resume_1_study.md
// - Client/public/template_resume_2_study.md

function trimText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function joinNonEmpty(values, separator = ' | ') {
  return values.filter(Boolean).join(separator);
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function splitDescription(value, maxLines = 2) {
  const source = String(value || '')
    .replace(/\r/g, '\n')
    .replace(/[â€¢Â·â–ªâ—¦]/g, '\n')
    .split('\n')
    .map((line) => trimText(line))
    .filter(Boolean);

  const lines = source.length
    ? source
    : String(value || '')
        .split(/[.]/)
        .map((line) => trimText(line))
        .filter(Boolean)
        .map((line) => `${line}.`);

  return lines
    .map((line) => line.replace(/^[\-\*\u2022\s]+/, ''))
    .filter(Boolean)
    .slice(0, maxLines)
    .map((line) => (/[.!?]$/.test(line) ? line : `${line}.`));
}

function shortenText(value, maxLength) {
  const text = trimText(value);

  if (!text || text.length <= maxLength) {
    return text;
  }

  const shortened = text.slice(0, maxLength - 1);
  const boundary = shortened.lastIndexOf(' ');
  return `${(boundary > 30 ? shortened.slice(0, boundary) : shortened).trim()}.`;
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length === 10) {
    return `+91 ${digits}`;
  }

  return trimText(value);
}

function formatLink(value) {
  const url = trimText(value);

  if (!url) {
    return '';
  }

  return url.replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
}

function buildSummary(profile) {
  const savedSummary = shortenText(profile.summary, 520);
  if (savedSummary) {
    return savedSummary;
  }

  const focusSkills = [
    ...profile.skills.languages,
    ...profile.skills.frameworks,
    ...profile.skills.tools,
    ...profile.skills.otherLanguages,
  ]
    .filter(Boolean)
    .slice(0, 5);

  const projectFocus = profile.projects
    .map((item) => trimText(item.title))
    .filter(Boolean)
    .slice(0, 2);

  return shortenText(
    joinNonEmpty(
      [
        profile.education.department
          ? `${profile.education.department} student focused on placement-ready software development and practical problem solving.`
          : 'Engineering student focused on placement-ready software development and practical problem solving.',
        focusSkills.length ? `Core strengths include ${focusSkills.join(', ')}.` : '',
        projectFocus.length ? `Hands-on work includes ${projectFocus.join(' and ')}.` : '',
      ],
      ' '
    ),
    520
  );
}

function buildTemplateOneEducationEntries(profile) {
  const entries = [];

  if (profile.education.department || profile.education.passingYear || profile.education.currentCgpa || profile.education.percentage) {
    entries.push({
      title: 'Bachelor of Technology',
      subtitle: joinNonEmpty(
        [
          profile.education.department || '',
          profile.education.passingYear ? `${profile.education.passingYear}` : '',
        ],
        ' | '
      ),
      detail: joinNonEmpty(
        [
          profile.education.currentCgpa ? `CGPA: ${profile.education.currentCgpa}` : '',
          profile.education.percentage ? `Percentage: ${profile.education.percentage}%` : '',
        ],
        ' | '
      ),
    });
  }

  if (profile.education.diploma) {
    entries.push({
      title: profile.education.diploma.institute || 'Diploma',
      subtitle: joinNonEmpty(
        [
          profile.education.department || 'Diploma',
          profile.education.diploma.year ? `${profile.education.diploma.year}` : '',
        ],
        ' | '
      ),
      detail: profile.education.diploma.marks ? `Percentage: ${profile.education.diploma.marks}%` : '',
    });
  }

  if (profile.education.twelfth) {
    entries.push({
      title: 'Higher Secondary Education (HSC)',
      subtitle: profile.education.twelfth.year ? `Year: ${profile.education.twelfth.year}` : '',
      detail: profile.education.twelfth.marks ? `Percentage: ${profile.education.twelfth.marks}%` : '',
    });
  }

  if (profile.education.tenth) {
    entries.push({
      title: 'Secondary School Education (SSC)',
      subtitle: profile.education.tenth.year ? `Year: ${profile.education.tenth.year}` : '',
      detail: profile.education.tenth.marks ? `Percentage: ${profile.education.tenth.marks}%` : '',
    });
  }

  return entries;
}

function buildTemplateTwoEducationEntries(profile) {
  const entries = [];

  if (profile.education.department || profile.education.passingYear || profile.education.currentCgpa || profile.education.percentage) {
    entries.push({
      title: 'Bachelor of Technology',
      subtitle: joinNonEmpty(
        [
          profile.education.department || '',
          profile.education.passingYear ? `${profile.education.passingYear}` : '',
        ],
        ' - '
      ),
      detail: joinNonEmpty(
        [
          profile.education.currentCgpa ? `CGPA: ${profile.education.currentCgpa}` : '',
          profile.education.percentage ? `Percentage: ${profile.education.percentage}%` : '',
        ],
        ' | '
      ),
    });
  }

  if (profile.education.diploma) {
    entries.push({
      title: profile.education.diploma.institute || 'Diploma',
      subtitle: joinNonEmpty(
        [
          profile.education.department || 'Diploma',
          profile.education.diploma.year ? `${profile.education.diploma.year}` : '',
        ],
        ' | '
      ),
      detail: profile.education.diploma.marks ? `Percentage: ${profile.education.diploma.marks}%` : '',
    });
  }

  if (profile.education.twelfth) {
    entries.push({
      title: 'Higher Secondary Education (HSC)',
      subtitle: profile.education.twelfth.year ? `Year ${profile.education.twelfth.year}` : '',
      detail: profile.education.twelfth.marks ? `Percentage: ${profile.education.twelfth.marks}%` : '',
    });
  }

  if (profile.education.tenth) {
    entries.push({
      title: 'Secondary School Education (SSC)',
      subtitle: profile.education.tenth.year ? `Year ${profile.education.tenth.year}` : '',
      detail: profile.education.tenth.marks ? `Percentage: ${profile.education.tenth.marks}%` : '',
    });
  }

  return entries;
}

function buildTemplateOneSkillGroups(profile) {
  return [
    profile.skills.languages.length
      ? { label: 'Programming Languages', value: profile.skills.languages.join(', ') }
      : null,
    profile.skills.frameworks.length
      ? { label: 'Frameworks / Web Technologies', value: profile.skills.frameworks.join(', ') }
      : null,
    profile.skills.tools.length
      ? { label: 'Tools', value: profile.skills.tools.join(', ') }
      : null,
    profile.skills.otherLanguages.length
      ? { label: 'Core Concepts / Other Skills', value: profile.skills.otherLanguages.join(', ') }
      : null,
  ].filter(Boolean);
}

function buildTemplateTwoSkillGroups(profile) {
  return [
    profile.skills.languages.length
      ? { label: 'Programming Languages', value: profile.skills.languages.join(', ') }
      : null,
    profile.skills.tools.length
      ? { label: 'Tools & Software Developer Tools', value: profile.skills.tools.join(', ') }
      : null,
    profile.skills.frameworks.length
      ? { label: 'Web Technologies', value: profile.skills.frameworks.join(', ') }
      : null,
    profile.skills.otherLanguages.length
      ? { label: 'Core Concepts / Other Skills', value: profile.skills.otherLanguages.join(', ') }
      : null,
  ].filter(Boolean);
}

function buildTemplateOneModel(profile, selections) {
  return {
    fullName: trimText(profile.personal.fullName || profile.prn).toUpperCase(),
    headline: trimText(profile.headline || profile.education.department || 'Computer Science and Engineering'),
    email: trimText(profile.personal.email || profile.personal.collegeEmail),
    mobile: formatPhone(profile.personal.mobile),
    location: joinNonEmpty([trimText(profile.personal.city), trimText(profile.personal.state)], ', '),
    linkedin: trimText(profile.personal.linkedin),
    github: trimText(profile.personal.github),
    portfolio: trimText(profile.personal.portfolio),
    summary: buildSummary(profile),
    education: buildTemplateOneEducationEntries(profile),
    skillGroups: buildTemplateOneSkillGroups(profile),
    projects: (selections.projects || []).map((item) => ({
      title: trimText(item.title || 'Project'),
      techStack: shortenText(item.techStack, 100),
      bullets: splitDescription(item.description, 3).map((line) => shortenText(line, 220)),
      links: [
        item.githubLink ? `GitHub: ${formatLink(item.githubLink)}` : '',
        item.liveLink ? `Live: ${formatLink(item.liveLink)}` : '',
      ].filter(Boolean),
    })),
    experience: (selections.experience || []).map((item) => ({
      title: trimText(joinNonEmpty([item.role || item.type || 'Experience', item.companyName], ' | ')),
      meta: trimText(item.duration || ''),
      bullets: splitDescription(item.description, 3).map((line) => shortenText(line, 220)),
    })),
    certifications: (selections.certifications || []).map((item) =>
      shortenText(joinNonEmpty([trimText(item.name), trimText(item.platform)], ' | '), 180)
    ),
    activities: (selections.activities || []).map((item) => ({
      title: trimText(item.title),
      bullets: [
        ...splitDescription(item.description, 3).map((line) => shortenText(line, 180)),
        item.link ? shortenText(formatLink(item.link), 120) : '',
      ].filter(Boolean),
    })),
  };
}

function buildTemplateTwoModel(profile, selections) {
  return {
    fullName: trimText(profile.personal.fullName || profile.prn).toUpperCase(),
    headline: trimText(profile.education.department || profile.headline || 'Computer Science and Engineering'),
    email: trimText(profile.personal.email || profile.personal.collegeEmail),
    mobile: formatPhone(profile.personal.mobile),
    location: joinNonEmpty([trimText(profile.personal.city), trimText(profile.personal.state)], ', '),
    linkedin: trimText(profile.personal.linkedin),
    github: trimText(profile.personal.github),
    portfolio: trimText(profile.personal.portfolio),
    education: buildTemplateTwoEducationEntries(profile),
    skillGroups: buildTemplateTwoSkillGroups(profile),
    experience: (selections.experience || []).map((item) => ({
      title: trimText(joinNonEmpty([item.role || item.type || 'Experience', item.companyName], ' | ')),
      meta: trimText(item.duration || ''),
      description: splitDescription(item.description, 2).map((line) => shortenText(line, 240)),
    })),
    projects: (selections.projects || []).map((item) => ({
      title: trimText(item.title || 'Project'),
      techStack: shortenText(item.techStack, 110),
      description: splitDescription(item.description, 2).map((line) => shortenText(line, 240)),
      links: [
        item.githubLink ? `GitHub: ${formatLink(item.githubLink)}` : '',
        item.liveLink ? `Live: ${formatLink(item.liveLink)}` : '',
      ].filter(Boolean),
    })),
    certifications: (selections.certifications || []).map((item) =>
      shortenText(joinNonEmpty([trimText(item.name), trimText(item.platform)], ' | '), 220)
    ),
    activities: (selections.activities || []).map((item) => ({
      title: trimText(item.title),
      description: splitDescription(item.description, 2).map((line) => shortenText(line, 220)),
      link: item.link ? shortenText(formatLink(item.link), 120) : '',
    })),
  };
}

function buildRun(text, options = {}) {
  const value = String(text || '');

  if (!value) {
    return '';
  }

  const preserve = /^[ ]|[ ]$/.test(value);
  const properties = [
    options.bold ? '<w:b/>' : '',
    options.color ? `<w:color w:val="${options.color}"/>` : '',
    options.size ? `<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>` : '',
    options.underline ? '<w:u w:val="single"/>' : '',
  ]
    .filter(Boolean)
    .join('');

  return `<w:r>${properties ? `<w:rPr>${properties}</w:rPr>` : ''}<w:t${
    preserve ? ' xml:space="preserve"' : ''
  }>${escapeXml(value)}</w:t></w:r>`;
}

function buildParagraph(runs, options = {}) {
  const content = Array.isArray(runs) ? runs.join('') : runs;
  const pPr = [
    options.style ? `<w:pStyle w:val="${options.style}"/>` : '',
    options.center ? '<w:jc w:val="center"/>' : '',
    options.keepNext ? '<w:keepNext/>' : '',
  ]
    .filter(Boolean)
    .join('');

  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${content}</w:p>`;
}

function buildSectionHeading(text, style) {
  return buildParagraph(buildRun(text, { bold: true }), { style, keepNext: true });
}

function buildListParagraph(text, style = 'ListParagraph') {
  return buildParagraph(buildRun(`- ${text}`), { style });
}

function buildCenteredParagraphLine(parts, style = 'NormalWeb') {
  const items = Array.isArray(parts) ? parts.filter(Boolean) : [parts].filter(Boolean);
  return items.length ? buildParagraph(items, { style, center: true }) : '';
}

function buildDelimitedRuns(values, formatter) {
  const items = values
    .map((value) => (typeof formatter === 'function' ? formatter(value) : value))
    .filter(Boolean);

  return items.flatMap((item, index) => (index === 0 ? [item] : [buildRun(' | '), item]));
}

function buildTemplateOneXml(model) {
  // Template 1 contract:
  // left column -> Profile, Education, Technical Skills
  // right column -> Projects, Experience, Achievements, Certifications
  const leftColumn = [];
  const rightColumn = [];

  if (model.summary) {
    leftColumn.push(buildSectionHeading('Profile', 'Heading1'));
    leftColumn.push(buildParagraph(buildRun(model.summary, { size: 20 }), { style: 'BodyText' }));
  }

  if (model.education.length) {
    leftColumn.push(buildSectionHeading('Education', 'Heading1'));
    model.education.forEach((item) => {
      leftColumn.push(buildParagraph(buildRun(item.title, { bold: true }), { style: 'Heading2' }));
      if (item.subtitle) {
        leftColumn.push(buildParagraph(buildRun(item.subtitle), { style: 'BodyText' }));
      }
      if (item.detail) {
        leftColumn.push(buildParagraph(buildRun(item.detail), { style: 'BodyText' }));
      }
    });
  }

  if (model.skillGroups.length) {
    leftColumn.push(buildSectionHeading('Technical Skills', 'Heading1'));
    model.skillGroups.forEach((item) => {
      leftColumn.push(
        buildParagraph([buildRun(`${item.label}: `, { bold: true }), buildRun(item.value)], {
          style: 'BodyText',
        })
      );
    });
  }

  if (model.projects.length) {
    rightColumn.push(buildSectionHeading('Projects', 'Heading1'));
    model.projects.forEach((item) => {
      rightColumn.push(
        buildParagraph(
          [
            buildRun(item.title, { bold: true }),
            item.techStack ? buildRun(` | ${item.techStack}`) : '',
          ],
          { style: 'Heading2' }
        )
      );
      item.links.forEach((link) => {
        rightColumn.push(buildParagraph(buildRun(link), { style: 'BodyText' }));
      });
      item.bullets.forEach((line) => {
        rightColumn.push(buildListParagraph(line));
      });
    });
  }

  if (model.experience.length) {
    rightColumn.push(buildSectionHeading('Experience', 'Heading1'));
    model.experience.forEach((item) => {
      rightColumn.push(buildParagraph(buildRun(item.title, { bold: true }), { style: 'Heading2' }));
      if (item.meta) {
        rightColumn.push(buildParagraph(buildRun(item.meta), { style: 'BodyText' }));
      }
      item.bullets.forEach((line) => {
        rightColumn.push(buildListParagraph(line));
      });
    });
  }

  if (model.activities.length) {
    rightColumn.push(buildSectionHeading('Achievements', 'Heading1'));
    model.activities.forEach((item) => {
      rightColumn.push(buildParagraph(buildRun(item.title, { bold: true }), { style: 'Heading2' }));
      item.bullets.forEach((line) => {
        rightColumn.push(buildListParagraph(line));
      });
    });
  }

  if (model.certifications.length) {
    rightColumn.push(buildSectionHeading('Certifications', 'Heading1'));
    model.certifications.forEach((item) => {
      rightColumn.push(buildParagraph(buildRun(item), { style: 'BodyText' }));
    });
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16du="http://schemas.microsoft.com/office/word/2023/wordml/word16du" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16sdtfl="http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du wp14">
  <w:body>
    ${buildParagraph(buildRun(model.fullName, { color: '1F3761' }), { style: 'Title' })}
    ${buildParagraph(buildRun(model.headline, { bold: true }), { style: 'BodyText' })}
    ${buildParagraph(
      buildDelimitedRuns([
        model.mobile,
        model.email
          ? { text: model.email, options: { underline: true, color: '1155CC' } }
          : null,
        model.location,
      ], (item) =>
        item && typeof item === 'object'
          ? buildRun(item.text, item.options)
          : buildRun(item)
      ),
      { style: 'BodyText' }
    )}
    ${buildParagraph(
      [
        model.linkedin ? buildRun(`LinkedIn: ${formatLink(model.linkedin)}`) : '',
        model.github ? buildRun(model.linkedin ? ' | ' : '') + buildRun(`GitHub: ${formatLink(model.github)}`) : '',
        model.portfolio ? buildRun(model.linkedin || model.github ? ' | ' : '') + buildRun(`Portfolio: ${formatLink(model.portfolio)}`) : '',
      ].filter(Boolean),
      { style: 'BodyText' }
    )}
    <w:p>
      <w:pPr>
        <w:sectPr>
          <w:type w:val="continuous"/>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
          <w:cols w:num="2" w:space="360" w:equalWidth="0">
            <w:col w:w="3900" w:space="360"/>
            <w:col w:w="6206"/>
          </w:cols>
        </w:sectPr>
      </w:pPr>
    </w:p>
    ${leftColumn.join('')}
    <w:p><w:r><w:br w:type="column"/></w:r></w:p>
    ${rightColumn.join('')}
    <w:sectPr>
      <w:type w:val="continuous"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:num="2" w:space="360" w:equalWidth="0">
        <w:col w:w="3900" w:space="360"/>
        <w:col w:w="6206"/>
      </w:cols>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildTemplateTwoXml(model) {
  // Template 2 contract:
  // single column vertical flow ->
  // Education, Experience, Technical Skills, Projects, Certificates, Extracurricular Activities
  const sections = [];

  if (model.education.length) {
    sections.push(buildSectionHeading('EDUCATION', 'Heading2'));
    model.education.forEach((item) => {
      sections.push(buildParagraph(buildRun(item.title, { bold: true }), { style: 'NormalWeb' }));
      if (item.subtitle) {
        sections.push(buildParagraph(buildRun(item.subtitle), { style: 'NormalWeb' }));
      }
      if (item.detail) {
        sections.push(buildParagraph(buildRun(item.detail), { style: 'NormalWeb' }));
      }
    });
  }

  if (model.experience.length) {
    sections.push(buildSectionHeading('EXPERIENCE', 'Heading2'));
    model.experience.forEach((item) => {
      sections.push(buildParagraph(buildRun(item.title, { bold: true }), { style: 'NormalWeb' }));
      if (item.meta) {
        sections.push(buildParagraph(buildRun(item.meta), { style: 'NormalWeb' }));
      }
      item.description.forEach((line) => {
        sections.push(buildParagraph(buildRun(line), { style: 'NormalWeb' }));
      });
    });
  }

  if (model.skillGroups.length) {
    sections.push(buildSectionHeading('TECHNICAL SKILLS', 'Heading2'));
    model.skillGroups.forEach((item) => {
      sections.push(
        buildParagraph([buildRun(`${item.label}: `, { bold: true }), buildRun(item.value)], {
          style: 'NormalWeb',
        })
      );
    });
  }

  if (model.projects.length) {
    sections.push(buildSectionHeading('PROJECTS', 'Heading2'));
    model.projects.forEach((item) => {
      sections.push(
        buildParagraph(
          [
            buildRun(item.title, { bold: true }),
            item.techStack ? buildRun(` | ${item.techStack}`) : '',
          ],
          { style: 'NormalWeb' }
        )
      );
      item.description.forEach((line) => {
        sections.push(buildParagraph(buildRun(line), { style: 'NormalWeb' }));
      });
      item.links.forEach((link) => {
        sections.push(buildParagraph(buildRun(link), { style: 'NormalWeb' }));
      });
    });
  }

  if (model.certifications.length) {
    sections.push(buildSectionHeading('CERTIFICATES', 'Heading2'));
    model.certifications.forEach((item) => {
      sections.push(buildParagraph(buildRun(item), { style: 'NormalWeb' }));
    });
  }

  if (model.activities.length) {
    sections.push(buildSectionHeading('EXTRACURRICULAR ACTIVITIES', 'Heading2'));
    model.activities.forEach((item) => {
      sections.push(buildParagraph(buildRun(item.title, { bold: true }), { style: 'NormalWeb' }));
      item.description.forEach((line) => {
        sections.push(buildParagraph(buildRun(line), { style: 'NormalWeb' }));
      });
      if (item.link) {
        sections.push(buildParagraph(buildRun(item.link), { style: 'NormalWeb' }));
      }
    });
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16du="http://schemas.microsoft.com/office/word/2023/wordml/word16du" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16sdtfl="http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="urn:schemas-microsoft-com:office:word" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du wp14">
  <w:body>
    ${buildParagraph(buildRun(model.fullName, { bold: true, size: 44 }), { style: 'Heading3', center: true })}
    ${buildParagraph(buildRun(model.headline), { style: 'NormalWeb', center: true })}
    ${buildCenteredParagraphLine(
      buildDelimitedRuns([
        model.mobile,
        model.email
          ? { text: model.email, options: { underline: true, color: '1155CC' } }
          : null,
        model.location,
      ], (item) =>
        item && typeof item === 'object'
          ? buildRun(item.text, item.options)
          : buildRun(item)
      )
    )}
    ${model.linkedin ? buildCenteredParagraphLine([buildRun(`LinkedIn: ${formatLink(model.linkedin)}`)]) : ''}
    ${model.github ? buildCenteredParagraphLine([buildRun(`GitHub: ${formatLink(model.github)}`)]) : ''}
    ${model.portfolio ? buildCenteredParagraphLine([buildRun(`Portfolio: ${formatLink(model.portfolio)}`)]) : ''}
    ${sections.join('')}
    <w:sectPr>
      <w:type w:val="continuous"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="900" w:right="900" w:bottom="900" w:left="900" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="299"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildTemplateDocumentXml(templateCode, profile, selections) {
  const model = templateCode === 'resume_02'
    ? buildTemplateTwoModel(profile, selections)
    : buildTemplateOneModel(profile, selections);

  return templateCode === 'resume_02' ? buildTemplateTwoXml(model) : buildTemplateOneXml(model);
}

function getTemplateFilePath(templateCode) {
  const fileName = TEMPLATE_FILE_MAP[templateCode] || TEMPLATE_FILE_MAP.resume_01;
  return path.resolve(__dirname, '../../../../Client/public', fileName);
}

function buildDocxResumeBuffer(templateCode, profile, selections) {
  const templatePath = getTemplateFilePath(templateCode);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`DOCX template not found: ${templatePath}`);
  }

  const zip = new AdmZip(templatePath);
  const documentXml = buildTemplateDocumentXml(templateCode, profile, selections);

  zip.updateFile('word/document.xml', Buffer.from(documentXml, 'utf8'));

  if (zip.getEntry('word/media/image1.png')) {
    zip.updateFile('word/media/image1.png', BLANK_PNG_BUFFER);
  }

  return zip.toBuffer();
}

module.exports = {
  buildDocxResumeBuffer,
  prepareResumeModel: buildTemplateOneModel,
};
