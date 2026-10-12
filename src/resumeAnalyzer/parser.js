const HEADING_ALIASES = {
  summary: /^(professional\s+summary|summary|profile|objective|about\s+me)\s*:?$/i,
  skills: /^(technical\s+skills|skills|core\s+competenc(?:ies|e)|technologies|tech\s+stack)\s*:?(.*)$/i,
  experience: /^(work\s+(?:experience|history)|employment(?:\s+history)?|professional\s+experience|experience)\s*:?(.*)$/i,
  education: /^(academic\s+background|education|qualifications|academic\s+qualifications)\s*:?(.*)$/i,
  projects: /^(selected\s+projects|projects|personal\s+projects|academic\s+projects)\s*:?(.*)$/i,
  certifications: /^(certifications?|licenses?)\s*:?(.*)$/i,
  achievements: /^(achievements?|awards?|accomplishments?)\s*:?(.*)$/i
};

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const LINK = /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[^\s|,;)]+|github\.com\/[^\s|,;)]+|[\w.-]+\.(?:dev|me|io)(?:\/[^\s|,;)]*)?)/ig;
const DATE = /\b(?:19|20)\d{2}\s*(?:-|–|to)\s*(?:(?:19|20)\d{2}|present|current)|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2}/i;
const ACTION = /\b(?:built|created|developed|designed|implemented|improved|increased|reduced|led|automated|optimized|delivered|launched|managed|analyzed|engineered|deployed)\b/i;
const NUMBER = /\b\d+(?:\.\d+)?\s*(?:%|percent|x|users?|ms|seconds?|minutes?|hours?|k|m|crore|lakh)?\b/i;

function clean(value) { return value.replace(/\s+/g, " ").replace(/^[-*|•\s]+/, "").trim(); }
function linesOf(text) { return text.split(/\r?\n|(?<=[.!?])\s{2,}/).map(clean).filter(Boolean); }
function sectionize(lines) {
  const sections = { contact: false, summary: false, skills: false, experience: false, education: false, projects: false, certifications: false };
  const blocks = {};
  let current = "contact";
  blocks[current] = [];
  lines.forEach(line => {
    const found = Object.entries(HEADING_ALIASES).find(([, pattern]) => pattern.test(line));
    if (found) { current = found[0]; blocks[current] = []; if (sections[current] !== undefined) sections[current] = true; return; }
    blocks[current] = blocks[current] || [];
    blocks[current].push(line);
  });
  return { sections, blocks };
}
function nameFrom(lines, email) {
  const candidate = lines.slice(0, 6).find(line => {
    const words = line.split(/\s+/); return words.length >= 2 && words.length <= 5 && /^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*)+$/.test(line) && !/@|resume|curriculum|linkedin|github/i.test(line);
  });
  return candidate || null;
}
function entries(lines, kind) {
  return lines.filter(line => line.length > 2).map(line => ({
    text: line,
    dates: line.match(DATE)?.[0] || null,
    title: kind === "experience" ? clean(line.split(/\s+at\s+|\s+\|\s+|\s+-\s+/i)[0]) : null,
    company: kind === "experience" ? (line.match(/\bat\s+(.+)$/i)?.[1] || null) : null,
    degree: kind === "education" ? (line.match(/\b(B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|Bachelor[^,|]*|Master[^,|]*|Ph\.?D)\b[^,|]*/i)?.[0] || null) : null
  }));
}
export function parseResume(text) {
  const lines = linesOf(text);
  const email = text.match(EMAIL)?.[0] || null;
  const phone = text.match(PHONE)?.[0]?.replace(/\s+/g, " ") || null;
  const links = [...new Set((text.match(LINK) || []).map(value => value.replace(/[.)]+$/, "").startsWith("http") ? value : `https://${value}`))];
  const { sections, blocks } = sectionize(lines);
  const skills = (blocks.skills || []).join(", ").split(/[,;|•]/).map(clean).filter(value => value.length > 1).slice(0, 40);
  const achievements = [...(blocks.achievements || []), ...lines.filter(line => NUMBER.test(line) && ACTION.test(line))];
  sections.contact = Boolean(email || phone || links.length);
  return {
    candidate: { name: nameFrom(lines, email), email, phone, links },
    extraction: { success: true, confidence: 0, warnings: [], rawTextLength: text.length },
    sections,
    parsedData: { skills, experience: entries(blocks.experience || [], "experience"), education: entries(blocks.education || [], "education"), projects: entries(blocks.projects || [], "projects"), certifications: entries(blocks.certifications || [], "certifications") },
    _analysis: { lines, blocks, achievements, hasAction: lines.some(line => ACTION.test(line)), hasNumber: lines.some(line => NUMBER.test(line)), duplicateHeadings: lines.length !== new Set(lines.map(line => line.toLowerCase())).size }
  };
}
