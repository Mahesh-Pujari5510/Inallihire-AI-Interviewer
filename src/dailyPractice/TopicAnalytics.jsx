import React from "react";

export default function TopicAnalytics({ accuracyByTopic, history }) {
  const topics = Object.entries(accuracyByTopic || {}).sort((a, b) => a[1] - b[1]);
  return <section className="daily-section"><div className="section-heading"><div><p className="daily-eyebrow">Evidence from your sessions</p><h2>Topic signals</h2></div><span className="plan-count">{history.length} answers</span></div>{topics.length ? <div className="topic-list">{topics.slice(0, 5).map(([topic, score]) => <div key={topic}><div><span>{topic}</span><b>{score}%</b></div><div className="topic-bar"><i style={{ width: `${score}%` }} /></div></div>)}</div> : <div className="daily-empty"><strong>Your first session creates the baseline.</strong><span>Accuracy appears after a real answer is submitted.</span></div>}</section>;
}