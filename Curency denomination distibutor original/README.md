# Currency Denomination Distributor - Enterprise Edition

A comprehensive multi-platform currency denomination system supporting offline-first operation, multi-currency processing, AI-powered insights, and public API access.

## 🎯 Project Overview

This system handles currency denomination breakdown for extremely large amounts (tens of lakh crores and beyond) across multiple currencies with:

- **Offline-first architecture** - Core functionality works without internet
- **Multi-platform support** - Desktop (Electron), Mobile (React Native), Web (Next.js)
- **AI-powered insights** - Google Gemini integration for intelligent explanations
- **Public REST API** - For external integrations with rate limiting and authentication
- **Advanced analytics** - Real-time dashboards and trend analysis

## 🏗️ Architecture

### Four-Layer Design

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
│  Electron Desktop │ React Native Mobile │ Web Dashboard     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION/API LAYER                      │
│    Local API (Offline)    │    Cloud API (Online + Sync)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DOMAIN/CORE SERVICES                       │
│ Denomination Engine │ FX Service │ Optimization Engine      │
│ History │ Analytics │ Export │ Gemini Integration           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  SQLite (Local) │ PostgreSQL (Cloud) │ Redis │ S3 Storage   │
└─────────────────────────────────────────────────────────────┘
```

### Operating Modes

#### Offline Mode (Desktop)
```
Electron UI → Local FastAPI Backend → SQLite DB
```
**Available Features:**
- Single & bulk calculations
- Multi-currency denomination breakdown
- Local history (full + last 10 quick access)
- Dark mode & theming
- Exports (CSV/Excel/PDF/Print)
- Charts & visualizations

#### Online Mode (Full System)
```
Desktop/Mobile/Web → Cloud API → PostgreSQL + Services
                                    ↓
                        External APIs (FX Rates, Gemini)
```
**Additional Features:**
- Live exchange rates
- Multi-user authentication & sync
- AI-powered explanations (Gemini)
- Public REST API access
- Analytics dashboard
- Cross-device synchronization

## 🛠️ Tech Stack

### Frontend & Client Applications
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Desktop App | Electron + React | Cross-platform desktop with web technologies |
| Mobile App | React Native | iOS & Android with shared component logic |
| Web Dashboard | Next.js + React | Admin panel, analytics, SEO-friendly |
| Charts | Chart.js + D3.js | Visualizations and animated transitions |
| State Management | Redux Toolkit | Consistent state across platforms |
| UI Framework | Tailwind CSS + ShadCN UI | Modern, themeable, dark mode support |

### Backend Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Local Backend | Python + FastAPI | Offline mode on user machine |
| Cloud Backend | Python + FastAPI | Multi-user, auth, sync, public API |
| Core Engine | Pure Python Module | Reusable denomination logic |
| AI Integration | Google Gemini API | Explanations and suggestions |

### Database & Storage
| Usage | Technology | Reason |
|-------|-----------|--------|
| Local DB | SQLite | Lightweight, file-based, offline-perfect |
| Mobile Cache | SQLite (WatermelonDB) | Offline history and caching |
| Cloud DB | PostgreSQL | Scalable, JSONB support, relational |
| Analytics | ClickHouse (optional) | Fast querying for trend analysis |
| File Storage | Local FS + S3 | Exports, backups, report storage |

### DevOps & Cloud
| Component | Technology |
|-----------|-----------|
| Containers | Docker + Kubernetes |
| CI/CD | GitHub Actions |
| Hosting | AWS / GCP / Azure / Render |
| Monitoring | Grafana + Prometheus |
| API Gateway | Kong / NGINX |

## 📂 Project Structure

```
currency-denomination-system/
├── packages/
│   ├── core-engine/              # Pure Python denomination logic
│   ├── desktop-app/              # Electron + React application
│   ├── mobile-app/               # React Native application
│   ├── web-dashboard/            # Next.js admin/analytics dashboard
│   ├── local-backend/            # FastAPI offline backend
│   ├── cloud-backend/            # FastAPI cloud backend + public API
│   └── shared/                   # Shared types, utilities, configs
├── docs/                         # Architecture & API documentation
├── docker/                       # Docker configurations
└── scripts/                      # Build and deployment scripts
```

## ✨ Key Features

### Core Functionality
- ✅ **Multi-Currency Support** - INR, USD, EUR, GBP (extensible)
- ✅ **Extreme Large Numbers** - Handles tens of lakh crores accurately
- ✅ **Offline-First** - Full functionality without internet
- ✅ **Live FX Rates** - Real-time currency conversion (online mode)
- ✅ **Smart Optimization** - Multiple distribution strategies

### Optimization Modes
1. **Pure Greedy** - Minimize total number of notes
2. **Constrained Greedy** - Minimize specific denominations
3. **Custom Constraints** - Avoid specific denominations, cap counts
4. **AI-Suggested** - Gemini-powered alternative distributions

### User Experience
- 🌓 **Dark Mode** - System-wide theme toggle
- 📊 **Visualizations** - Bar charts, pie charts, animated transitions
- 📜 **History** - Full history + last 10 quick access sidebar
- 📋 **Copy to Clipboard** - Quick result sharing
- 🖨️ **Multi-Format Export** - CSV, Excel, PDF, Print

### Bulk Processing
- 📤 **CSV/OCR Upload** - Process CSV, PDF, images, Word documents
- 🎯 **Smart Defaults** - Auto-fills missing currency (INR) and mode (greedy)
- 🤖 **Intelligent Extraction** - Handles ANY text format automatically
- 📈 **Summary Statistics** - Aggregated insights
- 📊 **Batch Analytics** - Per-currency, per-range analysis
- 💾 **Bulk Export** - Results to CSV/Excel/PDF

### Enterprise Features
- 🔐 **Authentication** - JWT-based multi-user support
- 🔄 **Cross-Device Sync** - Desktop ↔ Cloud ↔ Mobile
- 🌐 **Public REST API** - For external integrations
- 🔑 **API Key Management** - Per-user rate limiting
- 📊 **Analytics Dashboard** - Usage trends, metrics, insights
- 🤖 **AI Explanations** - Natural language breakdown explanations
- 🌍 **Multi-Language** - i18n support (future)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (for cloud deployment)

### Quick Start

#### 1. Desktop Application (Offline Mode)
```bash
# Install dependencies
cd packages/desktop-app
npm install

