const STORAGE_KEY = 'roadmap_projects';

// プロジェクトデータ構造
let projects = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentProjectId = null;

// DOM要素
const form = document.getElementById('task-form');
const titleInput = document.getElementById('title');
const tasksContainer = document.getElementById('tasks');
const deadlineInput = document.getElementById('deadline');
const daysLeftSpan = document.getElementById('days-left');
const projectSelect = document.getElementById('project-select');
const projectNameEl = document.getElementById('project-name');
const addProjectBtn = document.getElementById('add-project');
const deleteProjectBtn = document.getElementById('delete-project');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

let draggedIndex = null;

init();

function init() {
  // 初期プロジェクトがなければ作成
  if (projects.length === 0) {
    createProject('新規プロジェクト');
  } else {
    currentProjectId = projects[0].id;
  }

  form.addEventListener('submit', handleSubmit);
  deadlineInput.addEventListener('change', handleDeadlineChange);
  projectSelect.addEventListener('change', handleProjectChange);
  addProjectBtn.addEventListener('click', handleAddProject);
  deleteProjectBtn.addEventListener('click', handleDeleteProject);
  projectNameEl.addEventListener('blur', handleProjectNameChange);
  projectNameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      projectNameEl.blur();
    }
  });

  renderProjectSelect();
  loadCurrentProject();
}

// プロジェクト関連
function getCurrentProject() {
  return projects.find(p => p.id === currentProjectId);
}

function createProject(name) {
  const project = {
    id: Date.now(),
    name: name,
    deadline: '',
    tasks: []
  };
  projects.push(project);
  currentProjectId = project.id;
  save();
  return project;
}

