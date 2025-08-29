# Minimal Kanban — Offline-First

A lightweight Kanban board you can deploy in minutes. Features:

- Columns: **To Do**, **In Progress**, **Done**
- **Create / Update / Delete** tasks (title, description, priority, category, due date)
- **Drag-and-drop** between columns
- **Search**, **filter** (priority/category), and **sort** (date/priority)
- **Local persistence** with `localStorage`
- **Multiple boards** + **Export/Import** JSON backup
- No build step; deploy on GitHub Pages/Netlify/Vercel as static site

## Quick Start (Local)

Open `index.html` in a browser. That's it.

## Deploy (GitHub Pages)

1. Create a new repo (e.g., `kanban-board`).
2. Upload these files (or push via git).
3. In **Settings → Pages**, set **Branch: `main` / root**. Wait for the green link.
4. Your app will be live at `https://<your-username>.github.io/kanban-board/`.

## Deploy (Netlify)

- Drag-drop this folder to https://app.netlify.com/drop or connect repo. **Build command:** _none_, **Publish directory:** `/`.

## Deploy (Vercel)

- Import the repo in https://vercel.com/new, Framework preset **"Other"**, Output directory `/`.

## Tech

- HTML, Vanilla JS, Tailwind via CDN
- HTML5 Drag & Drop
- Offline-first (no server)

## Structure

```
index.html
main.js
styles.css
assets/kanban.svg
```

---

Made for fast submission and clean UX.