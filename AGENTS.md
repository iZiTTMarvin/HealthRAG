# Repository Guidelines

## Project Structure & Module Organization
- `backend/` contains the FastAPI server (`main.py`), route modules in `backend/routes`, and service logic in `backend/services`.
- `frontend/` is a Vite + React app with pages/components in `frontend/src`, and styles in `frontend/src/styles`.
- `data/` stores datasets and utility scripts for data preparation.
- `model/` holds local model artifacts and vocab/config files.
- `img/` contains UI and documentation images.
- `tmp_data/` is for local runtime/cache files (for example, credentials or indices).
- Root-level Python scripts like `build_up_graph.py` and `ner_model.py` support model and graph workflows.

## Build, Test, and Development Commands
- Install backend dependencies: `python -m pip install -r "backend/requirements.txt"`.
- Run the API locally (from repo root): `python -m uvicorn backend.main:app --reload`.
- Install frontend dependencies: `cd "frontend" && npm install`.
- Start the frontend dev server: `npm run dev`.
- Build or preview the frontend: `npm run build` and `npm run preview`.

## Coding Style & Naming Conventions
- Python uses 4-space indentation and snake_case for modules and functions. Keep service logic in `backend/services` and routing in `backend/routes`.
- TypeScript/React uses 2-space indentation and double quotes. Components are PascalCase, hooks and utilities are camelCase.
- Keep styling in CSS files under `frontend/src/styles`.

## Testing Guidelines
- No automated test framework is configured in this repository. If you add tests, place them under `backend/tests/` or `frontend/src/__tests__` and document the chosen runner and command here.

## Commit & Pull Request Guidelines
- No git history is present in this working copy. Use short, imperative commit messages (for example, "Add chat streaming endpoint").
- Pull requests should include a clear summary, testing notes, and screenshots for UI changes. Link related issues when available.

## Security & Configuration Tips
- The backend expects local services like Neo4j and Ollama (default hosts in code). Ensure they are running before testing chat or graph features.
- Treat files in `tmp_data/` as local-only and avoid committing sensitive data.
