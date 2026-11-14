import { skillLabel } from "../jobs/skills";
import type { ScoreInputJob, SeekerProfile } from "../jobs/types";

export function cvTips(profile: SeekerProfile, job: ScoreInputJob): string[] {
  const known = new Set(profile.skills);
  const missing = job.skills
    .filter((skill) => !known.has(skill))
    .slice(0, 3)
    .map(skillLabel);
  const tips = [
    "Use the job title as the first line under your name so a recruiter scanning a Telegram post can see the match.",
  ];
  if (missing.length > 0) {
    tips.push(
      `If you have used ${missing.join(", ")}, even in coursework, put it in the skills line. Leave it out if you have not.`,
    );
  }
  if (job.city)
    tips.push(`Say whether you can work in ${job.city}${profile.remoteOk ? " or remotely" : ""}.`);
  if (job.deadline)
    tips.push(
      "Send the application before the deadline printed on the posting. Closed roles are ranked down.",
    );
  return tips.slice(0, 3);
}
