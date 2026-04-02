export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
};

export type TrainingContent = {
  videoUrl: string;
  questions: QuizQuestion[];
};

export const DEFAULT_TRAINING_VIDEO_URL =
  "https://www.pexels.com/download/video/7035591/";

export const TRAINING_CONTENT: Record<string, TrainingContent> = {
  "3D Printer": {
    videoUrl: DEFAULT_TRAINING_VIDEO_URL,
    questions: [
      {
        id: "q1",
        question: "What is the first thing you should verify before starting a print?",
        options: [
          "Music is playing",
          "Correct filament is loaded",
          "Lights are off",
          "The printer is unplugged",
        ],
        answer: "Correct filament is loaded",
      },
      {
        id: "q2",
        question: "Why is it important to ensure the correct filament is loaded?",
        options: [
          "It affects print quality and success",
          "It changes the screen brightness",
          "It speeds up the printer automatically",
          "It reduces noise",
        ],
        answer: "It affects print quality and success",
      },
      {
        id: "q3",
        question: "What is the purpose of slicing a 3D model?",
        options: [
          "To color the model",
          "To convert it into printable instructions",
          "To shrink the file size",
          "To upload it to the cloud",
        ],
        answer: "To convert it into printable instructions",
      },
      {
        id: "q4",
        question: "Why should you monitor the first few layers?",
        options: [
          "To make the print faster",
          "To ensure proper adhesion",
          "To change colors",
          "To cool the printer",
        ],
        answer: "To ensure proper adhesion",
      },
      {
        id: "q5",
        question: "What is the risk of touching the nozzle during operation?",
        options: [
          "Electric shock",
          "It may stop printing",
          "Severe burns",
          "Nothing happens",
        ],
        answer: "Severe burns",
      },
      {
        id: "q6",
        question: "Why must you wait for the bed to cool before removing a print?",
        options: [
          "It saves electricity",
          "It prevents damage and injury",
          "It improves color",
          "It speeds up printing",
        ],
        answer: "It prevents damage and injury",
      },
      {
        id: "q7",
        question: "What should you do if a print begins to fail?",
        options: [
          "Ignore it",
          "Stop the print and fix the issue",
          "Turn off the building power",
          "Add more filament",
        ],
        answer: "Stop the print and fix the issue",
      },
      {
        id: "q8",
        question: "What does the AMS system do?",
        options: [
          "Controls lighting",
          "Automatically manages multiple filaments",
          "Cleans the printer",
          "Speeds up prints",
        ],
        answer: "Automatically manages multiple filaments",
      },
      {
        id: "q9",
        question: "Why is bed leveling important?",
        options: [
          "It makes the printer quieter",
          "It ensures proper layer adhesion",
          "It changes print color",
          "It reduces file size",
        ],
        answer: "It ensures proper layer adhesion",
      },
      {
        id: "q10",
        question: "What should you do after completing a print?",
        options: [
          "Leave it for the next user",
          "Clean the area and reset the machine",
          "Turn off all power",
          "Remove filament",
        ],
        answer: "Clean the area and reset the machine",
      },
    ],
  },
  "Heat Press": {
    videoUrl: DEFAULT_TRAINING_VIDEO_URL,
    questions: [
      {
        id: "q1",
        question: "What is the primary function of a heat press?",
        options: [
          "Cutting materials",
          "Applying heat and pressure to bond materials",
          "Printing images",
          "Cooling objects",
        ],
        answer: "Applying heat and pressure to bond materials",
      },
      {
        id: "q2",
        question: "Why must temperature be set correctly?",
        options: [
          "For decoration",
          "To ensure proper bonding",
          "To reduce noise",
          "To save time",
        ],
        answer: "To ensure proper bonding",
      },
      {
        id: "q3",
        question: "What is the main hazard?",
        options: ["Noise", "Sharp edges", "Hot surfaces", "Water leaks"],
        answer: "Hot surfaces",
      },
      {
        id: "q4",
        question: "Why is pressure important?",
        options: [
          "It looks better",
          "It bonds materials properly",
          "It cools the press",
          "It saves energy",
        ],
        answer: "It bonds materials properly",
      },
      {
        id: "q5",
        question: "What should you check before pressing?",
        options: [
          "Material placement",
          "Music volume",
          "WiFi connection",
          "Floor condition",
        ],
        answer: "Material placement",
      },
      {
        id: "q6",
        question: "Why follow material instructions?",
        options: [
          "For appearance only",
          "To prevent damage or failure",
          "To reduce cost",
          "To speed up the process",
        ],
        answer: "To prevent damage or failure",
      },
      {
        id: "q7",
        question: "What should you do before opening the press?",
        options: [
          "Open immediately",
          "Wait for the cycle to finish",
          "Turn off power",
          "Shake the machine",
        ],
        answer: "Wait for the cycle to finish",
      },
      {
        id: "q8",
        question: "What happens with incorrect temperature?",
        options: [
          "Nothing",
          "Poor adhesion or damage",
          "Faster results",
          "Better color",
        ],
        answer: "Poor adhesion or damage",
      },
      {
        id: "q9",
        question: "What safety precaution is required?",
        options: [
          "Wear gloves and avoid hot surfaces",
          "Turn off lights",
          "Use water",
          "Sit down",
        ],
        answer: "Wear gloves and avoid hot surfaces",
      },
      {
        id: "q10",
        question: "What should you do after finishing?",
        options: [
          "Leave it on",
          "Clean and turn off if needed",
          "Walk away",
          "Open repeatedly",
        ],
        answer: "Clean and turn off if needed",
      },
    ],
  },
  "Laser Cutter": {
    videoUrl: DEFAULT_TRAINING_VIDEO_URL,
    questions: [
      {
        id: "q1",
        question: "What is the primary function of a laser cutter?",
        options: [
          "Melting plastic",
          "Cutting and engraving materials",
          "Painting surfaces",
          "Cooling materials",
        ],
        answer: "Cutting and engraving materials",
      },
      {
        id: "q2",
        question: "Why is cutting PVC dangerous?",
        options: [
          "It melts too fast",
          "It releases toxic fumes",
          "It is too soft",
          "It blocks the laser",
        ],
        answer: "It releases toxic fumes",
      },
      {
        id: "q3",
        question: "What is the biggest safety risk?",
        options: ["Noise", "Fire", "Dust", "Water"],
        answer: "Fire",
      },
      {
        id: "q4",
        question: "Should it be left unattended?",
        options: [
          "Yes",
          "No",
          "Only during engraving",
          "Only at night",
        ],
        answer: "No",
      },
      {
        id: "q5",
        question: "Why is ventilation required?",
        options: [
          "To cool the machine",
          "To remove harmful fumes",
          "To improve speed",
          "To reduce noise",
        ],
        answer: "To remove harmful fumes",
      },
      {
        id: "q6",
        question: "What should you do if a flame appears?",
        options: [
          "Ignore it",
          "Stop the machine immediately",
          "Open the lid and leave",
          "Call a friend",
        ],
        answer: "Stop the machine immediately",
      },
      {
        id: "q7",
        question: "What materials are generally safe?",
        options: [
          "Unknown plastics",
          "Approved materials like wood or acrylic",
          "Metal only",
          "PVC",
        ],
        answer: "Approved materials like wood or acrylic",
      },
      {
        id: "q8",
        question: "Why secure materials?",
        options: [
          "For appearance",
          "To prevent movement and errors",
          "To reduce noise",
          "To speed up cutting",
        ],
        answer: "To prevent movement and errors",
      },
      {
        id: "q9",
        question: "What should you check before starting?",
        options: [
          "Settings and material",
          "Phone battery",
          "Internet speed",
          "Lighting",
        ],
        answer: "Settings and material",
      },
      {
        id: "q10",
        question: "After finishing a job, you should:",
        options: [
          "Leave immediately",
          "Clean the area and ensure safety",
          "Turn off building power",
          "Restart machine",
        ],
        answer: "Clean the area and ensure safety",
      },
    ],
  },
  "Milling Machine": {
    videoUrl: DEFAULT_TRAINING_VIDEO_URL,
    questions: [
      {
        id: "q1",
        question: "What does a milling machine do?",
        options: [
          "Paints surfaces",
          "Cuts and shapes material",
          "Melts plastic",
          "Cools metal",
        ],
        answer: "Cuts and shapes material",
      },
      {
        id: "q2",
        question: "Why secure the workpiece?",
        options: [
          "For decoration",
          "To prevent movement during cutting",
          "To save time",
          "To reduce noise",
        ],
        answer: "To prevent movement during cutting",
      },
      {
        id: "q3",
        question: "Required PPE?",
        options: ["Sandals", "Safety glasses", "Hat", "Gloves only"],
        answer: "Safety glasses",
      },
      {
        id: "q4",
        question: "Why is loose clothing dangerous?",
        options: [
          "It looks bad",
          "It can get caught in moving parts",
          "It slows the machine",
          "It causes noise",
        ],
        answer: "It can get caught in moving parts",
      },
      {
        id: "q5",
        question: "What should you verify before starting?",
        options: [
          "Setup and tool position",
          "Music",
          "Lighting",
          "Temperature outside",
        ],
        answer: "Setup and tool position",
      },
      {
        id: "q6",
        question: "Incorrect speeds can cause:",
        options: [
          "Better cuts",
          "Tool damage or poor results",
          "Faster operation",
          "Silence",
        ],
        answer: "Tool damage or poor results",
      },
      {
        id: "q7",
        question: "Why avoid reaching in?",
        options: [
          "It is unnecessary",
          "Risk of injury",
          "It stops machine",
          "It cools parts",
        ],
        answer: "Risk of injury",
      },
      {
        id: "q8",
        question: "Purpose of coolant?",
        options: [
          "Decoration",
          "Reduce heat and friction",
          "Increase noise",
          "Change color",
        ],
        answer: "Reduce heat and friction",
      },
      {
        id: "q9",
        question: "Unusual noise means:",
        options: [
          "Ignore it",
          "Stop and check",
          "Increase speed",
          "Turn off lights",
        ],
        answer: "Stop and check",
      },
      {
        id: "q10",
        question: "After finishing:",
        options: [
          "Leave machine",
          "Clean and shut down properly",
          "Restart immediately",
          "Remove parts randomly",
        ],
        answer: "Clean and shut down properly",
      },
    ],
  },
  "Soldering Station": {
    videoUrl: DEFAULT_TRAINING_VIDEO_URL,
    questions: [
      {
        id: "q1",
        question: "What is soldering used for?",
        options: [
          "Cutting wires",
          "Joining electronic components",
          "Painting circuits",
          "Cooling metal",
        ],
        answer: "Joining electronic components",
      },
      {
        id: "q2",
        question: "Why is the iron dangerous?",
        options: [
          "It is heavy",
          "It is very hot",
          "It is sharp",
          "It is loud",
        ],
        answer: "It is very hot",
      },
      {
        id: "q3",
        question: "What melts?",
        options: ["Wire", "Solder", "Plastic", "Metal sheets"],
        answer: "Solder",
      },
      {
        id: "q4",
        question: "Why avoid fumes?",
        options: [
          "Smell only",
          "They can be harmful",
          "They are loud",
          "They cool the iron",
        ],
        answer: "They can be harmful",
      },
      {
        id: "q5",
        question: "Where place the iron?",
        options: ["Table", "Stand", "Floor", "Pocket"],
        answer: "Stand",
      },
      {
        id: "q6",
        question: "Before turning on:",
        options: ["Check setup", "Walk away", "Turn off lights", "Add water"],
        answer: "Check setup",
      },
      {
        id: "q7",
        question: "Why ventilation?",
        options: ["For noise", "To remove fumes", "For lighting", "For speed"],
        answer: "To remove fumes",
      },
      {
        id: "q8",
        question: "If burned:",
        options: [
          "Ignore",
          "Cool the area and seek help if needed",
          "Continue working",
          "Turn off building power",
        ],
        answer: "Cool the area and seek help if needed",
      },
      {
        id: "q9",
        question: "Why clean tip?",
        options: [
          "Looks better",
          "Improves soldering quality",
          "Reduces heat",
          "Changes color",
        ],
        answer: "Improves soldering quality",
      },
      {
        id: "q10",
        question: "After finishing:",
        options: ["Leave on", "Turn off and clean area", "Drop iron", "Cover it"],
        answer: "Turn off and clean area",
      },
    ],
  },
  UltiMaker: {
    videoUrl: DEFAULT_TRAINING_VIDEO_URL,
    questions: [
      {
        id: "q1",
        question: "What is an Ultimaker used for?",
        options: ["Cutting", "3D printing", "Welding", "Cooling"],
        answer: "3D printing",
      },
      {
        id: "q2",
        question: "How is filament loaded?",
        options: [
          "Automatically only",
          "Manually through feeder",
          "By pouring",
          "Not needed",
        ],
        answer: "Manually through feeder",
      },
      {
        id: "q3",
        question: "Why is bed adhesion important?",
        options: [
          "Color",
          "Prevents print failure",
          "Speed",
          "Noise",
        ],
        answer: "Prevents print failure",
      },
      {
        id: "q4",
        question: "Poor leveling causes:",
        options: ["Better prints", "Failed prints", "Faster prints", "No change"],
        answer: "Failed prints",
      },
      {
        id: "q5",
        question: "Before starting:",
        options: ["Check setup", "Play music", "Turn off lights", "Restart PC"],
        answer: "Check setup",
      },
      {
        id: "q6",
        question: "Interrupting a print can:",
        options: [
          "Improve it",
          "Cause failure",
          "Speed it up",
          "Save filament",
        ],
        answer: "Cause failure",
      },
      {
        id: "q7",
        question: "Supports are used to:",
        options: [
          "Decorate",
          "Hold overhangs",
          "Color print",
          "Cool printer",
        ],
        answer: "Hold overhangs",
      },
      {
        id: "q8",
        question: "After printing:",
        options: [
          "Leave it",
          "Remove print safely and clean",
          "Restart",
          "Turn off building",
        ],
        answer: "Remove print safely and clean",
      },
      {
        id: "q9",
        question: "Common failure cause:",
        options: [
          "Good setup",
          "Poor adhesion",
          "Clean bed",
          "Correct filament",
        ],
        answer: "Poor adhesion",
      },
      {
        id: "q10",
        question: "Monitor first layers because:",
        options: [
          "For fun",
          "They determine success",
          "For speed",
          "For color",
        ],
        answer: "They determine success",
      },
    ],
  },
  "Vinyl Cutter": {
    videoUrl: DEFAULT_TRAINING_VIDEO_URL,
    questions: [
      {
        id: "q1",
        question: "What does a vinyl cutter do?",
        options: ["Prints", "Cuts designs", "Melts", "Paints"],
        answer: "Cuts designs",
      },
      {
        id: "q2",
        question: "What is weeding?",
        options: [
          "Planting",
          "Removing excess vinyl",
          "Cutting",
          "Printing",
        ],
        answer: "Removing excess vinyl",
      },
      {
        id: "q3",
        question: "Why blade depth matters?",
        options: ["Color", "Proper cutting", "Noise", "Speed"],
        answer: "Proper cutting",
      },
      {
        id: "q4",
        question: "Material used?",
        options: ["Wood", "Vinyl", "Steel", "Glass"],
        answer: "Vinyl",
      },
      {
        id: "q5",
        question: "Too much pressure causes:",
        options: [
          "Clean cuts",
          "Damage to material/backing",
          "Faster cutting",
          "Better adhesion",
        ],
        answer: "Damage to material/backing",
      },
      {
        id: "q6",
        question: "Transfer tape is used to:",
        options: [
          "Cut",
          "Move design to surface",
          "Heat material",
          "Clean blade",
        ],
        answer: "Move design to surface",
      },
      {
        id: "q7",
        question: "Why test cut?",
        options: [
          "Decoration",
          "Ensure correct settings",
          "Speed",
          "Noise",
        ],
        answer: "Ensure correct settings",
      },
      {
        id: "q8",
        question: "Bad cut means:",
        options: [
          "Ignore",
          "Adjust settings",
          "Restart computer",
          "Add water",
        ],
        answer: "Adjust settings",
      },
      {
        id: "q9",
        question: "Alignment is important because:",
        options: [
          "Looks better",
          "Ensures accurate cuts",
          "Reduces noise",
          "Speeds up machine",
        ],
        answer: "Ensures accurate cuts",
      },
      {
        id: "q10",
        question: "After finishing:",
        options: [
          "Leave machine",
          "Clean and reset",
          "Turn off building",
          "Restart repeatedly",
        ],
        answer: "Clean and reset",
      },
    ],
  },
};
