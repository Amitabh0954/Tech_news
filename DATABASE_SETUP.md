# Database Setup Guide - Tech News Portal

This guide walks you through connecting your PostgreSQL database to the website and setting up user authentication with password hashing.

## What Was Configured

✅ **PostgreSQL Database Connection** - Configured to connect to `Tech_news` database  
✅ **User Authentication** - Email/password registration and login with JWT tokens  
✅ **Password Hashing** - Bcrypt-based secure password storage  
✅ **Database Models** - Users, Articles, Bookmarks, and related data  

---

## Step 1: Update Database Credentials

Edit `.env` file in `backend/` folder:

```env
# Update these with your PostgreSQL credentials
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/Tech_news
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Replace:
- `your_password` - Your PostgreSQL password
- `SECRET_KEY` - A random secure key (for JWT token signing)

---

## Step 2: Install Python Dependencies

Run this in the `backend/` folder:

```bash
pip install -e .
```

This installs:
- `passlib[bcrypt]` - Password hashing
- `python-jose[cryptography]` - JWT token generation
- `python-multipart` - Form data handling
- All other dependencies from `pyproject.toml`

---

## Step 3: Initialize Database Schema

Run the initialization script:

```bash
python init_db.py
```

This will:
1. Connect to your PostgreSQL `Tech_news` database
2. Create all necessary tables:
   - `users` - User accounts with email/password
   - `articles` - News articles (past and new)
   - `bookmarks` - User bookmarked articles
   - `sources` - News sources
   - `categories` - News categories
   - `summaries` - AI-generated article summaries
   - `impact_scores` - Article impact metrics
3. Enable the `pgvector` extension for embeddings

---

## Step 4: Start the Backend Server

```bash
cd backend/app
uvicorn main:app --reload
```

Server will be available at: `http://localhost:8000`  
API Documentation: `http://localhost:8000/docs`

---

## Authentication Endpoints

### Register New User

**POST** `/api/v1/auth/register`

```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "display_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "John Doe",
    "theme": "dark"
  }
}
```

### Login

**POST** `/api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

### Get Current User

**GET** `/api/v1/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  theme VARCHAR(20) DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Articles Table
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  source_id UUID NOT NULL,
  category_id UUID,
  title TEXT NOT NULL,
  slug VARCHAR(240) UNIQUE NOT NULL,
  canonical_url TEXT UNIQUE NOT NULL,
  author VARCHAR(180),
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ingested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Bookmarks Table (User Saved Articles)
```sql
CREATE TABLE bookmarks (
  user_id UUID NOT NULL,
  article_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_id, article_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (article_id) REFERENCES articles(id)
);
```

---

## Frontend Integration

### Login Example (React)

```typescript
// frontend/src/api/auth.ts
export const login = async (email: string, password: string) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  return data;
};
```

### Get Current User

```typescript
export const getCurrentUser = async (token: string) => {
  const response = await fetch('/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};
```

### Save Bookmark

```typescript
export const bookmarkArticle = async (token: string, articleId: string) => {
  const response = await fetch(`/api/v1/bookmarks/${articleId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};
```

---

## Security Checklist

- [ ] Update `SECRET_KEY` in `.env` to a random secure value
- [ ] Use HTTPS in production (not HTTP)
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES` to appropriate value (30 min recommended)
- [ ] Never commit `.env` file to version control
- [ ] Use strong PostgreSQL password
- [ ] Enable PostgreSQL SSL connections in production
- [ ] Set `APP_ENV=production` in production `.env`

---

## Troubleshooting

### Database Connection Error
```
sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL
```
**Solution:** Check `DATABASE_URL` in `.env` is correct format

### Password Hash Error
```
ModuleNotFoundError: No module named 'passlib'
```
**Solution:** Run `pip install -e .` in backend folder

### Token Verification Failed
```
Module 'jose' has no attribute 'JWTError'
```
**Solution:** Run `pip install python-jose[cryptography]`

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string |
| `SECRET_KEY` | - | Secret for JWT signing (keep secure!) |
| `ALGORITHM` | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | Token expiration time |
| `APP_ENV` | development | Environment (development/production) |
| `CORS_ORIGINS` | ["http://localhost:5173"] | Allowed frontend domains |

---

## Next Steps

1. ✅ Configure `.env` with your database credentials
2. ✅ Install dependencies: `pip install -e .`
3. ✅ Initialize database: `python init_db.py`
4. ✅ Start backend: `uvicorn main:app --reload`
5. ✅ Update frontend to use auth endpoints
6. ✅ Test registration and login in `/docs`

---

## Support

For API documentation, visit: `http://localhost:8000/docs` when server is running
