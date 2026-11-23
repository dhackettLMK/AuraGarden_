/**
 * Oscar's lines (brief 8.4). Warm, cheeky, Irish, Gen Z. At most 12 words a
 * bubble and at most one emoji. {name} is replaced with her name, used
 * sparingly. {amount} is the aura just earned. Never guilt, never sarcasm at her.
 */
export type LineCategory =
  | "task"
  | "boosted"
  | "college"
  | "swapnserve"
  | "hurley"
  | "martial"
  | "combo"
  | "goal"
  | "deck"
  | "achievement"
  | "rank"
  | "belt"
  | "realm"
  | "levelup"
  | "morning"
  | "afternoon"
  | "evening"
  | "late"
  | "overdue"
  | "streak"
  | "streakEnded"
  | "unlock"
  | "empty"
  | "tap"
  | "pet"
  | "thought"
  | "catchup"
  | "saveLink"
  | "welcome";

export const OSCAR_LINES: Record<LineCategory, string[]> = {
  task: [
    "+{amount} aura. Look at you go!",
    "That's savage, {name}.",
    "You're flyin' it.",
    "Slow and steady? Not you. Speedy.",
    "Main character behaviour.",
    "Aura levels: rising.",
    "Done and dusted. Next!",
    "Another one sorted. Class.",
    "Tick. Glow. Repeat.",
    "The garden felt that one.",
    "Grand job altogether.",
    "Lovely stuff. Keep her lit.",
    "That's the stuff, {name}.",
    "Absolute weapon behaviour.",
  ],
  boosted: [
    "+{amount} aura. The numbers are getting silly.",
    "That's not a number, that's a phone number.",
    "+{amount}?! I need a bigger orb.",
    "Your boosts are doing the heavy lifting now.",
    "Numbers this big should be illegal.",
    "My shell can barely hold this much aura.",
  ],
  college: [
    "Study done. Your brain's getting buff.",
    "SETU won't know what hit them.",
    "Another one for the transcript.",
    "Lecturers fear this level of organised.",
  ],
  swapnserve: [
    "Serving the community AND aura? Iconic.",
    "Swap 'N' Serve, sorted. Limerick thanks you.",
    "Good clothes, good people, good aura.",
    "Community queen behaviour.",
  ],
  hurley: [
    "Hurley Pop's: handled.",
    "Straight over the bar, that one.",
    "Hurley Pop's is in safe hands.",
  ],
  martial: [
    "Hi-yah! Black-belt finish.",
    "Discipline looks good on you.",
    "Training logged. Shell of steel.",
    "Respect. I'd bow but my shell's heavy.",
  ],
  combo: [
    "Combo! Stop, I can't keep up. (Don't stop.)",
    "Three in a row! You're on fire.",
    "Combo! My little legs can't keep up.",
    "Chain reaction. Love to see it.",
  ],
  goal: [
    "Daily goal smashed. Doing a shell shimmy.",
    "Goal hit! The garden's throwing a party.",
    "That's your goal done. Anything else is bonus.",
  ],
  deck: [
    "Everything done?! Go touch grass. I'll mind the garden.",
    "Deck cleared. You can officially relax.",
    "Nothing left today. Legend status confirmed.",
  ],
  achievement: [
    "New trophy! I'm polishing the shelf.",
    "Another badge. The shelf's getting heavy.",
    "Trophy unlocked. You earned every bit.",
  ],
  rank: [
    "Rank up! Look at you climbing.",
    "New rank. Tell your mam.",
    "Promoted! The garden salutes you.",
  ],
  belt: [
    "New belt! I'd bow but I'm a turtle.",
    "New belt colour. Very fetching.",
  ],
  realm: [
    "{name}. {NAME}. There's a whole new realm out here.",
    "A new realm! I packed snacks.",
    "The world just got bigger. Come see!",
  ],
  levelup: [
    "Level up! I knew you had it in you.",
    "New level, same legend.",
    "Levelling up like it's nothing.",
  ],
  morning: [
    "Morning, {name}! What would make today great?",
    "Morning! One small thing to start?",
    "Fresh day. Fresh aura. Let's go.",
    "Kettle on? Let's pick one thing.",
  ],
  afternoon: [
    "Afternoon! How's it going?",
    "Halfway through the day. You're doing grand.",
    "Little break, then one more task?",
  ],
  evening: [
    "Look what you got done today. Proud of you.",
    "Evening! Wind down whenever you like.",
    "The garden's glowing tonight. Because of you.",
  ],
  late: [
    "It's late. The garden will still be here tomorrow.",
    "Bedtime soon? I'm yawning just looking at you.",
    "Rest is productive too. Promise.",
    "Sleep now, aura tomorrow. Deal?",
  ],
  overdue: [
    "This one's been waiting. Do it, move it, or let it go?",
    "No stress. Pick a new day for it?",
    "Old one here. Still want it?",
  ],
  streak: [
    "Seven days in a row. That's a whole week of you.",
    "Streak's glowing. So are you.",
    "Another day on the streak. Unstoppable.",
  ],
  streakEnded: [
    "Fresh start. I kept some of your glow for you.",
    "Welcome back! Your glow's still here.",
    "Missed you! Let's ease back in.",
  ],
  unlock: [
    "Ooh, new neighbours! The butterflies have moved in.",
    "Something new in the garden. Go look!",
    "The garden grew while you worked.",
  ],
  empty: [
    "Nothing here yet. Want to plant something?",
    "A blank page. Very exciting.",
    "Quiet in here. Room to grow.",
  ],
  tap: [
    "You're doing better than you think.",
    "Hi! Just checking in. You're great.",
    "Drink some water. Turtle's orders.",
    "One thing at a time. That's the trick.",
    "I believe in you. Loudly.",
    "Proud of you, {name}.",
    "Tiny steps still count.",
    "Whatever today brings, we've got this.",
  ],
  pet: [
    "Hehe. That tickles.",
    "Best pats in Munster.",
    "More pets, please. 💚",
    "My shell is very polished, thanks.",
  ],
  thought: [
    "What made you smile today?",
    "What's on your mind?",
    "One thing you're proud of this week?",
    "What would you tell yourself last year?",
    "Who made your day better lately?",
    "What are you looking forward to?",
  ],
  catchup: [
    "Catch-up logged. Friends are the best aura.",
    "Look at you, keeping in touch.",
  ],
  saveLink: [
    "Quick one: save your secret garden link somewhere safe.",
    "Keep your garden link safe. It's the only key.",
  ],
  welcome: [
    "Hiya {name}! I'm Oscar. Welcome to your AuraGarden.",
    "Welcome back, {name}!",
  ],
};

const last = new Map<LineCategory, string>();

/** Pick a line by context, never repeating the previous one back to back. */
export function pickLine(category: LineCategory, vars: { name?: string; amount?: string } = {}) {
  const options = OSCAR_LINES[category];
  const pool = options.length > 1 ? options.filter((l) => l !== last.get(category)) : options;
  const template = pool[Math.floor(Math.random() * pool.length)];
  last.set(category, template);
  let line = template;
  // Using her name sometimes, never every line: drop it half the time when optional.
  const name = vars.name ?? "";
  if (!name) line = line.replace(/,? \{name\}/g, "").replace(/\{name\}\.? ?/g, "").replace(/\{NAME\}\.? ?/g, "");
  return line
    .replace(/\{name\}/g, name)
    .replace(/\{NAME\}/g, name.toUpperCase())
    .replace(/\{amount\}/g, vars.amount ?? "25");
}

export function lineCount() {
  return Object.values(OSCAR_LINES).reduce((n, l) => n + l.length, 0);
}
