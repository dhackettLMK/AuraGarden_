import { describe, expect, it } from "vitest";
import { groupOf } from "@/features/tasks/grouping";
import { blankTask, nextOccurrence } from "@/lib/data/tasks";

const today = "2026-11-25"; // Wednesday
const t = (dueDate: string | null, extra = {}) => blankTask({ title: "x", dueDate, ...extra });

describe("task groups", () => {
  it("groups by due date", () => {
    expect(groupOf(t("2026-11-20"), today)).toBe("overdue");
    expect(groupOf(t("2026-11-25"), today)).toBe("today");
    expect(groupOf(t("2026-11-26"), today)).toBe("tomorrow");
    expect(groupOf(t("2026-11-29"), today)).toBe("week");
    expect(groupOf(t("2026-11-30"), today)).toBe("later");
    expect(groupOf(t(null), today)).toBe("nodate");
    expect(groupOf(t("2026-11-20", { status: "done" }), today)).toBe("done");
  });
});

describe("recurrence", () => {
  it("finds the next date", () => {
    expect(nextOccurrence({ kind: "daily" }, "2026-11-25")).toBe("2026-11-26");
    expect(nextOccurrence({ kind: "weekdays" }, "2026-11-27")).toBe("2026-11-30");
    expect(nextOccurrence({ kind: "weekly", days: [1, 3] }, "2026-11-25")).toBe("2026-11-30");
    expect(nextOccurrence({ kind: "monthly" }, "2027-01-31")).toBe("2027-02-28");
    expect(nextOccurrence({ kind: "rrule", rule: "FREQ=WEEKLY;BYDAY=TU,TH" }, "2026-11-25")).toBe("2026-11-26");
  });
});
