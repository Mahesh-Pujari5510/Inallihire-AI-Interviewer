const COMMON_SKILLS = /javascript|typescript|react|node|python|java|sql|git|aws|docker|excel|communication|leadership|html|css|mongodb|api|testing|agile/i;
const reason = (earned, max, yes, no) => ({ earned, max, reason: earned ? yes : no });
export function scoreResume(parsed, confidence = 0, jobDescription = "") {
  const { sections, parsedData, _analysis: analysisMeta } = parsed;
  const contact = (parsed.candidate.email ? 4 : 0) + (parsed.candidate.phone ? 3 : 0) + (parsed.candidate.links.length ? 3 : 0);
  const summary = sections.summary ? Math.min(10, 6 + ((analysisMeta.blocks.summary || []).join(" ").length > 120 ? 4 : 1)) : 0;
  const skillHits = parsedData.skills.filter(skill => COMMON_SKILLS.test(skill)).length;
  const skills = Math.min(20, parsedData.skills.length * 2 + Math.min(8, skillHits * 2));
  const experience = sections.experience ? Math.min(20, 8 + (parsedData.experience.length > 1 ? 5 : 0) + (analysisMeta.hasAction ? 4 : 0) + (analysisMeta.hasNumber ? 3 : 0)) : Math.min(20, sections.projects || sections.education ? 14 : 0);
  const education = sections.education ? 10 : 0;
  const projects = sections.projects ? Math.min(10, 5 + (parsedData.projects.length > 1 ? 3 : 0) + (parsed.candidate.links.length ? 2 : 0)) : 0;
  const achievements = Math.min(10, (analysisMeta.hasNumber ? 6 : 0) + (analysisMeta.hasAction ? 4 : 0));
  const readability = confidence < 45 ? 2 : Math.max(4, 10 - (analysisMeta.duplicateHeadings ? 3 : 0) - (parsed.extraction.rawTextLength < 250 ? 2 : 0));
  const scores = {
    overall: contact + summary + skills + experience + education + projects + achievements + readability,
    contact: reason(contact, 10, "Contact details are usable for screening.", "Add an email, phone number, and at least one professional link."),
    summary: reason(summary, 10, "A professional summary is present and has useful detail.", "Add a 2-4 sentence summary focused on the target role."),
    skills: reason(skills, 20, `${parsedData.skills.length} skill terms were detected.`, "List technical and role-relevant skills with consistent names."),
    experience: reason(experience, 20, sections.experience ? "Experience includes role evidence." : "Relevant projects, education, or internships provide early-career evidence.", "Add work, internship, or project entries with dates and outcomes."),
    education: reason(education, 10, "Education and degree information were detected.", "Add degree, institution, and dates."),
    projects: reason(projects, 10, "Projects provide evidence of applied work.", "Add 1-2 relevant projects with tools, links, and outcomes."),
    achievements: reason(achievements, 10, "Action verbs and measurable evidence were detected.", "Use action verbs and quantify outcomes, for example: 'reduced load time by 35%'."),
    atsReadability: reason(readability, 10, "Text quality and structure are readable for an ATS.", "Improve text extraction quality and simplify repeated or complex formatting.")
  };
  const missingForJobDescription = jobDescription ? [...new Set((jobDescription.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) || []).filter(word => !analysisMeta.lines.join(" ").toLowerCase().includes(word)).slice(0, 20))] : [];
  const found = [...new Set((analysisMeta.lines.join(" ").match(/[A-Za-z][A-Za-z+#.-]{2,}/g) || []).filter(word => COMMON_SKILLS.test(word)))].slice(0, 30);
  const strengths = [];
  if (parsed.candidate.email) strengths.push(`Email detected: ${parsed.candidate.email}`);
  if (parsedData.skills.length) strengths.push(`Skills section lists ${parsedData.skills.length} skills.`);
  if (sections.projects) strengths.push("Project evidence is present for practical experience.");
  if (analysisMeta.hasNumber) strengths.push("Measurable results were found in the resume.");
  const improvements = [];
  if (!parsed.candidate.name) improvements.push("Put your full name at the top in plain text.");
  if (!sections.summary) improvements.push("Add a focused professional summary tailored to the role.");
  if (!analysisMeta.hasNumber) improvements.push("Replace vague claims with measurable outcomes, such as 'automated 4 workflows and cut processing time by 30%'.");
  if (!parsed.candidate.links.length) improvements.push("Add a LinkedIn, portfolio, or GitHub link.");
  if (!sections.experience && !sections.projects) improvements.push("Add dated internship, project, or work entries; students are assessed on relevant evidence, not only employment.");
  const { _analysis, ...publicParsed } = parsed;
  return { ...publicParsed, extraction: { ...parsed.extraction, confidence, warnings: confidence < 60 ? ["Extracted text quality is low; review the parsed preview before relying on this analysis."] : [] }, scores, keywords: { found, missingForJobDescription }, strengths, improvements, analysisStatus: confidence < 25 ? "unreliable" : "complete" };
}
