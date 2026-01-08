# V1 Web

React + TypeScript project with Rolldown and Oxlint.

## Quick Start

### Run Development Server
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Run Linter
```bash
npm run lint
```

## Tech Stack

- **React 19.2.0** - UI library
- **TypeScript 5.9** - Type safety
- **Rolldown** - Rust-based bundler (via rolldown-vite)
- **Oxlint** - Fast Rust-based linter
- **Storybook** - Component development environment

## Scripts

```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run lint             # Run oxlint linter
npm run preview          # Preview production build
npm run storybook        # Start Storybook dev server
npm run build-storybook  # Build static Storybook
```

## Project Structure

```
src/
├── assets/             # Static assets (images, icons)
├── App.tsx            # Main application component
└── main.tsx           # Entry point
```

## Storybook

Storybook is installed but currently empty. Add `.stories.tsx` files to start using Storybook for component development.

For more information, see [STORYBOOK.md](./STORYBOOK.md).
