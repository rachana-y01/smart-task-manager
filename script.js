//updated
// State Management
let tasks = JSON.parse(localStorage.getItem('smart-tasks')) || [];
let currentFilter = 'all';
let currentCategoryFilter = 'all';
let currentSort = 'manual';
let wasAllCompleted = false;

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const searchInput = document.getElementById('search-input');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const taskDate = document.getElementById('task-date');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('theme-toggle');

// New DOM Elements
const sortSelect = document.getElementById('sort-select');
const categoryFilter = document.getElementById('category-filter');
const completeAllBtn = document.getElementById('complete-all-btn');
const exportBtn = document.getElementById('export-btn');
const importInput = document.getElementById('import-input');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => initializeApp());
taskForm.addEventListener('submit', addTask);
searchInput.addEventListener('input', () => renderTasks());
filterBtns.forEach(btn => btn.addEventListener('click', setFilter));
themeToggle.addEventListener('click', toggleTheme);

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTasks();
});

categoryFilter.addEventListener('change', (e) => {
    currentCategoryFilter = e.target.value;
    renderTasks();
});

completeAllBtn.addEventListener('click', () => {
    const uncompleted = tasks.some(t => !t.completed);
    tasks = tasks.map(task => ({ ...task, completed: uncompleted ? true : false }));
    saveTasks();
    renderTasks(true);
});

exportBtn.addEventListener('click', exportTasks);
importInput.addEventListener('change', importTasks);

// Initialize Application
function initializeApp() {
    // Check dark mode preference
    if (localStorage.getItem('smart-theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Set minimum date to today for the date picker
    const today = new Date().toISOString().split('T')[0];
    taskDate.setAttribute('min', today);
    
    // Load Dummy Data for Screenshot Mode if empty
    if (tasks.length === 0 && !localStorage.getItem('init-dummy-loaded')) {
        tasks = [
            { id: "1001", text: "Complete Project Presentation", category: "Work", priority: "High", dueDate: today, completed: false, createdAt: new Date().toISOString() },
            { id: "1002", text: "Read 20 pages of new book", category: "Personal", priority: "Low", dueDate: "", completed: true, createdAt: (new Date(Date.now() - 86400000)).toISOString() },
            { id: "1003", text: "Study Data Structures", category: "Study", priority: "Medium", dueDate: (new Date(Date.now() + 86400000)).toISOString().split('T')[0], completed: false, createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('init-dummy-loaded', 'true');
        saveTasks();
    }

    renderTasks();
}

// Add New Task
function addTask(e) {
    e.preventDefault();
    
    const text = taskInput.value.trim();
    if (!text) {
        alert("⚠ Please enter a task!");
        return;
    }
    
    const newTask = {
        id: Date.now().toString(),
        text: text,
        category: taskCategory.value,
        priority: taskPriority.value,
        dueDate: taskDate.value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    playClickSound(); // Trigger tiny click sound
    
    // Reset inputs
    taskInput.value = '';
    taskDate.value = '';
    taskInput.focus();
}

// Play Click Sound
function playClickSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
}

// Delete Task
function deleteTask(id) {
    const li = document.getElementById(`task-${id}`);
    if (li) {
        li.classList.add('removing');
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }, 300);
    }
}

// Toggle Task Completion
function toggleTask(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    renderTasks(true);
}

// Set Filter
function setFilter(e) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    renderTasks();
}

// Toggle Dark Mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    if (isDark) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('smart-theme', 'dark');
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('smart-theme', 'light');
    }
}

// Helper: Calculate days remaining and formatting
function getDeadlineInfo(dueDate) {
    if (!dueDate) return { html: '', isOverdue: false, diffDays: Infinity };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(dueDate);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { html: `<span class="overdue-text"><i class="fas fa-exclamation-circle"></i> ⛔ Overdue by ${Math.abs(diffDays)} day(s)</span>`, isOverdue: true, diffDays };
    } else if (diffDays === 0) {
        return { html: `<span style="color: var(--priority-medium); font-weight: bold;"><i class="fas fa-clock"></i> ⚠ Due Today</span>`, isOverdue: false, diffDays };
    } else if (diffDays === 1) {
        return { html: `<span><i class="fas fa-calendar-day"></i> 📅 Due Tomorrow</span>`, isOverdue: false, diffDays };
    } else {
        return { html: `<span><i class="far fa-calendar-alt"></i> 📅 ${diffDays} days left</span>`, isOverdue: false, diffDays };
    }
}

