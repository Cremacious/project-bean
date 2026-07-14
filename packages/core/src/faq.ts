// packages/core/src/faq.ts
//
// The single source of truth for the parent-facing Help / FAQ content (issue #72).
// It lives in the platform-agnostic core so the web Help page and the native app
// render the SAME answers and can never drift. Pure data only: no DOM, React, or
// platform imports, exactly like the rest of this package.
//
// Copy rules (docs/WORKFLOW.md): every string here is warm, high contrast when
// rendered, and DASH FREE (no em dashes, en dashes, or hyphens as punctuation).
// Answers describe how the app actually behaves today, not what is planned, so
// they stay honest as the source of truth both surfaces read from.
//
// Contact details (the support email, the contact form) are intentionally NOT
// here: they are surfaced by each platform (the web Help page, the app settings)
// so this file has no environment or address knowledge to keep in sync.

/** One question and its answer. The answer is a list of paragraphs. */
export type FaqItem = {
  /** A stable, dash-free-slug id for anchoring and keys. */
  id: string;
  /** The question, phrased the way a parent would ask it. */
  question: string;
  /** The answer as one or more paragraphs of plain, dash-free copy. */
  answer: string[];
};

/** A titled group of related questions. */
export type FaqSection = {
  /** A stable id used for anchors and keys. */
  id: string;
  /** The section heading, dash free. */
  title: string;
  /** A one line description of what the section covers. */
  summary: string;
  /** The questions in display order. */
  items: FaqItem[];
};

/**
 * Every Help / FAQ section in display order. The web page renders these as
 * accessible accordions and the native settings screen can link to or mirror
 * them, so a single edit here updates both surfaces.
 */