# Run local backend
cd ../local-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Run desktop app
cd ../desktop-app
npm run dev
```

#### 2. Mobile Application
```bash
cd packages/mobile-app
npm install
npm run android  # or npm run ios
```

#### 3. Cloud Backend + Web Dashboard
```bash
# Start cloud backend
cd packages/cloud-backend
docker-compose up -d

# Start web dashboard
cd ../web-dashboard
npm install
npm run dev
```

## 📖 Core Modules

### 1. Currency Denomination Engine
**Location:** `packages/core-engine/`

Pure Python module handling:
- Greedy algorithm for denomination breakdown
- Arbitrary precision math (supports huge amounts)
- Configurable denomination sets per currency
- Constraint-based optimization
- Alternative distribution generation

**Key Functions:**
```python
calculate_denominations(amount, currency, options)
apply_constraints(result, constraints)
generate_alternatives(amount, currency, strategies)
```

### 2. Multi-Currency & FX Service
**Location:** `packages/core-engine/fx_service.py`

- Denomination configs for all currencies
- Live FX rate fetching (online)
- Cached rates (offline fallback)
- Conversion modes: convert-first or breakdown-native

### 3. Optimization Engine
**Location:** `packages/core-engine/optimizer.py`

Strategies:
- Minimize specific denominations
- Avoid denominations below/above threshold
- Cap maximum count per denomination
- Alternative greedy paths

### 4. History & Persistence Service
**Locations:** 
- Local: `packages/local-backend/app/services/history.py`
- Cloud: `packages/cloud-backend/app/services/history.py`

Features:
- Full calculation history storage
- Last 10 quick access
- Search & filter by date, currency, amount range
- Export history to CSV
- Cross-device sync (cloud mode)

### 5. Export & Reporting Service
**Location:** `packages/*/app/services/export.py`

Formats:
- **CSV** - Data analysis friendly
- **Excel** - Formatted with charts
- **PDF** - Professional reports with ReportLab
- **Print** - Printer-optimized layout

### 6. Visualization Service
**Location:** Frontend components

Charts:
- Bar chart: denomination counts
- Pie chart: value distribution
- Animated number transitions
- Trend charts (analytics dashboard)

### 7. Analytics & Dashboard Service
**Location:** `packages/cloud-backend/app/services/analytics.py`

Metrics:
- Total calculations per day/week/month
- Popular currencies
- Average amounts
- Common optimization modes
- User engagement statistics

### 8. Public API & Gateway
**Location:** `packages/cloud-backend/app/api/public/`

Endpoints:
```
POST /api/v1/calculate
POST /api/v1/bulk-calculate
GET  /api/v1/rates
GET  /api/v1/currencies
```

Features:
- API key authentication
- Rate limiting (configurable per key)
- Request logging & audit trail
- OpenAPI/Swagger documentation

### 9. Gemini Integration Service
**Location:** `packages/cloud-backend/app/services/gemini.py`

AI Features:
- Natural language explanation of breakdown
- Alternative distribution suggestions
- Bulk processing insights
- Pattern recognition in usage

**Example:**
```
Input: 5,00,000 INR breakdown
Gemini Output: "Your amount of ₹5,00,000 was optimally distributed 
using 25 notes of ₹2,000, 0 notes of ₹500, and 0 smaller denominations, 
minimizing the total count to just 25 notes."
```

## 🗄️ Database Design

### Entities

#### User
```
id (UUID)
name (string)
email (string, unique)
password_hash (string)
role (enum: user, admin)
created_at (timestamp)
updated_at (timestamp)
```

#### Calculation
```
id (UUID)
user_id (UUID, nullable for offline)
amount (decimal, precision 20)
currency (string, 3-letter code)
source_currency (string, nullable)
target_currency (string, nullable)
options (JSONB - constraints, mode, etc.)
result (JSONB - denomination breakdown)
total_notes (integer)
total_coins (integer)
source (enum: desktop, mobile, api, web)
created_at (timestamp)
```

#### ExchangeRate
```
id (UUID)
base_currency (string)
target_currency (string)
rate (decimal, precision 10)
fetched_at (timestamp)
provider (string)
```

#### UserSetting
```
user_id (UUID, FK)
theme (enum: light, dark, system)
default_currency (string)
default_language (string)
default_optimization_mode (string)
preferences (JSONB)
updated_at (timestamp)
```

#### ApiKey
```
id (UUID)
user_id (UUID, FK)
key (string, indexed, unique)
name (string)
scope (JSONB - permissions)
rate_limit (integer - requests per minute)
created_at (timestamp)
last_used_at (timestamp)
is_active (boolean)
```

#### AnalyticsEvent
```
id (UUID)
user_id (UUID, FK, nullable)
event_type (string - calculation, export, bulk_upload, etc.)
metadata (JSONB)
timestamp (timestamp)
```

## 🔧 Configuration

### Currency Denomination Configs

Stored in: `packages/core-engine/config/currencies.json`

```json
{
  "INR": {
    "name": "Indian Rupee",
    "symbol": "₹",
    "notes": [2000, 500, 200, 100, 50, 20, 10, 5],
    "coins": [10, 5, 2, 1]
  },
  "USD": {
    "name": "US Dollar",
    "symbol": "$",
    "notes": [100, 50, 20, 10, 5, 2, 1],
    "coins": [1, 0.5, 0.25, 0.10, 0.05, 0.01]
  }
}
```

## 📊 Non-Functional Requirements

### Performance
- Single calculation: < 100ms typical
- Bulk CSV processing: 50,000+ rows within reasonable time
- API response time: < 200ms (95th percentile)

### Scalability
- Support 10,000+ concurrent users (cloud mode)
- Handle amounts up to 10^15 (quadrillion)
- Process CSV files up to 100 MB

### Reliability
- 99.9% uptime for cloud services
- Offline mode always functional
- Graceful degradation when services unavailable

### Security
- Passwords: bcrypt hashed
- API keys: SHA-256 + rate limiting
- JWT tokens: 24hr expiry, refresh token support
- HTTPS enforced in production

### Usability
- Mobile-responsive design
- < 3 clicks to complete common tasks
- Keyboard shortcuts support
- Accessible (WCAG 2.1 AA)

## 🎨 UI/UX Features

### Dark Mode
- System preference detection
- Smooth theme transitions
- Persistent user preference
- Applies across all platforms

### History Sidebar
- Last 10 calculations (quick access)
- Click to reload
- Search & filter
- Export selected items

### Charts & Visualizations
- Animated number counters
- Bar chart: denomination distribution
- Pie chart: value breakdown
- Trend lines (analytics dashboard)

### Responsive Design
- Desktop: 1920x1080 to 1366x768
- Mobile: iOS & Android devices
- Tablet: Optimized layouts

## 🔄 Sync Mechanism

### Desktop ↔ Cloud Sync

**Offline Queue:**
1. User performs calculation offline
2. Stored in local SQLite with `synced = false`
3. When online, background sync pushes to cloud
4. Cloud returns sync confirmation
5. Local DB marks as `synced = true`

**Conflict Resolution:**
- Timestamp-based (last write wins)
- User can view sync status
- Manual re-sync option

### Mobile ↔ Cloud
- Always online (requires connection)
- Uses same cloud API
- Optimistic UI updates

## 🤖 AI Integration Details

### Gemini Use Cases

#### 1. Explanation Generation
**Input:** Calculation result
**Output:** Natural language explanation

#### 2. Alternative Suggestions
**Input:** Amount + current breakdown
**Output:** 2-3 alternative distributions with rationale

#### 3. Bulk Insights
**Input:** Bulk processing summary
**Output:** Pattern analysis and recommendations

#### 4. Natural Language Queries (Future)
**Example:** "Break down 75000 INR avoiding coins"
**Gemini:** Parses intent → API call → Response

### Fallback Strategy
- If Gemini API unavailable: Show cached template responses
- Offline mode: AI features disabled gracefully
- Error handling: Never blocks core functionality

## 📱 Mobile App Features

### Platform-Specific
- **iOS:** Face ID / Touch ID authentication
- **Android:** Fingerprint authentication
- **Both:** Push notifications for sync status

### Shared Features
- Same UI components as desktop (React Native Web compatibility)
- Offline calculation history (cached)
- Export via native share API
- Camera integration (future: scan currency)

## 🌐 Public API Documentation

### Authentication
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/api-keys
```

### Core Endpoints
```http
POST /api/v1/calculate
Body: { amount, currency, options }
Response: { denominations, total_notes, metadata }

POST /api/v1/bulk-calculate
Body: { calculations: [...] }
Response: { results: [...], summary }

GET /api/v1/rates?base=INR&target=USD
Response: { rate, updated_at }
```

### Rate Limits
- Free tier: 100 requests/hour
- Basic: 1,000 requests/hour
- Pro: 10,000 requests/hour
- Enterprise: Custom

## 🚀 Deployment

### Docker Compose (Development)
```bash
docker-compose up
```

### Kubernetes (Production)
```bash
kubectl apply -f k8s/
```

### Environment Variables
```env
# Cloud Backend
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GEMINI_API_KEY=...
FX_API_KEY=...
JWT_SECRET=...

# Desktop (Local Backend)
LOCAL_DB_PATH=./data/local.db
SYNC_ENABLED=true
CLOUD_API_URL=https://api.currencydenominator.com
```

## 📈 Future Enhancements

### Phase 1 (Current)
- ✅ Core denomination engine
- ✅ Desktop offline app
- ✅ Basic multi-currency
- ✅ OCR bulk upload with smart defaults
- ✅ Intelligent format extraction

### Phase 2
- 🔄 Cloud backend & sync
- 🔄 Mobile app
- 🔄 Public API

### Phase 3
- ⏳ Gemini integration
- ⏳ Analytics dashboard
- ⏳ Advanced exports

### Future Ideas
- 🔮 Blockchain audit log (Hyperledger)
- 🔮 Voice input (Speech-to-Text)
- 🔮 Plugin marketplace
- 🔮 Multi-language UI (i18n)
- 🔮 Scenario presets (ATM mode, Shop closing mode)

## 📝 License

MIT License - See LICENSE file

## 👥 Contributors

Built as an academic project demonstrating enterprise-grade software architecture.

## 📧 Contact

For questions or contributions, please open an issue on GitHub.

---

**Built with ❤️ using modern, scalable technologies**
