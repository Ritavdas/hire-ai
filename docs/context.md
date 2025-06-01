# HireAI MVP Context

## 1. Project Overview

**HireAI** is an AI‑powered CV search and screening tool designed for recruiters. The core idea is to allow recruiters to upload a folder of resumes (100+), index them in a database via Drizzle ORM on Supabase Postgres, and then perform instant, fast keyword‑based searches. The MVP uses Supabase’s Full‑Text Search (FTS) for indexing resumes, Drizzle ORM for database schema and queries, and a Next.js 15 frontend (using the app directory). Optionally, a lightweight OpenAI integration can be added later to demonstrate AI capabilities (e.g., summarizing a CV’s key skills).

Key goals:

* Index and store 100+ resumes efficiently.
* Provide an ultra‑fast search bar that returns matching resumes by keyword in real‑time.
* Show basic candidate details (name, location, snippet of matching text, relevance score).
* Outline a clear directory structure, tech stack, data flow, and implementation details so that Cursor (or any automated tool) can scaffold or guide development.

---

## 2. MVP Feature List

1. **Resume Upload & Parsing** (pre‑processing step, outside the UI):

   * A Node.js script (`scripts/uploadResumes.ts`) to walk through a local folder (e.g., `resumes/`), extract plain text from PDF/DOCX files, and insert each resume into Supabase via Drizzle ORM.
   * Metadata saved for each resume: `name` (filename), `location` (blank or parsed if available), `raw_text` (extracted content).

2. **Database with Full‑Text Search Index**:

   * Supabase (Postgres) table named `resumes` defined via Drizzle ORM schema:

     * `id` (UUID, primary key)
     * `name` (text)
     * `location` (text)
     * `rawText` (text)
     * `tsv` (tsvector) • auto‑generated from `rawText` for FTS • indexed with GIN for performance.
   * Raw SQL migration to create the GIN index and FTS function, invoked via Drizzle.

3. **Search API Endpoint** (`app/api/search/route.ts`):

   * Accepts a query parameter `q` (user’s search keywords).
   * Sanitizes and transforms `q` into a `to_tsquery`‑compatible string (e.g., prefix matching with `:*` and `&` connectors).
   * Uses Drizzle ORM’s `db.execute` to call the `fts_ranked_search` SQL function and retrieve top‑10 matching resumes.
   * Returns JSON array of results (`id`, `name`, `location`, `snippet`, `rank`).

4. **Frontend (Next.js 15)**:

   * **Search Page** (`app/page.tsx`):

     1. Renders a search `<input>` field with debounce (300 ms) to avoid spamming the API.
     2. Calls `/api/search?q=<user input>`, gets a list of candidate objects.
     3. Displays each candidate card with:

        * `name`, `location`
        * A snippet of matching text (HTML from `ts_headline`), rendered via `dangerouslySetInnerHTML`.
        * A relevance percentage (e.g., `Math.round(rank * 100) + '%'`).
   * **Styling**: Tailwind CSS utility classes for rapid, responsive design (cards, input, typography, spacing).

5. **Optional AI Integration** (MVP “AI Flair”):

   * **Summarize Endpoint** (`app/api/summarize/route.ts`):

     * Accepts `{ id: <resume_id> }` in POST body.
     * Fetches the corresponding `rawText` from Supabase via Drizzle ORM.
     * Sends a prompt to OpenAI’s ChatCompletion endpoint (e.g., “Given this resume text, list the top 3 technical skills and 1 key accomplishment.”).
     * Returns a short JSON response with extracted skills/summary.
   * **UI Hook**: Under each candidate card, a “🔍 Summarize CV” button. On click, show a loading spinner, call `/api/summarize`, and display the returned summary below the snippet. This demonstrates a minimal but concrete usage of AI in the pipeline.

---

## 3. Tech Stack

