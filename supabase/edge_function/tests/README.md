# Edge Functions Testing Quick Reference

## Running Specific Test Files

### Using npm scripts
```bash
# Run a specific test file
npm run test:edge-functions:file tests/my-function.test.ts

# Run all tests
npm run test:edge-functions


### Using Deno directly
```bash
# Run a specific test file
deno test --allow-net --allow-env tests/my-function.test.ts

# Run all tests in tests directory
deno test --allow-net --allow-env tests/

# Run tests matching a pattern
deno test --allow-net --allow-env tests/*.test.ts
```

### Using Deno tasks
```bash
# Run a specific test file
deno task test -- tests/my-function.test.ts

# Run all tests
deno task test
```

## Environment Variables Setup

### Option 1: Using .env File (Recommended)
```bash
# Create .env file from template
cp tests/env.example .env

# Edit .env file with your actual values
# The file will be automatically loaded when running tests
```

### Option 2: Export Environment Variables
```bash
export SUPABASE_URL="https://your-project-ref.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

### Environment Variables Loading Order
1. **System environment variables** (exported in shell)
2. **`.env` file** (automatically loaded with `--env-file=.env`)
3. **Code-set variables** (using `Deno.env.set()`)

## Test File Structure

```typescript
import { assertEquals, assertExists } from "../deps.ts"

const FUNCTION_NAME = "your-function-name"

Deno.test("Your Function - Basic Test", async () => {
  // Your test implementation
})
```

## Available Test Files

- `edge-functions.test.ts` - Compile/security-contract checks for clinic user management, SaaS management, public booking, and custom-domain provisioning, plus non-mutating live rejection tests when `SUPABASE_URL` is configured.

## Creating Edge Functions

To add a new Edge Function:

1. Create its source under `supabase/functions/<function-name>/index.ts`.
2. Add any function-specific Deno configuration beside the source when needed.
3. Add compile coverage to the shared `test` task.
4. Add corresponding non-mutating tests in this `tests/` directory.
