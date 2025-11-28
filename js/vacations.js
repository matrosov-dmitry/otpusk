function renderVacationsTable() {
    const tbody = document.querySelector('#vacationsTable tbody');
    tbody.innerHTML = '';

    const vacations = loadVacations();

    if (vacations.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 5;
        cell.textContent = 'Нет запланированных отпусков';
        cell.style.textAlign = 'center';
        return;
    }

    vacations.forEach(v => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = v.name;
        row.insertCell(1).textContent = v.start;
        row.insertCell(2).textContent = v.end;
        row.insertCell(3).textContent = v.days;
        row.insertCell(4).textContent = v.status;
    });
}


function renderManagementTable() {
    const tbody = document.querySelector('#managementTable tbody');
    const statusFilter = document.getElementById('statusFilter').value;
    const employeeFilter = document.getElementById('employeeFilter').value.toLowerCase();
    const quarterFilter = document.getElementById('quarterFilter').value;

    tbody.innerHTML = '';

    let vacations = loadVacations()
        .filter(v => {
            const statusMatch = !statusFilter || v.status === statusFilter;
            const employeeMatch = !employeeFilter || v.name.toLowerCase().includes(employeeFilter);
            return statusMatch && employeeMatch;
        });

    // Фильтр по кварталу
    if (quarterFilter) {
        const quarter = parseInt(quarterFilter);
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;

        vacations = vacations.filter(v => {
            const vacationDate = new Date(v.start);
            const month = vacationDate.getMonth();
            return month >= startMonth && month <= endMonth;
        });
    }

    if (vacations.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 6;
        cell.textContent = 'Нет данных, соответствующих фильтрам';
        cell.style.textAlign = 'center';
        return;
    }

    vacations.forEach(v => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = v.name;
        row.insertCell(1).textContent = v.start;
        row.insertCell(2).textContent = v.end;
        row.insertCell(3).textContent = v.days;

        // ИСПРАВЛЕННАЯ ЧАСТЬ - правильное отображение статуса
        const statusCell = row.insertCell(4);
        statusCell.textContent = v.status;
        statusCell.className = `status-cell status-${getStatusClass(v.status)}`;

        const actionsCell = row.insertCell(5);
        actionsCell.innerHTML = `
            <button onclick="editVacation(${v.id})" style="width: auto; padding: 5px 8px; font-size: 12px; margin-right: 5px; margin-bottom: 5px;">
                <i class="fas fa-edit"></i> Редактировать
            </button>
            <select onchange="updateStatus(${v.id}, this.value)" style="width: auto; margin-bottom: 5px; font-size: 12px; padding: 5px;">
                <option value="Запланирован" ${v.status === 'Запланирован' ? 'selected' : ''}>Запланирован</option>
                <option value="Использован" ${v.status === 'Использован' ? 'selected' : ''}>Использован</option>
                <option value="Отменен" ${v.status === 'Отменен' ? 'selected' : ''}>Отменен</option>
                <option value="Перенесен" ${v.status === 'Перенесен' ? 'selected' : ''}>Перенесен</option>
            </select>
            <button onclick="deleteVacation(${v.id})" style="width: auto; padding: 5px 8px; font-size: 12px;">
                <i class="fas fa-trash"></i> Удалить
            </button>
        `;
    });
}


function handleVacationSubmit(e) {
    e.preventDefault();

    const employeeId = document.getElementById('employeeSelect').value;
    const employees = loadEmployees();
    const employee = employees.find(e => e.id == employeeId);

    if (!employee) {
        alert('Выберите сотрудника');
        return;
    }

    const selectedDates = dateRangePicker.selectedDates;
    if (selectedDates.length !== 2) {
        alert('Выберите период отпуска');
        return;
    }

    const startDate = selectedDates[0];
    const endDate = selectedDates[1];

    if (startDate > endDate) {
        alert('Дата начала не может быть позже даты окончания');
        return;
    }

    const workingDays = calculateVacationDaysWithHolidays(startDate, endDate);
    const totalDays = Math.floor((endDate - startDate) / (1000 * 3600 * 24)) + 1;

    const formData = {
        id: document.getElementById('vacationId').value,
        employeeId: employeeId,
        name: employee.name,
        start: formatDateToString(startDate),
        end: formatDateToString(endDate),
        days: workingDays,
        workingDays: workingDays,
        totalDays: totalDays
    };

    // Проверяем, достаточно ли дней отпуска
    if (formData.days > (employee.totalVacationDays - employee.usedVacationDays)) {
        alert('Недостаточно дней отпуска у сотрудника');
        return;
    }

    if (editingVacationId) {
        // Обновляем существующий отпуск
        const oldVacation = loadVacations().find(v => v.id == editingVacationId);
        if (oldVacation) {
            // Возвращаем старые дни
            employee.usedVacationDays -= oldVacation.days;
        }

        if (updateVacation(formData)) {
            // Списываем новые дни
            employee.usedVacationDays += formData.days;
            saveEmployees(employees);
            cancelEditVacation();
        }
    } else {
        // Добавляем новый отпуск
        addVacation(formData);

        // Обновляем использованные дни у сотрудника
        employee.usedVacationDays += formData.days;
        saveEmployees(employees);
    }

    renderCalendar();
    updateStats();
    renderUpcomingVacations();
    renderVacationsTable();
    renderManagementTable();
    renderConflicts();
    updateEmployeeInfo();
    e.target.reset();
    document.getElementById('dayCount').textContent = '0';
    document.getElementById('workingDaysInfo').style.display = 'none';
    dateRangePicker.clear();

    // Переключаемся на вкладку обзора для просмотра результата
    document.querySelector('.tab[data-tab="dashboard"]').click();
}


