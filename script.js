class StudyPlanner {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('studyTasks')) || [];
        this.initEventListeners();
        this.renderTasks();
        this.updateProgressBar();
        this.initThemeToggle();
        this.initCalendar();
    }

    initEventListeners() {
        document.getElementById('task-form').addEventListener('submit', this.addTask.bind(this));
        document.getElementById('edit-task-form').addEventListener('submit', this.saveEditedTask.bind(this));
        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme.bind(this));
    }

    addTask(e) {
        e.preventDefault();
        const task = {
            id: Date.now(),
            subject: document.getElementById('subject').value,
            description: document.getElementById('task-description').value,
            deadline: document.getElementById('deadline').value,
            difficulty: document.getElementById('difficulty').value,
            estimatedTime: parseFloat(document.getElementById('estimated-time').value),
            completed: false
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateProgressBar();
        this.updateTimeEstimation();
        this.initCalendar();
        e.target.reset();
    }

    renderTasks() {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        // Sort tasks by deadline
        this.tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        this.tasks.forEach((task) => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            if (task.completed) taskElement.classList.add('completed');

            taskElement.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="studyPlanner.toggleTaskCompletion(${task.id})">
                <span>${task.subject}: ${task.description}</span>
                <span>Due: ${task.deadline}</span>
                <span>Difficulty: ${task.difficulty}</span>
                <button onclick="studyPlanner.editTask(${task.id})">Edit</button>
                <button onclick="studyPlanner.deleteTask(${task.id})">Delete</button>
            `;

            taskList.appendChild(taskElement);
        });
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        task.completed = !task.completed;
        this.saveTasks();
        this.renderTasks();
        this.updateProgressBar();
    }

    updateProgressBar() {
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const totalTasks = this.tasks.length;
        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        progressBar.style.width = `${progressPercentage}%`; // Fix the template string here
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateProgressBar();
        this.updateTimeEstimation();
        this.initCalendar();
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const modal = document.getElementById('edit-task-modal');

        document.getElementById('edit-subject').value = task.subject;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-deadline').value = task.deadline;
        document.getElementById('edit-difficulty').value = task.difficulty;
        document.getElementById('edit-estimated-time').value = task.estimatedTime;

        modal.style.display = 'block';
        document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    }

    saveEditedTask(e) {
        e.preventDefault();
        const taskId = this.tasks.find(t =>
            t.subject === document.getElementById('edit-subject').value &&
            t.description === document.getElementById('edit-task-description').value
        ).id;

        const updatedTask = {
            id: taskId,
            subject: document.getElementById('edit-subject').value,
            description: document.getElementById('edit-task-description').value,
            deadline: document.getElementById('edit-deadline').value,
            difficulty: document.getElementById('edit-difficulty').value,
            estimatedTime: parseFloat(document.getElementById('edit-estimated-time').value),
            completed: this.tasks.find(t => t.id === taskId).completed
        };

        const index = this.tasks.findIndex(t => t.id === taskId);
        this.tasks[index] = updatedTask;
        this.saveTasks();
        this.renderTasks();
        this.updateTimeEstimation();
        this.initCalendar();
        document.getElementById('edit-task-modal').style.display = 'none';
    }

    saveTasks() {
        localStorage.setItem('studyTasks', JSON.stringify(this.tasks));
    }

    updateTimeEstimation() {
        const totalTime = this.tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
        const timeEstimationResults = document.getElementById('time-estimation-results');

        timeEstimationResults.innerHTML = `
            <p>Total Study Time: ${totalTime.toFixed(1)} hours</p>
            <p>Average Time per Task: ${(totalTime / this.tasks.length || 0).toFixed(1)} hours</p>
        `;
    }

    initThemeToggle() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    }

    initCalendar() {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        this.tasks.forEach(task => {
            const taskDate = new Date(task.deadline);
            const taskElement = document.createElement('div');
            taskElement.textContent = `${task.subject}: ${task.description}`; // Fix template string here
            taskElement.style.backgroundColor = task.completed ? 'green' : 'red';
            calendar.appendChild(taskElement);
        });
    }
}

// Initialize the study planner
const studyPlanner = new StudyPlanner();

// Browser notifications (requires user permission)
if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            setInterval(() => {
                const upcomingTasks = studyPlanner.tasks.filter(task => {
                    const taskDate = new Date(task.deadline);
                    const today = new Date();
                    const timeDiff = taskDate - today;
                    return timeDiff > 0 && timeDiff <= (24 * 60 * 60 * 1000) && !task.completed;
                });

                upcomingTasks.forEach(task => {
                    new Notification(`Upcoming Task: ${task.subject}`, {
                        body: `${task.description} is due soon!` // Fix template string here
                    });
                });
            }, 24 * 60 * 60 * 1000); // Check daily
        }
    });
}
