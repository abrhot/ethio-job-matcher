export type Locale = "en" | "am";

export const copy = {
  en: {
    welcome: `Sera (ሥራ) finds Ethiopian jobs that fit your CV and sends them here.

Send a PDF or DOCX CV, or set a profile in one message:

Field: Software Engineering
Skills: React, Node.js, PostgreSQL
Level: junior
City: Addis Ababa
Remote: yes
Types: full-time, internship

Commands
/matches — your best jobs
/alerts instant|digest|both|off
/language en|am
/upgrade — cover letter drafts
/help`,
    help: "Send a CV, or /profile to see what I have stored. /matches lists jobs. /alerts changes how often I ping you. /language en or /language am. /upgrade explains premium.",
    needProfile:
      "I don't have a profile for you yet. Send a CV, or a message that starts with Field: and Skills:.",
    saved: "Profile saved. I'll score new jobs against it. Use /matches to see the current list.",
    noMatches: "No strong matches yet. I'll message you when a new posting fits.",
    alertsSet: (mode: string) => `Alerts set to ${mode}.`,
    languageSet: "Language set to English.",
    upgrade:
      "Premium is 299 ETB for 30 days. It drafts a cover letter and CV notes for each job. Payments use a stub until Chapa or Telebirr keys are added. Open the web app's Premium page to try the demo checkout.",
    cvFail: "I couldn't read that file. Send a PDF or DOCX with selectable text.",
    unknown: "I didn't catch that. /help lists what I can do.",
  },
  am: {
    welcome: `Sera (ሥራ) ከሲቪዎ ጋር የሚስማሙ የኢትዮጵያ ሥራዎችን እዚህ ይልካል።

PDF ወይም DOCX ሲቪ ይላኩ፣ ወይም መገለጫ በአንድ መልዕክት ይሙሉ፦

Field: Software Engineering
Skills: React, Node.js, PostgreSQL
Level: junior
City: Addis Ababa
Remote: yes
Types: full-time, internship

ትዕዛዞች
/matches — የሚስማሙ ሥራዎች
/alerts instant|digest|both|off
/language en|am
/upgrade — የማመልከቻ ደብዳቤ
/help`,
    help: "ሲቪ ይላኩ ወይም /profile የተቀመጠውን መገለጫ ያያሉ። /matches ሥራዎችን ያሳያል። /alerts የማሳወቂያ ድግግሞሽ ይቀይራል። /language am ወይም en።",
    needProfile: "መገለጫ እስካሁን የለም። ሲቪ ይላኩ፣ ወይም Field: እና Skills: ያለው መልዕክት ይጻፉ።",
    saved: "መገለጫ ተቀምጧል። አዲስ ሥራዎችን ከዚህ ጋር እናመሳስላለን። ዝርዝሩን ለማየት /matches ይጠቀሙ።",
    noMatches: "ጠንካራ ተዛማጅ እስካሁን የለም። ሲገኝ እልክልዎታለሁ።",
    alertsSet: (mode: string) => `ማሳወቂያ ወደ ${mode} ተቀይሯል።`,
    languageSet: "ቋንቋ ወደ አማርኛ ተቀይሯል።",
    upgrade:
      "ፕሪሚየም ለ30 ቀን 299 ብር ነው። ለእያንዳንዱ ሥራ የማመልከቻ ደብዳቤ ያዘጋጃል። ክፍያ እስካሁን ሙከራ (stub) ነው። በድር ገጹ Premium ላይ ይሞክሩ።",
    cvFail: "ፋይሉ አልተነበበም። ጽሑፍ ያለው PDF ወይም DOCX ይላኩ።",
    unknown: "አልገባኝም። /help የሚያደርጉትን ይዘረዝራል።",
  },
} as const;

export function localeOf(value: string | null | undefined): Locale {
  return value === "am" ? "am" : "en";
}