export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "Create an account, add your child, and read your first quest.",
    items: [
      {
        id: "what-is-bedtime-quests",
        question: "What is Bedtime Quests?",
        answer: [
          "Bedtime Quests is a library of interactive bedtime stories you read together. You read aloud, your little one chooses what happens next, and each choice leads the tale somewhere new. It is built to be a calm, cozy part of the nightly wind down.",
          "It is made for grown ups and children to share, side by side, rather than for a child to use alone.",
        ],
      },
      {
        id: "create-account",
        question: "How do I create an account?",
        answer: [
          "Tap Sign up and use your email and a password, or continue with Google or Apple. The account belongs to you, the grown up. Your child never signs in or has an account of their own.",
        ],
      },
      {
        id: "add-a-child",
        question: "How do I add my child?",
        answer: [
          "Once you are signed in, add a child profile with just their first name. That name is all we need to weave them into the story. You can add more than one child and switch between them at story time.",
        ],
      },
      {
        id: "pick-a-story",
        question: "How do I pick a story?",
        answer: [
          "Open the library and choose any story. Free stories are ready right away. Stories marked premium unlock with a subscription. Tap a story to start, then read the pages aloud and let your child pick each path.",
        ],
      },
      {
        id: "reading-modes",
        question: "What are the reading modes?",
        answer: [
          "There are two ways to read. In Read to me, you read the pages aloud and your child listens and chooses. In I can read, the text is set a little larger so a child reading on their own has an easier time.",
          "You can switch modes any time, and neither mode changes the story itself, only how it is presented.",
        ],
      },
    ],
  },
  {
    id: "personalization-safety",
    title: "Personalization and safety",
    summary: "How your child's name is used and what we do and do not collect.",
    items: [
      {
        id: "how-name-is-used",
        question: "How is my child's name used?",
        answer: [
          "Your child's first name is placed into the story text where the tale calls for it, so the hero of the quest is them. That is the whole of the personalization. We use the first name only.",
          "The name stays on your account. It is not used to build a profile, it is not shared, and it is not shown to anyone outside your family.",
        ],
      },
      {
        id: "what-data-collected",
        question: "What information do you collect about my child?",
        answer: [
          "As little as possible. We keep your child's first name and their story progress so you can pick up where you left off. We do not ask for a birth date, a photo, a voice recording, or a location, and your child never types anything into the app.",
          "Everything about your child sits behind your account, which is protected by your sign in.",
        ],
      },
      {
        id: "coppa",
        question: "Is Bedtime Quests made for children?",
        answer: [
          "Yes, and we built it to be careful with families. It is designed to be read with a grown up, and the grown up controls the account, the child profiles, and every setting. Grown up areas sit behind a simple parent check so a child does not wander into them.",
          "Anything that would measure usage or show an ad is turned off until you, the parent, choose to turn it on. You can read the full detail in our Privacy Policy.",
        ],
      },
      {
        id: "delete-data",
        question: "How do I review or delete my child's information?",
        answer: [
          "You can remove a child profile, or delete your whole account, from inside the app once you are signed in. Deleting your account also removes your child's first name and story progress. If you would like help, email our support team.",
        ],
      },
    ],
  },
  {
    id: "reading-accessibility",
    title: "Reading and accessibility",
    summary: "Fonts, text size, and how choices and endings work.",
    items: [
      {
        id: "font-options",
        question: "Can I change the font?",
        answer: [
          "Yes. You can choose from three reading fonts: Rounded, which is the friendly default, Hyperlegible, which is extra clear, and OpenDyslexic, which many families find easier for readers with dyslexia.",
        ],
      },
      {
        id: "text-size",
        question: "Can I make the text bigger?",
        answer: [
          "Yes. Text comes in four sizes, from Small up to Huge, so you can set it to suit your child's eyes and the light in the room. When a child reads on their own, the text starts a little larger by default.",
        ],
      },
      {
        id: "choices-endings",
        question: "How do choices and endings work?",
        answer: [
          "At key moments the story offers a couple of choices, and your child picks one. Each choice leads down a different path, and different paths reach different endings, so the same story can end more than one way and reads fresh the next night.",
        ],
      },
      {
        id: "achievements",
        question: "What are achievements?",
        answer: [
          "As you finish quests and discover different endings, your child collects gentle keepsakes for their journey. They are a warm way to look back on the stories you have shared, never a score and never a reason to rush.",
        ],
      },
      {
        id: "game-over",
        question: "What happens at a game over?",
        answer: [
          "Some paths reach a game over, and we keep those soft. There is no scary failure and nothing is lost. Your child is simply invited to try again and choose a new path, so bedtime stays calm.",
        ],
      },
    ],
  },
  {
    id: "subscription-billing",
    title: "Subscription and billing",
    summary: "The free library, premium, the free trial, and how to manage it.",
    items: [
      {
        id: "free-vs-premium",
        question: "What is the difference between free and premium?",
        answer: [
          "The free library gives you a set of full stories at no cost, forever. Premium unlocks every story, including new quests we add over time, with no ads.",
        ],
      },
      {
        id: "free-trial",
        question: "Is there a free trial?",
        answer: [
          "Yes. Premium starts with a 7 day free trial so you can enjoy the whole library before you decide. You will not be charged until the trial ends, and you can cancel any time before then and pay nothing.",
        ],
      },
      {
        id: "how-much",
        question: "How much does premium cost?",
        answer: [
          "Premium is offered monthly or yearly. The yearly plan works out cheaper per month than paying monthly. You will always see the exact price, in your own currency, on the plan screen before you confirm.",
        ],
      },
      {
        id: "where-to-subscribe",
        question: "Where do I subscribe?",
        answer: [
          "Subscriptions are purchased inside the mobile app, through your Apple or Google account. The website does not sell subscriptions. This keeps billing handled safely by the app store you already trust.",
        ],
      },
      {
        id: "manage-cancel",
        question: "How do I change or cancel my subscription?",
        answer: [
          "Because billing runs through the app store, you manage and cancel it there, in your Apple or Google account subscription settings. When you cancel, premium stays on until the end of the time you have already paid for, then simply does not renew.",
        ],
      },
      {
        id: "restore-purchase",
        question: "I subscribed but premium is not showing. What do I do?",
        answer: [
          "This can happen on a new phone or after reinstalling. Open the app, go to the premium screen, and choose Restore purchases. That reconnects the subscription tied to your app store account. If it still does not appear, email support and we will help.",
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    summary: "Sign in, offline reading, stories that will not load, and ads.",
    items: [
      {
        id: "cannot-sign-in",
        question: "I cannot sign in. What should I do?",
        answer: [
          "First check the email and password are correct. If you have forgotten your password, use Forgot password and we will email you a link to set a new one. That link works for one hour. If you signed up with Google or Apple, use that same button to sign back in.",
        ],
      },
      {
        id: "offline",
        question: "Can we read without internet?",
        answer: [
          "Mostly, yes. A story you have already opened is kept on the device so you can read it again offline, which is handy on a trip or when the signal drops. If your child reaches an ending while offline, it is saved on the phone and quietly syncs the next time you are back online.",
          "Stories you have never opened need a connection the first time, so it helps to open tonight's quest before you lose signal.",
        ],
      },
      {
        id: "story-not-loading",
        question: "A story will not load. How do I fix it?",
        answer: [
          "Check your internet connection, then close and reopen the app. If a premium story is locked, make sure your subscription is active, and use Restore purchases if you have moved to a new device. If a story still will not open, email support and tell us which one.",
        ],
      },
      {
        id: "ads",
        question: "Why am I seeing ads, and are they safe?",
        answer: [
          "Ads appear only on the free tier, and only after you agree to them. They are chosen by the page your child is on, not by tracking your child, and no information about your child is shared. Anyone on a free trial or a premium plan sees no ads at all.",
          "If you would rather have no ads, premium removes them completely. You can also change your ad and privacy choices any time.",
        ],
      },
    ],
  },
];

/** Every FAQ item flattened, useful for search or a jump list. */
export function allFaqItems(): FaqItem[] {
  return FAQ_SECTIONS.flatMap((section) => section.items);
}
