# SCEAP 2.0 Quick Reference

## 🚀 Start Here

### 1. First Time Setup (5 minutes)
```bash
# Linux/macOS
chmod +x setup.sh && ./setup.sh

# Windows
setup.bat

# Or manual:
cd sceap-backend && dotnet restore && dotnet ef database update
cd ../sceap-frontend && npm install
```

### 2. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd sceap-backend
dotnet run --launch-profile https
```

**Terminal 2 - Frontend:**
```bash
cd sceap-frontend
npm run dev
```

### 3. Open Application
- Frontend: **http://localhost:3000**
- API Docs: **https://localhost:5001/swagger**

---

## 📁 Key Files Reference

### Backend
| File | Purpose |
|------|---------|
| `Program.cs` | App startup, DI setup |
| `Models/DomainModels.cs` | Database entities |
| `Data/SceapDbContext.cs` | EF Core context |
| `Engines/CableSizingEngine.cs` | Cable calculations |
| `Engines/RoutingEngine.cs` | Path optimization |
| `Services/ServiceImplementations.cs` | Business logic |
| `Controllers/*.cs` | REST endpoints |

### Frontend
| File | Purpose |
|------|---------|
| `App.tsx` | Main router |
| `index.css` | Global styles & utilities |
| `components/Layout.tsx` | Main layout wrapper |
| `components/Sidebar.tsx` | Navigation menu |
| `pages/Dashboard.tsx` | Home page |
| `services/api.ts` | API client |
| `types/index.ts` | TypeScript interfaces |

---

## 🎨 Component Library

### Prebuilt Components
```tsx
// Page layout
<Layout> {/* children */} </Layout>

// Page header
<PageHeader title="Title" subtitle="Subtitle" action={button} />

// KPI Card
<KPICard title="Label" value="123" color="cyan" icon={<Icon />} />

// Data Table
<DataTable 
  columns={[{ key: 'name', label: 'Name' }]} 
  data={[]} 
/>

// Card with glow
<div className="card-glow p-6"> {/* content */} </div>

// Buttons
<button className="btn-primary">Click me</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-danger">Delete</button>

// Input
<input className="input-field" placeholder="..." />

// Badges
<span className="badge-success">Success</span>
<span className="badge-warning">Warning</span>
<span className="badge-error">Error</span>
```

---

## 🔧 Common Tasks

### Add a New Page
1. Create `src/pages/NewPage.tsx`
2. Add to `App.tsx` routes
3. Add to sidebar menu in `Sidebar.tsx`

### Call Backend API
```tsx
import { projectsAPI } from '@/services/api'

const projects = await projectsAPI.getAll()
const cable = await cableSizingAPI.calculate({ /* data */ })
```

### Show Notification
```tsx
import { showNotification } from '@/components/Toast'

showNotification('Success!', 'success')
showNotification('Error!', 'error')
showNotification('Warning!', 'warning')
```

### Database Update
```bash
cd sceap-backend
dotnet ef migrations add MigrationName
dotnet ef database update
```

---

## 📊 API Endpoints

### Projects
```
GET    /api/projects              # List all
GET    /api/projects/{id}         # Get one
POST   /api/projects              # Create
PUT    /api/projects/{id}         # Update
DELETE /api/projects/{id}         # Delete
```

### Cable Sizing
```
POST   /api/cablesizing/calculate                  # Calculate
GET    /api/cablesizing/sizes/{projectId}         # Get cables
POST   /api/cablesizing/{id}/approve              # Approve
POST   /api/cablesizing/export/{projectId}        # Export
```

### Cable Routing
```
POST   /api/cablerouting/optimize                 # Optimize
GET    /api/cablerouting/routes/{projectId}      # List routes
GET    /api/cablerouting/route/{id}               # Get details
```

### Tray Fill
```
GET    /api/trayfill/status/{projectId}           # Tray status
GET    /api/trayfill/utilization/{projectId}      # Utilization
GET    /api/trayfill/critical/{projectId}         # Critical only
GET    /api/trayfill/recommendations/{projectId}  # Suggestions
```

### Termination
```
GET    /api/termination/{projectId}               # List
POST   /api/termination                           # Create
PUT    /api/termination/{id}/status               # Update status
GET    /api/termination/summary/{projectId}       # Summary
```

---

## 🎨 TailwindCSS Classes

### Colors
```
text-cyan-400          # Cyan text
text-slate-400         # Gray text
bg-slate-900/50        # Semi-transparent dark
border-cyan-500/20     # Subtle cyan border
```

### Components
```
card-glow              # Styled card with glow
btn-primary            # Primary button
btn-secondary          # Secondary button
badge-success          # Green badge
gradient-text          # Cyan/blue gradient text
```

### Responsive
```
grid-cols-1            # Mobile: 1 column
md:grid-cols-2         # Tablet: 2 columns
lg:grid-cols-4         # Desktop: 4 columns
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5001 in use | Kill: `lsof -ti:5001 \| xargs kill -9` |
| Port 3000 in use | Kill: `lsof -ti:3000 \| xargs kill -9` |
| Database locked | Delete `sceap.db` and run migrations |
| npm error | Delete `node_modules` and `npm install` |
| .NET error | Install .NET 8 SDK from microsoft.com |

---

## 📚 Documentation

- **README.md** - Project overview
- **DEVELOPMENT.md** - Detailed guide
- **PROJECT_SUMMARY.md** - Complete implementation summary
- **This file** - Quick reference

---

## 🎯 Important Points

1. **Frontend proxy:** `/api/*` → `http://localhost:5001/api/*`
2. **Database:** SQLite (`sceap.db`) auto-created on first run
3. **Styling:** TailwindCSS with custom utilities in `index.css`
4. **Icons:** 40+ icons from Lucide React
5. **Charts:** Recharts for visualizations

---

## 📞 Key URLs in Development

- App: http://localhost:3000
- API: https://localhost:5001
- Swagger: https://localhost:5001/swagger
- Swagger JSON: https://localhost:5001/swagger/v1/swagger.json

---

## 🚀 Next Steps

1. ✅ Run the application
2. Explore the Dashboard
3. Test Cable Sizing page
4. Review code structure
5. Add your first feature
6. Run backend on watch mode: `dotnet watch run`

---

## 💡 Pro Tips

- Use `dotnet watch run` for hot reload
- Use `npm run dev` for Vite HMR
- Check Swagger UI for API testing
- Use React DevTools browser extension
- Check browser console for errors

---

**Happy coding!** 🎉
