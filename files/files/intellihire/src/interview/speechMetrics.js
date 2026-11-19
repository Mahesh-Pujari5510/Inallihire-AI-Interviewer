const FILLERS = /\b(um+|uh+|like|you know|basically|actually)\b/gi;

export function countFillerWords(text) {
  return (text.match(FILLERS) || []).length;
}

export function calculateSpeechMetrics(text, durationSeconds) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const duration = Math.max(1, Number(durationSeconds) || 1);
  return { wordsPerMinute: Math.round(words / duration * 60), fillerWordCount: countFillerWords(text), pauseCount: (text.match(/\.\.\.|\[pause\]/gi) || []).length };
}

export function finalCategoryScores(responses) {
  const values = responses.map(response => response.evaluation || {}).filter(evaluation => typeof evaluation.score === "number");
  const average = key => values.length ? Math.round(values.reduce((sum, value) => sum + (value[key] || value.score || 0), 0) / values.length / 12 * 100) : 0;
  return {
    "Technical Knowledge": average("technicalCorrectness"),
    Communication: average("clarity"),
    "Answer Structure": average("depth"),
    "Confidence / Delivery": average("confidence"),
    "Behavioral Responses": average("relevance")
  };
}