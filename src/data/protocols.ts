export interface Protocol {
  id: string;
  category: string;
  title: string;
  redFlags: string[];
  vitalsThresholds: {
    criticalSpO2: number;
    criticalSBP: number;
    criticalHeartRate: { min: number; max: number };
  };
  urgencyCriteria: {
    immediate: string[];
    emergent: string[];
    urgent: string[];
    nonUrgent: string[];
  };
  rationale: string;
}

export const CLINICAL_PROTOCOLS: Protocol[] = [
  {
    id: "chest-pain",
    category: "Cardiovascular",
    title: "Acute Chest Pain / Suspected Cardiac Event",
    redFlags: [
      "Crushing chest pressure",
      "Radiation to jaw, left arm, or back",
      "Diaphoresis (heavy sweating)",
      "Syncopal episode (fainting)",
      "Oxygen saturation < 90%"
    ],
    vitalsThresholds: {
      criticalSpO2: 90,
      criticalSBP: 90,
      criticalHeartRate: { min: 40, max: 120 }
    },
    urgencyCriteria: {
      immediate: [
        "Cardiac arrest",
        "Signs of cardiogenic shock (BP < 90/60 + altered mental state)",
        "Severe respiratory failure"
      ],
      emergent: [
        "Classic anginal symptoms",
        "ST-elevation suspected symptoms",
        "Shortness of breath with chest pain"
      ],
      urgent: [
        "Stable pleuritic pain",
        "Chest pain without high-risk comorbidities"
      ],
      nonUrgent: [
        "Chest wall tenderness on palpation",
        "Chronic stable angina with no change in pattern"
      ]
    },
    rationale: "Chest pain often indicates life-threatening conditions like MI or PE. Early intervention and EKG are critical."
  },
  {
    id: "respiratory-distress",
    category: "Respiratory",
    title: "Acute Respiratory Distress",
    redFlags: [
      "Stridor or wheezing",
      "Use of accessory muscles",
      "Cyanosis (bluish tint)",
      "Inability to speak in full sentences",
      "SpO2 < 92%"
    ],
    vitalsThresholds: {
      criticalSpO2: 90,
      criticalSBP: 90,
      criticalHeartRate: { min: 50, max: 130 }
    },
    urgencyCriteria: {
      immediate: [
        "Respiratory arrest",
        "Complete airway obstruction",
        "Severe cyanosis with decreased consciousness"
      ],
      emergent: [
        "Acute asthma exacerbation with SpO2 < 90%",
        "Moderate stridor",
        "Severe tachypnea (> 30 bpm)"
      ],
      urgent: [
        "Mild wheezing with SpO2 > 94%",
        "Chronic COPD exacerbation (stable)"
      ],
      nonUrgent: [
        "Upper respiratory tract infection signs",
        "Stable cough"
      ]
    },
    rationale: "Hypoxia leads to rapid organ failure. Airway management is the first priority in triage (ABC)."
  },
  {
    id: "abdominal-pain",
    category: "Gastrointestinal",
    title: "Acute Abdominal Pain",
    redFlags: [
      "Rigid, board-like abdomen",
      "High fever + rebounding pain",
      "Hematemesis (vomiting blood)",
      "Signs of shock (tachycardia + hypotension)"
    ],
    vitalsThresholds: {
      criticalSpO2: 92,
      criticalSBP: 90,
      criticalHeartRate: { min: 45, max: 110 }
    },
    urgencyCriteria: {
      immediate: [
        "Evisceration",
        "Shock secondary to internal hemorrhage"
      ],
      emergent: [
        "Suspected ectopic pregnancy (if female of childbearing age)",
        "Suspected AAA (pulsatile mass)",
        "Severe guarding"
      ],
      urgent: [
        "Localized pain with low-grade fever",
        "Suspected appendicitis without perforation"
      ],
      nonUrgent: [
        "Mild cramping",
        "Constipation without vomiting"
      ]
    },
    rationale: "Abdominal pain range from dyspepsia to aortic rupture. Risk stratification based on vitals is essential."
  },
  {
    id: "stroke-assessment",
    category: "Neurological",
    title: "Acute Neurological Deficit (Stroke)",
    redFlags: [
      "Facial drooping",
      "Arm weakness",
      "Speech difficulty",
      "Sudden onset headache ('worst of life')",
      "Altered mental status"
    ],
    vitalsThresholds: {
      criticalSpO2: 94,
      criticalSBP: 90,
      criticalHeartRate: { min: 40, max: 100 }
    },
    urgencyCriteria: {
      immediate: [
        "Unresponsive with airway compromise",
        "Status epilepticus"
      ],
      emergent: [
        "Sudden neurological deficit within 24h window",
        "Severe sudden headache",
        "New onset confusion"
      ],
      urgent: [
        "TIA symptoms that have resolved",
        "Chronic cognitive decline changes"
      ],
      nonUrgent: [
        "Chronic headache stable in pattern",
        "Mild peripheral neuropathy"
      ]
    },
    rationale: "Time is brain. Rapid identification for thrombolysis/thrombectomy is paramount."
  }
];
