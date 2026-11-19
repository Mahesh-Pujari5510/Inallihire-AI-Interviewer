export function calculateInterviewReport(interview, answers) {
  const evaluations = answers.map(item => item.evaluation).filter(Boolean);
  const average = evaluations.length ? Math.round(evaluations.reduce((sum, item) => sum + item.score, 0) / evaluations.length / 12 * 100) : 0;
  const categoryScores = {};
  interview.questions.forEach(question => {
    const evaluation = answers.find(item => item.questionId === question.id)?.evaluation;
    if (evaluation) { const key = question.category; categoryScores[key] = categoryScores[key] ? [...categoryScores[key], evaluation.score] : [evaluation.score]; }
  });
  Object.keys(categoryScores).forEach(key => { categoryScores[key] = Math.round(categoryScores[key].reduce((a, b) => a + b, 0) / categoryScores[key].length / 12 * 100); });
  const gaps = [...new Set(evaluations.flatMap(item => item.improvements || []))].slice(0, 5);
  return { overallScore: average, categoryScores: { technical: 0, communication: 0, problemSolving: 0, behavioral: 0, confidenceClarity: 0, ...categoryScores }, strengths: [...new Set(evaluations.flatMap(item => item.strengths || []))].slice(0, 5), knowledgeGaps: gaps, improvementPlan: gaps.slice(0, 5), recommendedPracticeTopics: [...new Set(interview.questions.flatMap(question => question.expectedTopics || []))].slice(0, 8), recommendedNextLevel: average >= 80 ? "Increase difficulty or target the next experience level." : "Repeat this level after practicing the listed gaps." };
}
