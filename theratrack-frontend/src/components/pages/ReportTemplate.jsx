import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Svg,
  Rect,
  G,
  Line,
} from "@react-pdf/renderer";

// ------------------- Fonts -------------------
import roboto from "../../font/Roboto/Roboto-VariableFont_wdth,wght.ttf";
import poppins from "../../font/Poppins/Poppins-Regular.ttf";
import italiana from "../../font/Italiana/Italiana-Regular.ttf";

Font.register({ family: "Roboto", src: roboto });
Font.register({ family: "Poppins", src: poppins });
Font.register({ family: "Italiana", src: italiana });

// ------------------- Styles -------------------
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    backgroundColor: "#F9F4F0",
    padding: 40,
  },
  mainHeader: {
    fontFamily: "Italiana",
    fontSize: 44, // bigger font
    textAlign: "center",
    color: "#2E4057",
    marginBottom: 7, // space below the main header
  },
  sectionHeading: {
    fontFamily: "Italiana",
    fontSize: 19,
    color: "#2E4057",
    marginBottom: 3, // reduced bottom margin
  },
  subtitle: {
    fontFamily: "Poppins",
    fontSize: 14,
    textAlign: "center",
    color: "#565555b8",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  statBox: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#fff",
    textAlign: "center",
    marginHorizontal: 5,
  },
  statTitle: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#565555b8",
    marginBottom: 5,
  },
  statValue: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  section: {
    marginVertical: 15,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#fff",
  },
  chartContainer: {
    marginVertical: 15,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#F4F4F9",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Poppins",
    fontSize: 10,
  },
  therapyPlan: {
    marginTop: 20, // smaller space from table
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#6B8778",
    color: "#fff",
  },
  therapyTitle: {
    fontFamily: "Italiana",
    fontSize: 20,
    marginBottom: 10,
    color: "#fff",
  },
  therapyTip: {
    fontFamily: "Poppins",
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  footer: {
    fontFamily: "Poppins",
    fontSize: 10,
    textAlign: "center",
    marginTop: 30,
    color: "#888",
  },
});

// ------------------- Chart Component -------------------
const AccuracyChart = ({ repetitions }) => {
  const chartHeight = 200;
  const barWidth = 15;
  const gap = 15;
  const chartPadding = 40;
  const chartWidth = repetitions.length * (barWidth + gap) + chartPadding;
  const maxAccuracy = 100;

  return (
    <Svg height={chartHeight + 50} width={chartWidth}>
      {/* Y-axis lines and labels */}
      {[0, 20, 40, 60, 80, 100].map((val, idx) => {
        const y = chartHeight - (val / maxAccuracy) * chartHeight;
        return (
          <G key={idx}>
            <Line x1={chartPadding} y1={y} x2={chartWidth} y2={y} stroke="#ccc" strokeWidth={0.5} />
            <Text x={chartPadding - 5} y={y + 3} fontSize={8} fill="#565555" textAnchor="end">
              {val}%
            </Text>
          </G>
        );
      })}

      {/* Bars */}
      {repetitions.map((rep, idx) => {
        const barHeight = (rep.posture_accuracy / maxAccuracy) * chartHeight;
        const x = chartPadding + idx * (barWidth + gap);
        const y = chartHeight - barHeight;
        const color =
          rep.posture_accuracy >= 85
            ? "#4CAF50"
            : rep.posture_accuracy >= 70
              ? "#FFA500"
              : "#F44336";

        return (
          <G key={idx}>
            <Rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx={2} />

            {/* Number on top of the bar */}
            <Text
              x={x + barWidth / 2}
              y={y - 2} // slightly above the bar
              fontSize={7}
              fill="#000"
              textAnchor="middle"
            >
              {rep.posture_accuracy}%  {/* no space before % */}
            </Text>

            {/* X-axis labels */}
            <Text
              x={x + barWidth / 2}
              y={chartHeight + 12}
              fontSize={7}
              fill="#565555"
              textAnchor="middle"
            >
              {idx + 1}
            </Text>
          </G>
        );
      })}


      {/* Axes */}
      <Line x1={chartPadding} y1={0} x2={chartPadding} y2={chartHeight} stroke="#6B8778" strokeWidth={1} />
      <Line x1={chartPadding} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#6B8778" strokeWidth={1} />
    </Svg>
  );
};

