let captureInterval;
let videoStream;
let cameraActive = false;

function startCamera() {
  let video = document.getElementById('video');
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      videoStream = stream;
      cameraActive = true;
    });

  captureInterval = setInterval(() => {
    captureFrame(video);
  }, 1000);
}

function stopCamera() {
  clearInterval(captureInterval);
  let video = document.getElementById('video');
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }
  cameraActive = false;
  document.getElementById("feedback").innerText = "Workout stopped.";

  // Clear overlay canvas
  let overlay = document.getElementById("overlay");
  let ctx = overlay.getContext("2d");
  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

function captureFrame(video) {
  if (!cameraActive) return; // Prevent drawing if camera is stopped

  let canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);
  let data = canvas.toDataURL("image/jpeg");

  fetch("/analyze_pose/", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "X-CSRFToken": getCSRFToken()
    },
    body: JSON.stringify({ frame: data })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("feedback").innerText = data.feedback;

    // Draw landmarks if provided
    if(data.landmarks && cameraActive){
      drawLandmarks(data.landmarks);
      analyzeExercise(data.landmarks);  // call exercise logic
    }
  });
}

function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}