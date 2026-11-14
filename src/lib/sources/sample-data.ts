import type { RawPosting } from "../jobs/types";

const apply =
  "How to apply: email the address in this posting with the subject line set to the job title.";

export const samplePostings: RawPosting[] = [
  {
    externalId: "entoto-junior-fullstack",
    sourceKey: "sample",
    title: "Junior Full-Stack Developer",
    company: "Entoto Labs",
    location: "Addis Ababa",
    url: "https://example.com/jobs/entoto-junior-fullstack",
    postedAt: "2026-11-10T08:00:00.000Z",
    text: `Junior Full-Stack Developer
Company: Entoto Labs
Location: Addis Ababa
Job type: Full-time
Experience: Junior (0-2 years)
Deadline: 15 December 2026

Entoto Labs builds payments software for Ethiopian merchants. We are hiring a junior developer to work on the customer dashboard.

Requirements:
- TypeScript, React, and Next.js
- Node.js APIs
- PostgreSQL
- Comfort with Git

${apply} careers@entotolabs.example`,
  },
  {
    externalId: "entoto-junior-fullstack-repost",
    sourceKey: "sample",
    title: "Junior Full-Stack Developer",
    company: "Entoto Labs",
    location: "Addis Ababa, Ethiopia",
    url: "https://t.me/example/entoto-junior-fullstack",
    postedAt: "2026-11-08T08:00:00.000Z",
    text: `Junior Full-Stack Developer
Company: Entoto Labs
Location: Addis Ababa
Job type: Full-time
Deadline: 15 December 2026

Repost: React, Next.js, Node.js, PostgreSQL. Junior full-time role.
Email careers@entotolabs.example`,
  },
  {
    externalId: "abay-intern",
    sourceKey: "sample",
    title: "Software Engineering Intern",
    company: "Abay Digital",
    location: "Addis Ababa",
    url: "https://example.com/jobs/abay-intern",
    postedAt: "2026-11-12T09:00:00.000Z",
    text: `Software Engineering Intern
Company: Abay Digital
Location: Addis Ababa
Job type: Internship
Experience: Student or fresh graduate
Deadline: 5 January 2027

A three-month internship for a final-year software engineering student. You will pair with a senior engineer on a React dashboard and a small Node.js service. PostgreSQL is a plus.

How to apply: internships@abaydigital.example`,
  },
  {
    externalId: "rift-remote-react",
    sourceKey: "sample",
    title: "React Developer (Contract)",
    company: "Rift Valley Analytics",
    location: "Remote",
    url: "https://example.com/jobs/rift-remote-react",
    postedAt: "2026-11-11T09:00:00.000Z",
    remoteHint: "remote",
    text: `React Developer (Contract)
Company: Rift Valley Analytics
Location: Remote
Job type: Contract
Experience: Junior
Deadline: 20 December 2026

Six-month contract. Build internal tools in React and TypeScript. Work from home is the default. Python for data pulls is useful.

How to apply: hello@riftvalley.example`,
  },
  {
    externalId: "transit-backend",
    sourceKey: "sample",
    title: "Backend Engineer",
    company: "Addis Transit",
    location: "Addis Ababa",
    url: "https://example.com/jobs/transit-backend",
    postedAt: "2026-11-09T09:00:00.000Z",
    text: `Backend Engineer
Company: Addis Transit
Location: Addis Ababa
Job type: Full-time
Experience: Mid-level, 3-5 years
Deadline: 28 December 2026

Design Node.js services and PostgreSQL schemas for ticketing. TypeScript required. On-site three days a week in Addis Ababa.

How to apply: jobs@addistransit.example`,
  },
  {
    externalId: "selam-java",
    sourceKey: "sample",
    title: "Senior Java Architect",
    company: "Selam Community Bank",
    location: "Addis Ababa",
    url: "https://example.com/jobs/selam-java",
    postedAt: "2026-11-07T09:00:00.000Z",
    text: `Senior Java Architect
Company: Selam Community Bank
Location: Addis Ababa
Job type: Full-time
Experience: Senior, minimum 7 years
Deadline: 10 January 2027

Lead the core banking integration team. Deep Java experience is required, plus banking domain knowledge. This is an on-site role.

How to apply: talent@selambank.example`,
  },
  {
    externalId: "bluenile-accountant",
    sourceKey: "sample",
    title: "Junior Accountant",
    company: "Blue Nile Microfinance",
    location: "Addis Ababa",
    url: "https://example.com/jobs/bluenile-accountant",
    postedAt: "2026-11-11T07:00:00.000Z",
    text: `Junior Accountant
Company: Blue Nile Microfinance
Location: Addis Ababa
Job type: Full-time
Experience: Junior, 1 year
Deadline: 18 December 2026

Prepare monthly statements, reconcile accounts, and support the audit. Excel and accounting fundamentals are required. Microfinance experience is a plus. On-site in Addis Ababa.

How to apply: careers@bluenilemfi.example`,
  },
  {
    externalId: "abeba-amharic-dev",
    sourceKey: "sample",
    title: "የሶፍትዌር ገንቢ",
    company: "Abeba Software",
    location: "አዲስ አበባ",
    url: "https://example.com/jobs/abeba-software",
    postedAt: "2026-11-13T07:00:00.000Z",
    text: `የሶፍትዌር ገንቢ (ጀማሪ)
ድርጅት: Abeba Software
ቦታ: አዲስ አበባ
ዓይነት: ቋሚ
ልምድ: 1 ዓመት
የመጨረሻ ቀን: 20/12/2026

React እና Node.js የሚያውቅ ጀማሪ ፕሮግራመር እንፈልጋለን። PostgreSQL እውቀት ተጨማሪ ጥቅም ነው። ሥራው በአዲስ አበባ ቢሮ ነው።

ያመልክቱ: jobs@abeba-software.example`,
  },
  {
    externalId: "awura-nurse",
    sourceKey: "sample",
    title: "Registered Nurse",
    company: "Awura Health",
    location: "Addis Ababa",
    url: "https://example.com/jobs/awura-nurse",
    postedAt: "2026-11-06T07:00:00.000Z",
    text: `Registered Nurse
Company: Awura Health
Location: Addis Ababa
Job type: Full-time
Experience: 2 years
Deadline: 30 December 2026

Outpatient clinic hiring a nurse for weekday shifts. Public health experience is welcome. This is an on-site clinical role, not a software role.

How to apply: hr@awurahealth.example`,
  },
  {
    externalId: "entoto-expired-web",
    sourceKey: "sample",
    title: "Junior Web Developer",
    company: "Haleta Studio",
    location: "Addis Ababa",
    url: "https://example.com/jobs/haleta-expired",
    postedAt: "2026-10-01T07:00:00.000Z",
    text: `Junior Web Developer
Company: Haleta Studio
Location: Addis Ababa
Job type: Full-time
Experience: Junior
Deadline: 1 November 2026

React and HTML/CSS for marketing sites. The deadline has passed; the posting is kept so closed roles rank lower.

How to apply: studio@haleta.example`,
  },
  {
    externalId: "rift-analyst",
    sourceKey: "sample",
    title: "Junior Data Analyst",
    company: "Rift Valley Analytics",
    location: "Addis Ababa",
    url: "https://example.com/jobs/rift-analyst",
    postedAt: "2026-11-12T12:00:00.000Z",
    text: `Junior Data Analyst
Company: Rift Valley Analytics
Location: Addis Ababa
Job type: Full-time
Experience: Junior, 1 year
Deadline: 8 January 2027

Analyze operational data with Python, SQL, and Excel. You will write short reports for an NGO client. Hybrid: two days remote.

How to apply: data@riftvalley.example`,
  },
  {
    externalId: "merkato-sales",
    sourceKey: "sample",
    title: "የሽያጭ ኦፊሰር",
    company: "Merkato Retail",
    location: "አዲስ አበባ",
    url: "https://example.com/jobs/merkato-sales",
    postedAt: "2026-11-05T12:00:00.000Z",
    text: `የሽያጭ ኦፊሰር
ድርጅት: Merkato Retail
ቦታ: አዲስ አበባ
ዓይነት: ቋሚ
ልምድ: ጀማሪ
የመጨረሻ ቀን: 5 ሕዳር 2019 ዓ.ም

የሽያጭ እና የደንበኞች አገልግሎት ልምድ ያለው ሰው እንፈልጋለን። ሥራው በቢሮ ነው።

ያመልክቱ: sales@merkato-retail.example`,
  },
];
