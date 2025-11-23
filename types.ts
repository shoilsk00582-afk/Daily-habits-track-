

export type RecurrenceType = 'daily' | 'specific_days';

export interface Recurrence {
  type: RecurrenceType;
  days: number[]; // 0 for Sunday, 1 for Monday, etc.
}

export type HabitCategory = 'self' | 'kids' | 'pets' | 'family';

export interface Habit {
  id: string;
  title: string;
  icon: string; // Emoji or icon name
  completed: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  color: string;
  time?: string; // e.g. "08:00"
  recurrence?: Recurrence;
  category?: HabitCategory;
}

export type GroceryUnit = 'pcs' | 'kg' | 'g' | 'l' | 'ml';

export interface GroceryItem {
  id: string;
  text: string;
  completed: boolean;
  quantity: string;
  unit: GroceryUnit;
  emoji: string;
}

export interface DailyContent {
  greeting: string;
  quote: string;
  focusTip: string;
}

export enum AppTab {
  JOURNEY = 'JOURNEY',
  LAUNCH = 'LAUNCH',
  DISCOVER = 'DISCOVER',
  GROCERY = 'GROCERY',
  FAMILY = 'FAMILY'
}

export interface CoachingSession {
  title: string;
  duration: string;
  category: string;
  description: string;
  imageUrl: string;
}