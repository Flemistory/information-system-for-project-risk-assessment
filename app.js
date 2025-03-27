let projects = JSON.parse(localStorage.getItem('projects')) || [];
let currentProject = null;

function saveData() {
    localStorage.setItem('projects', JSON.stringify(projects));
    renderProjects();
}

function renderProjects() {
    const container = document.getElementById('projects');
    container.innerHTML = '';
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <h3>${project.name}</h3>
            <p>${project.description || 'Нет описания'}</p>
            <p>Даты: ${project.startDate} - ${project.endDate}</p>
            <button onclick="viewProject('${project.id}')">Просмотреть риски</button>
        `;
        container.appendChild(card);
    });
}

function openModal(type, projectId) {
    currentProject = projectId;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if(type === 'project') {
        modalTitle.textContent = 'Добавить проект';
        modalBody.innerHTML = `
            <input type="text" id="projectName" placeholder="Название проекта" required>
            <input type="text" id="projectDesc" placeholder="Описание">
            <input type="date" id="startDate">
            <input type="date" id="endDate">
            <button onclick="addProject()">Сохранить</button>
        `;
    } else if(type === 'risk') {
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

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function addProject() {
    const project = {
        id: Date.now().toString(),
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDesc').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        risks: []
    };
    projects.push(project);
    saveData();
    closeModal();
}

function viewProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    currentProject = projectId;
    
    const modalBody = `
        <h3>${project.name}</h3>
        <button onclick="openModal('risk', '${projectId}')">Добавить риск</button>
        <table>
            <thead>
                <tr>
                    <th>Риск</th>
                    <th>Вероятность</th>
                    <th>Воздействие</th>
                    <th>Оценка</th>
                </tr>
            </thead>
            <tbody>
                ${project.risks.map(risk => `
                    <tr>
                        <td>${risk.name}</td>
                        <td>${risk.probability}%</td>
                        <td>${risk.impact}</td>
                        <td><span class="risk-level ${getRiskLevel(risk.score)}">${risk.score}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    openModal('risk-view');
    document.getElementById('modal-title').textContent = project.name;
    document.getElementById('modal-body').innerHTML = modalBody;
}

function addRisk(projectId) {
    const project = projects.find(p => p.id === projectId);
    const risk = {
        name: document.getElementById('riskName').value,
        probability: parseInt(document.getElementById('probability').value),
        impact: parseInt(document.getElementById('impact').value),
        score: 0
    };
    risk.score = risk.probability * risk.impact;
    project.risks.push(risk);
    saveData();
    closeModal();
    viewProject(projectId);
}

function getRiskLevel(score) {
    if (score <= 50) return 'low';
    if (score <= 150) return 'medium';
    return 'high';
}

// Инициализация
renderProjects();