import React from "react";
import "../css/ReportTemplate.module.css";

const ReportTemplate = ({ session, minutes = 0, seconds = 0, totalReps = 0, avgAccuracy = 0, repetitions = [], feedbacks = [] }) => {
  // Helper function to map accuracy to bar height class
  const getBarHeightClass = (accuracy) => {
    if (accuracy >= 90) return "bar-height-10";
    if (accuracy >= 80) return "bar-height-9";
    if (accuracy >= 70) return "bar-height-8";
    if (accuracy >= 60) return "bar-height-7";
    if (accuracy >= 50) return "bar-height-6";
    if (accuracy >= 40) return "bar-height-5";
    if (accuracy >= 30) return "bar-height-4";
    if (accuracy >= 20) return "bar-height-3";
    if (accuracy >= 10) return "bar-height-2";
    return "bar-height-1";
  };

  return (
    <div className="report-container">
      <h1>Workout Performance Report 🏋️‍♀️</h1>

      {/* Exercise Info */}
      <div className="section exercise-info">
        <div className="exercise-header">
          <img src="https://cdn-icons-png.flaticon.com/512/2964/2964514.png" alt="Exercise" />
          <h2>{session?.exercise?.name || "Exercise"}</h2>
        </div>
        <p><strong>Duration:</strong> {minutes} min {seconds} sec</p>
        <p><strong>Total Repetitions:</strong> {totalReps}</p>
        <p><strong>Average Accuracy:</strong> {avgAccuracy.toFixed(0)}%</p>
      </div>

      {/* Repetition Accuracy */}
      <div className="section">
        <h2>Repetition Accuracy</h2>
        <div className="bar-chart">
          {repetitions.length > 0 ? repetitions.map((rep, index) => {
            const accuracy = rep.posture_accuracy || 0;
            return (
              <div key={index} className={`bar ${getBarHeightClass(accuracy)}`}>
                {accuracy}%
              </div>
            );
          }) : <p className="no-feedback">No repetition data available.</p>}
        </div>

        <table>
          <thead>
            <tr>
              <th>Rep Number</th>
              <th>Posture Accuracy (%)</th>
            </tr>
          </thead>
          <tbody>
            {repetitions.length > 0 ? repetitions.map((rep, index) => (
              <tr key={index}>
                <td>{rep.count_number}</td>
                <td>{rep.posture_accuracy.toFixed(0)}</td>
              </tr>
            )) : <tr><td colSpan="2">No repetition data available</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Feedback Section */}
      <div className="section feedback-section">
        <h2>Session Feedback</h2>
        {feedbacks.length > 0 ? feedbacks.map((fb, index) => (
          <div key={index} className="feedback-item">
            <div className="feedback-icon">💬</div>
            <div>
              <div className="feedback-text">{fb.feedback_text || "No feedback provided."}</div>
              <div className="feedback-score">Score: {(fb.accuracy_score || 0).toFixed(0)}%</div>
            </div>
          </div>
        )) : <p className="no-feedback">No feedback available for this session.</p>}
      </div>

      {/* Footer */}
      <div className="footer">
        <h3>Keep Pushing Forward 💪</h3>
        <p>“Every rep counts — every day stronger than yesterday.”</p>
        <div className="icons">
          <span>🏋️</span>
          <span>🧘‍♀️</span>
          <span>💚</span>
          <span>🔥</span>
        </div>
      </div>
    </div>
  );
};

export default ReportTemplate;
