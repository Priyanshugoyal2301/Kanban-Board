// Minimal Kanban Board — offline-first
// LocalStorage model: { boards: { [name]: Task[] }, currentBoard: string }
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const LS_KEY = "kanbanBoards_v1";

function uid() { return Math.random().toString(36).slice(2,9); }

const defaultData = {
  boards: { "Default": [] },
  currentBoard: "Default"
};

function load() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || defaultData;
  } catch(e) { return defaultData; }
}

function save(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

let state = load();

// UI Elements
const boardSelect = $("#boardSelect");
const newBoardBtn = $("#newBoardBtn");
const exportBtn = $("#exportBtn");
const importInput = $("#importInput");

const searchInput = $("#searchInput");
const filterPriority = $("#filterPriority");
const filterCategory = $("#filterCategory");
const sortSelect = $("#sortSelect");

const cols = {
  todo: $("#todoCol"),
  inprogress: $("#inprogressCol"),
  done: $("#doneCol"),
};

const dialog = $("#taskDialog");
const form = $("#taskForm");
const dialogTitle = $("#dialogTitle");
const btnClose = $("#closeDialog");
const btnDelete = $("#deleteBtn");

const fTitle = $("#title");
const fDesc = $("#description");
const fPriority = $("#priority");
const fCategory = $("#category");
const fDue = $("#dueDate");
const fId = $("#taskId");
const fColumn = $("#taskColumn");

function renderBoardOptions() {
  boardSelect.innerHTML = Object.keys(state.boards).map(b => 
    `<option ${b===state.currentBoard?'selected':''}>${b}</option>`
  ).join("");
}

function getTasks() { return state.boards[state.currentBoard] || []; }

function setTasks(tasks) { state.boards[state.currentBoard] = tasks; save(state); }

function priorityRank(p) { return { High: 3, Medium: 2, Low: 1 }[p] || 0; }

function applyFilters(tasks) {
  const q = searchInput.value.trim().toLowerCase();
  const fp = filterPriority.value;
  const fc = filterCategory.value;
  let res = tasks.filter(t => {
    if (q && !(t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    if (fp && t.priority !== fp) return false;
    if (fc && t.category !== fc) return false;
    return true;
  });

  switch (sortSelect.value) {
    case "createdAt_asc": res.sort((a,b)=>a.createdAt-b.createdAt); break;
    case "createdAt_desc": res.sort((a,b)=>b.createdAt-a.createdAt); break;
    case "dueDate_asc": res.sort((a,b)=> (a.dueDate||'') .localeCompare(b.dueDate||'')); break;
    case "dueDate_desc": res.sort((a,b)=> (b.dueDate||'') .localeCompare(a.dueDate||'')); break;
    case "priority_desc": res.sort((a,b)=> priorityRank(b.priority)-priorityRank(a.priority)); break;
    case "priority_asc": res.sort((a,b)=> priorityRank(a.priority)-priorityRank(b.priority)); break;
  }
  return res;
}

function render() {
  // Clear columns
  Object.values(cols).forEach(col => col.innerHTML="");

  const tasks = applyFilters(getTasks());

  for (const t of tasks) {
    const col = cols[t.column] || cols.todo;
    const card = document.createElement("article");
    card.draggable = true;
    card.dataset.id = t.id;
    card.className = "rounded-xl border border-white/10 bg-neutral-800 p-3 shadow-sm";
    card.innerHTML = `
      <div class="flex items-start gap-2">
        <div class="handle text-xl select-none leading-none">⋮⋮</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-medium truncate">${escapeHtml(t.title)}</h4>
            <span class="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/10">${t.priority}</span>
            ${t.dueDate ? `<span class="text-[10px] px-2 py-0.5 rounded-full border border-white/10">${t.dueDate}</span>` : ""}
            ${t.category ? `<span class="text-[10px] px-2 py-0.5 rounded-full border border-white/10">${escapeHtml(t.category)}</span>` : ""}
          </div>
          ${t.description ? `<p class="text-sm opacity-80 mt-1 line-clamp-3">${escapeHtml(t.description)}</p>` : ""}
        </div>
        <button class="editBtn text-xs opacity-70 hover:opacity-100">Edit</button>
      </div>
    `;
    enableCardDnD(card);
    card.querySelector(".editBtn").addEventListener("click", () => openEdit(t));
    col.appendChild(card);
  }
  // Empty states
  Object.entries(cols).forEach(([key, col]) => {
    if (!col.children.length) {
      col.innerHTML = `<div class="text-sm opacity-60 p-3 rounded-xl bg-white/5">No tasks here. Drop or create one.</div>`;
    }
  });
}

function escapeHtml(str="") {
  return str.replace(/[&<>'"]/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
}

// New/Edit dialogs
function openNew(column) {
  form.reset();
  fId.value = "";
  fColumn.value = column;
  dialogTitle.textContent = "New Task";
  btnDelete.classList.add("hidden");
  dialog.showModal();
}

function openEdit(task) {
  fId.value = task.id;
  fColumn.value = task.column;
  fTitle.value = task.title;
  fDesc.value = task.description;
  fPriority.value = task.priority;
  fCategory.value = task.category;
  fDue.value = task.dueDate || "";
  dialogTitle.textContent = "Edit Task";
  btnDelete.classList.remove("hidden");
  dialog.showModal();
}

$$(".newTaskBtn").forEach(btn => btn.addEventListener("click", e => openNew(btn.dataset.column)));

btnClose.addEventListener("click", ()=> dialog.close());

form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const payload = {
    id: fId.value || uid(),
    column: fColumn.value || "todo",
    title: fTitle.value.trim(),
    description: fDesc.value.trim(),
    priority: fPriority.value,
    category: fCategory.value.trim() || "General",
    dueDate: fDue.value || "",
    createdAt: Date.now(),
  };
  let tasks = getTasks();
  const idx = tasks.findIndex(t=> t.id===payload.id);
  if (idx >= 0) {
    // retain createdAt
    payload.createdAt = tasks[idx].createdAt;
    tasks[idx] = payload;
  } else {
    tasks.push(payload);
  }
  setTasks(tasks);
  dialog.close();
  render();
});

btnDelete.addEventListener("click", ()=>{
  const id = fId.value;
  let tasks = getTasks().filter(t=> t.id !== id);
  setTasks(tasks);
  dialog.close();
  render();
});

// Board management
function initBoards() {
  if (!state.boards[state.currentBoard]) state.currentBoard = Object.keys(state.boards)[0];
  renderBoardOptions();
}
boardSelect.addEventListener("change", ()=>{
  state.currentBoard = boardSelect.value;
  save(state);
  render();
});

newBoardBtn.addEventListener("click", ()=>{
  const name = prompt("Board name?");
  if (!name) return;
  if (state.boards[name]) { alert("Board already exists."); return; }
  state.boards[name] = [];
  state.currentBoard = name;
  save(state);
  renderBoardOptions();
  render();
});

// Export / Import
exportBtn.addEventListener("click", ()=>{
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "kanban-backup.json"; a.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", async (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed.boards || !parsed.currentBoard) throw new Error("Invalid file");
    state = parsed;
    save(state);
    renderBoardOptions();
    render();
    alert("Import successful ✅");
  } catch(err) {
    alert("Import failed: " + err.message);
  } finally {
    importInput.value = "";
  }
});

// Drag & Drop
function enableColumnDnD() {
  $$(".colBody").forEach(col => {
    col.addEventListener("dragover", (e)=>{ e.preventDefault(); col.classList.add("drag-over"); });
    col.addEventListener("dragleave", ()=> col.classList.remove("drag-over"));
    col.addEventListener("drop", (e)=>{
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = e.dataTransfer.getData("text/id");
      if (!id) return;
      const column = col.id.replace("Col","");
      let tasks = getTasks();
      const idx = tasks.findIndex(t=> t.id===id);
      if (idx<0) return;
      tasks[idx].column = column;
      setTasks(tasks);
      render();
    });
  });
}

function enableCardDnD(card) {
  card.addEventListener("dragstart", (e)=>{
    e.dataTransfer.setData("text/id", card.dataset.id);
    requestAnimationFrame(()=> card.classList.add("opacity-60"));
  });
  card.addEventListener("dragend", ()=> card.classList.remove("opacity-60"));
}

[searchInput, filterPriority, filterCategory, sortSelect].forEach(el => el.addEventListener("input", render));

// Boot
initBoards();
enableColumnDnD();

// Seed example tasks for first-time users
if (getTasks().length === 0) {
  setTasks([
    { id: uid(), column: "todo", title:"Set project repo", description:"Create GitHub repo and push starter files", priority:"High", category:"Docs", dueDate:"", createdAt: Date.now()-100000 },
    { id: uid(), column: "inprogress", title:"Implement drag & drop", description:"Use native HTML5 DnD", priority:"Medium", category:"Feature", dueDate:"", createdAt: Date.now()-80000 },
    { id: uid(), column: "done", title:"Design UI", description:"Dark, glassy look with Tailwind", priority:"Low", category:"Design", dueDate:"", createdAt: Date.now()-60000 },
  ]);
}
render();
