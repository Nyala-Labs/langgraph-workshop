# Instructor Guide

## Overview

This guide helps instructors prepare for and deliver the LangGraph Comprehensive Workshop. It includes timing guidance, common student misconceptions, and troubleshooting tips.

## Pre-Workshop Preparation

### 2 Weeks Before
- [ ] Test all lab exercises on both Python and TypeScript tracks
- [ ] Verify setup scripts work on Windows, Mac, and Linux
- [ ] Create instructor accounts on LangSmith
- [ ] Prepare demo environment with pre-populated data
- [ ] Test network/firewall for API access
- [ ] Book helpers (1 per 10-15 students)

### 1 Week Before
- [ ] Send pre-workshop email with setup instructions
- [ ] Share `SETUP.md` and verification scripts
- [ ] Create shared document (Google Doc / HackMD) for collaboration
- [ ] Set up Discord/Slack channel
- [ ] Test screen sharing and recording setup
- [ ] Prepare backup exercises for fast finishers

### Day Before
- [ ] Run verification script on your machine
- [ ] Pre-load all example code in your IDE
- [ ] Test projector and font size visibility
- [ ] Prepare "cheat sheet" printouts (optional)
- [ ] Charge laptop and have backup charger
- [ ] Arrange classroom for pair programming if applicable

## Teaching Philosophy

### Evidence-Based Practices

1. **Participatory Live Coding** (Carpentries Method)
   - Type code in real-time; students code along
   - Say what you're typing as you type it
   - Explain before, during, and after
   - Go SLOWLY - 50% slower than feels natural
   - Never copy-paste during instruction

2. **Formative Assessment Every 15-20 Minutes**
   - "Predict the output" exercises
   - "Spot the bug" challenges
   - Quick polls or hand raises
   - Peer discussion questions

3. **Intentional Mistakes**
   - Make common errors deliberately
   - Model debugging process aloud
   - Frame errors positively: "Great! This shows us..."
   - Let students catch mistakes sometimes

4. **Cognitive Apprenticeship**
   - Narrate your thinking: "I'm choosing X because..."
   - Explain trade-offs openly
   - Show your own debugging workflow
   - Admit when you don't know something

## Daily Routine

### Morning (09:00-12:00)

**09:00-09:15 - Warm-up**
- Recap previous day (Days 2-5)
- Today's objectives (visible on slide/board)
- Quick poll: "How's everyone feeling?"
- Announce helpers and their locations

**09:15-10:30 - Block 1**
- 10 min: Concept introduction
- 20 min: Live-coded demo
- 30 min: Lab exercise (pairs recommended)
- 15 min: Debrief + formative check

**10:30-10:45 - Break**
- Encourage movement
- Helpers available for 1-on-1 help

**10:45-12:00 - Block 2**
- Same structure as Block 1
- Build on Block 1 concepts

### Afternoon (13:00-16:30)

**13:00-14:30 - Block 3**
- Deeper dive or new major topic
- May include longer lab (45 min)

**14:30-14:45 - Break**

**14:45-16:00 - Block 4**
- Integration time
- Work on capstone
- Helpers circulate actively

**16:00-16:30 - Wrap-up**
- Capstone progress check-in
- Exit ticket (3 questions)
- Preview tomorrow's topics
- Homework (optional)

## Common Student Misconceptions

### Day 1: Graphs & State

| Misconception | Reality | How to Address |
|---------------|---------|----------------|
| "Nodes run in parallel" | Nodes in same super-step run in parallel; graph is sequential super-steps | Draw timeline diagram |
| "State is just a dict" | State has merge semantics (reducers) | Show side-by-side comparison |
| "Edges are like function calls" | Edges are data flow, not control flow | Use railroad track analogy |

### Day 2: Persistence

| Misconception | Reality | How to Address |
|---------------|---------|----------------|
| "`thread_id` is optional" | Required for any persistence | Show error without it |
| "Checkpoints store everything" | Only state, not Python objects | Demonstrate with class instance |
| "MemorySaver is production-ready" | Only for dev/testing | Show database checkpointer |

### Day 3: Interrupts

