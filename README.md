# Full-Stack Application Tracking Dashboard

A lightweight, asynchronous full-stack dashboard designed to aggregate, track, and manage applications. Built with a fast, modern asynchronous Python backend and an interactive TypeScript React frontend.

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Asynchronous ASGI)
- **Database:** SQLite
- **Validation:** Pydantic v2

### Frontend
- **Framework:** React 18 (TypeScript)
- **Build Tool:** Vite
- **Linting & Code Quality:** ESLint + TypeScript-ESLint (Strict Type Safety)

---

## 🚀 Features & Business Logic

- **Asynchronous Pipeline:** End-to-end async operations from FastAPI endpoints down to database queries.
- **Advanced Sorting:** Interactive sorting mechanics supporting chronological tracking (Newest/Oldest), alphabetical indexing, and weighted priority ranking (High to Low / Low to High).
- **State Modification Guard:** Built-in validation loops preventing modifications or deletions on finalized applications marked as `DONE`.
- **CORS-Enabled API Configuration:** Completely optimized cross-origin middleware settings for seamless local development workflows.

---

## 💻 Getting Started

### 1. Backend Setup
Navigate to your backend or root directory, set up your Python virtual environment, and boot up the server:

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/scripts/activate  # On Windows: venv\Scripts\activate

# Install dependencies (FastAPI, SQLAlchemy, Uvicorn, etc.)
pip install -r requirements.txt

# Run the Uvicorn development server
uvicorn app.main:app --reload
