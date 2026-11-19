const technicalTopics = role => [`Explain a core concept you use as a ${role}.`, `How would you debug a difficult problem in a ${role} role?`, `Describe a project where you applied your technical skills.`];
const behavioralTopics = role => [`Tell me about a time you handled a difficult situation while working toward a ${role} goal.`, `How do you learn an unfamiliar tool or concept needed for ${role}?`];
const hrTopics = role => [`Why are you interested in the ${role} role?`, `What kind of work environment helps you do your best work as a ${role}?`];

export function validateInterviewConfig(config) {
  const errors = {};
  if (!config.role?.trim()) errors.role = "Job role is required.";
  if (!Number.isInteger(Number(config.totalQuestions)) || ![5, 10, 15].includes(Number(config.totalQuestions))) errors.totalQuestions = "Choose 5, 10, or 15 questions.";
  if (!['Fresher', '1-2 Years', '3-5 Years', '5+ Years'].includes(config.level)) errors.level = "Choose a supported experience level.";
  return errors;
}

export function generateQuestions(config) {
  const role = config.role.trim();
  const skills = (config.skills || []).filter(Boolean);
  const isFresher = config.level === "Fresher";
  const technical = technicalTopics(role).map((question, index) => ({ category: "technical", question: skills[index] ? `${question} Use ${skills[index]} in your explanation.` : question, expectedTopics: skills.length ? [skills[index % skills.length], "fundamentals"] : ["fundamentals", "role knowledge"], followUpRules: ["Ask for a concrete example if the answer is abstract."] }));
  const behavioral = behavioralTopics(role).map(question => ({ category: "behavioral", question, expectedTopics: isFresher ? ["learning", "problem solving", "reflection"] : ["ownership", "impact", "collaboration"], followUpRules: ["Ask what changed because of the candidate's action."] }));
  const project = { category: "project", question: isFresher ? "Walk me through your strongest academic, personal, or internship project and one thing you would improve." : "Walk me through a production project you owned, including an architectural trade-off and measurable impact.", expectedTopics: isFresher ? ["project", "tools", "learning"] : ["architecture", "ownership", "impact"], followUpRules: ["Ask a deeper project question when the answer names a tool without explaining use."] };
  const hr = hrTopics(role).map(question => ({ category: "hr", question, expectedTopics: ["motivation", "communication"], followUpRules: ["Ask for a specific example rather than a general claim."] }));
  const pool = config.interviewType === "Technical" ? [...technical, project] : config.interviewType === "HR" ? [...behavioral, ...hr] : config.interviewType === "Behavioral" ? [...behavioral, ...hr] : [...technical, project, ...behavioral, ...hr];
  const jobTerms = (config.jobDescription || "").match(/[A-Za-z][A-Za-z+#.-]{2,}/g) || [];
  const jobQuestion = jobTerms.length ? { category: "scenario", question: `This role mentions ${jobTerms.slice(0, 3).join(", ")}. Describe how you would apply the most relevant requirement in a real task.`, expectedTopics: jobTerms.slice(0, 3), followUpRules: ["Probe the decision, trade-off, and result."] } : null;
  const count = Number(config.totalQuestions) || 5;
  return [...(jobQuestion ? [jobQuestion] : []), ...pool].slice(0, count).map((question, index) => ({ ...question, id: index + 1, question: config.difficulty === "Hard" && question.category === "technical" ? `${question.question} Include trade-offs and failure modes.` : question.question }));
}

export function followUpQuestion(question, answer, config) {
  if (!answer.trim() || answer.trim().split(/\s+/).length < 8) return { category: "follow-up", question: `Can you give a specific example from your ${config.level === "Fresher" ? "project, coursework, or internship" : "work"}?`, expectedTopics: question.expectedTopics, followUpRules: [] };
  return { category: "follow-up", question: `You mentioned ${answer.trim().split(/\s+/).slice(0, 5).join(" ")}... What was your specific decision, and what result did it produce?`, expectedTopics: ["decision", "result"], followUpRules: [] };
}
