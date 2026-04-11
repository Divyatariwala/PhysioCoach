export const generateInsights = (reps) => {
  // 🛑 No data case
  if (!reps || reps.length === 0) {
    return {
      avg: 0,
      best: 0,
      worst: 0,
      performance: "No Data",
      consistency: 0,
      trend: "No trend",
      injuryRisk: "No data available"
    };
  }

  // 📊 Extract accuracy values
  const accuracies = reps.map(r => r.posture_accuracy);

  // 📈 Average
  const avg =
    accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length;

  // 🥇 Best / Worst
  const best = Math.max(...accuracies);
  const worst = Math.min(...accuracies);

  // 📉 Consistency (based on variance)
  const variance =
    accuracies.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
    accuracies.length;

  const consistency = Math.max(0, 100 - variance).toFixed(1);

  // 📊 Trend detection
  let trend = "Stable";

  if (accuracies.length >= 2) {
    const first = accuracies[0];
    const last = accuracies[accuracies.length - 1];

    if (last > first + 5) trend = "Improving 📈";
    else if (last < first - 5) trend = "Declining 📉";
  }

  // ⚠️ Fatigue detection
  if (accuracies.length >= 3) {
    const lastThree = accuracies.slice(-3);
    const avgLastThree =
      lastThree.reduce((a, b) => a + b, 0) / lastThree.length;

    if (avgLastThree < avg - 10) {
      trend = "Fatigue detected ⚠️";
    }
  }

  // 🚑 Injury Risk Detection
  let injuryRisk = "Low risk ✅";

  if (avg < 60) {
    injuryRisk = "High risk ⚠️ Poor posture detected";
  } else if (avg < 75) {
    injuryRisk = "Moderate risk ⚠️ Improve control";
  }

  // 🎯 Performance classification
  let performance = "";

  if (avg >= 85) performance = "Excellent 🔥";
  else if (avg >= 70) performance = "Good 👍";
  else if (avg >= 50) performance = "Average ⚖️";
  else performance = "Needs Improvement ❗";

  // 🧠 AI Suggestions (VERY IMPORTANT 🔥)
  let suggestions = [];

  if (avg < 60) {
    suggestions = [
      "Focus on correcting posture before increasing reps.",
      "Use a mirror or camera feedback for alignment.",
      "Reduce speed and perform controlled movements."
    ];
  } else if (avg < 75) {
    suggestions = [
      "Maintain steady posture throughout the movement.",
      "Avoid rushing through repetitions.",
      "Engage core muscles for better stability."
    ];
  } else if (avg < 85) {
    suggestions = [
      "Increase reps gradually.",
      "Try slight variations to challenge muscles.",
      "Ensure consistent breathing technique."
    ];
  } else {
    suggestions = [
      "Excellent form! Increase intensity safely.",
      "Try advanced variations of the exercise.",
      "Maintain consistency and track progress."
    ];
  }

  // 📦 Final Output
  return {
    avg: avg.toFixed(1),
    best,
    worst,
    performance,
    consistency,
    trend,
    injuryRisk,
    suggestions
  };
};