| Layer             | Technology / Library           | Purpose                                                                                    |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| **Frontend**      | Next.js 15 (React)             | Framework for using the app directory, server‑rendered React, and integrated API routes.   |
|                   | React                          | Component‑based UI rendering.                                                              |
|                   | Tailwind CSS                   | Utility‑first CSS framework for rapid styling (optional but recommended).                  |
|                   | TypeScript                     | Type annotations for safer code.                                                           |
|                   | react‑debounce‑input           | Debounced input component (or custom `setTimeout` debounce logic).                         |
| **Backend / DB**  | Supabase (Postgres)            | Database as a Service (PostgreSQL), includes Auth, Storage, and Vector extension (future). |
|                   | Drizzle ORM                    | Type-safe ORM for schema definition, migrations, and queries.                              |
|                   | Postgres Full‑Text Search      | Built‑in FTS via `tsvector`, `ts_headline`, `ts_rank`, and GIN index.                      |
|                   | PGVector Extension (Phase 2)   | Vector embeddings storage for semantic search (future).                                    |
| **API Routes**    | Next.js API Routes (`app/api`) | Server functions within Next.js 15 to handle search & summarize endpoints.                 |
|                   | Supabase JavaScript Client     | Interact with Supabase for auth/storage if needed.                                         |
| **Resume Parser** | Node.js + `pdf-parse`          | Extract text from PDF files.                                                               |
|                   | Node.js + `textract`           | Extract text from Word docs (`.docx`, `.doc`).                                             |
|                   | Node.js (TypeScript)           | Script environment (`scripts/uploadResumes.ts`).                                           |
| **AI (Optional)** | OpenAI ChatCompletion          | Generate simple summaries / skill extractions from resume text.                            |
| **Deployment**    | Vercel                         | Host Next.js app (includes frontend + API routes).                                         |
|                   | Environment Variables          | Store Supabase URL, Supabase Service Role Key, and OpenAI API Key securely.                |

---

## 4. Data Flow & Request / Response Flow

### 4.1 Resume Ingestion (Pre‑MVP Preparation)

1. **Drop PDFs/Word files into `resumes/` folder**.
2. **Run `node scripts/uploadResumes.ts`**:

   * Reads each file.
   * If `.pdf`: use `pdf-parse` → extract plain text.
   * If `.docx`/`.doc`: use `textract` → extract plain text.
   * Constructs a record object matching the Drizzle schema: `{ name: <filename without extension>, location: "", rawText: <extractedText> }`.
   * Uses Drizzle ORM’s `db.insert(resumes).values({...})` to insert the record into Supabase.
   * Supabase auto‑populates the `tsv` column (via database trigger configured in migration).
3. **Supabase Confirmation**: The `resumes` table now has 100+ rows, each with `tsv` indexed by GIN.

### 4.2 Search Flow (User Interaction)

1. **User visits `https://<your-domain>/`** → Next.js serves `app/page.tsx`.
2. **Next.js renders static skeleton**: heading, search input, empty results.
3. **User types into input** (e.g., "React Next.js").

   * A custom `useEffect` debounces the input (300 ms).
   * After debounce, fetch is triggered: `GET /api/search?q=React%20Next.js`.
4. **API Route `/api/search/route.ts`** handles request:

   * Extracts `q = "React Next.js"` from `request.nextUrl.searchParams`.
   * Sanitizes: `components = ["React:*", "Next.js:*"]` → `"React:* & Next.js:*"`.
   * Uses Drizzle’s `db.execute` to call raw SQL for FTS:

     ```ts
     const result = await db.execute(
       sql`SELECT id, name, location,
         ts_headline('english', raw_text, to_tsquery(${sanitized})) AS snippet,
         ts_rank(tsv, to_tsquery(${sanitized})) AS rank
       FROM resumes
       WHERE tsv @@ to_tsquery(${sanitized})
       ORDER BY rank DESC
       LIMIT 10;`
     );
     ```

   * `result` returns rows like:

     ```json
     [
       {
         "id": "uuid-1",
         "name": "Alex Johnson",
         "location": "New York, NY",
         "snippet": "...worked extensively with <b>React</b> and <b>Next.js</b> to develop...",
         "rank": 0.215
       },
       { ... },
       // up to 10 rows
     ]
     ```

5. **API Route returns JSON** → Next.js dispatches JSON to the frontend.
6. **Frontend receives `results` array**:

   * Updates React state `results = [Candidate1, Candidate2, …]`.
   * Renders a list of `<div>` cards:

     * Candidate’s `name` + `location`.
     * `dangerouslySetInnerHTML={{ __html: snippet }}` to highlight matched terms.
     * `rank * 100` displayed as e.g. "21% relevant".

