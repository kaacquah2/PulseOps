# Contributing to PulseOps

Thank you for your interest in contributing to PulseOps! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please provide:
- Clear description of the feature
- Use cases and benefits
- Potential implementation approach
- Any alternative solutions considered

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/pulseops.git
   cd pulseops
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm run dev
   npm run lint
   npm run type-check
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Use conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request**
   - Provide a clear title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Ensure all checks pass

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components and hooks
- Keep components small and focused
- Extract reusable logic to custom hooks

### File Organization

```
app/              # Next.js pages and API routes
components/       # Reusable React components
lib/              # Utility functions and helpers
types/            # TypeScript type definitions
prisma/           # Database schema
```

### Naming Conventions

- **Components**: PascalCase (e.g., `MonitorCard.tsx`)
- **Functions**: camelCase (e.g., `calculateUptime`)
- **Files**: kebab-case for non-components (e.g., `api-client.ts`)
- **Types**: PascalCase (e.g., `MonitorStatus`)

### Component Structure

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);

  return (
    <div className="space-y-4">
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
}
```

### API Route Structure

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  field: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = schema.parse(body);

    // Your logic here

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Database Changes

When modifying the database schema:

1. Update `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
4. Document the changes in your PR

### Testing

Before submitting:

- Test all affected functionality
- Check for console errors
- Verify responsive design
- Test with different data states (empty, populated, error)
- Ensure accessibility (keyboard navigation, screen readers)

## Project-Specific Guidelines

### Adding a New Monitor Type

1. Update `MonitorType` in `types/index.ts`
2. Implement check logic in `lib/monitoring/check.ts`
3. Update UI to show the new type
4. Add documentation

### Adding a New Alert Channel

1. Update database schema in `prisma/schema.prisma`
2. Create alert handler in `lib/alerts/`
3. Add UI configuration in settings
4. Document the integration

### Adding a New Dashboard Widget

1. Create component in `components/dashboard/`
2. Add to dashboard page
3. Ensure it fetches data efficiently
4. Make it responsive

## Questions?

Feel free to:
- Open a discussion on GitHub
- Comment on existing issues
- Reach out to maintainers

Thank you for contributing to PulseOps! 🎉
