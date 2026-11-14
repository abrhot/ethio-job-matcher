export interface SkillDef {
  id: string;
  label: string;
  aliases: string[];
}

export const SKILLS: SkillDef[] = [
  { id: "javascript", label: "JavaScript", aliases: ["javascript"] },
  { id: "typescript", label: "TypeScript", aliases: ["typescript"] },
  { id: "react", label: "React", aliases: ["react.js", "reactjs", "react"] },
  { id: "nextjs", label: "Next.js", aliases: ["next.js", "nextjs", "next js"] },
  { id: "node", label: "Node.js", aliases: ["node.js", "nodejs", "node"] },
  { id: "python", label: "Python", aliases: ["python"] },
  { id: "postgresql", label: "PostgreSQL", aliases: ["postgresql", "postgres"] },
  { id: "sql", label: "SQL", aliases: ["sql", "mysql"] },
  { id: "java", label: "Java", aliases: ["java"] },
  { id: "php", label: "PHP", aliases: ["laravel", "php"] },
  { id: "flutter", label: "Flutter", aliases: ["flutter", "dart"] },
  { id: "django", label: "Django", aliases: ["django"] },
  { id: "html-css", label: "HTML/CSS", aliases: ["tailwind", "html", "css"] },
  { id: "git", label: "Git", aliases: ["github", "git"] },
  { id: "docker", label: "Docker", aliases: ["kubernetes", "docker"] },
  {
    id: "data-analysis",
    label: "Data analysis",
    aliases: ["data analysis", "data analyst", "analytics"],
  },
  { id: "excel", label: "Excel", aliases: ["microsoft excel", "excel"] },
  { id: "power-bi", label: "Power BI", aliases: ["power bi", "powerbi"] },
  {
    id: "accounting",
    label: "Accounting",
    aliases: ["accounting", "accountant", "ሂሳብ", "አካውንታንት"],
  },
  { id: "finance", label: "Finance", aliases: ["finance", "financial", "ፋይናንስ"] },
  { id: "auditing", label: "Auditing", aliases: ["auditing", "auditor", "audit", "ኦዲት"] },
  { id: "banking", label: "Banking", aliases: ["microfinance", "banking", "ባንክ"] },
  { id: "marketing", label: "Marketing", aliases: ["marketing", "ማርኬቲንግ"] },
  { id: "sales", label: "Sales", aliases: ["sales", "ሽያጭ"] },
  {
    id: "customer-service",
    label: "Customer service",
    aliases: ["customer service", "customer support", "የደንበኞች አገልግሎት"],
  },
  { id: "hr", label: "Human resources", aliases: ["human resources", "recruitment", "hr"] },
  {
    id: "project-management",
    label: "Project management",
    aliases: ["project management", "project manager"],
  },
  {
    id: "monitoring-evaluation",
    label: "M&E",
    aliases: ["monitoring and evaluation", "monitoring & evaluation", "m&e", "meal"],
  },
  { id: "logistics", label: "Logistics", aliases: ["supply chain", "logistics", "ሎጂስቲክስ"] },
  { id: "procurement", label: "Procurement", aliases: ["procurement", "purchasing", "ግዥ"] },
  { id: "nursing", label: "Nursing", aliases: ["nursing", "nurse", "ነርስ"] },
  { id: "public-health", label: "Public health", aliases: ["public health", "ጤና"] },
  {
    id: "civil-engineering",
    label: "Civil engineering",
    aliases: ["civil engineering", "civil engineer", "construction"],
  },
  { id: "teaching", label: "Teaching", aliases: ["teaching", "teacher", "መምህር"] },
  {
    id: "graphic-design",
    label: "Graphic design",
    aliases: ["graphic design", "graphic designer", "ui/ux", "figma"],
  },
  { id: "law", label: "Law", aliases: ["lawyer", "legal", "law", "ሕግ", "ህግ"] },
  { id: "agriculture", label: "Agriculture", aliases: ["agriculture", "agronomy", "ግብርና"] },
  {
    id: "communication",
    label: "Communication",
    aliases: ["communications", "communication", "public relations"],
  },
  { id: "social-work", label: "Social work", aliases: ["social work", "social worker"] },
];

const ALIASES = SKILLS.flatMap((skill) =>
  skill.aliases.map((alias) => ({ id: skill.id, alias: alias.toLowerCase() })),
).sort((a, b) => b.alias.length - a.alias.length);

function aliasMatches(haystack: string, alias: string): boolean {
  if (/[\u1200-\u137F]/.test(alias) || /[\s.&/]/.test(alias)) {
    return haystack.includes(alias);
  }
  if (alias === "java") return /(?<![a-z])java(?!script)/i.test(haystack);
  if (alias === "audit") return /(?<![a-z])audit/i.test(haystack);
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i").test(haystack);
}

export function detectSkills(text: string): string[] {
  const haystack = text.normalize("NFC").toLowerCase();
  const found: string[] = [];
  for (const { id, alias } of ALIASES) {
    if (found.includes(id)) continue;
    if (aliasMatches(haystack, alias)) found.push(id);
  }
  return found;
}

export function skillLabel(id: string): string {
  return SKILLS.find((skill) => skill.id === id)?.label ?? id;
}

export function canonicalizeSkills(inputs: string[]): string[] {
  const found: string[] = [];
  for (const input of inputs) {
    const detected = detectSkills(input);
    if (detected.length === 0) {
      const trimmed = input.normalize("NFC").trim().toLowerCase();
      if (trimmed && !found.includes(trimmed)) found.push(trimmed);
      continue;
    }
    for (const id of detected) {
      if (!found.includes(id)) found.push(id);
    }
  }
  return found;
}