### 4.3 (Optional) AI Summarization Flow

1. **User clicks on "🔍 Summarize CV" button** under a candidate card.
2. **Frontend calls** `POST /api/summarize` with `{ id: "uuid-1" }` in the request body.
3. **API Route `/api/summarize/route.ts`**:

   * Uses Drizzle ORM to fetch that row’s `rawText`:

     ```ts
     const resume = await db.select({ rawText: resumes.rawText })
       .from(resumes)
       .where(eq(resumes.id, resumeId))
       .get();
     ```

   * Constructs a ChatCompletion request to OpenAI:

     ```ts
     const prompt = `Here is a candidate's resume text:\n\n${resume.rawText}\n\nList the top 3 technical skills and one key achievement in bullet points.`;
     const completion = await openai.createChatCompletion({
       model: 'gpt-4',
       messages: [
         { role: 'system', content: 'You are an AI assistant that extracts top skills and achievements.' },
         { role: 'user', content: prompt }
       ],
       max_tokens: 100,
       temperature: 0.3
     });
     ```

   * Returns the generated summary (e.g., `"- JavaScript\n- React\n- Next.js\n- Built a real‑time dashboard for X"`).
4. **Frontend displays the summary** below the snippet area (maybe in a collapsible section).

This “AI Summarization Flow” is optional and can be deferred to the last hours of Day 1 or saved for Phase 2. Even without it, the core search is fully functional.

---

## 5. Database Schema (Drizzle ORM + Supabase Migration)

**Drizzle Schema Definition (TypeScript)**

```ts
// db/schema.ts
import { pgTable, uuid, text, tsvector } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const resumes = pgTable('resumes', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  rawText: text('raw_text').notNull(),
  tsv: tsvector('tsv').generatedAlways(
    sql`to_tsvector('english', coalesce(${rawText}, ''))`,
  ),
});
```

**Migration to Create Table, Index, and FTS Function**

```sql
-- migrations/20250601_create_resumes.sql
create extension if not exists "uuid-ossp";

create table if not exists resumes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text,
  raw_text text not null,
  tsv tsvector generated always as (
    to_tsvector('english', coalesce(raw_text, ''))
  ) stored
);

create index if not exists idx_resumes_tsv on resumes using gin(tsv);

create or replace function fts_ranked_search(q text, limit integer)
returns table (
  id uuid,
  name text,
  location text,
  snippet text,
  rank real
) as $$
begin
  return query
    select
      id,
      name,
      location,
      ts_headline('english', raw_text, to_tsquery(q)) as snippet,
      ts_rank(tsv, to_tsquery(q)) as rank
    from resumes
    where tsv @@ to_tsquery(q)
    order by rank desc
    limit limit;
