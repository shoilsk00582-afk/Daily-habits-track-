import React, { useState, useEffect } from 'react';
import { Habit, DailyContent, AppTab, CoachingSession, RecurrenceType, GroceryItem, GroceryUnit, HabitCategory } from './types';
import { getDailyMotivation, getPersonalizedAdvice } from './services/geminiService';
import { SunIcon, MoonIcon, CheckIcon, RocketIcon, MountainIcon, CompassIcon, PlusIcon, PlayIcon, PencilIcon, TrashIcon, BarChartIcon, ShoppingCartIcon, UsersIcon, DownloadIcon, BellIcon } from './components/Icons';

// --- Default Data ---
const DEFAULT_HABITS: Habit[] = [
  { id: '1', title: 'Walk the Dog', icon: '🐕', completed: false, timeOfDay: 'morning', color: 'bg-emerald-100 text-emerald-600', time: '06:30', category: 'pets' },
  { id: '2', title: 'Pack Kids\' Lunch', icon: '🍱', completed: false, timeOfDay: 'morning', color: 'bg-orange-100 text-orange-600', time: '06:45', category: 'kids' },
  { id: '3', title: 'Hydrate', icon: '💧', completed: false, timeOfDay: 'morning', color: 'bg-blue-100 text-blue-600', time: '07:00', category: 'self' },
  { id: '4', title: 'Meditate 5m', icon: '🧘', completed: false, timeOfDay: 'morning', color: 'bg-purple-100 text-purple-600', time: '07:30', category: 'self' },
  { id: '5', title: 'Deep Work Session', icon: '🧠', completed: false, timeOfDay: 'afternoon', color: 'bg-amber-100 text-amber-600', time: '14:00', category: 'self' },
  { id: '6', title: 'Call Parents', icon: '📞', completed: false, timeOfDay: 'afternoon', color: 'bg-rose-100 text-rose-600', time: '16:30', category: 'family' },
  { id: '7', title: 'Play with Kids', icon: '🧸', completed: false, timeOfDay: 'afternoon', color: 'bg-teal-100 text-teal-600', time: '17:15', category: 'kids' },
  { id: '8', title: 'Feed Pet', icon: '🐾', completed: false, timeOfDay: 'evening', color: 'bg-yellow-100 text-yellow-600', time: '18:00', category: 'pets' },
  { id: '9', title: 'Read to Kids', icon: '📚', completed: false, timeOfDay: 'evening', color: 'bg-indigo-100 text-indigo-600', time: '19:30', category: 'kids' },
  { id: '10', title: 'Gratitude Journal', icon: '📓', completed: false, timeOfDay: 'evening', color: 'bg-indigo-100 text-indigo-600', time: '20:00', category: 'self' },
  { id: '11', title: 'Disconnect Screens', icon: '📵', completed: false, timeOfDay: 'evening', color: 'bg-pink-100 text-pink-600', time: '21:30', category: 'self' },
];

const COACHING_SESSIONS: CoachingSession[] = [
  { title: "The Power of Habit", duration: "5 min", category: "Focus", description: "Learn how small changes compound over time.", imageUrl: "https://picsum.photos/400/200?random=1" },
  { title: "Deep Sleep Reset", duration: "10 min", category: "Sleep", description: "Prepare your mind for a restful night.", imageUrl: "https://picsum.photos/400/200?random=2" },
  { title: "Anxiety SOS", duration: "3 min", category: "Mental Health", description: "Quick relief for overwhelming moments.", imageUrl: "https://picsum.photos/400/200?random=3" },
];

// --- Utilities ---
const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Create a pleasant major triad (C5, E5, G5) to sound uplifting
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const startTime = now + (i * 0.05);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.05, startTime + 0.05); // Low volume for subtlety
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        
        osc.start(startTime);
        osc.stop(startTime + 0.6);
    });
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

const isHabitScheduledForToday = (habit: Habit) => {
  if (!habit.recurrence) return true; // Default to daily if not set
  if (habit.recurrence.type === 'daily') return true;
  
  const todayIndex = new Date().getDay(); // 0 = Sunday
  return habit.recurrence.days.includes(todayIndex);
};

const getDateKey = (date: Date = new Date()) => date.toISOString().split('T')[0];

const getGroceryEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  const map: Record<string, string> = {
    'apple': '🍎', 'banana': '🍌', 'orange': '🍊', 'lemon': '🍋', 'grape': '🍇', 'melon': '🍈', 'watermelon': '🍉',
    'pear': '🍐', 'peach': '🍑', 'cherry': '🍒', 'strawberry': '🍓', 'kiwi': '🥝', 'tomato': '🍅', 'coconut': '🥥',
    'avocado': '🥑', 'eggplant': '🍆', 'potato': '🥔', 'carrot': '🥕', 'corn': '🌽', 'pepper': '🌶️', 'cucumber': '🥒',
    'broccoli': '🥦', 'mushroom': '🍄', 'onion': '🧅', 'garlic': '🧄', 'bread': '🍞', 'croissant': '🥐', 'baguette': '🥖',
    'cheese': '🧀', 'milk': '🥛', 'yogurt': '🍦', 'butter': '🧈', 'egg': '🥚', 'chicken': '🍗', 'meat': '🥩', 'pork': '🥓',
    'beef': '🥩', 'fish': '🐟', 'coffee': '☕', 'tea': '🍵', 'juice': '🧃', 'beer': '🍺', 'wine': '🍷', 'water': '💧',
    'rice': '🍚', 'noodle': '🍜', 'pasta': '🍝', 'pizza': '🍕', 'burger': '🍔', 'fries': '🍟', 'chocolate': '🍫',
    'candy': '🍬', 'cookie': '🍪', 'cake': '🍰', 'honey': '🍯', 'salt': '🧂', 'sugar': '🧂', 'oil': '🌻',
    'soap': '🧼', 'paper': '🧻', 'shampoo': '🧴', 'toilet': '🧻', 'lettuce': '🥬', 'salad': '🥗', 'cereal': '🥣',
    'donut': '🍩', 'ice cream': '🍦', 'sushi': '🍣', 'shrimp': '🍤', 'lobster': '🦞', 'crab': '🦀', 'squid': '🦑',
    'bacon': '🥓', 'steak': '🥩', 'sandwich': '🥪', 'soup': '🍲', 'stew': '🍲', 'curry': '🍛', 'dumpling': '🥟',
    'bento': '🍱', 'taco': '🌮', 'burrito': '🌯', 'pancakes': '🥞', 'waffle': '🧇', 'popcorn': '🍿'
  };

  for (const key in map) {
    if (lower.includes(key)) return map[key];
  }
  return '🛒';
};

// --- Components ---

