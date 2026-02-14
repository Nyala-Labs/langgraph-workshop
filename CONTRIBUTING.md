# Contributing to LangGraph Workshop

Thank you for your interest in improving the workshop materials!

## How to Contribute

### Reporting Issues
- Use GitHub Issues to report bugs or suggest improvements
- Include: operating system, Python/Node version, error messages
- For bugs: provide minimal reproducible example

### Suggesting Improvements
- Open an issue first to discuss major changes
- Explain the problem and proposed solution
- Link to relevant documentation or examples

### Submitting Changes

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/langgraph-workshop.git
   cd langgraph-workshop
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Python
   pytest
   python scripts/verify_setup.py
   
   # TypeScript
   npm test
   npm run verify-setup
   ```

5. **Commit with clear message**
   ```bash
   git add .
   git commit -m "Add feature: description of change"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

## Guidelines

### Code Style
- **Python**: Follow PEP 8, use Black for formatting
- **TypeScript**: Use Prettier, follow ESLint rules
- **Comments**: Explain "why", not "what"
- **Docstrings**: Required for all public functions

### Documentation
- Update README.md if adding features
- Add lab instructions for new exercises
- Include examples and expected outputs
- Keep language clear and beginner-friendly

### Labs and Examples
- Test on both Python and TypeScript tracks
- Provide starter code and solutions
- Include formative assessment questions
- Time estimates should be realistic

### Commit Messages
Format: `type: description`

Types:
- `feat`: New feature or lab
- `fix`: Bug fix
- `docs`: Documentation update
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
- `feat: add Day 3 streaming lab exercise`
- `fix: correct state schema in capstone starter`
- `docs: clarify interrupt() usage in Day 3 README`

## Testing Checklist

Before submitting a PR:
- [ ] Code runs without errors
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] Verified on both Python and TypeScript (if applicable)
- [ ] Checked on Windows/Mac/Linux (if possible)
- [ ] No sensitive data (API keys, credentials) committed

## Code Review Process

1. Maintainers will review within 5 business days
2. Feedback may request changes
3. Once approved, maintainers will merge
4. Your contribution will be credited in releases

## Questions?

Open an issue or reach out to maintainers:
- Email: [workshop@example.com](mailto:workshop@example.com)
- Discord: [LangChain Community](https://discord.gg/langchain)

Thank you for contributing! 🙏
