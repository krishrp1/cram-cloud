export const SEMESTERS = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);

// Flat list of selectable branches. CSE and AI fan out into their real
// sub-branches (each with its own notes); the rest are single-branch
// departments where the branch value equals the department name.
export const BRANCHES = [
  { value: "cse-core", label: "CSE - Core" },
  { value: "cse-csds", label: "CSE - CSDS" },
  { value: "cse-csiot", label: "CSE - CSIOT" },
  { value: "cse-cybersecurity", label: "CSE - Cyber Security" },
  { value: "cse-csbs", label: "CSE - CSBS" },
  { value: "ai-aiml", label: "AI - AIML" },
  { value: "ai-aids", label: "AI - AIDS" },
  { value: "ece", label: "ECE" },
  { value: "civil", label: "Civil" },
  { value: "mechanical", label: "Mechanical" },
  { value: "biotech", label: "Biotech" },
] as const;

export type BranchValue = (typeof BRANCHES)[number]["value"];

export const BRANCH_VALUES = BRANCHES.map((b) => b.value) as [BranchValue, ...BranchValue[]];

export function branchLabel(value: string): string {
  return BRANCHES.find((b) => b.value === value)?.label ?? value;
}

// Groups the flat branch list back into departments for the picker UI —
// CSE and AI expand to their sub-branches, everything else is a single card.
export const DEPARTMENT_GROUPS = [
  { name: "CSE", branches: BRANCHES.filter((b) => b.value.startsWith("cse-")) },
  { name: "AI", branches: BRANCHES.filter((b) => b.value.startsWith("ai-")) },
  { name: "ECE", branches: BRANCHES.filter((b) => b.value === "ece") },
  { name: "Civil", branches: BRANCHES.filter((b) => b.value === "civil") },
  { name: "Mechanical", branches: BRANCHES.filter((b) => b.value === "mechanical") },
  { name: "Biotech", branches: BRANCHES.filter((b) => b.value === "biotech") },
] as const;
