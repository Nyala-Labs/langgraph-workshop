# Changelog

All notable changes to this workshop will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-14

### Added
- Complete 4-day + optional Day 5 workshop curriculum
- Python track with full implementation examples
- TypeScript track with full implementation examples
- Day 1: Foundations (graphs, state, reducers, streaming)
- Day 2: Persistence & durable execution
- Day 3: Human-in-the-loop with interrupts
- Day 4: Memory, multi-agent systems, time travel
- Day 5: Production hardening (evals, observability, safety)
- Capstone project: Research Assistant Agent
  - Incremental implementation across 5 days
  - Multi-agent supervisor pattern
  - Long-term memory with store
  - HITL approval gates
  - Evaluation harness with multiple evaluators
- Comprehensive setup and verification scripts
- Instructor guide with pedagogy best practices
- Debugging checklist and operational runbooks
- Evaluation dataset with 8+ test scenarios
- Support for both OpenAI and Anthropic models

### Documentation
- Main README with prerequisites and schedule
- Detailed SETUP.md for both tracks
- Day-by-day READMEs with learning objectives
- Lab instructions with starter code and solutions
- INSTRUCTOR_GUIDE.md with teaching tips
- CONTRIBUTING.md for community contributions
- Debugging checklist for common issues

### Infrastructure
- GitHub Actions-ready test configuration
- pytest configuration for Python track
- TypeScript build configuration
- Environment variable management with .env
- SQLite checkpointer for development
- LangSmith tracing integration

## Future Releases

### Planned for 1.1.0
- Video walkthroughs of each lab
- Additional challenge exercises for advanced learners
- Docker-based development environment
- Pre-configured cloud deployment templates
- More multi-agent patterns (hierarchical, swarm)

### Planned for 1.2.0
- LangGraph Studio integration exercises
- Advanced evaluation patterns (A/B testing, red teaming)
- Production deployment to AWS/GCP/Azure guides
- Performance optimization module
- Security hardening checklist

### Under Consideration
- Rust/Go track (if community interest)
- Industry-specific capstone variants (healthcare, finance, education)
- Integration with popular frameworks (FastAPI, Next.js)
- Certification program
- Train-the-trainer materials

## [Unreleased]

### Changed
- N/A

### Fixed
- N/A

---

For detailed changes, see [commits](https://github.com/YOUR_ORG/langgraph-workshop/commits/main).