function handleAddProject() {
  createProject('新規プロジェクト');
  renderProjectSelect();
  loadCurrentProject();
  projectNameEl.focus();
  // テキストを選択
  const range = document.createRange();
  range.selectNodeContents(projectNameEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function handleDeleteProject() {
  if (projects.length <= 1) {
    alert('最後のプロジェクトは削除できません');
    return;
  }
  if (!confirm('このプロジェクトを削除しますか？')) return;

  projects = projects.filter(p => p.id !== currentProjectId);
  currentProjectId = projects[0].id;
  save();
  renderProjectSelect();
  loadCurrentProject();
}

function handleProjectChange() {
  currentProjectId = parseInt(projectSelect.value);
  loadCurrentProject();
}

function handleProjectNameChange() {
  const project = getCurrentProject();
  if (project) {
    project.name = projectNameEl.textContent.trim() || '無題';
    save();
    renderProjectSelect();
  }
}

function renderProjectSelect() {
  projectSelect.innerHTML = projects.map(p =>
    `<option value="${p.id}" ${p.id === currentProjectId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
  ).join('');
}

function loadCurrentProject() {
  const project = getCurrentProject();
  if (!project) return;

  projectNameEl.textContent = project.name;
  deadlineInput.value = project.deadline || '';
  updateDaysLeft();
  render();
}

// デッドライン
function handleDeadlineChange() {
  const project = getCurrentProject();
  if (project) {
    project.deadline = deadlineInput.value;
    save();
    updateDaysLeft();
  }
}

function updateDaysLeft() {
  const project = getCurrentProject();
  const deadline = project?.deadline;

  if (!deadline) {
    daysLeftSpan.textContent = '';
    daysLeftSpan.className = 'days-left';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    daysLeftSpan.textContent = `${Math.abs(diffDays)}日超過`;
    daysLeftSpan.className = 'days-left urgent';
  } else if (diffDays === 0) {
    daysLeftSpan.textContent = '今日まで!';
    daysLeftSpan.className = 'days-left urgent';
  } else if (diffDays <= 3) {
    daysLeftSpan.textContent = `あと${diffDays}日`;
    daysLeftSpan.className = 'days-left warning';
  } else {
    daysLeftSpan.textContent = `あと${diffDays}日`;
    daysLeftSpan.className = 'days-left safe';
  }
}

// タスク関連
function handleSubmit(e) {
  e.preventDefault();
  const project = getCurrentProject();
  if (!project) return;

  project.tasks.push({
    id: Date.now(),
    title: titleInput.value.trim(),
    done: false
  });
  save();
  render();
  titleInput.value = '';
  titleInput.focus();
}

function deleteTask(id) {
  const project = getCurrentProject();
  if (!project) return;

  project.tasks = project.tasks.filter(t => t.id !== id);
  save();
  render();
}

function toggleDone(id) {
  const project = getCurrentProject();
  if (!project) return;

  const task = project.tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    save();
    render();
  }
}

function editTask(id) {
  const project = getCurrentProject();
  if (!project) return;

  const task = project.tasks.find(t => t.id === id);
  if (!task) return;

  const newTitle = prompt('タスク名を編集', task.title);
  if (newTitle !== null && newTitle.trim()) {
    task.title = newTitle.trim();
    save();
    render();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// 進捗更新
function updateProgress() {
  const project = getCurrentProject();
  if (!project) return;

  const total = project.tasks.length;
  const done = project.tasks.filter(t => t.done).length;
  const percent = total > 0 ? (done / total) * 100 : 0;

  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${done} / ${total}`;
}

// 描画
function render() {
  const project = getCurrentProject();
  if (!project) return;

  tasksContainer.innerHTML = '';
  const tasks = project.tasks;
  const cols = 5;

  tasks.forEach((task, index) => {
    const row = Math.floor(index / cols);
    const colInRow = index % cols;
    const isReverse = row % 2 === 1;

    // 行の最初のタスクの前に下向き矢印を追加
    if (colInRow === 0 && row > 0) {
      const downArrow = document.createElement('div');
      downArrow.className = 'arrow down' + (isReverse ? '' : ' left');
      downArrow.textContent = '↓';
      tasksContainer.appendChild(downArrow);
    }

    // 未完了で一番先頭のタスクを探す
    const firstUndoneIndex = tasks.findIndex(t => !t.done);
    const isCurrent = !task.done && index === firstUndoneIndex;

    const el = document.createElement('div');
    el.className = 'task' + (task.done ? ' done' : '') + (isCurrent ? ' current' : '');
    el.draggable = true;
    el.dataset.index = index;

    el.innerHTML = `
      <span class="title">${escapeHtml(task.title)}</span>
      <button class="edit" title="編集">✎</button>
      <button class="delete" title="削除">×</button>
    `;

    // クリックで完了トグル
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      toggleDone(task.id);
    });

    el.querySelector('.edit').addEventListener('click', (e) => {
      e.stopPropagation();
      editTask(task.id);
    });

    el.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    // ドラッグ開始
    el.addEventListener('dragstart', (e) => {
      draggedIndex = index;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    // ドラッグ終了
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      draggedIndex = null;
      document.querySelectorAll('.task').forEach(t => t.classList.remove('drag-over'));
    });

    // ドラッグオーバー
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        el.classList.add('drag-over');
      }
    });

    el.addEventListener('dragleave', () => {
      el.classList.remove('drag-over');
    });

    // ドロップ
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');

      if (draggedIndex !== null && draggedIndex !== index) {
        const [moved] = tasks.splice(draggedIndex, 1);
        tasks.splice(index, 0, moved);
        save();
        render();
      }
    });

    // 横矢印を追加（行内の最後以外）
    const isLastInRow = colInRow === cols - 1 || index === tasks.length - 1;
    if (!isLastInRow) {
      const wrapper = document.createElement('div');
      wrapper.className = 'task-wrapper' + (isReverse ? ' reverse' : '');
      wrapper.appendChild(el);

      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = isReverse ? '←' : '→';
      wrapper.appendChild(arrow);

      tasksContainer.appendChild(wrapper);
    } else {
      tasksContainer.appendChild(el);
    }
  });

  updateProgress();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
