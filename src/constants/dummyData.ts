/**
 * Muse AI Clone - Mock Data Datasets
 *
 * Centralized initial state mocks for:
 * 1. Chat conversation messages & Muse AI responses
 * 2. Sidebar drawer chat sessions & side topics
 * 3. Pre-built prompt idea templates for one-tap agent execution
 * 4. Scheduled autonomous goals and background tasks
 * 5. Account plan limits and third-party workspace connectors
 */

import {
  ChatMessage,
  SideChatItem,
  IdeaItem,
  TaskGoalItem,
  ConnectorItem,
  PlanData,
} from '@/types';

// Re-export all types for convenience
export * from '@/types';

/**
 * Initial seed messages presented when opening the main chat screen.
 */
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    text: "Look at my last three months of statements. Where's my money actually going? Tell me what you'd change and why.",
    timestamp: '10:18 AM',
  },
  {
    id: 'msg-2',
    sender: 'agent',
    text: "You're averaging $4,320/mo. Two things stand out: dining is up 35% to $410/mo, and you have three subscriptions you haven't opened in 90 days. That's $47/mo you won't miss. Want me to cancel them?",
    timestamp: '10:19 AM',
    widget: {
      type: 'finance',
    },
  },
  {
    id: 'msg-3',
    sender: 'agent',
    text: "Tickets just opened for the movie you're tracking. 4:30 PM or 7:30 PM. Interested?",
    timestamp: '10:20 AM',
  },
  {
    id: 'msg-4',
    sender: 'user',
    text: 'Yeah, book for 2',
    timestamp: '10:21 AM',
  },
  {
    id: 'msg-5',
    sender: 'user',
    text: 'Lets do 7:30pm',
    timestamp: '10:21 AM',
  },
  {
    id: 'msg-6',
    sender: 'agent',
    text: 'Selecting the best available seats for you in the middle row...',
    timestamp: '10:22 AM',
    widget: {
      type: 'browser',
      data: { statusText: 'Selecting seats...' },
    },
    actions: [
      {
        type: 'browser_session',
        title: 'Cinema Seats Selection',
        replayUrl: 'https://www.browserbase.com/sessions/45ea61b8-1a58-405e-8391-6955f71a9e1a',
      },
    ],
  },
  {
    id: 'msg-7',
    sender: 'agent',
    text: 'Found a few travel strollers for Luca — perfect for your trip. The Glide Pro is $80 (these usually go for $320). Interested?',
    timestamp: '10:22 AM',
    widget: {
      type: 'checkout',
      data: {
        productTitle: 'Glide Pro Stroller',
        price: '$80.00',
        regularPrice: '$320.00',
        total: '$80',
      },
    },
  },
  {
    id: 'msg-8',
    sender: 'agent',
    text: 'Found the field trip form in your email due today, so I filled it out.',
    timestamp: '10:22 AM',
    widget: {
      type: 'document',
    },
  },
  {
    id: 'msg-9',
    sender: 'agent',
    text: "The field trip needs a chaperone, and it looks like you're free. Want me to sign you up and send a confirmation email?",
    timestamp: '10:22 AM',
  },
  {
    id: 'msg-10',
    sender: 'user',
    text: 'Yes, that sounds great!',
    timestamp: '10:22 AM',
    reaction: '✍️',
  },
  {
    id: 'msg-11',
    sender: 'agent',
    text: "Sent. I'll remind you on Thursday to pack a lunch.",
    timestamp: '10:23 AM',
  },
];

/**
 * Mock side conversations displayed in the sliding sidebar drawer.
 */
export const SIDE_CHATS: SideChatItem[] = [
  {
    id: 'side-1',
    title: 'Look at my last three months statements',
    hasUnreadDot: false,
  },
  {
    id: 'side-2',
    title: 'Movie tickets reservation 7:30pm',
    hasUnreadDot: false,
  },
  {
    id: 'side-3',
    title: 'Travel stroller deal for Luca',
    hasUnreadDot: false,
  },
  {
    id: 'side-4',
    title: 'Field trip permission slip',
    hasUnreadDot: true,
  },
  {
    id: 'side-5',
    title: 'Marathon training prep',
    hasUnreadDot: true,
  },
];

/**
 * Curated idea templates presented on the Ideas tab.
 */
