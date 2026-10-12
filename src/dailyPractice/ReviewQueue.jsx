import React from "react";

export default function ReviewQueue({ items, onReview }) {
  return <section className="daily-section"><div className="section-heading"><div><p className="daily-eyebrow">Spaced repetition</p><h2>Review mistakes</h2></div><span className="plan-count">{items.length} saved</span></div>{items.length ? <div className="review-list">{items.slice(0, 4).map(item => <button key={item.questionId} onClick={() => onReview(item)}><span>{item.topic}</span><small>Practice again →</small></button>)}</div> : <div className="daily-empty"><strong>Your review queue is clear.</strong><span>Incorrect answers will appear here automatically.</span></div>}</section>;
}