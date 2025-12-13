# SmartBin Frontend (Next.js)

Modern, responsive frontend for the SmartBin waste management system built with Next.js 16, React 19, and TypeScript.

## 🚀 Features

- ✅ **Modern UI** - Built with Next.js 16 App Router and React 19
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **shadcn/ui** - Beautiful, accessible components
- ✅ **Real-time Updates** - Connected to backend microservices
- ✅ **Responsive Design** - Works on all devices
- ✅ **Dark Mode** - Theme support

## 📦 Tech Stack

- **Framework:** Next.js 16
- **React:** 19.2.0
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS 4.x
- **UI Components:** shadcn/ui + Radix UI
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Package Manager:** pnpm

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_BIN_SERVICE_URL=http://localhost:8002
NEXT_PUBLIC_DETECTION_SERVICE_URL=http://localhost:8003
NEXT_PUBLIC_RECLAMATION_SERVICE_URL=http://localhost:8004
NEXT_PUBLIC_APP_NAME=SmartBin
NEXT_PUBLIC_APP_VERSION=2.0.0
```

## 🏃 Development

### Local Development (without Docker)

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Docker Development

```bash
# From project root
make start

# Or with Docker Compose
docker-compose up frontend
```

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── bin-card.tsx      # Bin display card
│   ├── bin-control.tsx   # Bin control modal
│   ├── dashboard-view.tsx # Dashboard view
│   └── map-view.tsx      # Map view
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Helper functions
├── public/              # Static assets
├── styles/              # Additional styles
├── .env.local          # Environment variables
├── next.config.mjs     # Next.js configuration
├── package.json        # Dependencies
├── tailwind.config.ts  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

## 🔌 API Integration

The frontend connects to the following backend services:

- **Auth Service** (8001) - User authentication and points
- **Bin Service** (8002) - Bin management and control
- **Detection Service** (8003) - Material detection data
- **Reclamation Service** (8004) - Issue reporting

All API calls are handled through `lib/api.ts`.

## 🎨 UI Components

Built with shadcn/ui for consistency and accessibility:

- Buttons, Cards, Badges
- Forms, Inputs, Selects
- Dialogs, Sheets, Toasts
- Progress bars, Charts
- And more...

## 🧪 Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 📝 Key Components

### Dashboard View

- Displays all available bins
- Real-time status updates
- Filter by status and location

### Bin Card

- Shows bin details (capacity, location, status)
- Interactive controls
- Visual fill level indicator

### Bin Control

- Open/close bin remotely
- Simulated material detection
- Points earning system

## 🔄 Migration from Old Frontend

The old vanilla HTML/CSS/JS frontend has been backed up to `frontend_backup/` and replaced with this modern Next.js application.

Key improvements:

- ✅ Better performance with React Server Components
- ✅ Type safety with TypeScript
- ✅ Modern UI/UX
- ✅ Better state management
- ✅ Improved developer experience

## 🐛 Troubleshooting

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Dependencies issues

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build errors

```bash
# Check TypeScript errors
pnpm run lint

# Force rebuild
rm -rf .next
pnpm build
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contributing

See the main project README for contribution guidelines.
