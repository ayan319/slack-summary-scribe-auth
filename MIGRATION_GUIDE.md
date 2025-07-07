# 🔄 React Router to Next.js App Router Migration Guide

## ⚠️ Remaining Files to Migrate

The following files still contain `react-router-dom` imports and need to be migrated to Next.js App Router:

### 1. **src/pages/Admin.tsx**
- **Issue**: Uses `useNavigate` from react-router-dom
- **Solution**: Replace with Next.js `useRouter` from `next/navigation`

```typescript
// Before
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate('/dashboard');

// After
import { useRouter } from "next/navigation";
const router = useRouter();
router.push('/dashboard');
```

### 2. **src/pages/Index.tsx**
- **Issue**: Uses `useNavigate` from react-router-dom
- **Solution**: Replace with Next.js `useRouter` or `Link` component

```typescript
// Before
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();

// After
import { useRouter } from "next/navigation";
const router = useRouter();
// OR use Next.js Link component for navigation
import Link from "next/link";
```

### 3. **src/components/Navigation.tsx**
- **Issue**: Uses `Link` and `useLocation` from react-router-dom
- **Solution**: Replace with Next.js equivalents

```typescript
// Before
import { Link, useLocation } from "react-router-dom";
const location = useLocation();

// After
import Link from "next/link";
import { usePathname } from "next/navigation";
const pathname = usePathname();
```

### 4. **src/components/MobileMenu.tsx**
- **Issue**: Uses `useNavigate` from react-router-dom
- **Solution**: Replace with Next.js `useRouter`

### 5. **src/pages/NotFound.tsx**
- **Issue**: Uses `useLocation` and `Link` from react-router-dom
- **Solution**: Replace with Next.js equivalents

## 🚀 Quick Migration Steps

### Step 1: Update Navigation Component
```typescript
// src/components/Navigation.tsx
'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
// ... other imports

const Navigation = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    // ... other items
  ];

  return (
    <nav>
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={pathname === item.path ? "active" : ""}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};
```

### Step 2: Update Pages with Navigation
```typescript
// For any page component that uses navigation
'use client';

import { useRouter } from "next/navigation";

const SomePage = () => {
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/dashboard');
  };

  return (
    // Component JSX
  );
};
```

### Step 3: Move Pages to App Router Structure
Since you're using App Router, consider moving these page components to the `app/` directory:

```
app/
├── page.tsx                 # Home page (replace src/pages/Index.tsx)
├── dashboard/
│   └── page.tsx            # Dashboard page
├── admin/
│   └── page.tsx            # Admin page (migrate from src/pages/Admin.tsx)
├── settings/
│   └── page.tsx            # Settings page
└── not-found.tsx           # 404 page (replace src/pages/NotFound.tsx)
```

## 🔧 Automated Migration Script

You can create a script to help with the migration:

```bash
#!/bin/bash
# migration-script.sh

echo "🔄 Migrating React Router to Next.js App Router..."

# Replace useNavigate imports
find src/ -name "*.tsx" -type f -exec sed -i 's/import { useNavigate }/import { useRouter }/g' {} \;
find src/ -name "*.tsx" -type f -exec sed -i 's/from "react-router-dom"/from "next\/navigation"/g' {} \;

# Replace useNavigate usage
find src/ -name "*.tsx" -type f -exec sed -i 's/const navigate = useNavigate()/const router = useRouter()/g' {} \;
find src/ -name "*.tsx" -type f -exec sed -i 's/navigate(/router.push(/g' {} \;

# Replace useLocation
find src/ -name "*.tsx" -type f -exec sed -i 's/useLocation/usePathname/g' {} \;
find src/ -name "*.tsx" -type f -exec sed -i 's/location\.pathname/pathname/g' {} \;

echo "✅ Basic migration complete. Manual review required."
```

## 📋 Manual Review Checklist

After running migrations, manually review:

- [ ] All `react-router-dom` imports removed
- [ ] Navigation logic updated to use Next.js hooks
- [ ] Link components use Next.js `Link`
- [ ] Client components have `'use client'` directive
- [ ] TypeScript errors resolved
- [ ] Build passes: `npm run build`

## 🎯 Benefits After Migration

1. **Better Performance**: Server-side rendering and automatic code splitting
2. **SEO Optimization**: Better search engine indexing
3. **Type Safety**: Full TypeScript support with Next.js
4. **Modern Architecture**: Latest React patterns and best practices
5. **Simplified Routing**: File-based routing system

## ⚡ Quick Commands

```bash
# Check for remaining react-router-dom usage
grep -r "react-router-dom" src/

# Check for useNavigate usage
grep -r "useNavigate" src/

# Check for useLocation usage
grep -r "useLocation" src/

# Build and test
npm run build
npm run dev
```

Once these files are migrated, your entire application will be fully compatible with Next.js 15 App Router!
