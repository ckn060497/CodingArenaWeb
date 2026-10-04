# CodingArena Web

Responsive web version of the current CodingArena Android project.

## Stack
- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5.3
- Existing Spring Boot API

## Features carried over
- Home dashboard
- Contests
- Contest problems
- Direct Open IDE from every problem
- Java / C++ / Python source editor
- Submission API and judge status polling
- Global leaderboard
- Contest ranking
- Profile
- Submission history
- Daily Challenge
- Speed Coding
- Debugging Challenge
- Output Prediction
- Programming Quiz
- Practice Arena
- Community
- User Discussions
- Announcements
- Notifications
- Help & FAQ
- Achievements
- Admin: Create Contest / Create Problem
- Responsive bottom navigation
- Same blue + violet + green visual language as the Android project

## Run locally

Because browser JavaScript uses fetch, run the folder through a local HTTP server rather than opening index.html directly.

Example:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Connect the existing Spring Boot backend

Open the menu (☰) -> API Settings and enter the backend base URL, for example:

```text
http://localhost:8080
```

For a deployed backend:

```text
https://your-backend.example.com
```

The frontend expects the same API paths already used by the Android app:

- GET `/api/contests`
- GET `/api/contests/{id}/problems`
- GET `/api/contests/{id}/rankings`
- GET `/api/leaderboard`
- GET `/api/users/{id}`
- GET `/api/users/{id}/submissions`
- POST `/api/submissions`
- GET `/api/submissions/{id}`
- POST `/api/contests`
- POST `/api/problems`

## Important CORS note

If the web frontend and Spring Boot backend are on different domains/ports, enable CORS in Spring Boot for the web frontend origin.

The web IDE is a browser editor. It does not execute Java/C++/Python locally; submissions are sent to the existing judge backend.
