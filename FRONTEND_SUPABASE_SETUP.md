# Frontend Supabase Setup

## Quick Fix for Password Functionality

The frontend needs **separate environment variables** with the `VITE_` prefix.

### Add to your `.env` file:

```bash
# Backend variables (you already have these)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Frontend variables (ADD THESE - same values, different names)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Why?

- **Backend** uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` (via `process.env`)
- **Frontend** needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (via `import.meta.env`)
- Vite only exposes variables prefixed with `VITE_` to the client for security

### After adding:

1. Restart your dev server (`npm run dev`)
2. The password functionality will now work!

### Note:

The app will still work without these variables (using localStorage), but password creation won't work until they're set.
