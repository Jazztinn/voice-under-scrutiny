// Curated prompts for pitch / public-speaking practice.
// Each topic carries a `scenario` (who you're speaking to / the setup) and
// `cases` (concrete angles or project framings to make the practice tangible).
export type Topic = {
  prompt: string;
  scenario: string;
  cases: string[];
};

export const TOPICS: Topic[] = [
  // Elevator / startup pitches
  {
    prompt: "Pitch your favorite app as if it were your own startup, in 60 seconds.",
    scenario:
      "You're on stage at a demo day. A room of investors and press has 60 seconds of attention before the next founder.",
    cases: [
      "Open with the problem the app quietly solves every day",
      "Frame the market as bigger than people assume",
      "End with traction or a bold one-line vision",
    ],
  },
  {
    prompt: "You have one elevator ride to convince an investor to fund your idea. Go.",
    scenario:
      "You stepped into an elevator with a partner from a fund you've chased for weeks. 8 floors. No slides.",
    cases: [
      "Lead with a hook, not your resume",
      "Name the insight only you have",
      "Close by asking for a follow-up meeting, not the check",
    ],
  },
  {
    prompt: "Explain what your company does to a 10-year-old.",
    scenario:
      "A friend's kid asks what you do all day. No jargon survives contact with a curious child.",
    cases: [
      "Use a single everyday analogy",
      "Replace every buzzword with a picture",
      "Make them care by tying it to something they like",
    ],
  },
  {
    prompt: "Pitch a product that solves a problem you personally had this week.",
    scenario:
      "A friction moment from the last 7 days. You're pitching the fix to someone who felt the same pain.",
    cases: [
      "Tell the story of the exact moment it annoyed you",
      "Show why existing fixes fall short",
      "Describe the 'after' world in one sentence",
    ],
  },
  {
    prompt: "Convince me to join your startup instead of a stable corporate job.",
    scenario:
      "You're recruiting a talented engineer who has a comfortable, well-paid offer in hand.",
    cases: [
      "Sell the mission and the learning curve",
      "Be honest about the risk, then reframe it",
      "Paint what they'll build that they never could there",
    ],
  },
  {
    prompt: "Describe your business model in three sentences.",
    scenario:
      "An investor cuts you off: 'How do you actually make money?' Three sentences, no filler.",
    cases: [
      "Who pays, for what, how often",
      "Why the economics get better at scale",
      "The one number that proves it works",
    ],
  },
  {
    prompt: "Pitch a subscription box for something that has never had one.",
    scenario:
      "A creative brainstorm. Invent a monthly box nobody has tried and sell the ritual of it.",
    cases: [
      "Pick an odd but lovable category",
      "Sell the surprise and the belonging, not the objects",
      "Justify why monthly beats one-time",
    ],
  },
  {
    prompt: "Sell me a bottle of water as if it were the last one on Earth.",
    scenario:
      "Post-scarcity roleplay. You hold the only bottle; I'm the buyer with everything to trade.",
    cases: [
      "Anchor on scarcity and stakes",
      "Make me feel the thirst before naming a price",
      "Handle my attempt to haggle",
    ],
  },
  {
    prompt: "Pitch a mobile app that makes commuting enjoyable.",
    scenario:
      "A product review. You're proposing the app to a skeptical head of product.",
    cases: [
      "Target a specific commuter: train, bus, or driver",
      "Turn dead time into a habit worth opening",
      "Name the one feature that hooks retention",
    ],
  },
  {
    prompt: "You have 30 seconds to explain why your solution is 10x better than the competition.",
    scenario:
      "A buyer already uses a rival product. 30 seconds to justify the switch.",
    cases: [
      "Pick one dimension where you win by a mile",
      "Quantify the 10x, don't just claim it",
      "Preempt the 'switching is painful' objection",
    ],
  },

  // Sales / persuasion
  {
    prompt: "Sell this pen to me.",
    scenario:
      "The classic. I'm holding nothing; you hold one ordinary pen and my attention.",
    cases: [
      "Diagnose my need before you sell",
      "Create a moment where I must sign something",
      "Sell status or utility, then close",
    ],
  },
  {
    prompt: "Convince a skeptical customer to switch from a product they've used for years.",
    scenario:
      "A loyal user of a competitor for 5+ years. Habit and sunk cost are working against you.",
    cases: [
      "Acknowledge what they love about the old tool",
      "Lower the perceived cost of switching",
      "Offer a low-risk first step",
    ],
  },
  {
    prompt: "Persuade someone to try a food they say they hate.",
    scenario:
      "A friend swears they despise a dish. Dinner is served; you have one shot.",
    cases: [
      "Separate the memory from the reality",
      "Reframe the texture or flavor they fear",
      "Make the first bite feel low-commitment",
    ],
  },
  {
    prompt: "Talk me out of a bad decision I'm about to make.",
    scenario:
      "A friend is one click from a choice they'll regret. Emotions are high.",
    cases: [
      "Validate the feeling before the logic",
      "Surface the consequence they're avoiding",
      "Offer a better alternative, not just 'no'",
    ],
  },
  {
    prompt: "Convince your team to adopt a tool nobody wants to learn.",
    scenario:
      "A tired team, mid-quarter, allergic to yet another tool and migration.",
    cases: [
      "Lead with the pain it removes for them",
      "Shrink the learning curve to one workflow",
      "Name who else already loves it",
    ],
  },
  {
    prompt: "Persuade a stranger to give up their seat for someone who needs it.",
    scenario:
      "A crowded train. Someone clearly needs the seat; the occupant hasn't noticed.",
    cases: [
      "Be polite, specific, and brief",
      "Appeal to their better self, not guilt",
      "Give them an easy, face-saving yes",
    ],
  },
  {
    prompt: "Make the case for working a four-day week.",
    scenario:
      "You're pitching leadership worried about output and client coverage.",
    cases: [
      "Tie fewer hours to higher focus and output",
      "Address the coverage and fairness fears",
      "Propose a measurable trial",
    ],
  },
  {
    prompt: "Convince me that a book you love is worth reading.",
    scenario:
      "A friend who 'doesn't really read' asks why this book. No spoilers allowed.",
    cases: [
      "Sell the feeling, not the plot",
      "Connect it to something they already care about",
      "Promise a payoff and set the time cost",
    ],
  },

  // Impromptu / storytelling
  {
    prompt: "Tell a story about a time you failed and what you learned.",
    scenario:
      "A team retro or interview. Vulnerability lands better than a highlight reel.",
    cases: [
      "Set real stakes so the failure matters",
      "Own the mistake without over-apologizing",
      "Land a lesson you actually still use",
    ],
  },
  {
    prompt: "Describe the best meal you've ever had, and make me hungry.",
    scenario:
      "Dinner table storytelling. Sensory detail is your only tool.",
    cases: [
      "Set the scene and who you were with",
      "Hit smell, texture, and sound, not just taste",
      "End on the feeling the meal left behind",
    ],
  },
  {
    prompt: "Tell me about a person who changed the way you think.",
    scenario:
      "A reflective one-on-one. Make a stranger feel like they know this person.",
    cases: [
      "Show one specific moment, not a summary",
      "Name the belief before and after",
      "Explain how you carry it now",
    ],
  },
  {
    prompt: "Recount a moment when everything went wrong but turned out fine.",
    scenario:
      "A story with a rough middle and a warm ending. Build the tension honestly.",
    cases: [
      "Stack the problems so it feels hopeless",
      "Find the turn, and don't rush it",
      "Reflect on why it worked out",
    ],
  },
  {
    prompt: "Describe your ideal weekend without mentioning any screens.",
    scenario:
      "A creative constraint. Paint two days of analog life vividly.",
    cases: [
      "Anchor each part to a place and a sense",
      "Let the pace feel unhurried",
      "Reveal what the weekend says about you",
    ],
  },
  {
    prompt: "Tell a two-minute story that ends with a lesson.",
    scenario:
      "Open-mic storytelling. Tight arc, clear point, no rambling.",
    cases: [
      "Start in the middle of the action",
      "Keep one clear thread",
      "Let the lesson emerge, don't lecture",
    ],
  },
  {
    prompt: "Explain a hobby of yours to someone who has never heard of it.",
    scenario:
      "A curious newcomer asks what you do for fun and why you love it.",
    cases: [
      "Start with the feeling it gives you",
      "Explain the basics without a manual",
      "Invite them to picture trying it",
    ],
  },
  {
    prompt: "Describe a place you've been that words can barely capture.",
    scenario:
      "You're trying to give someone the feeling of a place they'll never see.",
    cases: [
      "Ground the abstract in one concrete image",
      "Describe how it made your body feel",
      "Admit what words miss, then get closer",
    ],
  },

  // Explain / teach
  {
    prompt: "Explain how the internet works in plain language.",
    scenario:
      "A smart adult who's never thought about it. No acronyms allowed.",
    cases: [
      "Use a mail or highway analogy",
      "Trace one request end to end",
      "Stop before the jargon creeps in",
    ],
  },
  {
    prompt: "Teach me something useful in 90 seconds.",
    scenario:
      "A micro-lesson. I should be able to use it the moment you finish.",
    cases: [
      "Pick something small and immediately usable",
      "Show, then have me picture doing it",
      "End with the one thing to remember",
    ],
  },
  {
    prompt: "Explain a complex idea from your field to a complete beginner.",
    scenario:
      "Someone bright but outside your field wants the real idea, simply.",
    cases: [
      "Find the everyday version of the idea",
      "Build up in one or two steps",
      "Check for the moment it clicks",
    ],
  },
  {
    prompt: "Describe how to make your favorite dish, step by step.",
    scenario:
      "A friend wants to cook it tonight and has never made it before.",
    cases: [
      "List what they need up front",
      "Sequence the steps so nothing burns",
      "Warn about the one place people mess up",
    ],
  },
  {
    prompt: "Explain why the sky is blue as if talking to a curious child.",
    scenario:
      "A kid keeps asking 'but why?' Keep it true and wonder-filled.",
    cases: [
      "Use light and color they can picture",
      "Avoid physics terms entirely",
      "Leave room for the next 'why?'",
    ],
  },
  {
    prompt: "Summarize a news story you read recently and why it matters.",
    scenario:
      "A friend missed the news and wants the gist plus the so-what.",
    cases: [
      "Give the who/what in two sentences",
      "Separate fact from your read on it",
      "Land why it affects them",
    ],
  },

  // Opinion / persuasive speech
  {
    prompt: "Argue for or against remote work.",
    scenario:
      "A debate format. Pick a side and hold it against a sharp opponent.",
    cases: [
      "Stake a clear position early",
      "Use one strong stat and one story",
      "Steelman the other side, then rebut",
    ],
  },
  {
    prompt: "Make the case that failure is more valuable than success.",
    scenario:
      "A provocative talk. The audience starts out disagreeing.",
    cases: [
      "Define what you mean by 'valuable'",
      "Use a concrete failure that paid off",
      "Answer the obvious objection head-on",
    ],
  },
  {
    prompt: "Argue that a boring skill is actually a superpower.",
    scenario:
      "A talk that reframes something people overlook.",
    cases: [
      "Pick a genuinely unglamorous skill",
      "Show where it quietly wins",
      "Give the audience a reason to build it",
    ],
  },
  {
    prompt: "Convince the audience that less is more.",
    scenario:
      "A room drawn to more features, more stuff, more everything.",
    cases: [
      "Open with a cost of 'more' they feel",
      "Give a vivid example of subtraction winning",
      "Make restraint feel powerful, not limiting",
    ],
  },
  {
    prompt: "Defend an unpopular opinion you genuinely hold.",
    scenario:
      "A friendly but skeptical crowd. Sincerity beats contrarianism.",
    cases: [
      "State it plainly, no hedging",
      "Show how you arrived at it",
      "Respect the disagreement while holding ground",
    ],
  },
  {
    prompt: "Argue why curiosity matters more than intelligence.",
    scenario:
      "A commencement-style argument to ambitious young people.",
    cases: [
      "Define both terms so the contrast is fair",
      "Use someone curious who outran the 'smart' ones",
      "Give them a way to practice curiosity",
    ],
  },

  // Motivational / ceremonial
  {
    prompt: "Give a 60-second pep talk to a team that just lost.",
    scenario:
      "A locker room after a hard loss. Heads down, morale low.",
    cases: [
      "Acknowledge the hurt before the hope",
      "Name one thing they did right",
      "Point to the next fight, not the last one",
    ],
  },
  {
    prompt: "Deliver a toast at a friend's milestone celebration.",
    scenario:
      "A room full of people who love your friend. Glasses raised, waiting.",
    cases: [
      "Open with a specific memory, not a cliché",
      "Say the thing everyone feels but hasn't said",
      "Land a warm, quotable close",
    ],
  },
  {
    prompt: "Welcome a new employee on their first day.",
    scenario:
      "Their first hour. Nervous, wants to belong and to matter.",
    cases: [
      "Make them feel expected, not processed",
      "Share one thing that makes this place special",
      "Give a concrete, kind first step",
    ],
  },
  {
    prompt: "Give a short graduation speech to your younger self.",
    scenario:
      "You, years ago, at a turning point. What would actually have landed?",
    cases: [
      "Pick the one lesson you learned hardest",
      "Skip the platitudes they'd ignore",
      "End with something they'd carry",
    ],
  },
  {
    prompt: "Motivate a room full of people to start something they've been putting off.",
    scenario:
      "A crowd full of half-started dreams and good excuses.",
    cases: [
      "Name the excuse out loud",
      "Shrink the first step to something tiny",
      "Give them a reason to start today",
    ],
  },

  // Quick-fire / creative
  {
    prompt: "Describe your morning routine as if it were an action movie trailer.",
    scenario:
      "Voice-over energy. Ordinary tasks, epic stakes.",
    cases: [
      "Narrate in dramatic movie-trailer voice",
      "Turn coffee and alarms into high stakes",
      "End on a 'this summer' style tagline",
    ],
  },
  {
    prompt: "Pitch a holiday that doesn't exist yet.",
    scenario:
      "You're proposing a brand-new holiday the world should adopt.",
    cases: [
      "Name it and what it celebrates",
      "Invent one ritual people would love",
      "Sell why the world needs it now",
    ],
  },
  {
    prompt: "Explain your job using only analogies.",
    scenario:
      "No literal descriptions allowed. Everything by comparison.",
    cases: [
      "Compare your role to a familiar job",
      "Map your daily tasks to the analogy",
      "Use the analogy to reveal what's hard about it",
    ],
  },
  {
    prompt: "Give a tour of your favorite room as if you were a museum guide.",
    scenario:
      "A guided tour, deadpan and reverent, of an ordinary room.",
    cases: [
      "Assign grand significance to small objects",
      "Keep the tour-guide cadence throughout",
      "End at a 'centerpiece' exhibit",
    ],
  },
  {
    prompt: "Introduce yourself as if accepting an award.",
    scenario:
      "Spotlight, applause fading. You have the mic and the moment.",
    cases: [
      "Open with gratitude that feels earned",
      "Thank someone specific and real",
      "Close on what the award means to you",
    ],
  },
];

/**
 * Returns a random topic prompt, avoiding the `exclude` value when possible
 * so pressing "New topic" never repeats the current one.
 */
export function randomTopic(exclude?: string): string {
  if (TOPICS.length === 1) return TOPICS[0].prompt;
  let next = TOPICS[Math.floor(Math.random() * TOPICS.length)].prompt;
  while (next === exclude) {
    next = TOPICS[Math.floor(Math.random() * TOPICS.length)].prompt;
  }
  return next;
}

/** Looks up the full detail (scenario + cases) for a topic prompt. */
export function topicDetail(prompt: string): Topic | undefined {
  return TOPICS.find((t) => t.prompt === prompt);
}
