-- Enables the extensions CareerOS's Knowledge Layer relies on.
-- pgvector: similarity search over embeddings used by the Grounding capability
-- (SAS PRD §26.3) when matching Profile/Skill content against goals, roadmap
-- content, and — once scoped — Learning Hub / Services Marketplace listings.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
