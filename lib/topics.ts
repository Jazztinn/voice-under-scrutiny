// Curated prompts for pitch / public-speaking practice.
// Grouped loosely by style; flattened into one pool for random selection.
export const TOPICS: string[] = [
  // Elevator / startup pitches
  "Pitch your favorite app as if it were your own startup, in 60 seconds.",
  "You have one elevator ride to convince an investor to fund your idea. Go.",
  "Explain what your company does to a 10-year-old.",
  "Pitch a product that solves a problem you personally had this week.",
  "Convince me to join your startup instead of a stable corporate job.",
  "Describe your business model in three sentences.",
  "Pitch a subscription box for something that has never had one.",
  "Sell me a bottle of water as if it were the last one on Earth.",
  "Pitch a mobile app that makes commuting enjoyable.",
  "You have 30 seconds to explain why your solution is 10x better than the competition.",

  // Sales / persuasion
  "Sell this pen to me.",
  "Convince a skeptical customer to switch from a product they've used for years.",
  "Persuade someone to try a food they say they hate.",
  "Talk me out of a bad decision I'm about to make.",
  "Convince your team to adopt a tool nobody wants to learn.",
  "Persuade a stranger to give up their seat for someone who needs it.",
  "Make the case for working a four-day week.",
  "Convince me that a book you love is worth reading.",

  // Impromptu / storytelling
  "Tell a story about a time you failed and what you learned.",
  "Describe the best meal you've ever had, and make me hungry.",
  "Tell me about a person who changed the way you think.",
  "Recount a moment when everything went wrong but turned out fine.",
  "Describe your ideal weekend without mentioning any screens.",
  "Tell a two-minute story that ends with a lesson.",
  "Explain a hobby of yours to someone who has never heard of it.",
  "Describe a place you've been that words can barely capture.",

  // Explain / teach
  "Explain how the internet works in plain language.",
  "Teach me something useful in 90 seconds.",
  "Explain a complex idea from your field to a complete beginner.",
  "Describe how to make your favorite dish, step by step.",
  "Explain why the sky is blue as if talking to a curious child.",
  "Summarize a news story you read recently and why it matters.",

  // Opinion / persuasive speech
  "Argue for or against remote work.",
  "Make the case that failure is more valuable than success.",
  "Argue that a boring skill is actually a superpower.",
  "Convince the audience that less is more.",
  "Defend an unpopular opinion you genuinely hold.",
  "Argue why curiosity matters more than intelligence.",

  // Motivational / ceremonial
  "Give a 60-second pep talk to a team that just lost.",
  "Deliver a toast at a friend's milestone celebration.",
  "Welcome a new employee on their first day.",
  "Give a short graduation speech to your younger self.",
  "Motivate a room full of people to start something they've been putting off.",

  // Quick-fire / creative
  "Describe your morning routine as if it were an action movie trailer.",
  "Pitch a holiday that doesn't exist yet.",
  "Explain your job using only analogies.",
  "Give a tour of your favorite room as if you were a museum guide.",
  "Introduce yourself as if accepting an award.",
];

/**
 * Returns a random topic, avoiding the `exclude` value when possible
 * so pressing "New topic" never repeats the current one.
 */
export function randomTopic(exclude?: string): string {
  if (TOPICS.length === 1) return TOPICS[0];
  let next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  while (next === exclude) {
    next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  }
  return next;
}