// Update Progress Bar
function updateProgress(showConfetti = false) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    
    if (progressText && progressFill) {
        progressText.textContent = `${completed}/${total} (${percentage}%)`;
        progressFill.style.width = `${percentage}%`;
    }

    const isAllCompleted = total > 0 && completed === total;
    if (isAllCompleted && showConfetti === true) {
        triggerConfetti();
    }
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

// Render Tasks to DOM
function renderTasks(showConfetti = false) {
    taskList.innerHTML = '';
    
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchQuery);
        let matchesFilter = true;
        if (currentFilter === 'pending') {
            matchesFilter = !task.completed;
        } else if (currentFilter === 'completed') {
            matchesFilter = task.completed;
        }

        let matchesCat = true;
        if (currentCategoryFilter !== 'all') {
            matchesCat = task.category === currentCategoryFilter;
        }
        return matchesFilter && matchesSearch && matchesCat;
    });
    
    // Sort logic
    filteredTasks.sort((a, b) => {
        if (currentSort === 'newest') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (currentSort === 'oldest') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (currentSort === 'priority') {
            const p = { "High": 3, "Medium": 2, "Low": 1 };
            return p[b.priority] - p[a.priority];
        } else if (currentSort === 'deadline') {
            const aDays = getDeadlineInfo(a.dueDate).diffDays;
            const bDays = getDeadlineInfo(b.dueDate).diffDays;
            return aDays - bDays;
        }
        return 0;
    });

    updateProgress(showConfetti);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem; font-size: 1.1rem; line-height: 1.6;">
                <h3 style="margin-bottom: 0.5rem; color: var(--text-color);">No tasks yet 🚀</h3>
                <p>Start by adding one!</p>
            </div>
        `;
        return;
    }
    
    filteredTasks.forEach(task => {
        const deadlineData = getDeadlineInfo(task.dueDate);
        const deadlineHTML = deadlineData.html;
        const overdueClass = deadlineData.isOverdue && !task.completed ? 'overdue' : '';

        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${overdueClass}`;
        li.id = `task-${task.id}`;
        
        li.innerHTML = `
            <div class="task-content">
                <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                <div class="task-details">
                    <span class="task-text" id="text-${task.id}">${task.text}</span>
                    <div class="task-meta">
                        <span class="badge"><i class="fas fa-tag"></i> ${task.category}</span>
                        ${deadlineHTML}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn icon-btn" onclick="editTask('${task.id}')" aria-label="Edit Task">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="delete-btn icon-btn" onclick="deleteTask('${task.id}')" aria-label="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        li.draggable = currentSort === 'manual';
        if (currentSort === 'manual') {
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);
            li.addEventListener('dragenter', handleDragEnter);
            li.addEventListener('dragleave', handleDragLeave);
        }
        
        taskList.appendChild(li);
    });
}

function saveTasks() {
    localStorage.setItem('smart-tasks', JSON.stringify(tasks));
}

// Inline Edit Task
window.editTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const textSpan = document.getElementById(`text-${id}`);
    const currentText = task.text;
    
    // Replace span with input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';
    
    textSpan.replaceWith(input);
    input.focus();
    
    // Save on Blur or Enter
    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== "") {
            task.text = newText;
            saveTasks();
        }
        renderTasks();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
};

/* Drag and Drop */
let draggedTask = null;

function handleDragStart(e) {
    draggedTask = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.id);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) { e.preventDefault(); }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');
}

function handleDrop(e) {
    if (e.stopPropagation) { e.stopPropagation(); }
    
    if (draggedTask !== this) {
        const draggedId = draggedTask.id.replace('task-', '');
        const targetId = this.id.replace('task-', '');
        
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);
        
        const temp = tasks[draggedIndex];
        tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, temp);
        
        saveTasks();
        renderTasks();
    }
    this.classList.remove('over');
    return false;
}

document.addEventListener('dragend', function() {
    const items = document.querySelectorAll('.task-item');
    items.forEach(item => {
        item.classList.remove('over');
        item.classList.remove('dragging');
    });
});

/* Export / Import Features */
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importTasks(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedTasks = JSON.parse(event.target.result);
            if (Array.isArray(importedTasks)) {
                tasks = importedTasks;
                saveTasks();
                renderTasks();
                alert("Tasks successfully imported! 🎉");
            } else {
                alert("Invalid file format.");
            }
        } catch (err) {
            alert("Error parsing JSON file. Please make sure it's a valid backup.");
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}