export const IDEA_ITEMS: IdeaItem[] = [
  {
    id: 'idea-1',
    icon: '🛂',
    title: 'I can follow up on your airline refund',
    description: 'I found an email from the airline confirming your canceled flight on October 14, but no refund has been posted. Want me to draft a follow-up and track it until it lands?',
    prompt: 'Draft a follow-up email for my airline refund and track it until it lands.',
  },
  {
    id: 'idea-2',
    icon: '🛍️',
    title: 'I can find a bigger stroller for Luca',
    description: "Based on Luca's age he'll outgrow his stroller in the next month. I'm watching Marketplace for a bigger option under $300.",
    prompt: "Look for travel stroller options for Luca on Marketplace under $300.",
  },
  {
    id: 'idea-3',
    icon: '👟',
    title: 'Build a daily training plan for your half marathon',
    description: 'Your VO2 max is up 4% and your average pace dropped to 9.12. I\'m building a 10-week plan synced to your calendar that adjusts based on your health connector data.',
    prompt: 'Build a personalized 10-week half marathon training plan synced with my calendar.',
  },
  {
    id: 'idea-4',
    icon: '🍽️',
    title: 'I can book your anniversary dinner',
    description: "You saved a restaurant on Instagram last month and there's an opening Saturday at 8 PM. Want me to reserve a table for two?",
    prompt: 'Reserve a table for two at our saved restaurant for this Saturday at 8 PM.',
  },
  {
    id: 'idea-5',
    icon: '🛏️',
    title: 'I can help dial in your sleep based on the data',
    description: 'Cross-referencing your sleep logs with your calendar reveals peak REM cycles when you wrap up screen time by 10 PM. Want a nightly bedtime optimization schedule?',
    prompt: 'Analyze my sleep tracker logs and create a nightly bedtime routine schedule.',
  },
];

/**
 * Pre-configured scheduled agent check-ins displayed in Tasks tab.
 */
export const TASK_GOALS: TaskGoalItem[] = [
  {
    id: 'task-1',
    title: 'Morning Health & Workout Check-in',
    schedule: 'Every day @ 8:00 AM',
    status: 'active',
    runsCount: 28,
  },
  {
    id: 'task-2',
    title: 'Evening Reflection & Habit Log',
    schedule: 'Every day @ 9:00 PM',
    status: 'active',
    runsCount: 34,
  },
  {
    id: 'task-3',
    title: 'Weekly Focus Sprint Review',
    schedule: 'Every Sunday @ 6:00 PM',
    status: 'active',
    runsCount: 8,
  },
];

/**
 * Account usage stats and quota reset schedule displayed on Settings tab.
 */
export const SETTINGS_PLAN_DATA: PlanData = {
  planName: 'Free plan',
  percentUsed: 11,
  resetText: 'Weekly limit resets on Oct 2',
  creditsUsed: 110,
  creditsTotal: 1000,
  remainingCredits: 890,
};

/**
 * Pre-configured third-party tools with connection state in Settings.
 */
export const SETTINGS_CONNECTORS: ConnectorItem[] = [
  {
    id: 'conn-bb',
    name: 'Browserbase Cloud Browsers',
    description: 'Autonomous Chrome sessions, Stagehand & live replays',
    iconBg: '#0066FF',
    connected: true,
    category: 'Cloud Automation',
    accountEmail: 'Connected via BROWSERBASE_API_KEY',
  },
  {
    id: 'conn-1',
    name: 'Google Workspace',
    description: 'Gmail, Calendar events & Google Drive sync',
    iconBg: '#4285F4',
    connected: true,
    category: 'Productivity',
    accountEmail: 'rahul.s@gmail.com',
  },
  {
    id: 'conn-2',
    name: 'Notion',
    description: 'Automate databases, docs, and habit trackers',
    iconBg: '#000000',
    connected: true,
    category: 'Workspace',
    accountEmail: 'rahul.notion.so',
  },
  {
    id: 'conn-3',
    name: 'GitHub',
    description: 'Pull request reviews, issue triage & commits',
    iconBg: '#24292E',
    connected: true,
    category: 'Developer',
    accountEmail: 'github.com/rahulsana',
  },
  {
    id: 'conn-4',
    name: 'Slack',
    description: 'Channel agent summary & urgent notifications',
    iconBg: '#4A154B',
    connected: true,
    category: 'Messaging',
    accountEmail: 'Team Workspace',
  },
  {
    id: 'conn-5',
    name: 'Linear',
    description: 'Track issues, sprint cycles and product roadmap',
    iconBg: '#5E6AD2',
    connected: false,
    category: 'Developer',
  },
  {
    id: 'conn-6',
    name: 'Figma',
    description: 'Inspect design tokens, frame comments & assets',
    iconBg: '#F24E1E',
    connected: false,
    category: 'Design',
  },
  {
    id: 'conn-7',
    name: 'X (Twitter)',
    description: 'Scan timelines, trends, and post drafts',
    iconBg: '#1DA1F2',
    connected: false,
    category: 'Social',
  },
];
