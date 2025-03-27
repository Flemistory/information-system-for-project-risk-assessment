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
            <div class="project-actions">
                <button class="view-btn" onclick="viewProject('${project.id}')">Риски</button>
                <button class="edit-btn" onclick="editProject('${project.id}')">Редактировать</button>
                <button class="delete-btn" onclick="deleteProject('${project.id}')">Удалить</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openModal(type, projectId) {
    currentProject = projectId || null;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if(type === 'project') {
        modalTitle.textContent = currentProject ? 'Редактировать проект' : 'Добавить проект';
        modalBody.innerHTML = `
            <input type="text" id="projectName" placeholder="Название проекта" required>
            <input type="text" id="projectDesc" placeholder="Описание">
            <input type="date" id="startDate">
            <input type="date" id="endDate">
            <button onclick="addProject()">Сохранить</button>
        `;
        
        if(currentProject) {
            const project = projects.find(p => p.id === currentProject);
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectDesc').value = project.description;
            document.getElementById('startDate').value = project.startDate;
            document.getElementById('endDate').value = project.endDate;
        }
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
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDesc').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value
    };
    
    if(currentProject) {
        const index = projects.findIndex(p => p.id === currentProject);
        projects[index] = {
            ...projects[index],
            ...projectData
        };
    } else {
        const newProject = {
            id: Date.now().toString(),
            ...projectData,
            risks: []
        };
        projects.push(newProject);
    }
    
    saveData();
    closeModal();
    currentProject = null;
}

function deleteProject(projectId) {
    if(confirm('Удалить проект и все связанные риски?')) {
        projects = projects.filter(p => p.id !== projectId);
        saveData();
    }
}

function editProject(projectId) {
    openModal('project', projectId);
}

function viewProject(projectId) {
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

function addRisk(projectId) {
    const project = projects.find(p => p.id === projectId);
    const risk = {
        id: Date.now().toString(),
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

function deleteRisk(projectId, riskId) {
    if(confirm('Удалить риск?')) {
        const project = projects.find(p => p.id === projectId);
        project.risks = project.risks.filter(r => r.id !== riskId);
        saveData();
        viewProject(projectId);
    }
}

function editRisk(projectId, riskId) {
    const project = projects.find(p => p.id === projectId);
    const risk = project.risks.find(r => r.id === riskId);
    
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

function getRiskLevel(score) {
    if (score <= 50) return 'low';
    if (score <= 150) return 'medium';
    return 'high';
}

// Экспорт в Excel
function exportToExcel(projectId) {
    const project = projects.find(p => p.id === projectId);
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
    const project = projects.find(p => p.id === projectId);
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

// Инициализация
renderProjects();