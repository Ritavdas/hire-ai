# HireAI - CV Search & Screening Tool

HireAI is an AI-powered CV search and screening tool designed for recruiters. It allows recruiters to upload a folder of resumes, index them in a database, and perform instant, fast keyword-based searches.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account with a project set up
- PostgreSQL database (provided by Supabase)

### Environment Setup

1. Clone this repository
2. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DATABASE_URL=postgresql://username:password@host:5432/database
OPENAI_API_KEY=your-openai-api-key  # Optional for CV summarization
```

### Installation

```bash
# Install dependencies
npm install

# Set up the database
npm run db:setup

# Create a test resume (optional)
npm run create:test-resume

# Upload resumes to the database
npm run upload:resumes

# Start the development server
npm run dev
```

### Resume Upload

1. Place your resume files (PDF, DOCX, DOC, or TXT) in the `resumes/` directory
2. Run `npm run upload:resumes` to process and upload them to the database

## Features

- Upload and parse 100+ resumes
- Ultra-fast full-text search
- View candidate details and matching text snippets
- Optional AI-powered resume summarization

## Tech Stack

- Next.js 15 with App Router
- Drizzle ORM with Supabase PostgreSQL
- Tailwind CSS for styling
- pdf-parse and textract for document parsing
- OpenAI API for resume summarization (optional)