| Misconception | Reality | How to Address |
|---------------|---------|----------------|
| "Interrupt pauses at exact line" | Node restarts from beginning | Step through code with debugger |
| "Can't use try/except" | Can use, just not around `interrupt()` | Show correct pattern |
| "Resume picks up where it left off" | Resume re-runs node with new value | Live demonstration |

### Day 4: Memory & Multi-Agent

| Misconception | Reality | How to Address |
|---------------|---------|----------------|
| "Store and checkpointer are the same" | Different scopes (cross-thread vs within-thread) | Venn diagram |
| "Semantic search is just keyword matching" | Uses embeddings for meaning | Show example with synonyms |
| "Supervisor slows everything down" | Can be fast with right model | Profile timing |

### Day 5: Production

| Misconception | Reality | How to Address |
|---------------|---------|----------------|
| "Evaluation is optional" | Required for production | Show real-world failure case |
| "100% test coverage needed" | Focus on critical paths | Discuss risk-based testing |
| "Observability = logging" | Structured traces with context | Show LangSmith trace exploration |

## Timing Tips

### If Running Behind (>15 minutes)
1. Skip optional exercises (marked in materials)
2. Live-code the lab instead of having students code
3. Merge two formative checks into one
4. Shorten lunch by 15 minutes (ask first!)
5. Reduce depth on advanced topics

### If Running Ahead (>15 minutes)
1. Add challenge exercises for advanced students
2. Do deeper dive into a topic students requested
3. Live troubleshooting of student code
4. Show additional real-world examples
5. Extra time for capstone work

### Time Management Per Block
- **Concept (10 min)**: If over, you're too detailed. Focus on "why" and "what", not "how".
- **Demo (20 min)**: If over, reduce live-typed code. Pre-type boilerplate.
- **Lab (30 min)**: If over, extend break or shorten debrief. Don't cut labs.
- **Debrief (15 min)**: If over, you're solving individual bugs. That's for office hours.

## Handling Questions

### During Instruction
- **Good question for now**: Pause and answer immediately
- **Good question for later**: "Great question! Let's cover that in Block 3"
- **Off-topic**: "Interesting! Let's discuss at lunch/break"
- **Debugging help**: "Put up a sticky note, helper will come"

### Types of Questions

**Conceptual**: "Why do we need checkpointers?"
→ Answer immediately, may benefit everyone

**Procedural**: "How do I install package X?"
→ Defer to helper or break time

**Debugging**: "My code has error Y"
→ Helper assists, don't derail class

**Advanced**: "What about distributed execution?"
→ Acknowledge, offer to discuss after class

## Code Demo Best Practices

### Screen Setup
- Font size: 18pt minimum (20-22pt better)
- Dark theme or high contrast
- Hide notifications, close unrelated tabs
- Use full screen for IDE
- Keep terminal visible if running code

### Live Coding Technique
1. **Announce** what you're about to code
2. **Type** while narrating each line
3. **Explain** what you just coded
4. **Run** the code and show output
5. **Ask** for predictions before running

### Common Pitfalls
- ❌ Typing too fast
- ❌ Using keyboard shortcuts without explaining
- ❌ Switching windows without warning
- ❌ Copy-pasting code
- ❌ Assuming knowledge ("as you know...")

## Troubleshooting Student Issues

### "My code doesn't work"

**Step 1**: Read the error message together
```python
# Show them HOW to read Python tracebacks
# - Bottom line is the actual error
# - Lines above show call stack
# - File path shows WHERE error occurred
```

**Step 2**: Check common issues
- Typos in variable names
- Missing imports
- Wrong indentation (Python)
- Missing/extra brackets
- Stale Python session (restart kernel)

**Step 3**: Use print debugging
```python
# Add strategic prints
print("State before:", state)
result = problematic_function(state)
print("Result:", result)
```

**Step 4**: If still stuck → helper takes over

### "I'm getting import errors"

```bash
# Python
which python  # Check version and venv
pip list | grep langgraph  # Check installation
pip install --upgrade langgraph  # Reinstall

# TypeScript
npm list @langchain/langgraph  # Check installation
rm -rf node_modules && npm install  # Reinstall
```

### "My environment is broken"

**Nuclear option**:
```bash
# Python
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# TypeScript
rm -rf node_modules package-lock.json
npm install
```

## Helper Management