function updateStatus(id, status) {
    const vacations = loadVacations();
    const vacation = vacations.find(v => v.id === id);
    if (vacation) {
        const oldStatus = vacation.status;
        vacation.status = status;
        saveVacations(vacations);

        // Если статус изменился на "Отменен", возвращаем дни сотруднику
        if (oldStatus !== 'Отменен' && status === 'Отменен') {
            const employees = loadEmployees();
            const employee = employees.find(e => e.id == vacation.employeeId);
            if (employee) {
                employee.usedVacationDays -= vacation.days;
                saveEmployees(employees);
            }
        }

        // Если статус изменился с "Отменен" на другой, снова списываем дни
        if (oldStatus === 'Отменен' && status !== 'Отменен') {
            const employees = loadEmployees();
            const employee = employees.find(e => e.id == vacation.employeeId);
            if (employee) {
                employee.usedVacationDays += vacation.days;
                saveEmployees(employees);
            }
        }

        renderCalendar();
        updateStats();
        renderUpcomingVacations();
        renderVacationsTable();
        renderManagementTable();
        renderConflicts();
        updateEmployeeInfo();
        renderReports();
    }
}


function deleteVacation(id) {
    if (confirm('Удалить запись об отпуске?')) {
        const vacations = loadVacations();
        const vacation = vacations.find(v => v.id === id);
        const updatedVacations = vacations.filter(v => v.id !== id);
        saveVacations(updatedVacations);

        // Возвращаем дни сотруднику, если отпуск не был отменен
        if (vacation && vacation.status !== 'Отменен') {
            const employees = loadEmployees();
            const employee = employees.find(e => e.id == vacation.employeeId);
            if (employee) {
                employee.usedVacationDays -= vacation.days;
                saveEmployees(employees);
            }
        }

        renderCalendar();
        updateStats();
        renderUpcomingVacations();
        renderVacationsTable();
        renderManagementTable();
        renderConflicts();
        updateEmployeeInfo();
        renderReports();
    }
}


function editVacation(id) {
    const vacations = loadVacations();
    const vacation = vacations.find(v => v.id === id);
    if (vacation) {
        document.getElementById('vacationId').value = vacation.id;
        document.getElementById('employeeSelect').value = vacation.employeeId;

        // Устанавливаем даты в dateRangePicker
        dateRangePicker.setDate([new Date(vacation.start), new Date(vacation.end)]);

        document.getElementById('vacationDays').value = vacation.days;
        document.getElementById('dayCount').textContent = vacation.days;

        // Изменяем кнопку на "Обновить отпуск"
        const submitButton = document.getElementById('submitVacationButton');
        submitButton.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить отпуск';

        // Изменяем заголовок
        document.getElementById('planningTitle').textContent = 'Редактирование отпуска';

        // Показываем кнопку отмены
        document.getElementById('cancelEditVacationButton').style.display = 'block';

        editingVacationId = id;

        // Обновляем информацию о сотруднике
        updateEmployeeInfo();

        // Переключаемся на вкладку планирования
        document.querySelector('.tab[data-tab="planning"]').click();
    }
}


function cancelEditVacation() {
    document.getElementById('vacationId').value = '';
    document.getElementById('employeeSelect').value = '';
    dateRangePicker.clear();
    document.getElementById('vacationDays').value = 14;
    document.getElementById('dayCount').textContent = '0';
    document.getElementById('workingDaysInfo').style.display = 'none';

    // Возвращаем кнопку в исходное состояние
    const submitButton = document.getElementById('submitVacationButton');
    submitButton.innerHTML = '<i class="fas fa-save"></i> Сохранить отпуск';

    // Возвращаем заголовок
    document.getElementById('planningTitle').textContent = 'Планирование отпуска';

    // Скрываем кнопку отмены
    document.getElementById('cancelEditVacationButton').style.display = 'none';

    // Скрываем информацию о сотруднике
    document.getElementById('employeeInfo').style.display = 'none';

    editingVacationId = null;
}
