# PRODUCT REQUIREMENTS DOCUMENT (PRD) – HIRE-AI vNext

**Author:** TBD  
**Last updated:** January 2025

---

## 1. AI-POWERED TALENT SHORTLIST ENGINE

### A. Objective

Cut sourcing time by auto-ranking applicants against a job's must-have and nice-to-have criteria using LLM-based résumé parsing plus structured signals (skill tests, badges). Inspired by G2i's "90th-percentile" matching and Uplers' pre-vetted talent pools.

### B. Success Metrics

- ≤5 relevant candidates in <60s for 80% of roles
- 25% faster time-to-hire vs. current baseline
- 90% of recruiters rate shortlist relevance ≥4/5

### C. Core User Stories

- **US-1:** As a recruiter, when I open a job req I want to see an auto-generated ranked list of top applicants so I can skip manual triage.
- **US-2:** As a hiring manager, I want weight sliders (skills, seniority, time-zone, comp) so I can tune the ranking to my team's needs.

### D. Functional Spec

1. Ingest resumes → extract structured data (entities, embeddings).
2. Composite "FitScore" = Σ(skill match, assessment score, timezone overlap, availability, comp band).
3. Interactive dashboard: top-N list, breakdown per candidate, and "why matched" explanation.
4. Feedback loop: thumbs-up / down refines weighting per job.

### E. Non-Functional

- P50 latency <3s for shortlist generation (cached).
- Explainability: show contributors ≥5% weight.

---

## 2. SMART JOB AD COMPOSER & DISTRIBUTION

### A. Objective

Generate high-converting remote-friendly job posts and 1-click broadcast them to major boards (Remote OK, LinkedIn, etc.). Mirrors Remote OK's easy post flow + tag system.

### B. Success Metrics

- Job post completion rate ≥90% (now 68%)
- 2× increase in qualified applicant volume per role
- Avg. CPC down 20% due to better targeting

### C. Core User Stories

- **US-3:** As a recruiter, I want AI to draft a compelling job description from my bullet points so I can publish faster.
- **US-4:** As a recruiter, I want to select boards (Remote OK, Hacker News, etc.) and auto-push, tracking performance centrally.

### D. Functional Spec

1. GPT prompt templates create job ad (tone, benefits, DEI language).
2. Tag recommender (e.g., #async, #equity) from Remote OK taxonomy to boost discoverability.
3. Board adapters (REST or RSS) for posting; store post IDs for analytics.
4. Dashboard: impressions, clicks, applies per channel.

---

## 3. TECHNICAL SKILL VERIFICATION & BADGING

### A. Objective

Increase employer trust by attaching verifiable skill badges (e.g., "React Senior 85th percentile") to candidate profiles, echoing G2i's deep code challenge and Uplers' vetting labels.

### B. Success Metrics

- 70% of active candidates complete at least one assessment
- Hires sourced with badge see 15% higher salary offers (quality signal)
- Recruiter "trust" score ≥4/5

### C. Core User Stories

- **US-5:** As a developer, I want to take a timed assessment and earn a public badge so I can stand out.
- **US-6:** As a recruiter, I want to filter candidates by badge level to focus on proven talent.

### D. Functional Spec

1. Integrate third-party coding challenge API (e.g., HackerRank, Woven) or build in-house graded tasks.
2. Badge issuance rule-set (score thresholds, expiry after 18 mo).
3. Badge metadata stored on-chain hash or signed JSON for tamper-proofing (stretch).
4. Filters in search UI by badge type/level.

---

## 4. REAL-TIME AVAILABILITY & ENGAGEMENT SIGNALS

### A. Objective

Surface live "hire-ability" indicators (e.g., actively interviewing, notice period, first response SLA) similar to Uplers' "ready to start in 2 weeks" and Remote OK's "actively hiring" tags.

### B. Success Metrics

- 30% lift in recruiter-candidate response rate
- 20% fewer interviews canceled due to availability mismatch
- >50% of candidate profiles show fresh status (<14d)

### C. Core User Stories

- **US-7:** As a candidate, I can update my availability and preferred interview windows so I avoid scheduling churn.
- **US-8:** As a recruiter, I want realtime icons (green = actively looking) in search results so I waste less outreach.

### D. Functional Spec

1. Candidate portal quick-update widget (availability, time-zone).
2. Websocket or SSE pushes to recruiter UI for status changes.
3. Decay logic: status auto-expires → "unknown" after X days.
4. Analytics: average first-response time, surfaced in company dashboards.

---

## COMMON DESIGN CONSIDERATIONS

- **Branding & polish:** Use consistent card layout, subtle motion on hover, accessible color contrasts.
- **Privacy:** GDPR/CCPA compliant data handling, granular candidate consent for badge display & board posting.
- **Monetization levers:** premium board placements, paid assessment credits, recruiter seats.

---

## TECH / DEPENDENCIES

- Next.js + React (already in repo), Postgres via Drizzle ORM.
- OpenAI / Llama 3 for language tasks.
- Redis for feature-flag rollout & caching shortlists.
- CRON job or webhook queue for board distribution.
- Websocket layer (e.g., Pusher) for real-time signals.

---

## RISKS & MITIGATIONS

1. **False-positive matches** → provide explainability & recruiter feedback loop.
2. **Assessment drop-off** → offer lightweight "take-home" alt path.
3. **Job board API changes** → abstract via adapter pattern.

---

## References

- [1] Remote OK job tag system & quick posting flow – <https://remoteok.com>
- [2] G2i "pre-vetted engineers" & percentile scoring – <https://www.g2i.co>
- [3] Uplers "ready to deploy within 48 hours" talent pool & availability tags – <https://www.uplers.com>
