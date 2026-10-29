---
name: feature-learning
description: Teach software feature concepts using implementation and test examples, either briefly in conversation or as an explicitly requested detailed learning document. Use for conceptual understanding, not a readiness review or line-by-line walkthrough.
argument-hint: '[feature scope/learning interests]'
---

# Feature Learning Guide

Turn a recently implemented feature into a focused software-engineering lesson. The reader should finish with a useful mental model and enough orientation to explore the code independently.

## Choose a Mode

- **Conversational mode** is the default, including for every `$feature-workflow` milestone. Explain one to three relevant concepts briefly in the conversation, grounded in the reviewed change and a representative code or test example. Explain why the design matters and link to useful local files. Adapt the depth to the change and the user's interests. Do not create a learning document or add exercises unless the user asks for them.
- **Detailed document mode** applies when the user explicitly asks for a full learning document. Create the personal note in `learning/` and use the guidance below to build a more complete lesson. Include exercises only when useful or requested.

Both modes use the same principles below; their depth and output differ. In conversational mode, do not mechanically include every section, a file tour, or a test-layer survey.

## 1. Choose the Learning Goals

1. Read the feature diff, relevant specification, implementation entry points, and representative tests.
2. Identify the concepts that best explain the feature, such as state ownership, data modeling, snapshot semantics, factories, service boundaries, i18n, persistence, accessibility, or test layering. Select one to three for conversational mode and typically three to five for a detailed document.
3. Assume the reader knows basic programming and software-engineering vocabulary. Briefly define a concept only when its project-specific use is not obvious.
4. Follow any learning interests named by the user. Otherwise prioritize concepts with the most architectural or maintenance value.

## 2. Teach Through the Feature

For each selected concept, connect four things:

- **Idea** — explain the concept in plain language.
- **Repository example** — show where this feature uses it with a local file link.
- **Reasoning** — explain what problem it solves here and who owns the data or behavior.
- **Tradeoff** — name a reasonable alternative and why the current design may be preferable or limiting.

Start with what the user experiences, then build the system model behind it. When the flow crosses at least three meaningful boundaries, use a compact diagram such as UI event → application orchestration → service/data transformation → persistence → rendered state.

Do not turn the explanation into a change log, release checklist, or list of every file. Do not repeat a `feature-completion` verdict or code-review findings except for a short context note when a known limitation affects the lesson.

## 3. Use Tests as Executable Examples

Explain the testing strategy as part of the design:

- Use one or two representative unit tests to teach isolated data or service behavior.
- Use component tests to show UI contracts, state transitions, events, focus, or keyboard behavior.
- Use E2E tests to show which boundaries are only meaningful in a real browser workflow.

Describe why each test belongs at that layer and what a lower layer cannot prove. Validation totals may be mentioned briefly, but command logs, coverage tables, and pass/fail reporting belong to `feature-completion` unless the user explicitly asks for them.

## 4. Give a Learning-Oriented Code Tour

Provide an ordered path through roughly three to seven files. For each stop, give the reader a question to answer rather than only a description:

- What responsibility is isolated here?
- What data enters and leaves?
- Which dependency or caller connects it to the next step?
- What invariant would break if this code changed incorrectly?

Use exact local links and useful starting lines. Quote only small expressions when they illuminate a concept; never reproduce large source blocks or explain every line.

## 5. Optional Exercises for a Detailed Document

When useful or requested, offer two to four optional exercises in increasing depth:

- **Observe** — trace a user action or inspect persisted/runtime data without editing code.
- **Modify** — make a small local change to content or behavior and predict the result.
- **Extend** — add a test case or a small feature variant that reuses the same architecture.

For each exercise, state the learning objective and expected observation. Do not perform edits or start services unless the user also asks for execution.

## 6. Recommended Detailed Document Shape

1. **30-second concept map** — the feature and the two or three central ideas.
2. **User flow to data flow** — connect visible behavior to system boundaries.
3. **Concept lessons** — repository example, reasoning, and tradeoff for each idea.
4. **Tests as examples** — how different test layers express the design.
5. **Guided reading path** — key files and questions to investigate.
6. **Try it yourself**, when useful or requested — progressive exercises with expected observations.

End with a small glossary only for feature-specific terms actually used. Adapt depth to the feature and the reader's interests; the goal is conceptual ownership, not memorizing implementation details.