// ------------------- Table -------------------
const RepsTable = ({ repetitions }) => (
  <View style={{ marginTop: 10, marginBottom: 20, borderRadius: 10, overflow: "hidden", border: "1px solid #6B8778" }}>
    <View style={{ flexDirection: "row", backgroundColor: "#6B8778", padding: 5 }}>
      <Text style={{ flex: 1, textAlign: "center", fontSize: 14, color: "#fff", fontFamily: "Poppins", fontWeight: "bold" }}>Rep #</Text>
      <Text style={{ flex: 1, textAlign: "center", color: "#fff", fontFamily: "Poppins", fontWeight: "bold", fontSize: 14 }}>Accuracy</Text>
    </View>

    {repetitions.map((rep, idx) => (
      <View key={idx} style={{ flexDirection: "row", borderBottom: "1px solid #ccc", padding: 5 }}>
        <Text style={{ flex: 1, textAlign: "center", fontFamily: "Poppins", fontSize: 14 }}>{idx + 1}</Text>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "Poppins",
            fontSize: 14,
            color: rep.posture_accuracy >= 85 ? "#4CAF50" : rep.posture_accuracy >= 70 ? "#FFA500" : "#F44336",
          }}
        >
          {rep.posture_accuracy}%  {/* no space before % */}
        </Text>
      </View>
    ))}

  </View>
);

// ------------------- Therapy Plan -------------------
const generateTherapyPlan = (accuracy) => {
  if (accuracy < 50)
    return [
      "Focus on posture: use mirror feedback and slow down movements.",
      "Reduce intensity and increase rest periods.",
      "Consider professional guidance if difficulty persists.",
    ];
  if (accuracy < 70)
    return [
      "Maintain form and control pace.",
      "Gradually increase repetitions.",
      "Include warm-up and cool-down stretches.",
    ];
  if (accuracy < 85)
    return [
      "Keep practicing and increase reps slowly.",
      "Try advanced variations of the exercise.",
      "Monitor fatigue and recovery carefully.",
    ];
  return [
    "Excellent performance!",
    "Increase intensity safely.",
    "Focus on consistency and progression.",
  ];
};

// ------------------- Report -------------------
const ReportTemplate = ({ session, minutes, seconds, totalReps, avgAccuracy, repetitions }) => {
  const therapyPlan = generateTherapyPlan(avgAccuracy);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.mainHeader}>Workout Report</Text>
        <Text style={styles.subtitle}>
          Exercise: {session?.exercise_name || "-"} | Duration: {minutes}m {seconds}s
        </Text>

        {/* Stats */}
        <Text style={styles.sectionHeading}>Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Total Reps</Text>
            <Text style={styles.statValue}>{totalReps}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Avg Accuracy</Text>
            <Text style={styles.statValue}>{Math.round(avgAccuracy)}%</Text>
          </View>
        </View>

        {/* Chart */}
        <Text style={styles.sectionHeading}>Repetition Accuracy Chart</Text>
        <View style={styles.chartContainer}>
          <AccuracyChart repetitions={repetitions} />
        </View>

        {/* Table */}
        <Text style={styles.sectionHeading}>Repetition Accuracy Details</Text>
        <RepsTable repetitions={repetitions} />

        {/* Therapy Plan */}
        <Text style={styles.sectionHeading}>Therapy / Exercise Plan</Text>
        <View style={styles.therapyPlan}>
          {therapyPlan.map((tip, idx) => (
            <Text key={idx} style={styles.therapyTip}>
              • {tip}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>Generated on {new Date().toLocaleString("en-GB")}</Text>
      </Page>
    </Document>
  );
};

export default ReportTemplate;
