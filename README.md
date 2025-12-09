# 🚀 Sky Guardian: Aether Defense

A high-performance HTML5 Canvas space shooter game built with React 19, TypeScript, and Vite. Features dynamic particle systems, progressive enemy waves, and retro-style synthesized audio effects.

## ✨ Features

- **🎮 Classic Space Shooter Gameplay**: Control your ship and defend against waves of enemies
- **⚡ High Performance**: Optimized canvas rendering with efficient collision detection
- **🎨 Modern UI**: Built with React 19 and Tailwind CSS for a sleek, responsive interface
- **🎵 Dynamic Audio**: Web Audio API-powered retro sound effects (shooting, explosions, hits)
- **💫 Particle Effects**: Smooth particle systems for explosions and visual feedback
- **🏆 Score System**: Track your progress with score and high score persistence
- **📱 Responsive Design**: Optimized for various screen sizes
- **⌨️ Intuitive Controls**: Arrow keys for movement, spacebar to shoot

## 🛠️ Tech Stack

- **React 19.2.1** - Latest React with modern features
- **TypeScript 5.8** - Type-safe development
- **Vite 6.2** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework (via CDN)
- **HTML5 Canvas API** - High-performance 2D graphics rendering
- **Web Audio API** - Real-time audio synthesis

## 🎯 Game Mechanics

- **Lives System**: Start with 3 lives, lose one when hit by enemies
- **Progressive Difficulty**: Enemies spawn faster as your score increases
- **Power System**: Strategic shooting with limited power regeneration
- **Multiple Enemy Types**: Various enemy patterns and behaviors
- **Collision Detection**: Precise hitbox calculations for fair gameplay

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Jarvis219/Game-Sky-Guardian.git
cd Game-Sky-Guardian

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start development server (default: http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🎮 How to Play

1. **Movement**: Use `Arrow Keys` (↑ ↓ ← →) to move your ship
2. **Shoot**: Press `Spacebar` to fire bullets
3. **Objective**: Destroy enemies, avoid collisions, and survive as long as possible
4. **Strategy**: Manage your power bar - it regenerates slowly, so shoot wisely!

## 📁 Project Structure

```
Game-Sky-Guardian/
├── components/
│   ├── GameCanvas.tsx    # Main game rendering and logic
│   ├── GameOver.tsx      # Game over screen
│   ├── HUD.tsx          # Heads-up display (score, lives, power)
│   └── MainMenu.tsx     # Start screen
├── services/
│   └── audioService.ts   # Web Audio API sound effects
├── utils/
│   └── gameUtils.ts      # Collision detection & utilities
├── App.tsx              # Main app component
├── index.tsx            # React entry point
├── index.html           # HTML template
├── types.ts             # TypeScript type definitions
├── constants.ts         # Game constants and configuration
└── vite.config.ts       # Vite configuration
```

## 🎨 Customization

### Adjust Game Difficulty

Edit `constants.ts` to modify:

- Enemy spawn rates
- Player speed and shooting power
- Bullet damage and speed
- Lives count

### Modify Visual Style

- Update Tailwind config in `index.html` for color schemes
- Adjust particle effects in `GameCanvas.tsx`
- Customize UI components in `components/` folder

## 🐛 Known Issues

- Audio may not play on first interaction (browser autoplay policy)
- Performance may vary on low-end devices

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available for personal and educational use.

## 🙏 Acknowledgments

- Inspired by classic arcade space shooters
- Built with modern web technologies
- Sound effects generated using Web Audio API

---

**Enjoy the game! 🎮✨**

For issues or suggestions, please open an issue on GitHub.