end;
$$ language plpgsql stable;
```

**Drizzle Client Initialization (TypeScript)**

```ts
// db/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { resumes } from './schema';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema: { resumes } });
```

### Table `resumes` Column Descriptions

| Column     | Type       | Constraints        | Description                                                                        |
| ---------- | ---------- | ------------------ | ---------------------------------------------------------------------------------- |
| `id`       | `uuid`     | `PRIMARY KEY`      | Unique identifier automatically generated with `uuid_generate_v4()`.               |
| `name`     | `text`     | `NOT NULL`         | Candidate’s name (derived from filename or manually provided).                     |
| `location` | `text`     |                    | Free‑text location field (optional).                                               |
| `rawText`  | `text`     | `NOT NULL`         | Entire extracted resume content (concatenation of all PDF text or doc text).       |
| `tsv`      | `tsvector` | `GENERATED ALWAYS` | Computed from `raw_text` via `to_tsvector('english', raw_text)`. Indexed with GIN. |

No other tables are strictly necessary for the MVP. Additional tables (e.g., `interviews`, `users`) can be defined via Drizzle in Phase 2.

---

## 6. API Endpoints

### 6.1 `GET /api/search?q=<keywords>`

* **Description**: Executes a full‑text search against `resumes.tsv` using Drizzle ORM to run raw SQL.

* **Parameters**:

  * `q` (string, required): User’s search keywords, e.g. "Python ETL".

* **Implementation (`app/api/search/route.ts`)**:

  ```ts
  import { NextResponse } from 'next/server';
  import { sql } from 'drizzle-orm';
  import { db } from '@/db/client';

  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    if (!q) {
      return NextResponse.json({ error: 'Missing query param "q"' }, { status: 400 });
    }

    const sanitized = q
      .trim()
      .split(/\s+/)
      .map((word) => `${word}:*`)
      .join(' & ');

    const result = await db.execute(sql`
      SELECT id, name, location,
        ts_headline('english', raw_text, to_tsquery(${sanitized})) AS snippet,
        ts_rank(tsv, to_tsquery(${sanitized})) AS rank
      FROM resumes
      WHERE tsv @@ to_tsquery(${sanitized})
      ORDER BY rank DESC
      LIMIT 10;
    `);

    return NextResponse.json({ results: result.rows });
  }
  ```

* **Response** (JSON):

  ```json
  {
    "results": [
      {
        "id": "uuid-1",
        "name": "Alex Johnson",
        "location": "New York, NY",
        "snippet": "...worked extensively with <b>React</b> and <b>Next.js</b> to develop...",
        "rank": 0.215
      },
      // up to 10 entries
    ]
  }
  ```

### 6.2 `POST /api/summarize` (Optional)

* **Description**: Fetches a resume by `id` using Drizzle ORM, sends its text to OpenAI, and returns a short summary (top 3 skills + 1 achievement).

* **Request Body** (JSON):

  ```json
  { "id": "uuid-1" }
  ```

* **Implementation (`app/api/summarize/route.ts`)**:

  ```ts
  import { NextResponse } from 'next/server';
  import { eq } from 'drizzle-orm';
  import { db } from '@/db/client';
  import { resumes } from '@/db/schema';

 import { OpenAI } from 'openai';

 const openai = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
 });

  export async function POST(request: Request) {
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing "id" in request body' }, { status: 400 });
    }

    const resume = await db.select({ rawText: resumes.rawText })
      .from(resumes)
      .where(eq(resumes.id, id))
      .get();
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    try {
      const prompt = `Here is a candidate's resume text:\n\n${resume.rawText}\n\nList the top 3 technical skills and one key achievement in bullet points.`;
      const completion = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an AI assistant that extracts top skills and achievements.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      const summary = completion.data.choices[0].message?.content.trim() || '';
      return NextResponse.json({ summary });
    } catch (err: any) {
      return NextResponse.json({ error: 'OpenAI request failed: ' + err.message }, { status: 500 });
    }
  }

  ```

* **Response** (JSON):

  ```json
  { "summary": "- JavaScript\n- React\n- Next.js\n- Built a real-time admin dashboard for ..." }
  ```

---

## 7. Frontend Directory Structure (Next.js 15)

```text
HireAI-MVP/
├─ public/                      # Static assets (images, favicon, etc.)
│   └─ favicon.ico
│   └─ logo.png
│
├─ db/                          # Drizzle ORM configuration and schema
│   ├─ client.ts                # Drizzle client initialization connecting to Supabase
│   └─ schema.ts                # Drizzle schema definitions for `resumes` table
│
├─ app/                         # Next.js 15 app directory
│   ├─ api/
│   │   ├─ search/
│   │   │   └─ route.ts           # GET search logic using Drizzle
│   │   └─ summarize/
│   │       └─ route.ts           # POST summarize logic (optional)
│   │
│   ├─ components/               # Shared React components
│   │   ├─ CandidateCard.tsx      # Card for displaying a candidate result
│   │   ├─ SearchInput.tsx        # Debounced search input component
│   │   └─ AIButton.tsx           # “Summarize CV” button + loading state
│   │
│   ├─ styles/
│   │   └─ globals.css            # Tailwind imports or custom CSS
│   │
│   ├─ page.tsx                   # Main search page UI
│   ├─ layout.tsx                 # Optional layout wrapper (imports global CSS)
│   └─ globals.css                # Imported in layout for Tailwind
│
├─ scripts/                      # Utility scripts for pre‑processing
│   └─ uploadResumes.ts           # Node.js script to parse & upload resumes to Supabase via Drizzle
│
├─ data/                         # (Optional) Local JSON seeds or example data
│   └─ sampleCandidates.json      
│
├─ resumes/                      # Folder containing raw resume files (PDF/DOCX) for ingestion
│   ├─ Alex_Johnson.pdf
│   ├─ Meera_Patel.docx
│   └─ … (100+ files) …
│
├─ .env.local                    # Local environment variables (not checked into Git)
├─ package.json                  # npm dependencies, scripts
├─ tailwind.config.js            # Tailwind CSS configuration (if using Tailwind)
├─ tsconfig.json                 # TypeScript config (if using TS)
└─ next.config.js                # Next.js configuration (if customizing)
```

### 7.1 Key File Descriptions

* `db/schema.ts`: Defines the `resumes` table using Drizzle ORM, including the `tsv` column as a generated `tsvector`.
* `db/client.ts`: Initializes Drizzle ORM’s Postgres client, connecting to Supabase via `SUPABASE_DATABASE_URL`.
* `app/page.tsx`: Contains the search input, debounced effect, fetch to `/api/search`, and rendering of results. Uses Tailwind for styling.
* `app/api/search/route.ts`: Server function that sanitizes the user query, uses Drizzle’s `db.execute` to run raw SQL for FTS, and returns JSON results.
* `app/api/summarize/route.ts` (optional): Server function that fetches a single resume’s `rawText` via Drizzle, sends to OpenAI, and returns the `summary`.
* `scripts/uploadResumes.ts`: Runs locally (node) to parse .pdf/.docx files in `resumes/`, extract text, and insert into Supabase via Drizzle’s `db.insert`.
* `app/components/CandidateCard.tsx`: Reusable card component to display each candidate’s name, location, snippet, relevance, and “Summarize” button.
* `app/components/SearchInput.tsx`: A React component wrapping an `<input>` with built‑in debounce logic (could use `react-debounce-input`).
* `app/components/AIButton.tsx`: A button component that, on click, calls `/api/summarize` and displays a spinner + summary text.

---

## 8. Scripts & Utilities

### 8.1 `scripts/uploadResumes.ts`

```ts
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import textract from 'textract';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';

