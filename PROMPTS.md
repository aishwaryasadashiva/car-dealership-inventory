# AI Usage and Original ChatGPT Conversations

## AI Tool Used

I used ChatGPT as a development assistant while building the Car Dealership Inventory System. I used it to understand errors, troubleshoot implementation issues, improve test isolation, review test results, and improve project documentation.

## Original ChatGPT Conversations

The following link was provided to document the original ChatGPT conversation used during development.

### 1. Backend Testing and Development

- **Original conversation:** https://chatgpt.com/share/6add785d-3f14-83ec-8f1b-a31bee4ca897
- **Purpose:** Original conversation supplied for documenting AI assistance during the project.

Additional original conversations should be linked here as they are recovered.

## Summary of AI Assistance

The following descriptions summarize the main areas in which I used AI assistance. They are summaries of the work, not verbatim transcripts of the original conversations.

### 1. Backend Testing

**Prompt summary:** Help me fix the backend tests and configure a temporary SQLite database so the tests do not modify the development database.

**How I used the response:** I updated the pytest fixture and test cases to use a separate in-memory database. I ran the test suite to check the changes.

### 2. Authentication Configuration

**Prompt summary:** Help me understand and resolve the `JWT_SECRET_KEY` error that prevented pytest from loading the application.

**How I used the response:** I configured a test-only secret for the test environment so the application could be imported during testing.

### 3. Test Verification

**Prompt summary:** Help me interpret pytest output and understand the warning reported by the Starlette test-client integration.

**How I used the response:** I ran the backend test suite and checked the results, including the passing test count and deprecation warning.

### 4. Project Documentation

**Prompt summary:** Help me structure the README with project details, setup instructions, API endpoints, testing instructions, and an AI usage disclosure.

**How I used the response:** I reviewed and updated the README to explain the project, how to run it, and how to verify the application.

## Reflection on AI Usage

ChatGPT helped me investigate errors, understand testing issues, and organize project documentation. I used its suggestions as development assistance and ran the relevant commands locally to verify the results.

Using AI helped me work through problems more efficiently, but I recognize that generated suggestions need to be reviewed and tested. I remain responsible for understanding the implementation and explaining my technical decisions.

## Verification

The latest recorded backend test run reported 14 passed tests, zero failures, and one deprecation warning. The frontend production build and ESLint checks also completed successfully.

## Important Note About Conversation Records

This file contains summaries of AI assistance as well as the original conversation link listed above. The summaries are not verbatim transcripts.

Where the assignment requires raw, unedited AI chat logs or public conversation links, the original records must be supplied. Additional genuine links or unedited logs should be added as needed to document the conversations used during development.