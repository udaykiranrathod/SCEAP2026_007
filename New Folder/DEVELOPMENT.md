# SCEAP 2.0 Development Guide

## Overview

This guide will help you get SCEAP 2.0 running on your local development machine.

## Prerequisites

Before you start, ensure you have the following installed:

- **[.NET 8 SDK](https://dotnet.microsoft.com/download)** - Backend runtime
- **[Node.js 18+](https://nodejs.org/)** - Frontend runtime
- **Git** - Version control
- **Visual Studio Code** (recommended) or any code editor

## Quick Start (5 minutes)

### Option 1: Automated Setup

**On Linux/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

**On Windows:**
```bash
setup.bat
```

### Option 2: Manual Setup

#### Step 1: Backend Setup
```bash
cd sceap-backend

# Restore NuGet packages
dotnet restore

# Create SQLite database and apply migrations
dotnet ef database update

# Run the backend server
dotnet run --launch-profile https
```

Backend will be available at: `https://localhost:5001`

#### Step 2: Frontend Setup (in a new terminal)
```bash
cd sceap-frontend

# Install npm packages
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

#### Step 3: Access the Application
Open your browser and navigate to: **http://localhost:3000**

## Architecture Overview

### Backend (.NET Core)

**Key Directories:**
- `Controllers/` - REST API endpoints
- `Services/` - Business logic layer
- `Engines/` - Cable sizing and routing calculation engines
- `Models/` - Domain models (Project, Cable, Tray, etc.)
- `Data/` - Entity Framework Core context

**Main Components:**

1. **Database** (SQLite)
   - Project management
   - Cable specifications
   - Tray information
   - Cable routes
   - Terminations
   - Reports

2. **Calculation Engines**
   - Cable Sizing Engine (IEC 60287, IS 1554 standards)
   - Routing Engine (Dijkstra's algorithm, Least-Fill algorithm)

3. **API Controllers**
   - ProjectsController
   - CableSizingController
   - CableRoutingController
   - TrayFillController
   - TerminationController

### Frontend (React)

**Key Directories:**
- `components/` - Reusable UI components
- `pages/` - Full page layouts
- `services/` - API integration
- `types/` - TypeScript interfaces
- `utils/` - Helper functions

**Main Pages:**
1. Dashboard - KPI cards, charts, tray status
2. Cable Sizing - Calculate cable specifications
3. Cable Routing - Optimize cable routes
4. Tray Fill - Monitor tray utilization
5. Drum Estimation - (Coming soon)
6. Termination - (Coming soon)
7. Reports - (Coming soon)

## Development Workflow

### Running the Full Stack

1. **Terminal 1 - Backend:**
   ```bash
   cd sceap-backend
   dotnet watch run --launch-profile https
   ```
   Uses `dotnet watch` for hot reload

2. **Terminal 2 - Frontend:**
   ```bash
   cd sceap-frontend
   npm run dev
   ```
   Vite provides instant HMR

3. **Terminal 3 - Optional (for database updates):**
   ```bash
   cd sceap-backend
   dotnet ef migrations add MigrationName
   dotnet ef database update
   ```

### API Testing

#### Using Swagger UI
Navigate to: `https://localhost:5001/swagger`

#### Using curl
```bash
# Get all projects
curl https://localhost:5001/api/projects

# Calculate cable size
curl -X POST https://localhost:5001/api/cablesizing/calculate \
  -H "Content-Type: application/json" \
  -d '{"cableNumber":"CB-001","loadKW":100,"voltage":415}'
```

#### Using VS Code REST Client
Install "REST Client" extension and use `.http` files

## Database Management

### SQLite Database

The SQLite database file is created automatically: `sceap.db`

### Database Operations

**Create a new migration:**
```bash
cd sceap-backend
dotnet ef migrations add AddNewTable
```

**Apply migrations:**
```bash
dotnet ef database update
```

**Drop and recreate database:**
```bash
dotnet ef database drop -f
dotnet ef database update
```

### Database Schema

Tables created:
- `Projects` - Project metadata
- `Cables` - Cable specifications
- `Trays` - Cable tray information
- `CableRoutes` - Optimized cable routes
- `Terminations` - Cable connections
- `DrumSpools` - Drum estimation data
- `Raceways` - Raceway layout
- `Reports` - Generated reports

## Common Tasks

### Adding a New Page

1. Create component in `sceap-frontend/src/pages/NewPage.tsx`
2. Add route in `sceap-frontend/src/App.tsx`
3. Add navigation item in `sceap-frontend/src/components/Sidebar.tsx`

Example:
```tsx
// src/pages/NewPage.tsx
import React from 'react'
import { Layout } from '@/components/Layout'
import { PageHeader } from '@/components/Dashboard'

export const NewPage: React.FC = () => {
  return (
    <Layout>
      <PageHeader title="New Feature" subtitle="Description" />
      {/* Content here */}
    </Layout>
  )
}
```

### Adding a New API Endpoint

1. Create controller in `sceap-backend/Controllers/NewController.cs`
2. Add routes with `[Route]` and `[HttpGet/Post/Put/Delete]` attributes
3. Swagger documentation auto-generated

### Creating a New Component

Create in `sceap-frontend/src/components/YourComponent.tsx`:

```tsx
import React from 'react'

interface Props {
  // Define props
}

export const YourComponent: React.FC<Props> = (props) => {
  return (
    <div className="card-glow p-6">
      {/* Component content */}
    </div>
  )
}
```

## Styling Guide

### TailwindCSS Classes

**Colors:**
- Primary: `cyan-500` (#22d3ee)
- Background: `slate-950` (#030712)
- Success: `emerald-*`
- Warning: `amber-*`
- Error: `red-*`

**Common Classes:**
```tsx
// Cards
<div className="card-glow p-6"> ... </div>

// Buttons
<button className="btn-primary"> ... </button>
<button className="btn-secondary"> ... </button>
<button className="btn-danger"> ... </button>

// Inputs
<input className="input-field" />

// Badges
<span className="badge-success"> ... </span>
<span className="badge-warning"> ... </span>
<span className="badge-error"> ... </span>

// Gradient text
<span className="gradient-text"> ... </span>
```

## Troubleshooting

### Backend Issues

**"dotnet: command not found"**
- Install .NET 8 SDK from https://dotnet.microsoft.com/download

**"Cannot open database file"**
- Delete `sceap.db` and run `dotnet ef database update`

**Port 5001 already in use**
- Kill the process: `lsof -ti:5001 | xargs kill -9` (macOS/Linux)
- Or change port in `launchSettings.json`

### Frontend Issues

**"npm: command not found"**
- Install Node.js from https://nodejs.org/

**Module not found errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Port 3000 already in use**
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or change port in `vite.config.ts`

### Database Issues

**Migration conflicts**
```bash
dotnet ef database drop -f
dotnet ef database update
```

## Deployment

### Backend Deployment

1. **Build for production:**
   ```bash
   dotnet publish -c Release -o out
   ```

2. **Deploy the `out` folder to your server**

3. **Configure environment:**
   - Set connection string for PostgreSQL
   - Set production appsettings.json

### Frontend Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder to:**
   - Web server (nginx, Apache)
   - CDN (Cloudflare, AWS CloudFront)
   - Static hosting (Vercel, Netlify, GitHub Pages)

## Performance Tips

1. **Frontend:**
   - Use React DevTools Profiler
   - Check bundle size: `npm run build && npm run preview`
   - Lazy load pages with React.lazy

2. **Backend:**
   - Use EF Core query profiling
   - Add database indexes for frequently queried columns
   - Implement caching for calculation results

## Code Quality

### Run TypeScript compiler
```bash
cd sceap-frontend
npx tsc --noEmit
```

### Format code
```bash
# Backend (VS Code extension: C#)
# Frontend - Prettier already configured
```

## Getting Help

- Check API docs: `https://localhost:5001/swagger`
- Read inline code comments
- Review TypeScript interfaces for prop definitions
- Check component usage in other pages

## Next Development Priorities

1. ✅ Basic project structure
2. ✅ Dashboard with visualizations
3. ✅ Cable sizing module
4. ⏳ Cable routing module
5. ⏳ Additional pages and features
6. ⏳ Authentication/Authorization
7. ⏳ Advanced 3D visualizations
8. ⏳ PDF report generation

Happy coding! 🚀