async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.text;
  } else if (ext === '.docx' || ext === '.doc') {
    return new Promise((resolve, reject) => {
      textract.fromFileWithPath(filePath, (err, text) => {
        if (err) return reject(err);
        resolve(text as string);
      });
    });
  } else {
    throw new Error(`Unsupported extension: ${ext}`);
  }
}

async function main() {
  const RESUME_DIR = path.join(process.cwd(), 'resumes');
  const files = fs.readdirSync(RESUME_DIR).filter((f) =>
    ['.pdf', '.docx', '.doc'].includes(path.extname(f).toLowerCase())
  );

  console.log(`Found ${files.length} resume(s). Processing...`);

  for (const filename of files) {
    try {
      const fullPath = path.join(RESUME_DIR, filename);
      console.log(`Extracting text from ${filename}...`);
      const rawText = await extractTextFromFile(fullPath);

      const nameOnly = path.basename(filename, path.extname(filename));
      await db.insert(resumes).values({ name: nameOnly, location: '', rawText });
      console.log(`Inserted ${filename}`);
    } catch (err: any) {
      console.error(`Failed to process ${filename}:`, err.message);
    }
  }

  console.log('All done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

**How to run**:

1. Place all resume files in `resumes/` at the project root (e.g., `resumes/Alex_Johnson.pdf`, `resumes/Meera_Patel.docx`, etc.).
2. In terminal:

   ```bash
   export SUPABASE_DATABASE_URL="postgresql://<username>:<password>@<host>:5432/<db>"
   node scripts/uploadResumes.ts
   ```

3. Watch console logs; verify Supabase table has the new rows.

---

## 9. Environment Configuration

Create a file named `.env.local` at the project root (this file should **not** be committed to Git). It should contain:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   # Service Role Key with write permission
SUPABASE_DATABASE_URL=postgresql://<username>:<password>@<host>:5432/<db>

# (Optional) OpenAI integration
OPENAI_API_KEY=sk-abc123...
```

* **NEXT\_PUBLIC\_SUPABASE\_URL**: Visible to both client & server, used by Supabase JS client for auth/storage if needed.
* **SUPABASE\_SERVICE\_ROLE\_KEY**: Only used in server‑side code for direct Supabase calls (e.g., via `@supabase/supabase-js`) if needed.
* **SUPABASE\_DATABASE\_URL**: Connection string used by Drizzle ORM to connect to Supabase Postgres.
* **(Optional) OPENAI\_API\_KEY**: Needed for `/api/summarize` if you implement AI summarization. Provide a valid OpenAI key.

In production (Vercel), you’ll set these same variables under **Project Settings → Environment Variables**.

---

## 10. Directory Structure (Full)

```text
HireAI-MVP/
├─ .env.local                    # Local env vars (not in Git)
├─ package.json                  # npm dependencies, scripts
├─ tailwind.config.js            # Tailwind CSS configuration (if using Tailwind)
├─ tsconfig.json                 # TypeScript config
├─ next.config.js                # Next.js configuration (if customizing)
│
├─ public/                       # Static files (e.g. favicon, logos)
│   └─ favicon.ico
│   └─ logo.png
│
├─ db/                           # Drizzle ORM configuration and schema
│   ├─ client.ts                # Drizzle client initialization (connects to Supabase Postgres)
│   └─ schema.ts                # Drizzle schema definitions for `resumes` table
│
├─ app/                          # Next.js 15 app directory
│   ├─ api/
│   │   ├─ search/
│   │   │   └─ route.ts           # GET search logic using Drizzle
│   │   └─ summarize/
│   │       └─ route.ts           # POST summarize logic (optional)
│   │
│   ├─ components/                # Shared React components
│   │   ├─ CandidateCard.tsx       # Display each candidate result
│   │   ├─ SearchInput.tsx         # Debounced input component
│   │   └─ AIButton.tsx            # “Summarize CV” button + loading state
│   │
│   ├─ styles/
│   │   └─ globals.css             # Tailwind imports or custom CSS
│   │
│   ├─ page.tsx                    # Main search page UI
│   ├─ layout.tsx                  # Optional layout wrapper (imports global CSS)
│   └─ globals.css                 # Imported in layout for Tailwind
│
├─ scripts/                      # Utility scripts for pre‑processing
│   └─ uploadResumes.ts           # Node.js script to parse & upload resumes to Supabase via Drizzle
│
├─ data/                         # (Optional) Local JSON seeds or example data
│   └─ sampleCandidates.json      
│
├─ resumes/                      # Folder containing raw resume files (PDF/DOCX) for ingestion
│   ├─ Alex_Johnson.pdf
│   ├─ Meera_Patel.docx
│   └─ … (100+ files) …
│
└─ README.md                     # (Optional) High-level instructions for future developers
```

**Explanation of each directory**:

* `db/`: Contains Drizzle ORM schema (`schema.ts`) and client initialization (`client.ts`).
* `app/api`: Server functions. `search/route.ts` uses Drizzle raw SQL for FTS; `summarize/route.ts` uses Drizzle to fetch resume text and calls OpenAI.
* `app/page.tsx`: The main page for recruiters to search CVs; contains React state, debounced fetch logic, and result rendering.
* `app/layout.tsx`: Wraps all pages, imports global CSS (e.g., Tailwind).
* `app/components/`: Reusable UI components (candidate cards, search inputs, AI button).
* `scripts/`: Contains Node.js script `uploadResumes.ts` that uses Drizzle ORM to insert parsed resume data.
* `data/`: (Optional) Local JSON seeds for testing before parsing real PDFs.
* `resumes/`: Place all raw resume files here; `uploadResumes.ts` expects this folder structure.
* `app/styles/`: Contains global CSS or Tailwind imports.

---

## 11. Development & Deployment Instructions

### 11.1 Local Development (24 h MVP)

1. **Clone or create the repository**:

   ```bash
   git clone <your-repo-url> HireAI-MVP
   cd HireAI-MVP
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   Create a file named `.env.local` at the project root with:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   SUPABASE_DATABASE_URL=postgresql://<username>:<password>@<host>:5432/<db>
   OPENAI_API_KEY=<optional, for summarization>
   ```

4. **Run Drizzle migrations**:

   ```bash
   npx drizzle-kit generate:pg --out migrations
   npx drizzle-kit up
   ```

   * This creates the `resumes` table, GIN index, and `fts_ranked_search` function in Supabase.

5. **Run resume ingestion script** (once, to upload 100 resumes):

   ```bash
   node scripts/uploadResumes.ts
   ```

   * Ensure all 100 PDF/DOCX files are in `resumes/`.
   * Check Supabase Dashboard to confirm 100 rows in `resumes` table.

6. **Start Next.js dev server**:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   * Visit `http://localhost:3000` in your browser.
   * Type a keyword (e.g., "React"), observe instant CV matches.
   * (Optional) Click "Summarize CV" under a card, watch OpenAI summarize.

7. **Iterate & polish**:

   * Tweak Tailwind classes or component layout to make cards look neat.
   * Test on mobile sizes (100% width input, stacked cards, etc.).
   * Add error handling (e.g., if Drizzle query returns no results, show "No matches found.").

### 11.2 Deployment to Vercel

1. **Push your code to GitHub** (or GitLab).
2. **Go to Vercel Dashboard** → "New Project" → import your repo.
3. **Configure environment variables** in Vercel project settings:

   * `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-ref.supabase.co`
   * `SUPABASE_SERVICE_ROLE_KEY` = `<your-service-role-key>`
   * `SUPABASE_DATABASE_URL` = `postgresql://<username>:<password>@<host>:5432/<db>`
   * `OPENAI_API_KEY` = `<if using summarization>`
4. **Deploy**. Vercel detects Next.js 15 automatically and runs `npm run build` → `npm start`.
5. **Live URL** is generated (e.g., `https://hireai.vercel.app/`).

   * Test the search interface to ensure it works identically to local.
   * Confirm Drizzle queries are returning results.
6. **Submit** your hackathon link to judges. Record a short Loom or screen recording demonstrating:

   * Upload & ingestion (show 100 CVs in Supabase table).
   * Live search (type “Docker AWS” → see 5 results in <200 ms).
   * (Optional) Summarization (“Summarize CV” → AI output appears).

---

## 12. Future Extensions / Phase 2 Roadmap (2‑Week Stretch)

1. **Semantic Vector Search with PGVector**

   * Use Supabase’s Vector extension to store 1536‑dim embeddings.
   * Precompute resume embeddings with OpenAI Embeddings API (during ingestion).
   * Create a query endpoint: embed recruiter’s search text / job description, ANN search to get top‑10 semantically similar resumes via raw SQL in Drizzle.
   * Display semantic similarity score (converted to %).

2. **Authentication & User Roles**

   * Integrate Supabase Auth (email/password, OAuth).
   * Create a `users` table with a `role` column (e.g., `recruiter`, `admin`) via Drizzle.
   * Protect API routes with RLS so that only authenticated recruiters can search.

3. **Interview Scheduling & Calendar Integration**

   * Add an `interviews` table via Drizzle: `{ id, resumeId, recruiterId, scheduledTime, notes }`.
   * Build a UI flow to pick a date/time (use `react-datepicker` or integrate Calendly widget).
   * On confirm, use Drizzle to insert into `interviews`, send a calendar invite via Google Calendar API.

4. **Candidate Shortlist & Notes**

   * Add a “Shortlist” button on each candidate card (toggle star icon).
   * Allow recruiters to add free‑text notes about each candidate, store in a `candidateNotes` table via Drizzle.
   * Display a “Shortlisted” badge on candidate cards.

5. **Advanced Filtering & Sorting**

   * Add filters for years of experience, education level, location radius.
   * Allow sorting by relevance (default), date added, alphabetical.
   * Provide a multi‑select filter for skills (UI: checkboxes or tag input).

6. **Bias Detection & Fairness** (Optional but impressive)

   * Run a quick check on each resume (e.g., detect gendered pronouns, age references).
   * Show a “Bias Alert” badge if resume mentions protected attributes.
   * Provide guidelines to recruiters on how to ignore sensitive info.

7. **Enhanced UI/UX**

   * Responsive design: ensure UI works on mobile.
   * Dark mode toggle.
   * Refine card styling, use icons for skills, add company logos in work history.
   * Loading skeletons for search results.

8. **Performance & Testing**

   * Write unit tests for API endpoints (supertest or Jest).
   * Write integration tests for search flow (Cypress or Playwright).
   * Load test the search endpoint with hundreds of concurrent requests.

9. **Analytics & Monitoring**

   * Integrate PostHog or Google Analytics to track searches, clicks, and recruiter usage.
   * Show a dashboard (admin) with top searched keywords, top candidates viewed.

10. **Deployment & DevOps**

    * Configure continuous integration (CI) pipeline (GitHub Actions) to run tests on each push.
    * Add a staging environment on Vercel for QA.
    * Set up monitoring/alerts (e.g., Sentry for error tracking).

11. **Documentation & Demo**

    * Write a detailed `README.md` with screenshots, usage instructions, and architecture diagrams.
    * Create a short demo video (2–3 minutes) showing search, AI summarization, and any advanced features.

---

## 13. Additional Developer Notes

* **Debounce Logic**: The `useEffect` in `app/page.tsx` uses `setTimeout`/`clearTimeout`. If you prefer, you can install `react‑debounce‑input`:

  ```bash
  npm install react‑debounce‑input
  ```

  Then:

  ```tsx
  import { DebounceInput } from 'react‑debounce‑input';

  <DebounceInput
    minLength={2}
    debounceTimeout={300}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search resumes…"
    className="w-full border px-4 py-2"
  />
  ```

* **Tailwind Setup**: If you choose Tailwind, install & configure:

  1. `npm install -D tailwindcss postcss autoprefixer`
  2. `npx tailwindcss init -p`
  3. In `tailwind.config.js`, set `content: ['./app/**/*.{js,ts,jsx,tsx}', './app/components/**/*.{js,ts,jsx,tsx}']`.
  4. In `app/globals.css`, include:

     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

  5. In `app/layout.tsx`:

     ```tsx
     import './globals.css';
     export default function RootLayout({ children }: { children: React.ReactNode }) {
       return <html lang="en"><body>{children}</body></html>;
     }
     ```

* **Error Handling**: In production, wrap Drizzle queries in try/catch. Return user‑friendly errors (e.g., “Unable to fetch results, please try again later”).

* **Security**: Expose `NEXT_PUBLIC_SUPABASE_URL` on the client if needed for Supabase JS client, but keep `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DATABASE_URL` server‑only. Utilize Supabase Auth & RLS in Phase 2 for fine-grained access control.

* **Cost Management**: Supabase’s free tier offers 500 MB DB storage, unlimited rows for Postgres, and generous API request limits. OpenAI usage (if you implement summarization) should be kept minimal—only one call per CV summary to control costs.

* **Local Testing vs. Production**: Use environment variables to switch between local Supabase instance and production (Vercel). For local Supabase, you can run `supabase start` (docker) if you want a fully local dev database.

---

## 14. Summary

This **context.md** file provides a comprehensive reference for:

* The MVP’s feature scope: ultra‑fast FTS search over 100+ resumes using Drizzle ORM.
* The tech stack: Next.js 15 (app directory) + Drizzle ORM + Supabase + Node.js for parsing, with optional OpenAI.
* Data flow: from raw PDF → parsed text → Supabase table (via Drizzle) → search API → frontend.
* Database schema: `resumes` table defined with Drizzle schema, `tsv` column, GIN index, `fts_ranked_search` function migration.
* API routes: `GET /api/search` using Drizzle raw SQL, `POST /api/summarize` using Drizzle to fetch data and OpenAI.
* Directory structure: where to place `db/` (Drizzle), `app/` pages, components, scripts, data.
* Environment variables and deployment steps (local and Vercel).
* Future Phase 2 roadmap: semantic search (PGVector), Auth, interview scheduling, bias detection, etc.

You can feed this entire file to **Cursor** (or any code generator) to help scaffold the project. It includes everything a developer needs to spin up the MVP in under 24 hours and then expand it over a two‑week stretch.

Good luck building HireAI!
