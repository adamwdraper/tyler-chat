# Tyler Chat Frontend

A modern chat interface for the Tyler AI agent, built with React, Material-UI, and Redux Toolkit.

## Features

- Real-time chat interface with AI agent
- Thread management
- Responsive design with mobile support
- Modern Material Design using Modernize theme

## Prerequisites

- Node.js 20+ and npm 10+
- Tyler backend server running on port 8000

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (optional):
```
VITE_API_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Project Structure

- `/src/components/chat` - Chat-related components
- `/src/store` - Redux store and slices
- `/src/types` - TypeScript type definitions
- `/src/theme.ts` - Material-UI theme configuration

## Technologies Used

- React 18
- Material-UI 5
- Redux Toolkit
- TypeScript
- Vite 