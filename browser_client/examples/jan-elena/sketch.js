
// black wall, annoying sound
// two people
// once people wrists touch, annoying sound stops
// the more people stay together, the more shiny pixels appear on the scene
// look at 2 player example , example 2 + example 3 posenet skeleton 






let startPeer;
let video;
let poseNet;
let myPose = {};
let partnerPose = {};
let vol = 0;

// Variables to hold wrists
let myLeftWrist;
let partnerLeftWrist;
let myRightWrist;
let partnerRightWrist;


// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;


// Color palette
const colors = {
  x: 'rgba(200, 63, 84, 0.5)',
  y: 'rgba(49, 128, 144, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
};

function preload() {

  aSound = loadSound('sound.mp3');
}

// particles: check the examples with light on syllabus once again 
//when the touch happens the decay variable changes 
//brick wall 
// try to transition from 2d in p5 to 3d with webjl
// x and y and fixed z position + camera 


function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  const options = {
    architecture: 'MobileNetV1',
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: true,
    minConfidence: 0.5,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single',
    inputResolution: 513,
    multiplier: 0.75,
    quantBytes: 2,
  };

  poseNet = ml5.poseNet(video, options, modelReady);
  poseNet.on('pose', (results) => getPose(results));
  video.hide();
  //WebRTCPeerClient.initSocketClient();

  // To connect to server remotely pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
   WebRTCPeerClient.initSocketClient('http://ef09cc288b8a.ngrok.io');

  // Start the peer client
  WebRTCPeerClient.initPeerClient();
}


function draw() {
  
  if (
    !WebRTCPeerClient.isPeerStarted() ||
    typeof myPose.pose === 'undefined'
  ) {
    console.log('returning!');
    return;
  }

  // Get the incoming data from the peer connection
  const newData = WebRTCPeerClient.getData();

  // Check if there's anything in the data
  if (newData === null) {
    return;
    // If there is data
  } else {
    // Get the pose data from newData.data
    // newData.data is the data sent by user
    // newData.userId is the peer ID of the user
    partnerPose = newData.data;
  }

  // If we don't yet have a partner pose
  if (partnerPose === null) {
    // Return and try again for partner pose
    console.log('waiting for partner');
    return;
  }

  // Here should be the wrists 

  myLeftWrist = getLeftWrist(myPose);
  myRightWrist = getRightWrist(myPose);

  
  partnerLeftWrist = getPartnerLeftWrist(partnerPose);
  partnerRightWrist = getPartnerRightWrist(partnerPose);

 
  background(0);

  // Draw my keypoints and skeleton
  drawKeypoints(myPose, colors.x, 0); // draw keypoints
  drawSkeleton(myPose, colors.x, 0); // draw skeleton

  // Draw partner keypoints and skeleton
  drawKeypoints(partnerPose, colors.y, 0);
  drawSkeleton(partnerPose, colors.y, 0);

  // If our L-R wrists are touching
  if (touching(myLeftWrist, partnerRightWrist)) {
    console.log('touching!');
    // HERE SHOULD BE THE SOUND PART
    aSound.stop();
  } else {
    // HERE SHOULD BE THE SOUND PART
    aSound.volume(vol++);
  }


   // If our R-L wrists are touching
   if (touching(myRightWrist, partnerLeftWrist)) {
    console.log('touching!');
    // HERE SHOULD BE THE SOUND PART
    aSound.stop();
  } else {
    // HERE SHOULD BE THE SOUND PART
    aSound.volume(vol++);
  }




  // Use for debugging
  // drawFramerate();
  // drawMyVideo();
}

// When posenet model is ready, let us know!
function modelReady() {
  console.log('Model Loaded');
}

// Function to get and send pose from posenet

function getPose(poses) {
  // ?? We're using single detection so we'll only have one pose
  // which will be at [0] in the array
  myPose = poses[0];

  // Send my pose over peer if the peer is started
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(myPose);
  }
}

// A function to draw ellipses over the detected keypoints
// Include an offset if testing by yourself
// And you want to offset one of the skeletons
function drawKeypoints(pose, clr, offset) {
  // Loop through all keypoints
  for (let j = 0; j < pose.pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.pose.keypoints[j];
    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (keypoint.score > scoreThreshold) {
      fill(clr);
      noStroke();
      ellipse(
        keypoint.position.x + offset, // Offset useful if testing on your own
        keypoint.position.y,
        size,
        size,
      );
    }
  }
}

// A function to draw the skeletons
function drawSkeleton(pose, clr, offset) {
  // Loop through all the skeletons detected
  const skeleton = pose.skeleton;

  // For every skeleton, loop through all body connections
  for (let j = 0; j < skeleton.length; j++) {
    // Get the ends "joints" for each bone
    const partA = skeleton[j][0];
    const partB = skeleton[j][1];

    // If the score is high enough
    if (
      partA.score > scoreThreshold &&
      partB.score > scoreThreshold
    ) {
      // Draw a line to represent the bone
      stroke(clr);
      line(
        partA.position.x + offset,
        partA.position.y,
        partB.position.x + offset,
        partB.position.y,
      );
    }
  }
}


function getLeftWrist(pose) {
  
  return pose.pose.leftWrist;
}


function getRightWrist(pose) {
  
    return pose.pose.rightWrist;
  }

  //???
  
function getPartnerLeftWrist(pose) {
  
    return pose.pose.leftWrist;
  }

  
  
function getPartnerRightWrist(pose) {
  
    return pose.pose.rightWrist;
  }
  



// Function to see if two points are "touching"
// face to face scenarion, any hand 
// add both

function touching(wrist1, wrist2) {
  // Get the distance between the two wrists
  const d = dist(wrist1.x, wrist1.y, wrist2.x, wrist2.y);

  // If the distance is less than 50 pixels we are touching!
  if (d < 50) {
    return true;
  }

  // Otherwise we are not touching!
  return false;
}


function drawFramerate() {
  fill(0);
  stroke(0);
  text(getFrameRate(), 10, 10);
}

function drawMyVideo() {
  // Draw my video for debug
  push();
  translate(0.25 * width, 0);
  scale(-0.25, 0.25);
  image(video, 0, 0, width, height);
  pop();
}

// Press any key to stop the sketch
function keyPressed() {
  noLoop();
}