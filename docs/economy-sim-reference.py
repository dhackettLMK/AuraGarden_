"""Rough reference model of the AuraGarden economy (brief sections 7, 9.3 and 10).

Port this to scripts/simulate-economy.ts against the real config files and tune
thresholds until the pacing targets in brief section 10.5 are met.
Run: python3 docs/economy-sim-reference.py
"""
import math

REALMS = [0, 50_000, 150_000, 500_000, 1_500_000, 5_000_000,
          15_000_000, 50_000_000, 150_000_000, 500_000_000]
REALM_BOOST = 2  # x2 per realm beyond the first
STREAK_TIERS = [(1000, 10), (730, 7), (365, 5), (200, 4), (100, 3), (60, 2.5),
                (30, 2), (14, 1.5), (7, 1.25), (3, 1.1), (0, 1)]


def streak_boost(days):
    for threshold, mult in STREAK_TIERS:
        if days >= threshold:
            return mult


def run(tasks_per_day, years=5, break_every=45):
    total, streak, achievements, marks = 0.0, 0, 0, {}
    for day in range(int(365 * years)):
        # tasks + first-of-day + daily goal (80% of days) + combos + clear the deck (30%) + misc
        base = tasks_per_day * 25 + 10 + 50 * 0.8 + 7.5 + 30 + 15
        if break_every and day % break_every == break_every - 1:
            streak //= 3  # rough stand-in for the boost stepping down after a missed day
        else:
            streak += 1
        realm = sum(1 for t in REALMS if total >= t)
        mult = streak_boost(streak) * REALM_BOOST ** (realm - 1) * (1 + 0.01 * achievements)
        total += base * mult
        earned = min(220, int(25 * math.log10(1 + total / 100) + day / 12))
        if earned > achievements:
            bonus = (250 if total < 1e5 else 1_000 if total < 1e6 else 5_000
                     if total < 1e7 else 25_000 if total < 1e8 else 100_000)
            total += (earned - achievements) * bonus
            achievements = earned
        for m in (1e4, 1e5, 1e6, 1e7, 1e8, 1e9):
            marks.setdefault(f"{m:.0e}", day) if total >= m else None
        for i, t in enumerate(REALMS):
            marks.setdefault(f"realm {i + 1}", day) if total >= t else None
    return marks, total


if __name__ == "__main__":
    for tpd in (3, 6, 10):
        marks, total = run(tpd)
        line = ", ".join(f"{k} @ month {v / 30.4:.1f}" for k, v in marks.items())
        print(f"{tpd} tasks/day: {line} | 5-year total {total:,.0f}")
