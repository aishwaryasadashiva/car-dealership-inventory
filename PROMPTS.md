# AI Usage and Prompts

I used ChatGPT as a development assistant while building the Car Dealership Inventory System. I used it to understand errors, troubleshoot implementation issues, improve test isolation, and review project documentation.

The following are summaries of the main areas where I requested assistance. They are summaries, not verbatim transcripts of the original conversations.

## 1. Backend testing

**Prompt summary:** Help me fix the backend tests and configure a temporary SQLite database so the tests do not modify the development database.

**How I used the response:** I updated the pytest fixture and test cases to use a separate in-memory database. I ran the test suite to check the changes.

## 2. Authentication configuration

**Prompt summary:** Help me understand and resolve the `JWT_SECRET_KEY` error that prevented pytest from loading the application.

**How I used the response:** I configured a test-only secret for the test environment so the application could be imported during testing.

## 3. Test verification

**Prompt summary:** Help me interpret pytest output and understand the warning reported by the Starlette test client integration.

**How I used the response:** I ran the complete backend test suite and checked the results.

## 4. Project documentation

**Prompt summary:** Help me structure the README with project details, setup instructions, API endpoints, testing instructions, and an AI usage disclosure.

**How I used the response:** I reviewed and updated the README to explain the project and how to run it.

## Verification


The latest recorded backend test run reported 14 passed tests, zero failures, and one deprecation warning. The frontend production build and ESLint checks also completed successfully.

This document summarizes AI assistance and is not a verbatim record of the original prompts or responses. Where the assignment requires raw AI chat logs or public conversation links, those should be supplied separately from the original conversations.
