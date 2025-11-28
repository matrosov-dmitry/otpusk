function initializeConflictGroups() {
    updateConflictGroupSelects();
    renderConflictGroups();
}


function updateConflictGroupSelects() {
    const employeeSelect1 = document.getElementById('conflictGroupEmployee1');
    const employeeSelect2 = document.getElementById('conflictGroupEmployee2');

    employeeSelect1.innerHTML = '<option value="">Выберите сотрудника</option>';
    employeeSelect2.innerHTML = '<option value="">Выберите сотрудника</option>';

    const employees = loadEmployees();
    employees.forEach(employee => {
        const option1 = document.createElement('option');
        option1.value = employee.id;
        option1.textContent = employee.name;
        employeeSelect1.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = employee.id;
        option2.textContent = employee.name;
        employeeSelect2.appendChild(option2);
    });
}


function addConflictGroup() {
    const employee1Id = document.getElementById('conflictGroupEmployee1').value;
    const employee2Id = document.getElementById('conflictGroupEmployee2').value;

    if (!employee1Id || !employee2Id) {
        alert('Выберите обоих сотрудников');
        return;
    }

    if (employee1Id === employee2Id) {
        alert('Выберите разных сотрудников');
        return;
    }

    const employees = loadEmployees();
    const employee1 = employees.find(e => e.id == employee1Id);
    const employee2 = employees.find(e => e.id == employee2Id);

    if (!employee1 || !employee2) {
        alert('Ошибка при выборе сотрудников');
        return;
    }

    const groups = loadConflictGroups();

    // Проверяем, не существует ли уже такая группа
    const exists = groups.some(group => 
        (group.employee1Id == employee1Id && group.employee2Id == employee2Id) ||
        (group.employee1Id == employee2Id && group.employee2Id == employee1Id)
    );

    if (exists) {
        alert('Эта группа пересечения уже существует');
        return;
    }

    groups.push({
        id: Date.now(),
        employee1Id: employee1Id,
        employee2Id: employee2Id,
        employee1Name: employee1.name,
        employee2Name: employee2.name
    });

    saveConflictGroups(groups);
    renderConflictGroups();

    // Очищаем выбор
    document.getElementById('conflictGroupEmployee1').value = '';
    document.getElementById('conflictGroupEmployee2').value = '';
}


function renderConflictGroups() {
    const container = document.getElementById('conflictGroupsList');
    container.innerHTML = '';

    const groups = loadConflictGroups();

    if (groups.length === 0) {
        container.innerHTML = '<p>Нет созданных групп пересечения</p>';
        return;
    }

    groups.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'conflict-group-item';

        const employeesEl = document.createElement('div');
        employeesEl.className = 'conflict-group-employees';
        employeesEl.textContent = `${group.employee1Name} ↔ ${group.employee2Name}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.style.width = 'auto';
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.onclick = function() {
            deleteConflictGroup(group.id);
        };

        groupEl.appendChild(employeesEl);
        groupEl.appendChild(deleteBtn);
        container.appendChild(groupEl);
    });
}


function deleteConflictGroup(id) {
    if (confirm('Удалить группу пересечения?')) {
        const groups = loadConflictGroups().filter(g => g.id !== id);
        saveConflictGroups(groups);
        renderConflictGroups();
    }
}

// Инициализация фильтров календаря

function renderConflicts() {
    const container = document.getElementById('conflictsContainer');
    container.innerHTML = '';

    const conflicts = findVacationConflicts();

    if (conflicts.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--md-on-surface-variant);">Конфликтов не обнаружено</p>';
        return;
    }

    // Создаем таблицу конфликтов
    const table = document.createElement('table');
    table.className = 'compact-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Сотрудник 1</th>
            <th>Сотрудник 2</th>
            <th>Период пересечения</th>
            <th>Даты отпусков</th>
            <th>Статусы</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    conflicts.forEach(conflict => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${conflict.employee1}</td>
            <td>${conflict.employee2}</td>
            <td>${conflict.overlapStart} - ${conflict.overlapEnd}</td>
            <td>
                <div>${conflict.employee1}: ${conflict.vacation1Start} - ${conflict.vacation1End}</div>
                <div>${conflict.employee2}: ${conflict.vacation2Start} - ${conflict.vacation2End}</div>
            </td>
            <td>
                <div>${conflict.employee1}: <span class="status-badge ${getStatusClass(conflict.vacation1Status)}">${conflict.vacation1Status}</span></div>
                <div>${conflict.employee2}: <span class="status-badge ${getStatusClass(conflict.vacation2Status)}">${conflict.vacation2Status}</span></div>
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}


function findVacationConflicts() {
    const vacations = loadVacations();
    const conflictGroups = loadConflictGroups();
    const conflicts = [];

    // Проходим по всем парам отпусков
    for (let i = 0; i < vacations.length; i++) {
        for (let j = i + 1; j < vacations.length; j++) {
            const v1 = vacations[i];
            const v2 = vacations[j];

            // Проверяем, что это разные сотрудники и оба отпуска запланированы
            if (v1.employeeId !== v2.employeeId && 
                v1.status === 'Запланирован' && 
                v2.status === 'Запланирован') {

                // Проверяем, находятся ли сотрудники в одной группе пересечения
                const isInConflictGroup = conflictGroups.some(group => 
                    (group.employee1Id == v1.employeeId && group.employee2Id == v2.employeeId) ||
                    (group.employee1Id == v2.employeeId && group.employee2Id == v1.employeeId)
                );

                // Проверяем пересечение дат
                const start1 = new Date(v1.start);
                const end1 = new Date(v1.end);
                const start2 = new Date(v2.start);
                const end2 = new Date(v2.end);

                if (datesOverlap(v1, v2) && isInConflictGroup) {
                    // Находим период пересечения
                    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
                    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

                    conflicts.push({
                        employee1: v1.name,
                        employee2: v2.name,
                        overlapStart: overlapStart.toISOString().split('T')[0],
                        overlapEnd: overlapEnd.toISOString().split('T')[0],
                        vacation1Start: v1.start,
                        vacation1End: v1.end,
                        vacation2Start: v2.start,
                        vacation2End: v2.end,
                        vacation1Status: v1.status,
                        vacation2Status: v2.status
                    });
                }
            }
        }
    }

    return conflicts;
}


function checkOverlaps() {
    const vacations = loadVacations();
    const table = document.getElementById('managementTable');
    table.querySelectorAll('.conflict').forEach(row => row.classList.remove('conflict'));

    vacations.forEach((current, i) => {
        vacations.forEach((other, j) => {
            if (i !== j && 
                current.employeeId !== other.employeeId &&
                current.status === 'Запланирован' &&
                other.status === 'Запланирован' &&
                datesOverlap(current, other)) {

                const rows = table.querySelectorAll('tbody tr');
                // Находим соответствующие строки в таблице
                rows.forEach(row => {
                    const name = row.cells[0].textContent;
                    if (name === current.name || name === other.name) {
                        row.classList.add('conflict');
                    }
                });
            }
        });
    });

    // Обновляем вкладку конфликтов
    renderConflicts();

    alert('Проверка пересечений завершена. Конфликтующие отпуска выделены красным.');
}


function datesOverlap(a, b) {
    const startA = new Date(a.start);
    const endA = new Date(a.end);
    const startB = new Date(b.start);
    const endB = new Date(b.end);
    return startA <= endB && startB <= endA;
}
