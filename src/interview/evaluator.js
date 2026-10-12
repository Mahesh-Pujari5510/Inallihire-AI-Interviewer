const emptyEvaluation = answer => ({ score: 0, relevance: 0, technicalCorrectness: 0, clarity: 0, depth: 0, practicalExamples: 0, communicationQuality: 0, strengths: [], improvements: [answer.trim() ? "Add the concept, your reasoning, and a concrete example." : "No answer was provided. Answer the question before submitting."], strongerAnswerOutline: ["State your approach", "Explain the relevant details", "Give evidence or an example", "End with the result or learning"], idealAnswer: "Insufficient information for an ideal answer because the response did not provide enough evidence." });
export function evaluateAnswer(question, answer, config) {
  const clean = (answer || "").trim();
  if (clean.split(/\s+/).filter(Boolean).length < 8) return emptyEvaluation(clean);
  const lower = clean.toLowerCase();
  const topicHits = (question.expectedTopics || []).filter(topic => lower.includes(String(topic).toLowerCase())).length;
  const hasExample = /for example|e\.g\.|project|internship|work|built|implemented|when i|we used/i.test(clean);
  const hasResult = /\d+\s*%?|improv|reduc|increas|result|impact|outcome|learn/i.test(clean);
  const relevance = Math.min(2, 1 + (topicHits ? 1 : 0));
  const technicalCorrectness = question.category === "technical" || question.category === "scenario" ? Math.min(2, 1 + (topicHits ? 1 : 0)) : 2;
  const clarity = /first|then|finally|because|however/i.test(lower) ? 2 : 1;
  const depth = Math.min(2, clean.split(/\s+/).length > 45 ? 2 : 1);
  const practicalExamples = hasExample ? 2 : 0;
  const communicationQuality = clean.split(/\s+/).length > 15 ? 2 : 1;
  const score = relevance + technicalCorrectness + clarity + depth + practicalExamples + communicationQuality;
  const strengths = [relevance === 2 ? "Addresses the question's expected topic." : "Makes a relevant start.", clarity === 2 ? "Uses a clear sequence of ideas." : "The response is understandable.", hasExample ? "Includes practical evidence." : "Shows willingness to engage with the prompt."].slice(0, 3);
  const improvements = [relevance < 2 ? `Directly address ${question.expectedTopics?.join(", ") || "the expected topic"}.` : "", technicalCorrectness < 2 ? "Explain the technical mechanism or reasoning more precisely." : "", !hasExample ? "Add a concrete project, work, or coursework example." : "", !hasResult ? "End with a measurable result, impact, or lesson learned." : ""].filter(Boolean);
  return { score, relevance, technicalCorrectness, clarity, depth, practicalExamples, communicationQuality, strengths, improvements, strongerAnswerOutline: ["Start with the direct answer", "Explain the reasoning and trade-offs", hasExample ? "Keep the concrete example" : "Add a concrete example", hasResult ? "Connect it to the result" : "Quantify the outcome or learning"], idealAnswer: `A stronger ${config.role} answer would directly explain ${question.expectedTopics?.join(", ") || "the relevant concept"}, use a specific example, describe the candidate's action, and close with the result or lesson learned.` };
}