const Confetti = () => {
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 1.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = Math.random() > 0.5 ? '50%' : '2px'; // Circle or square
        
        return (
            <div 
              key={i}
              className="absolute top-0 w-2.5 h-2.5"
              style={{
                 left: `${left}%`,
                 backgroundColor: color,
                 borderRadius: shape,
                 animation: `fall ${duration}s linear forwards ${delay}s`
              }}
            />
        );
      })}
    </div>
  );
};

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
  minimal?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggle, onEdit, minimal = false }) => {
  return (
    <div 
      onClick={() => onToggle(habit.id)}
      className={`group relative flex items-center p-4 mb-4 rounded-2xl transition-all duration-500 transform cursor-pointer overflow-hidden border
        ${habit.completed 
          ? 'bg-emerald-50/50 border-emerald-200 shadow-sm animate-success-pop' 
          : 'bg-white border-transparent shadow-md shadow-gray-100 hover:shadow-xl hover:shadow-pink-100/40 hover:-translate-y-1 hover:border-pink-100'}
      `}
    >
      {/* Background Progress Fill Animation */}
      <div 
        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-50/80 to-transparent transition-all duration-700 ease-out z-0`}
        style={{ width: habit.completed ? '100%' : '0%' }}
      />
      
      {/* Bottom Progress Bar */}
      <div 
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700 ease-out z-10`}
        style={{ width: habit.completed ? '100%' : '0%' }}
      />

      {/* Hover Shimmer Effect (only when active and not completed) */}
      {!habit.completed && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 pointer-events-none" />
      )}

      {/* Icon */}
      <div className={`relative z-20 flex items-center justify-center w-12 h-12 rounded-2xl text-2xl mr-4 transition-all duration-500 transform shadow-sm
        ${habit.completed 
          ? 'bg-emerald-100 scale-110 rotate-0' 
          : `${habit.color} group-hover:scale-110 group-hover:-rotate-6`}`}>
        {habit.icon}
      </div>

      {/* Content */}
      <div className="relative z-20 flex-1 min-w-0">
        <h3 className={`font-bold text-base truncate transition-all duration-500 ${habit.completed ? 'text-emerald-800 line-through decoration-emerald-500/30' : 'text-gray-800 group-hover:text-gray-900'}`}>
          {habit.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {!minimal && (
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full transition-colors duration-300 
              ${habit.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
              {habit.timeOfDay}
            </span>
          )}
          {habit.time && (
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors duration-300 flex items-center gap-1
             ${habit.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
               🕐 {formatTime(habit.time)}
             </span>
          )}
          {habit.recurrence && habit.recurrence.type === 'specific_days' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-400">
                ↺ {habit.recurrence.days.length} days/wk
              </span>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="relative z-20 flex items-center gap-2">
        {/* Edit Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(habit);
          }}
          className={`p-2 rounded-full transition-all duration-300 
            ${habit.completed 
              ? 'text-emerald-300 hover:text-emerald-600 hover:bg-emerald-100' 
              : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
            }`}
          aria-label="Edit habit"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        
        {/* Checkbox / Status Indicator */}
        <div className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500
          ${habit.completed 
            ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-200 scale-105 animate-ring-ping' 
            : 'border-gray-200 bg-gray-50 group-hover:border-pink-400 group-hover:bg-white'
          }
        `}>
          <CheckIcon className={`text-white w-4 h-4 transition-all duration-300 transform ${habit.completed ? 'animate-check-bounce' : 'opacity-0 scale-0'}`} />
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-6 mt-2">
    <h2 className="text-2xl font-bold text-gray-800 serif">{title}</h2>
    {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
  </div>
);

// --- Form Modal Component ---
interface HabitFormModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

const HabitFormModal: React.FC<HabitFormModalProps> = ({ habit, isOpen, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('✨');
  const [timeOfDay, setTimeOfDay] = useState<Habit['timeOfDay']>('morning');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<HabitCategory>('self');
  
  // Recurrence State
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    if (isOpen) {
      setTitle(habit?.title || '');
      setIcon(habit?.icon || '✨');
      setTimeOfDay(habit?.timeOfDay || 'morning');
      setTime(habit?.time || '');
      setCategory(habit?.category || 'self');
      if (habit?.recurrence) {
        setRecurrenceType(habit.recurrence.type);
        setSelectedDays(habit.recurrence.days);
      } else {
        setRecurrenceType('daily');
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      }
    }
  }, [isOpen, habit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = habit?.id || Date.now().toString();
    
    // Determine color based on time of day if it's new or time changed
    let color = habit?.color;
    if (!habit || habit.timeOfDay !== timeOfDay) {
         switch(timeOfDay) {
            case 'morning': color = 'bg-blue-100 text-blue-600'; break;
            case 'afternoon': color = 'bg-amber-100 text-amber-600'; break;
            case 'evening': color = 'bg-indigo-100 text-indigo-600'; break;
            default: color = 'bg-gray-100 text-gray-600';
         }
    }

    onSave({
       id,
       title,
       icon,
       timeOfDay,
       time,
       completed: habit?.completed || false,
       color: color || 'bg-gray-100 text-gray-600',
       category,
       recurrence: {
           type: recurrenceType,
           days: recurrenceType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedDays
       }
    });
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div className="bg-white w-full max-w-sm p-6 rounded-3xl shadow-2xl relative z-10 animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 serif">{habit ? 'Edit Habit' : 'New Habit'}</h3>
                <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    ✕
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Habit Name</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all placeholder:text-gray-300"
                        required
                        placeholder="e.g. Read 10 pages"
                    />
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                   <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Icon</label>
                      <input 
                          type="text" 
                          value={icon} 
                          onChange={e => setIcon(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-0 py-3 text-2xl text-center focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
                          maxLength={5}
                          required
                      />
                   </div>
                   <div className="col-span-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Time (Optional)</label>
                      <input 
                          type="time" 
                          value={time} 
                          onChange={e => setTime(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
                      />
                   </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {(['self', 'kids', 'pets', 'family'] as HabitCategory[]).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`flex-1 min-w-[60px] py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200 border-2 
                                    ${category === cat 
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' 
                                        : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Time of Day</label>
                    <div className="flex gap-2">
                        {['morning', 'afternoon', 'evening'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTimeOfDay(t as any)}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold capitalize transition-all duration-200 border-2 
                                    ${timeOfDay === t 
                                        ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm transform scale-105' 
                                        : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recurrence Section */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Repeat</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-3">
                        {['daily', 'specific_days'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setRecurrenceType(type as RecurrenceType)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${recurrenceType === type ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {type === 'daily' ? 'Every Day' : 'Specific Days'}
                            </button>
                        ))}
                    </div>

                    {recurrenceType === 'specific_days' && (
                        <div className="flex justify-between gap-1 animate-fade-in">
                            {weekDays.map((day, index) => {
                                const isSelected = selectedDays.includes(index);
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                if (selectedDays.length > 1) setSelectedDays(prev => prev.filter(d => d !== index));
                                            } else {
                                                setSelectedDays(prev => [...prev, index]);
                                            }
                                        }}
                                        className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200 transform ${isSelected ? 'bg-pink-500 text-white shadow-md shadow-pink-200 scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    >
                                        {day}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
                
                <div className="pt-4 flex gap-3">
                    {habit && (
                        <button type="button" onClick={() => onDelete(habit.id)} className="p-4 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors hover:scale-105 transform duration-200">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button type="submit" className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all hover:shadow-lg transform active:scale-95 duration-200">
                        {habit ? 'Save Changes' : 'Create Habit'}
                    </button>
                </div>
            </form>
        </div>
     </div>
  );
};

// --- Install App Modal ---
const InstallModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm p-6 rounded-3xl shadow-2xl relative z-10 animate-fade-in-up text-center">
        <h3 className="text-xl font-bold text-gray-800 serif mb-4">Install App</h3>
        <p className="text-gray-600 mb-6 text-sm">Add this app to your home screen for the full experience.</p>
        
        <div className="space-y-4 text-left">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">🤖 Android</div>
             <p className="text-xs text-gray-500">Tap <span className="font-bold">⋮ (Menu)</span> → <span className="font-bold">Add to Home screen</span></p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">🍎 iOS (Safari)</div>
             <p className="text-xs text-gray-500">Tap <span className="font-bold">Share</span> button → <span className="font-bold">Add to Home Screen</span></p>
          </div>
        </div>

        <button onClick={onClose} className="mt-6 bg-gray-900 text-white w-full py-3 rounded-xl font-bold">
          Got it
        </button>
      </div>
    </div>
  );
};

// --- Weekly Report Component ---
const WeeklyReport = ({ history }: { history: Record<string, number> }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create ordered array ending in today based on history
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = getDateKey(d);
    
    return {
      day: days[d.getDay()],
      value: history[dateKey] || 0,
      isToday: i === 6
    };
  });

  const average = Math.round(last7Days.reduce((acc, curr) => acc + curr.value, 0) / 7);

  return (
    <div className="mx-6 mt-8 bg-white rounded-2xl p-6 shadow-xl shadow-indigo-100/50">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-gray-800 font-bold flex items-center gap-2">
             <span className="text-indigo-500 p-1.5 bg-indigo-50 rounded-lg"><BarChartIcon className="w-4 h-4"/></span>
             Weekly Report
           </h3>
           <p className="text-xs text-gray-400 mt-1">Your consistency score: <span className="text-indigo-600 font-bold">{average}%</span></p>
        </div>
      </div>
      
      <div className="flex items-end justify-between h-32 gap-2">
        {last7Days.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
            <div className="relative w-full flex items-end justify-center h-full bg-gray-50 rounded-lg overflow-hidden">
               <div 
                 className={`w-full rounded-t-lg transition-all duration-1000 ease-out relative group-hover:opacity-80
                   ${item.isToday ? 'bg-gradient-to-t from-pink-500 to-orange-400' : 'bg-indigo-200'}
                 `}
                 style={{ height: `${item.value}%` }}
               >
                 {/* Tooltip */}
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                   {item.value}%
                 </div>
               </div>
            </div>
            <span className={`text-[10px] font-bold ${item.isToday ? 'text-pink-500' : 'text-gray-400'}`}>
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LAUNCH);
  
  // Habits with persistence and daily reset
  const [habits, setHabits] = useState<Habit[]>(() => {
    const savedHabits = localStorage.getItem('fabulous_habits');
    const lastOpenedDate = localStorage.getItem('fabulous_last_opened');
    const today = getDateKey();
    
    if (savedHabits) {
        let parsedHabits = JSON.parse(savedHabits);
        // If it's a new day, reset completion status
        if (lastOpenedDate !== today) {
            parsedHabits = parsedHabits.map((h: Habit) => ({ ...h, completed: false }));
        }
        return parsedHabits;
    }
    return DEFAULT_HABITS;
  });

  // History with persistence and seed data
  const [history, setHistory] = useState<Record<string, number>>(() => {
    const savedHistory = localStorage.getItem('fabulous_history');
    if (savedHistory) return JSON.parse(savedHistory);
    
    // Seed fake data for first-time user experience
    const seed: Record<string, number> = {};
    for (let i = 1; i <= 6; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        seed[getDateKey(d)] = Math.floor(Math.random() * 50) + 40; // 40-90% random
    }
    return seed;
  });

  const [dailyContent, setDailyContent] = useState<DailyContent | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [adviceModal, setAdviceModal] = useState<string | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  
  // Notification Logic
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };
  
  // Grocery State
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [groceryInput, setGroceryInput] = useState('');
  const [groceryQuantity, setGroceryQuantity] = useState('1');
  const [groceryUnit, setGroceryUnit] = useState<GroceryUnit>('pcs');

  // Modal State
  const [modalState, setModalState] = useState<{ isOpen: boolean, habit: Habit | null }>({ isOpen: false, habit: null });

  // Update Last Opened Date and Fetch Content
  useEffect(() => {
    localStorage.setItem('fabulous_last_opened', getDateKey());

    const fetchContent = async () => {
      setLoadingAI(true);
      const content = await getDailyMotivation();
      setDailyContent(content);
      setLoadingAI(false);
    };
    fetchContent();
  }, []);

  // Notification Scheduler
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // HH:MM
      const todayKey = getDateKey(now);

      habits.forEach(habit => {
        if (!habit.time || habit.completed) return;
        
        // Check if habit is scheduled for today (recurrence)
        if (!isHabitScheduledForToday(habit)) return;

        // Check if time matches
        if (habit.time === timeString) {
           // Check if already sent today
           const lastSent = localStorage.getItem(`notif_${habit.id}`);
           if (lastSent !== todayKey) {
              new Notification(`Time to ${habit.title}! ${habit.icon}`, {
                 body: `It's ${formatTime(habit.time)} - Time for your ${habit.timeOfDay} habit.`,
                 icon: 'https://cdn-icons-png.flaticon.com/512/3094/3094851.png'
              });
              localStorage.setItem(`notif_${habit.id}`, todayKey);
           }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [habits, notificationPermission]);

  const getProgress = () => {
    const todaysHabits = habits.filter(isHabitScheduledForToday);
    if (todaysHabits.length === 0) return 0;
    const completed = todaysHabits.filter(h => h.completed).length;
    return Math.round((completed / todaysHabits.length) * 100);
  };

  // Persist habits and history whenever habits change
  useEffect(() => {
      localStorage.setItem('fabulous_habits', JSON.stringify(habits));
      
      const currentProgress = getProgress();
      const todayKey = getDateKey();
      
      setHistory(prev => {
          // Prevent unnecessary state updates/renders if progress hasn't changed
          if (prev[todayKey] === currentProgress) return prev;
          
          const newHistory = { ...prev, [todayKey]: currentProgress };
          localStorage.setItem('fabulous_history', JSON.stringify(newHistory));
          return newHistory;
      });
  }, [habits]);

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const newState = !h.completed;
        if (newState) {
          playSuccessSound();
          // Trigger confetti
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2500); // Match duration of confetti fall
        }
        return { ...h, completed: newState };
      }
      return h;
    }));
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, habit: null });
  };

  const openEditModal = (habit: Habit) => {
    setModalState({ isOpen: true, habit });
  };

  const handleSaveHabit = (savedHabit: Habit) => {
    if (modalState.habit) {
        // Editing existing
        setHabits(prev => prev.map(h => h.id === savedHabit.id ? savedHabit : h));
    } else {
        // Creating new
        setHabits(prev => [...prev, savedHabit]);
    }
    setModalState({ isOpen: false, habit: null });
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setModalState({ isOpen: false, habit: null });
  };

  const handleGetAdvice = async (topic: string) => {
    setAdviceModal("Thinking...");
    const advice = await getPersonalizedAdvice(topic);
    setAdviceModal(advice);
  };

  const renderJourney = () => (
    <div className="animate-fade-in pb-24">
       <div className="relative h-64 bg-gradient-to-br from-pink-500 to-orange-400 rounded-b-[3rem] p-6 text-white overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">Today's Focus</span>
                <span className="text-2xl animate-pulse">✨</span>
             </div>
             <div>
               <h1 className="text-3xl font-bold serif leading-tight mb-2">
                 {loadingAI ? "Loading inspiration..." : dailyContent?.greeting}
               </h1>
               <p className="text-white/90 text-sm font-light leading-relaxed max-w-xs">
                 "{loadingAI ? "..." : dailyContent?.quote}"
               </p>
             </div>
          </div>
       </div>

       <div className="px-6 -mt-8 relative z-20">
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-pink-100/50">
             <h3 className="text-gray-800 font-bold mb-2 flex items-center gap-2">
               <span className="text-pink-500 p-1.5 bg-pink-50 rounded-lg"><RocketIcon className="w-4 h-4"/></span>
               Current Challenge
             </h3>
             <p className="text-gray-600 text-sm mb-4">You are on Day 3 of the "Hydration Hero" journey.</p>
             <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                <div className="bg-gradient-to-r from-pink-500 to-orange-400 h-2 rounded-full animate-[shimmer_2s_infinite]" style={{ width: '40%' }}></div>
             </div>
             <div className="flex justify-between text-xs text-gray-400 font-medium">
               <span>Start</span>
               <span>Goal: 7 Days</span>
             </div>
          </div>
       </div>

       {/* Weekly Report Section */}
       <WeeklyReport history={history} />

       <div className="px-6 mt-8">
         <SectionHeader title="My Journey" subtitle="Your personalized path to change" />
         <div className="space-y-4">
            <div className="group bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-lg hover:shadow-blue-100 transition-all border border-blue-100">
              <div>
                 <h4 className="font-bold text-blue-900 group-hover:text-blue-700 transition-colors">Morning Routine</h4>
                 <p className="text-xs text-blue-600 mt-1">Build an indestructible morning</p>
              </div>
              <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                 <SunIcon className="text-blue-500 w-6 h-6" />
              </div>
            </div>
            
            <div className="group bg-gradient-to-r from-indigo-50 to-purple-100 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-lg hover:shadow-indigo-100 transition-all border border-indigo-100">
              <div>
                 <h4 className="font-bold text-indigo-900 group-hover:text-indigo-700 transition-colors">Deep Work</h4>
                 <p className="text-xs text-indigo-600 mt-1">Master your focus</p>
              </div>
              <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                 <MountainIcon className="text-indigo-500 w-6 h-6" />
              </div>
            </div>
         </div>
       </div>
    </div>
  );

  const renderLaunch = () => {
    // Filter habits for display based on today's schedule
    const todaysHabits = habits.filter(isHabitScheduledForToday);

    return (
      <div className="px-6 pt-12 pb-24 animate-fade-in">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 serif">Today</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={() => setInstallModalOpen(true)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-pink-500 transition-colors" title="Install App">
                  <DownloadIcon className="w-5 h-5" />
              </button>
              <div className="text-center">
                 <div className="relative w-14 h-14 flex items-center justify-center">
                   <svg className="absolute w-full h-full transform -rotate-90">
                     <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                     <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-pink-500 transition-all duration-1000 ease-out" strokeDasharray={150} strokeDashoffset={150 - (150 * getProgress()) / 100} strokeLinecap="round" />
                   </svg>
                   <span className="text-xs font-bold text-gray-700">{getProgress()}%</span>
                 </div>
              </div>
          </div>
        </div>

        {/* Permission Request Banner */}
        {notificationPermission === 'default' && (
           <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
              <div>
                  <h3 className="font-bold text-sm">Enable Reminders?</h3>
                  <p className="text-xs text-indigo-100 opacity-90">Get notified when it's time for your habits.</p>
              </div>
              <button 
                onClick={requestNotificationPermission}
                className="bg-white text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50"
              >
                 <BellIcon className="w-4 h-4" />
              </button>
           </div>
        )}
  
        {loadingAI && (
           <div className="mb-6 bg-yellow-50 text-yellow-800 text-xs p-3 rounded-xl border border-yellow-100 animate-pulse flex items-center gap-2">
             <span className="animate-spin">⏳</span> Updating your daily plan...
           </div>
        )}
  
        {/* Morning Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-orange-500">
             <div className="p-1 bg-orange-100 rounded-full"><SunIcon className="w-4 h-4" /></div>
             <h2 className="font-bold uppercase tracking-wider text-xs">Morning</h2>
          </div>
          {todaysHabits.filter(h => h.timeOfDay === 'morning').map(habit => (
            <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onEdit={openEditModal} />
          ))}
          {todaysHabits.filter(h => h.timeOfDay === 'morning').length === 0 && (
            <p className="text-gray-400 text-sm italic pl-2 border-l-2 border-gray-100">No morning habits for today.</p>
          )}
        </div>
  
        {/* Afternoon Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-blue-500">
             <div className="p-1 bg-blue-100 rounded-full"><RocketIcon className="w-4 h-4" /></div>
             <h2 className="font-bold uppercase tracking-wider text-xs">Afternoon</h2>
          </div>
          {todaysHabits.filter(h => h.timeOfDay === 'afternoon').map(habit => (
            <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onEdit={openEditModal} />
          ))}
          {todaysHabits.filter(h => h.timeOfDay === 'afternoon').length === 0 && (
             <button 
               onClick={openCreateModal}
               className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
             >
               <PlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> Add Afternoon Habit
             </button>
          )}
        </div>
  
         {/* Evening Section */}
         <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-indigo-500">
             <div className="p-1 bg-indigo-100 rounded-full"><MoonIcon className="w-4 h-4" /></div>
             <h2 className="font-bold uppercase tracking-wider text-xs">Evening</h2>
          </div>
          {todaysHabits.filter(h => h.timeOfDay === 'evening').map(habit => (
            <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onEdit={openEditModal} />
          ))}
           {todaysHabits.filter(h => h.timeOfDay === 'evening').length === 0 && (
            <p className="text-gray-400 text-sm italic pl-2 border-l-2 border-gray-100">No evening habits for today.</p>
          )}
        </div>
        
        {/* Floating Action Button */}
        <div className="fixed bottom-24 right-6 z-30">
          <button 
            onClick={openCreateModal}
            className="bg-gray-900 text-white w-14 h-14 rounded-full shadow-xl shadow-gray-900/30 flex items-center justify-center hover:scale-110 hover:bg-black transition-all active:scale-95"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  const renderGrocery = () => (
    <div className="px-6 pt-12 pb-24 animate-fade-in min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 serif mb-6">Grocery List</h1>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (!groceryInput.trim()) return;
        setGroceryItems(prev => [...prev, { 
            id: Date.now().toString(), 
            text: groceryInput, 
            completed: false,
            quantity: groceryQuantity,
            unit: groceryUnit,
            emoji: getGroceryEmoji(groceryInput)
        }]);
        setGroceryInput('');
        setGroceryQuantity('1');
        setGroceryUnit('pcs');
      }} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
        
        <div className="mb-3">
            <input
            type="text"
            value={groceryInput}
            onChange={(e) => setGroceryInput(e.target.value)}
            placeholder="Item name (e.g. Apples)"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all shadow-sm placeholder:text-gray-300"
            />
        </div>

        <div className="flex gap-2">
            <input
                type="number"
                min="0"
                step="0.1"
                value={groceryQuantity}
                onChange={(e) => setGroceryQuantity(e.target.value)}
                placeholder="Qty"
                className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-center text-gray-800 font-medium focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
            />
            <select
                value={groceryUnit}
                onChange={(e) => setGroceryUnit(e.target.value as GroceryUnit)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-gray-800 font-medium focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all appearance-none"
            >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="g">gram</option>
                <option value="l">liter</option>
                <option value="ml">ml</option>
            </select>
            <button
            type="submit"
            disabled={!groceryInput.trim()}
            className="bg-green-500 text-white w-14 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-200"
            >
            <PlusIcon className="w-6 h-6" />
            </button>
        </div>
      </form>

      <div className="space-y-3">
        {groceryItems.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <ShoppingCartIcon className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Your shopping list is empty.</p>
          </div>
        )}
        
        {groceryItems.map(item => (
          <div 
            key={item.id}
            className={`flex items-center p-4 bg-white rounded-xl shadow-sm border transition-all duration-300 group ${item.completed ? 'border-green-100 bg-green-50/30' : 'border-gray-100 hover:border-green-200'}`}
          >
            <button
              onClick={() => {
                 setGroceryItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
                 if(!item.completed) playSuccessSound(); 
              }}
              className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-green-400'}`}
            >
              {item.completed && <CheckIcon className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1 flex items-center gap-3">
                 <span className="text-2xl">{item.emoji || '🛒'}</span>
                 <div>
                    <div className={`font-medium text-base ${item.completed ? 'text-gray-400 line-through decoration-green-500/30' : 'text-gray-700'}`}>
                        {item.text}
                    </div>
                    {(item.quantity && item.unit) && (
                        <div className="text-xs font-bold text-gray-400 bg-gray-100 inline-block px-2 py-0.5 rounded-md mt-1">
                            {item.quantity} {item.unit}
                        </div>
                    )}
                 </div>
            </div>
            
            <button 
              onClick={() => setGroceryItems(prev => prev.filter(i => i.id !== item.id))}
              className="text-gray-300 hover:text-red-400 p-2 transition-colors opacity-50 group-hover:opacity-100"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFamily = () => {
    const kidsHabits = habits.filter(h => h.category === 'kids');
    const petHabits = habits.filter(h => h.category === 'pets');
    const familyHabits = habits.filter(h => h.category === 'family');

    return (
        <div className="px-6 pt-12 pb-24 animate-fade-in bg-amber-50/30 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 serif mb-2">Family & Pets</h1>
            <p className="text-gray-500 text-sm mb-8">Care for the ones you love.</p>

            {/* Children Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">👶</span>
                    <h2 className="font-bold text-lg text-gray-800">Children</h2>
                </div>
                {kidsHabits.length > 0 ? (
                    kidsHabits.map(habit => (
                        <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onEdit={openEditModal} minimal />
                    ))
                ) : (
                    <div className="bg-white p-6 rounded-2xl text-center shadow-sm border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm mb-3">No tasks for children.</p>
                        <button onClick={() => { setModalState({isOpen: true, habit: null}); }} className="text-pink-500 font-bold text-sm">Add Habit</button>
                    </div>
                )}
            </div>

            {/* Pets Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🐾</span>
                    <h2 className="font-bold text-lg text-gray-800">Pets</h2>
                </div>
                {petHabits.length > 0 ? (
                    petHabits.map(habit => (
                        <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onEdit={openEditModal} minimal />
                    ))
                ) : (
                    <div className="bg-white p-6 rounded-2xl text-center shadow-sm border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm mb-3">No tasks for pets.</p>
                        <button onClick={() => { setModalState({isOpen: true, habit: null}); }} className="text-pink-500 font-bold text-sm">Add Habit</button>
                    </div>
                )}
            </div>

            {/* Other Family Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">❤️</span>
                    <h2 className="font-bold text-lg text-gray-800">Family & Parents</h2>
                </div>
                {familyHabits.length > 0 ? (
                    familyHabits.map(habit => (
                        <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onEdit={openEditModal} minimal />
                    ))
                ) : (
                     <p className="text-gray-400 text-sm italic">No family tasks.</p>
                )}
            </div>
            
            <div className="fixed bottom-24 right-6 z-30">
                <button 
                    onClick={openCreateModal}
                    className="bg-indigo-500 text-white w-14 h-14 rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:scale-110 hover:bg-indigo-600 transition-all active:scale-95"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
  };

  const renderDiscover = () => (
    <div className="px-6 pt-12 pb-24 animate-fade-in bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 serif mb-6">Discover</h1>
      
      {/* Quick Advice AI Chips */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">Ask your AI Coach</p>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {['Sleep Better', 'Reduce Anxiety', 'Stop Procrastinating', 'Love Myself'].map((topic) => (
             <button 
               key={topic}
               onClick={() => handleGetAdvice(topic)}
               className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 transition-all shadow-sm active:scale-95"
             >
               {topic}
             </button>
          ))}
        </div>
      </div>

      <SectionHeader title="Daily Coaching" />
      <div className="grid gap-6">
        {COACHING_SESSIONS.map((session, idx) => (
          <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-1">
             <div className="h-32 bg-gray-200 relative overflow-hidden">
                <img src={session.imageUrl} alt={session.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">
                   {session.duration}
                </div>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transform scale-50 group-hover:scale-100 transition-transform">
                        <PlayIcon className="w-5 h-5 text-pink-500 ml-1" />
                    </div>
                </div>
             </div>
             <div className="p-5">
                <div className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-1">{session.category}</div>
                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-pink-600 transition-colors">{session.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{session.description}</p>
             </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-indigo-900 rounded-3xl p-8 text-white text-center relative overflow-hidden shadow-2xl shadow-indigo-900/40">
         <div className="relative z-10">
            <h3 className="font-bold text-xl serif mb-2">Join the Community</h3>
            <p className="text-indigo-200 text-sm mb-6 max-w-[200px] mx-auto">5 million people are building habits with you.</p>
            <button className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold text-sm hover:bg-indigo-50 transition-transform hover:scale-105 shadow-lg">
              View Challenges
            </button>
         </div>
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full -mr-10 -mt-10 opacity-50 mix-blend-multiply"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500 rounded-full -ml-10 -mb-10 opacity-50 mix-blend-multiply"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col font-sans text-gray-900">
      
      {/* Advice Modal */}
      {adviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAdviceModal(null)}></div>
           <div className="bg-white p-8 rounded-3xl max-w-sm relative z-10 animate-fade-in-up text-center shadow-2xl">
              <div className="text-4xl mb-4">🧙‍♂️</div>
              <h3 className="font-bold text-xl serif mb-4 text-gray-800">Coach Says</h3>
              <p className="text-gray-600 leading-relaxed mb-6 font-medium">"{adviceModal}"</p>
              <button onClick={() => setAdviceModal(null)} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Thanks!</button>
           </div>
        </div>
      )}

      {/* Install Modal */}
      <InstallModal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} />

      <HabitFormModal 
        habit={modalState.habit}
        isOpen={modalState.isOpen}
        onClose={() => setModalState({isOpen: false, habit: null})}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />
      
      {/* Confetti Overlay */}
      {showConfetti && <Confetti />}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
         {activeTab === AppTab.JOURNEY && renderJourney()}
         {activeTab === AppTab.LAUNCH && renderLaunch()}
         {activeTab === AppTab.FAMILY && renderFamily()}
         {activeTab === AppTab.GROCERY && renderGrocery()}
         {activeTab === AppTab.DISCOVER && renderDiscover()}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-between items-center py-4 px-4 absolute bottom-0 w-full z-40 max-w-md">
        <button 
          onClick={() => setActiveTab(AppTab.JOURNEY)}
          className={`flex flex-col items-center gap-1 w-12 transition-all duration-300 ${activeTab === AppTab.JOURNEY ? 'text-pink-500 -translate-y-2' : 'text-gray-300 hover:text-gray-500'}`}
        >
          <CompassIcon className={`w-6 h-6 ${activeTab === AppTab.JOURNEY ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold tracking-wide">Journey</span>
          {activeTab === AppTab.JOURNEY && <span className="w-1 h-1 bg-pink-500 rounded-full mt-1"></span>}
        </button>

        <button 
          onClick={() => setActiveTab(AppTab.LAUNCH)}
          className={`flex flex-col items-center gap-1 w-12 transition-all duration-300 ${activeTab === AppTab.LAUNCH ? 'text-blue-500 -translate-y-2' : 'text-gray-300 hover:text-gray-500'}`}
        >
          <RocketIcon className={`w-6 h-6 ${activeTab === AppTab.LAUNCH ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold tracking-wide">Launch</span>
           {activeTab === AppTab.LAUNCH && <span className="w-1 h-1 bg-blue-500 rounded-full mt-1"></span>}
        </button>

        <button 
          onClick={() => setActiveTab(AppTab.FAMILY)}
          className={`flex flex-col items-center gap-1 w-12 transition-all duration-300 ${activeTab === AppTab.FAMILY ? 'text-amber-500 -translate-y-2' : 'text-gray-300 hover:text-gray-500'}`}
        >
          <UsersIcon className={`w-6 h-6 ${activeTab === AppTab.FAMILY ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold tracking-wide">Family</span>
           {activeTab === AppTab.FAMILY && <span className="w-1 h-1 bg-amber-500 rounded-full mt-1"></span>}
        </button>

        <button 
          onClick={() => setActiveTab(AppTab.GROCERY)}
          className={`flex flex-col items-center gap-1 w-12 transition-all duration-300 ${activeTab === AppTab.GROCERY ? 'text-green-500 -translate-y-2' : 'text-gray-300 hover:text-gray-500'}`}
        >
          <ShoppingCartIcon className={`w-6 h-6 ${activeTab === AppTab.GROCERY ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold tracking-wide">Grocery</span>
           {activeTab === AppTab.GROCERY && <span className="w-1 h-1 bg-green-500 rounded-full mt-1"></span>}
        </button>

        <button 
          onClick={() => setActiveTab(AppTab.DISCOVER)}
          className={`flex flex-col items-center gap-1 w-12 transition-all duration-300 ${activeTab === AppTab.DISCOVER ? 'text-indigo-500 -translate-y-2' : 'text-gray-300 hover:text-gray-500'}`}
        >
          <SunIcon className={`w-6 h-6 ${activeTab === AppTab.DISCOVER ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold tracking-wide">Discover</span>
           {activeTab === AppTab.DISCOVER && <span className="w-1 h-1 bg-indigo-500 rounded-full mt-1"></span>}
        </button>
      </div>
    </div>
  );
};

export default App;