function initializeEmployees() {
    const employees = loadEmployees();
    if (employees.length === 0) {
        // Добавляем тестовых сотрудников
        const defaultEmployees = [
            { id: 1, name: 'Иванов Иван Иванович', totalVacationDays: 28, usedVacationDays: 0 },
            { id: 2, name: 'Петрова Анна Сергеевна', totalVacationDays: 30, usedVacationDays: 0 },
            { id: 3, name: 'Сидоров Алексей Владимирович', totalVacationDays: 35, usedVacationDays: 0 },
            { id: 4, name: 'Козлова Мария Петровна', totalVacationDays: 28, usedVacationDays: 0 },
            { id: 5, name: 'Николаев Дмитрий Сергеевич', totalVacationDays: 30, usedVacationDays: 0 }
        ];
        saveEmployees(defaultEmployees);
    }
}


function updateEmployeeSelect() {
    const select = document.getElementById('employeeSelect');
    select.innerHTML = '<option value="">Выберите сотрудника</option>';

    const employees = loadEmployees();
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        select.appendChild(option);
    });
}


function updateEmployeeInfo() {
    const employeeId = document.getElementById('employeeSelect').value;
    const employeeInfo = document.getElementById('employeeInfo');

    if (!employeeId) {
        employeeInfo.style.display = 'none';
        return;
    }

    const employees = loadEmployees();
    const employee = employees.find(e => e.id == employeeId);

    if (employee) {
        document.getElementById('selectedEmployeeName').textContent = employee.name;
        document.getElementById('totalDays').textContent = employee.totalVacationDays;
        document.getElementById('usedDays').textContent = employee.usedVacationDays;
        document.getElementById('remainingDays').textContent = employee.totalVacationDays - employee.usedVacationDays;
        employeeInfo.style.display = 'block';

        // Устанавливаем максимальное значение для слайдера
        document.getElementById('vacationDays').max = employee.totalVacationDays - employee.usedVacationDays;
    }
}


function renderEmployeesTable() {
    const tbody = document.querySelector('#employeesTable tbody');
    tbody.innerHTML = '';

    const employees = loadEmployees();

    if (employees.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 5;
        cell.textContent = 'Нет данных о сотрудниках';
        cell.style.textAlign = 'center';
        return;
    }

    employees.forEach(employee => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = employee.name;
        row.insertCell(1).textContent = employee.totalVacationDays;
        row.insertCell(2).textContent = employee.usedVacationDays;
        row.insertCell(3).textContent = employee.totalVacationDays - employee.usedVacationDays;

        const actionsCell = row.insertCell(4);
        actionsCell.innerHTML = `
            <button onclick="editEmployee(${employee.id})" style="width: auto; padding: 5px 8px; font-size: 12px; margin-right: 5px;">
                <i class="fas fa-edit"></i> Изменить
            </button>
            <button onclick="deleteEmployee(${employee.id})" style="width: auto; padding: 5px 8px; font-size: 12px;">
                <i class="fas fa-trash"></i> Удалить
            </button>
        `;
    });
}

// Функции для работы с отпусками

function handleEmployeeSubmit(e) {
    e.preventDefault();

    const formData = {
        id: document.getElementById('employeeId').value,
        name: document.getElementById('employeeName').value,
        totalVacationDays: document.getElementById('totalVacationDays').value
    };

    if (editingEmployeeId) {
        // Обновляем существующего сотрудника
        if (updateEmployee(formData)) {
            cancelEditEmployee();
        }
    } else {
        // Добавляем нового сотрудника
        addEmployee(formData);
    }

    renderEmployeesTable();
    updateEmployeeSelect();
    updateConflictGroupSelects();
    initializeCalendarFilters();
    renderReports();
    e.target.reset();
}


function editEmployee(id) {
    const employees = loadEmployees();
    const employee = employees.find(e => e.id === id);
    if (employee) {
        document.getElementById('employeeId').value = employee.id;
        document.getElementById('employeeName').value = employee.name;
        document.getElementById('totalVacationDays').value = employee.totalVacationDays;

        // Изменяем кнопку на "Обновить"
        const submitButton = document.getElementById('employeeSubmitButton');
        submitButton.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить сотрудника';

        // Показываем кнопку отмены
        document.getElementById('cancelEditButton').style.display = 'block';

        editingEmployeeId = id;
    }
}


function cancelEditEmployee() {
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeName').value = '';
    document.getElementById('totalVacationDays').value = '28';

    // Возвращаем кнопку в исходное состояние
    const submitButton = document.getElementById('employeeSubmitButton');
        submitButton.innerHTML = '<i class="fas fa-plus"></i> Добавить сотрудника';

    // Скрываем кнопку отмены
    document.getElementById('cancelEditButton').style.display = 'none';

    editingEmployeeId = null;
}


function deleteEmployee(id) {
    if (confirm('Удалить сотрудника?')) {
        const employees = loadEmployees().filter(e => e.id !== id);
        saveEmployees(employees);
        renderEmployeesTable();
        updateEmployeeSelect();
        updateConflictGroupSelects();
        initializeCalendarFilters();
        renderReports();

        // Если удаляли редактируемого сотрудника, сбрасываем форму
        if (editingEmployeeId === id) {
            cancelEditEmployee();
        }
    }
}
