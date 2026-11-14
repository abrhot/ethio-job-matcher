export function jobTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
    freelance: "Freelance",
    unknown: "Type not stated",
  };
  return labels[type] ?? type;
}

export function remoteLabel(mode: string): string {
  const labels: Record<string, string> = {
    remote: "Remote",
    onsite: "On-site",
    hybrid: "Hybrid",
    unknown: "Location flexible",
  };
  return labels[mode] ?? mode;
}

export function levelLabel(level: string): string {
  const labels: Record<string, string> = {
    student: "Student",
    intern: "Intern",
    junior: "Junior",
    mid: "Mid-level",
    senior: "Senior",
    any: "Any level",
  };
  return labels[level] ?? level;
}

export function formatWhen(value: Date | string | null | undefined): string {
  if (!value) return "Date not listed";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Date not listed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function scoreBand(score: number): { label: string; className: string } {
  if (score >= 74) return { label: "Strong match", className: "text-[#145c38]" };
  if (score >= 50) return { label: "Worth a look", className: "text-[#6a4510]" };
  return { label: "Low fit", className: "text-[#5c564c]" };
}
