// squat.js
import { calculateAngle, smoothAngle } from './exercise_logic.js';

export function analyzeSquat(landmarks, state){
  const LEFT_HIP=23, LEFT_KNEE=25, LEFT_ANKLE=27;
  const RIGHT_HIP=24, RIGHT_KNEE=26, RIGHT_ANKLE=28;

  let leftAngle = calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]);
  let rightAngle = calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]);

  [leftAngle, rightAngle] = smoothAngle(leftAngle,rightAngle);

  const downThreshold=100;
  const upThreshold=170;

  state.feedback = `Squats: ${state.count}`;

  // Down phase
  if(!state.down && leftAngle<downThreshold && rightAngle<downThreshold){
    state.down=true;
    state.feedback="Down position!";
  }

  // Up phase
  if(state.down && leftAngle>upThreshold && rightAngle>upThreshold){
    state.down=false;
    state.count+=1;
    state.feedback=`Squats: ${state.count}`;
  }

  // Form guidance
  if(state.down && (leftAngle>downThreshold || rightAngle>downThreshold)) state.feedback="Bend a bit more";
  if(!state.down && (leftAngle<upThreshold || rightAngle<upThreshold)) state.feedback="Push up fully";

  document.getElementById("repCounter").innerText=`Reps: ${state.count}`;
  document.getElementById("feedback").innerText=state.feedback;
}