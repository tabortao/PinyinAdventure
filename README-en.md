# Pinyin Adventure (Smart Pinyin Learning Game)

## 1. Introduction
**Pinyin Adventure** is an interactive Pinyin learning application designed specifically for elementary school students. Combining gamified teaching concepts with fun challenges, we help children easily master Chinese Pinyin initials, finals, and overall recognition syllables. The project is built with React, Tailwind CSS, and Supabase, providing a seamless experience across multiple devices.

## 2. Features

### 2.1 Adventure Mode
- **Scientific Grading**: Difficulty levels are scientifically divided from Grade 1 to Grade 6 based on textbook standards.
- **Multiple Question Types**: Includes single characters, words, and sentences to comprehensively train spelling skills.
- **Instant Feedback**: Correct answers trigger celebration animations and sound effects, while incorrect answers provide smart hints and recording.

### 2.2 Smart Review
- **Ebbinghaus Memory**: Built-in smart review algorithm automatically schedules review content based on user forgetting curves.
- **Mistake Notebook**: Automatically records misspelled Pinyin and provides targeted reinforcement training.

### 2.3 Fun Interaction
- **Cartoon Style**: Uses fresh blue-green tones and cute cartoon elements to attract children's interest.
- **Voice Reading**: Standard Pinyin TTS pronunciation supporting initial call sounds (e.g., b -> 'bo'), correcting pronunciation errors.
- **Achievement System**: Records adventure progress and points to motivate learning.

## 3. Tech Stack
- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS + Shadcn/UI (Lucide Icons)
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context + Hooks
- **Routing**: React Router v6

## 4. Deployment

### 4.1 Prerequisites
- Node.js >= 16.0.0
- npm or pnpm

### 4.2 Installation
```bash
npm install
# or
pnpm install
```

### 4.3 Environment Variables
Copy `.env.example` to `.env` and fill in Supabase configuration:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4.4 Development & Build
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 5. Author Info
- **Author**: Tabor
- **WeChat**: tabor2024 (Welcome feedback)
- **Version**: v1.6.0

## 6. Directory Structure
```txt
├── README.md # Documentation
├── index.html # Entry file
├── package.json # Package configuration
├── postcss.config.js # PostCSS configuration
├── public # Static assets directory
│   ├── favicon.png # Icon
│   └── images # Image resources
├── src # Source code directory
│   ├── index.css # Global styles
│   ├── main.tsx # Project entry file
├── tsconfig.app.json  # TS frontend configuration
├── tsconfig.json # TS configuration
├── tsconfig.node.json # TS Node configuration
└── vite.config.ts # Vite configuration
```
