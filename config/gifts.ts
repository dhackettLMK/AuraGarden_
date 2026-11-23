import type { ProjectIcon, ProjectKind } from "@/lib/types";

/**
 * Gift config (brief 3 and 14). This file is public in the repo and visible to
 * anyone who opens /laura, so keep it to what you'd write on a card.
 * It is a map keyed by slug so another /name gift could be added later.
 */
export interface StarterProject {
  name: string;
  kind: ProjectKind;
  color: string;
  icon: ProjectIcon;
  description: string;
  sections: string[];
  suggestions: string[];
}

export interface GiftConfig {
  slug: string;
  recipient: string;
  tagLine: string;
  signature: string;
  /** Optional card that rises from the box. Unset for now. */
  note: string | null;
  starterProjects: StarterProject[];
}

export const STARTER_PROJECTS: StarterProject[] = [
  {
    name: "College Work",
    kind: "college",
    color: "#445463",
    icon: { kind: "brand", brand: "setu" },
    description: "Lectures, assignments and exams at SETU.",
    sections: ["Assignments", "Exams"],
    suggestions: ["Add an assignment", "Plan a study session", "Note an exam date"],
  },
  {
    name: "Swap 'N' Serve",
    kind: "swapnserve",
    color: "#F6C828",
    icon: { kind: "brand", brand: "swapnserve" },
    description: "Youth-led clothing redistribution in Limerick.",
    sections: ["Events", "Admin"],
    suggestions: ["Plan the next swap", "Post on socials", "Sort donations"],
  },
  {
    name: "Hurley Pop's",
    kind: "hurley",
    color: "#E3A04A",
    icon: { kind: "custom", name: "hurley" },
    description: "Everything Hurley Pop's.",
    sections: [],
    suggestions: ["Add a to-do for Hurley Pop's", "Plan this week", "Order supplies"],
  },
  {
    name: "Martial Arts Training",
    kind: "martial",
    color: "#C23B3B",
    icon: { kind: "custom", name: "belt" },
    description: "Training, gradings and goals.",
    sections: ["Training", "Gradings"],
    suggestions: ["Log a training session", "Practise a kata", "Book the next grading"],
  },
];

export const GIFTS: Record<string, GiftConfig> = {
  laura: {
    slug: "laura",
    recipient: "Laura",
    tagLine: "For Laura, grow something great.",
    signature: "David",
    note: null,
    starterProjects: STARTER_PROJECTS,
  },
};

export function getGift(slug: string): GiftConfig | null {
  return GIFTS[slug] ?? null;
}

/** Suggestion chips for empty projects she creates herself. */
export const CUSTOM_PROJECT_SUGGESTIONS = ["Add a first task", "Write down the goal", "Plan this week"];
