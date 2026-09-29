# AI-Assisted Development Story

This document summarises how I use GitHub Copilot and Claude Code as part of my software development workflow.

The tools support my work, but I remain responsible for design decisions, implementation quality, security, testing, and final review.

## Overview

> I use GitHub Copilot and Claude Code as context-aware development assistants. I have added repository guidance so both tools understand the project architecture, coding conventions, testing strategy, and quality requirements. Copilot is especially useful for focused suggestions and repeatable scaffolding, while Claude Code is useful for larger, coordinated changes and repository-wide refactoring. I do not treat generated code as automatically correct: I review the design, keep changes scoped, write tests, run linting and builds, and use CI and pull-request review as quality gates. The main value is faster exploration and implementation while retaining engineering ownership of the result.

## Contents

- [Approach](#approach)
- [GitHub Copilot](#github-copilot)
    - [How I integrate it](#how-i-integrate-it)
    - [How I use it](#how-i-use-it)
    - [How I control quality](#how-i-control-quality)
- [Claude Code](#claude-code)
    - [How I integrate it](#how-i-integrate-it-1)
    - [How I use it](#how-i-use-it-1)
    - [How I control quality](#how-i-control-quality-1)
- [My End-to-End Workflow](#my-end-to-end-workflow)

## Approach

I use AI as an engineering multiplier rather than as a replacement for engineering judgement.

My approach is to provide the tools with clear project context, ask for focused changes, inspect the proposed implementation, and verify the result with automated checks. This makes AI assistance more consistent with the existing architecture and reduces the risk of accepting code that merely appears plausible.

The project is a React and Firebase application using Vite, React Router, Redux, SCSS modules, Vitest, Cypress, and GitHub Actions.

## GitHub Copilot

### How I integrate it

GitHub Copilot is integrated through repository-level and path-specific guidance:

- [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) provides the overall project conventions.
- [`.github/instructions`](../.github/instructions) contains focused guidance for components, pages, Redux, styling, and testing.
- [`.github/agents`](../.github/agents) contains reusable workflows for creating components, pages, and Redux slices.

The guidance gives Copilot knowledge of the project structure and preferred implementation patterns, including:

- `@/` imports for source files
- centralised constants
- PropTypes for component props
- reusable UI components
- accessibility requirements
- SCSS module conventions
- RTK Query and thunk guidance
- Vitest and Cypress test expectations
- ESLint and Prettier requirements

### How I use it

I use Copilot for:

- exploring unfamiliar parts of the codebase
- generating focused implementation suggestions
- scaffolding components, pages, and Redux work
- creating test cases alongside production code
- identifying repetitive code or possible refactoring opportunities
- explaining existing code and possible trade-offs

The repository agents make scaffolding more repeatable. For example, a new component workflow considers its folder structure, styles, PropTypes, accessibility, test selectors, and associated tests rather than generating only a single JSX file.

### How I control quality

Copilot output is treated as a proposal. I review it against the existing architecture and validate it using:

- ESLint with warnings treated as errors
- Prettier formatting
- Vitest unit and integration tests
- Cypress component and end-to-end tests
- production builds
- GitHub Actions checks
- normal pull-request review

This means the assistant can improve speed without becoming the authority on correctness.

## Claude Code

### How I integrate it

Claude Code is integrated as a persistent, repository-aware coding environment:

- [`CLAUDE.md`](../CLAUDE.md) provides stable project context for sessions.
- [`.claude/docs`](../.claude/docs) contains detailed guidance for components, pages, Redux, styling, and testing.
- [`.claude/agents`](../.claude/agents) contains reusable workflows for feature scaffolding.
- [`.devcontainer/devcontainer.json`](../.devcontainer/devcontainer.json) installs the Claude Code extension and CLI in the development container.

The development container also supports a consistent working environment by configuring Node.js, GitHub CLI, formatting, ESLint fixes, Cypress dependencies, and persistent tool configuration.

### How I use it

I use Claude Code for:

- understanding the architecture before making a change
- implementing coordinated changes across source files and tests
- repository-wide refactoring
- updating documentation and configuration alongside code
- running commands and tests during an implementation task
- investigating failures and narrowing changes to the responsible code path

Its persistent context is particularly useful when a task spans several layers, such as a page, reusable components, Redux state, tests, and documentation.

### How I control quality

Claude Code follows the same engineering checks as the rest of the project:

- inspect the existing implementation before changing it
- keep changes scoped to the requested behaviour
- follow the project instructions and existing abstractions
- run linting and formatting
- run targeted tests first, then broader tests where appropriate
- review the resulting diff
- verify build and CI behaviour before merging

Local credentials and machine-specific permissions are kept out of source control. This allows the repository to describe the workflow without exposing personal configuration.

## My End-to-End Workflow

1. Define the desired behaviour and identify the code path that owns it.
2. Give the assistant the relevant project context and constraints.
3. Ask for a small, focused implementation or investigation.
4. Review the proposed design and code rather than accepting it blindly.
5. Add or update tests at the same time as the implementation.
6. Run the narrowest useful validation first, such as a targeted test or lint check.
7. Run broader checks when the change has a wider impact.
8. Review the diff for correctness, security, maintainability, and unintended changes.
9. Document meaningful architectural or workflow changes.
10. Submit the work through the normal Git and pull-request process.

## Key Principle

AI can accelerate implementation, but it does not remove the need to understand the codebase. The developer still owns the problem definition, technical decisions, verification, and outcome.
