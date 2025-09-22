// Chart.js Dashboard
const ctx = document.getElementById('progressChart');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ["Day 1", "Day 2", "Day 3"],
    datasets: [{
      label: 'Posture Accuracy (%)',
      data: [70, 80, 90],
      borderColor: "blue",
      fill: false,
      tension: 0.3
    }]
  },
  options: {
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  }
});