---
trigger: always_on
---

# Project Rules: Schere-Stein-Papier (ARENA.OPS)

## 1. Technical Stack
- **Framework:** SvelteKit
- **Styling:** Tailwind CSS (following the provided design system)
- **Backend/Database:** Supabase (connected via MCP)
- **Package Manager:** pnpm (Strictly enforced)

## 2. Game Logic Rules
- **Winning Conditions:**
  - Rock beats Scissors
  - Scissors beats Paper
  - Paper beats Rock
- **Opponent:** AI/Bot uses a random selection.
- **States:** The game must handle `WAITING`, `PLAYING`, and `RESULT` states.

## 3. Database Schema (Supabase)
- **Table:** `profiles`
- **Columns:**
  - `id`: uuid (primary key)
  - `username`: text
  - `wins`: int (default 0)
  - `losses`: int (default 0)
  - `draws`: int (default 0)

## 4. Design Guidelines
- **Primary Color:** #00FFFF (Neon Cyan)
- **Secondary Color:** #FF3D00 (Coral/Red)
- **Tertiary Color:** #FFD600 (Yellow)
- **Background:** #0F2A35 (Dark Petrol)
- **Typography:** Space Grotesk (Headlines), Plus Jakarta Sans (Body), Manrope (Labels).