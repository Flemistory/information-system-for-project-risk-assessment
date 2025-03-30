// Глобальные переменные
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;
let projects = [];
let currentProject = null;

// Инициализация системы
window.onload = function () {
    // Проверка наличия администратора
    checkAndCreateAdmin();

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        loadUserData();
        document.getElementById('main-page').style.display = 'block';
    } else {
        openAuthModal(); // Открываем модальное окно авторизации
    }
};

// Проверка наличия администратора и создание, если отсутствует
function checkAndCreateAdmin() {
    const adminExists = users.some(user => user.role === 'admin');
    if (!adminExists) {
        const adminUser = {
            login: 'admin',
            password: 'admin', // Рекомендуется использовать более безопасный пароль в продакшене
            role: 'admin'
        };
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Открыть модальное окно авторизации
function openAuthModal() {
    document.getElementById('auth-modal').style.display = 'block';
}

// Закрыть модальное окно авторизации
function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

// Переключение между авторизацией и регистрацией
function toggleAuthMode() {
    const title = document.getElementById('auth-title');
    const button = document.getElementById('auth-button');
    const switchButton = document.getElementById('switch-auth');
    if (title.textContent === 'Авторизация') {
        title.textContent = 'Регистрация';
        button.textContent = 'Зарегистрироваться';
        switchButton.textContent = 'Вход';
    } else {
        title.textContent = 'Авторизация';
        button.textContent = 'Войти';
        switchButton.textContent = 'Регистрация';
    }
}

// Обработка авторизации/регистрации
function handleAuth() {
    const login = document.getElementById('auth-login').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const isRegistration = document.getElementById('auth-title').textContent === 'Регистрация';
    if (isRegistration) {
        if (!login || !password) {
            alert('Введите логин и пароль!');
            return;
        }
        if (users.find(user => user.login === login)) {
            alert('Пользователь с таким логином уже существует!');
            return;
        }
        users.push({ login, password, role: 'user' });
        localStorage.setItem('users', JSON.stringify(users));
        alert('Регистрация успешна!');
        toggleAuthMode();
    } else {
        const user = users.find(u => u.login === login && u.password === password);
        if (!user) {
            alert('Неверный логин или пароль!');
            return;
        }
        currentUser = user;
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
        closeAuthModal();
        if (currentUser.role === 'admin') {
            navigateToAdminPanel();
        } else {
            navigateToMainPage();
        }
    }
    document.getElementById('auth-login').value = '';
    document.getElementById('auth-password').value = '';
}

// Загрузка данных пользователя
function loadUserData() {
    if (!currentUser) return;
    projects = JSON.parse(localStorage.getItem(`projects_${currentUser.login}`)) || [];
    renderProjects();
}

// Сохранение данных с учетом авторизации
function saveData() {
    if (!currentUser) return;
    localStorage.setItem(`projects_${currentUser.login}`, JSON.stringify(projects));
    renderProjects();
}

// Отрисовка проектов
function renderProjects() {
    if (!currentUser) return;
    const container = document.getElementById('projects');
    container.innerHTML = '';
    if (projects.length === 0) {
        container.innerHTML = '<p>Нет проектов. Добавьте новый проект.</p>';
        return;
    }
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <h3>${project.name}</h3>
            <p>${project.description || 'Нет описания'}</p>
            <p>Даты: ${project.startDate} - ${project.endDate}</p>
            <div class="project-actions">
                <button class="view-btn" onclick="viewProject('${project.id}')">Риски</button>
                <button class="edit-btn" onclick="editProject('${project.id}')">Редактировать</button>
                <button class="delete-btn" onclick="deleteProject('${project.id}')">Удалить</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Добавление проекта
function addProject() {
    if (!currentUser) return;
    const projectData = {
        id: Date.now().toString(),
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDesc').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        risks: []
    };
    if (!projectData.name || !projectData.startDate || !projectData.endDate) {
        alert('Заполните все обязательные поля!');
        return;
    }
    projects.push(projectData);
    saveData();
    closeModal();
}

// Удаление проекта
function deleteProject(projectId) {
    if (!currentUser) return;
    if (!confirm('Удалить проект и все связанные риски?')) return;
    projects = projects.filter(p => p.id !== projectId);
    saveData();
}

// Редактирование проекта
function editProject(projectId) {
    if (!currentUser) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    openModal('project', projectId);
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDesc').value = project.description;
    document.getElementById('startDate').value = project.startDate;
    document.getElementById('endDate').value = project.endDate;
    document.querySelector('#modal button').onclick = () => {
        project.name = document.getElementById('projectName').value;
        project.description = document.getElementById('projectDesc').value;
        project.startDate = document.getElementById('startDate').value;
        project.endDate = document.getElementById('endDate').value;
        saveData();
        closeModal();
    };
}

// Просмотр проекта
function viewProject(projectId) {
    if (!currentUser) return;
    const project = projects.find(p => p.id === projectId);
    currentProject = projectId;
    const modalBody = `
        <h3>${project.name}</h3>
        <button onclick="openModal('risk', '${projectId}')">Добавить риск</button>
        <div class="export-buttons">
            <button class="export-btn excel" onclick="exportToExcel('${projectId}')">Экспорт в Excel</button>
            <button class="export-btn pdf" onclick="exportToPDF('${projectId}')">Экспорт в PDF</button>
        </div>
        <table id="project-table-${projectId}">
            <thead>
                <tr>
                    <th>Риск</th>
                    <th>Вероятность</th>
                    <th>Воздействие</th>
                    <th>Оценка</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${project.risks.map(risk => `
                    <tr>
                        <td>${risk.name}</td>
                        <td>${risk.probability}%</td>
                        <td>${risk.impact}</td>
                        <td><span class="risk-level ${getRiskLevel(risk.score)}">${risk.score}</span></td>
                        <td>
                            <button onclick="editRisk('${projectId}', '${risk.id}')">Ред.</button>
                            <button onclick="deleteRisk('${projectId}', '${risk.id}')">Уд.</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    openModal('risk-view');
    document.getElementById('modal-title').textContent = project.name;
    document.getElementById('modal-body').innerHTML = modalBody;
}

// Добавление риска
function addRisk(projectId) {
    if (!currentUser) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const risk = {
        id: Date.now().toString(),
        name: document.getElementById('riskName').value,
        probability: parseInt(document.getElementById('probability').value),
        impact: parseInt(document.getElementById('impact').value),
        score: 0
    };
    if (!risk.name || isNaN(risk.probability) || isNaN(risk.impact)) {
        alert('Заполните все обязательные поля!');
        return;
    }
    risk.score = risk.probability * risk.impact;
    project.risks.push(risk);
    saveData();
    closeModal();
    viewProject(projectId);
}

// Удаление риска
function deleteRisk(projectId, riskId) {
    if (!currentUser) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    if (!confirm('Удалить риск?')) return;
    project.risks = project.risks.filter(r => r.id !== riskId);
    saveData();
    viewProject(projectId);
}

// Редактирование риска
function editRisk(projectId, riskId) {
    if (!currentUser) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const risk = project.risks.find(r => r.id === riskId);
    if (!risk) return;
    openModal('risk', projectId);
    document.getElementById('riskName').value = risk.name;
    document.getElementById('probability').value = risk.probability;
    document.getElementById('impact').value = risk.impact;
    document.querySelector('#modal button').onclick = () => {
        risk.name = document.getElementById('riskName').value;
        risk.probability = parseInt(document.getElementById('probability').value);
        risk.impact = parseInt(document.getElementById('impact').value);
        risk.score = risk.probability * risk.impact;
        saveData();
        closeModal();
        viewProject(projectId);
    };
}

// Экспорт в Excel
function exportToExcel(projectId) {
    if (!currentUser) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const risks = project.risks.map(risk => ({
        'Название риска': risk.name,
        'Вероятность (%)': risk.probability,
        'Воздействие': risk.impact,
        'Оценка риска': risk.score
    }));
    const ws = XLSX.utils.json_to_sheet(risks);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Риски');
    XLSX.writeFile(wb, `${project.name}.xlsx`);
}

// Экспорт в PDF
function exportToPDF(projectId) {
    if (!currentUser) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const table = document.getElementById(`project-table-${projectId}`);
    html2canvas(table).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${project.name}.pdf`);
    });
}

// Получение уровня риска
function getRiskLevel(score) {
    if (score <= 50) return 'low';
    if (score <= 150) return 'medium';
    return 'high';
}

// Открыть модальное окно
function openModal(type, projectId) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (type === 'project') {
        modalTitle.textContent = projectId ? 'Редактировать проект' : 'Добавить проект';
        modalBody.innerHTML = `
            <input type="text" id="projectName" placeholder="Название проекта" required>
            <input type="text" id="projectDesc" placeholder="Описание">
            <input type="date" id="startDate" required>
            <input type="date" id="endDate" required>
            <button onclick="addProject()">Сохранить</button>
        `;
        if (projectId) {
            const project = projects.find(p => p.id === projectId);
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectDesc').value = project.description;
            document.getElementById('startDate').value = project.startDate;
            document.getElementById('endDate').value = project.endDate;
        }
    } else if (type === 'risk') {
        modalTitle.textContent = 'Добавить риск';
        modalBody.innerHTML = `
            <input type="text" id="riskName" placeholder="Название риска" required>
            <input type="number" id="probability" placeholder="Вероятность (0-100)" min="0" max="100" required>
            <input type="number" id="impact" placeholder="Воздействие (1-5)" min="1" max="5" required>
            <button onclick="addRisk('${projectId}')">Сохранить</button>
        `;
    }
    modal.style.display = 'block';
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Навигация на главную страницу
function navigateToMainPage() {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    loadUserData();
    document.getElementById('main-page').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
}

// Навигация на админ-панель
function navigateToAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Доступ запрещен!');
        return;
    }
    loadUsers();
    document.getElementById('main-page').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
}

// Загрузка пользователей
function loadUsers() {
    if (!currentUser || currentUser.role !== 'admin') return;
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.login}</td>
            <td>${user.role}</td>
            <td>
                <button onclick="editUserRole('${user.login}')">Изменить роль</button>
                <button class="delete-user" onclick="deleteUser('${user.login}')">Удалить</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Изменение роли пользователя
function editUserRole(login) {
    const user = users.find(u => u.login === login);
    if (!user) return;
    const newRole = prompt(`Текущая роль: ${user.role}
Введите новую роль (user/admin):`).trim();
    if (newRole !== 'user' && newRole !== 'admin') {
        alert('Неверная роль! Допустимые значения: user, admin.');
        return;
    }
    user.role = newRole;
    localStorage.setItem('users', JSON.stringify(users));
    loadUsers();
}

// Удаление пользователя
function deleteUser(login) {
    if (!confirm('Удалить пользователя?')) return;
    users = users.filter(u => u.login !== login);
    localStorage.setItem('users', JSON.stringify(users));
    loadUsers();
}

// Добавление нового пользователя
function addUser() {
    const login = document.getElementById('new-login').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const role = document.getElementById('new-role').value.trim();
    if (!login || !password || !role) {
        alert('Заполните все обязательные поля!');
        return;
    }
    if (users.find(user => user.login === login)) {
        alert('Пользователь с таким логином уже существует!');
        return;
    }
    users.push({ login, password, role });
    localStorage.setItem('users', JSON.stringify(users));
    loadUsers();
    document.getElementById('new-login').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('new-role').value = 'user';
}

// Выход из системы
function logout() {
    if (!confirm('Вы уверены, что хотите выйти?')) return;
    currentUser = null;
    localStorage.removeItem('loggedInUser'); // Удаляем данные текущего пользователя
    document.getElementById('main-page').style.display = 'none'; // Скрываем главную страницу
    document.getElementById('admin-panel').style.display = 'none'; // Скрываем админ-панель
    openAuthModal(); // Открываем модальное окно авторизации
}

// Переключение боковой панели
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    if (sidebar.classList.contains('sidebar-closed')) {
        sidebar.classList.remove('sidebar-closed');
        sidebar.classList.add('sidebar-open');
        content.classList.remove('content-shifted');
    } else {
        sidebar.classList.remove('sidebar-open');
        sidebar.classList.add('sidebar-closed');
        content.classList.add('content-shifted');
    }
}