### Helper Roles
- **Roaming**: Walk around, watch for stuck students (sticky notes)
- **Station**: Fixed location for complex debugging
- **Online**: Monitor chat/Discord for remote questions

### Helper Briefing (each morning)
- Which labs are tricky today
- Common errors to watch for
- When to escalate to instructor
- Rotate helper assignments

### Sticky Note System
- **Green**: "I'm done, ready to move on"
- **Red/Pink**: "I'm stuck, need help"
- **Blue** (optional): "I have a conceptual question"

## Day-Specific Notes

### Day 1
- **Hardest part**: State merge semantics with reducers
- **Extra time needed**: First lab (students getting used to setup)
- **Watch for**: TypeScript type errors, Python TypedDict confusion
- **Pro tip**: Have a "known-good" state schema example visible

### Day 2
- **Hardest part**: Understanding thread_id vs checkpoint_id
- **Extra time needed**: Checkpoint history inspection lab
- **Watch for**: Students using MemorySaver in production code
- **Pro tip**: Draw timeline showing checkpoints being created

### Day 3
- **Hardest part**: Why nodes restart on resume (not continue from line)
- **Extra time needed**: Streaming with interrupts lab
- **Watch for**: Try/except around interrupt() (breaks it!)
- **Pro tip**: Live demo in debugger showing node restart

### Day 4
- **Hardest part**: Store vs checkpointer distinction
- **Extra time needed**: Multi-agent routing implementation
- **Watch for**: Forgetting to pass `store` via runtime param
- **Pro tip**: Use Venn diagram for store/checkpointer scopes

### Day 5
- **Hardest part**: Evaluation mindset shift (testing agents is hard)
- **Extra time needed**: Capstone demos (people always run over!)
- **Watch for**: Perfectionism (good enough is good enough)
- **Pro tip**: Time-box demos strictly (use timer)

## Accessibility Considerations

- **Visual**: Large fonts, high contrast, describe visual elements aloud
- **Auditory**: Use microphone, face audience, provide written notes
- **Motor**: Allow extra time for typing, pair programming option
- **Cognitive**: Chunk information, provide summaries, allow breaks

## Emergency Scenarios

### Internet Outage
- Switch to pre-downloaded examples
- Skip LLM-dependent labs, use mocks
- Work offline with local checkpointer
- Improvise debugging session

### Projector Failure
- Screen share to student laptops
- Email code snippets
- Students work from written materials
- Pair instruction (verbal + student screen)

### Student Computer Crash
- Pair student with neighbor
- Use backup laptop if available
- Student can follow along, code later
- Provide completed code to catch up

### You Make a Major Mistake
1. Acknowledge it openly: "Ah, I made an error!"
2. Model debugging: "Let's figure out what went wrong"
3. Fix it together with students
4. Frame as learning moment: "This is exactly what you'll do in practice"

## Post-Workshop

### Immediately After
- [ ] Collect exit surveys
- [ ] Save chat logs and shared document
- [ ] Grade capstone projects (if applicable)
- [ ] Send certificates (if applicable)

### Within 1 Week
- [ ] Send follow-up email with resources
- [ ] Share recordings (if recorded)
- [ ] Provide completed solutions
- [ ] Analyze survey feedback

### For Future Improvement
- [ ] Note what worked well
- [ ] Note what needs adjustment
- [ ] Update materials based on feedback
- [ ] Share learnings with other instructors

## Contact & Support

**During Workshop**:
- Lead instructor: [You]
- Helpers: [List]
- Emergency contact: [Number]

**After Workshop**:
- Questions: [Email]
- Issues: [GitHub repo]
- Community: [Discord/Slack]

---

## Quick Reference

### Key Commands (Python)
```bash
# Setup
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/verify_setup.py

# Run
python capstone/python/graph.py

# Test
pytest capstone/python/tests/
```

### Key Commands (TypeScript)
```bash
# Setup
npm install
npm run verify-setup

# Run
npm run start

# Test
npm test
```

### Important URLs
- LangGraph Docs: https://langchain-ai.github.io/langgraph/
- LangSmith: https://smith.langchain.com
- Workshop Materials: [Your repo]

---

**Good luck! You've got this! 🚀**

Remember: Students learn from your mistakes as much as your successes. Stay calm, be authentic, and have fun!
