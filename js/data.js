// Функции для работы с данными
function loadVacations() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveVacations(vacations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vacations));
    updateBackupInfo();
}

function loadEmployees() {
    return JSON.parse(localStorage.getItem(EMPLOYEES_KEY) || '[]');
}

function saveEmployees(employees) {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
    updateBackupInfo();
}

function loadConflictGroups() {
    return JSON.parse(localStorage.getItem(CONFLICT_GROUPS_KEY) || '[]');
}

function saveConflictGroups(groups) {
    localStorage.setItem(CONFLICT_GROUPS_KEY, JSON.stringify(groups));
    updateBackupInfo();
}

function addVacation(vacation) {
    const vacations = loadVacations();
    vacations.push({
        id: Date.now(),
        employeeId: vacation.employeeId,
        name: vacation.name,
        start: vacation.start,
        end: vacation.end,
        days: vacation.days,
        workingDays: vacation.workingDays,
        status: 'Запланирован'
    });
    saveVacations(vacations);
}

function updateVacation(vacation) {
    const vacations = loadVacations();
    const index = vacations.findIndex(v => v.id == vacation.id);
    if (index !== -1) {
        vacations[index].employeeId = vacation.employeeId;
        vacations[index].name = vacation.name;
        vacations[index].start = vacation.start;
        vacations[index].end = vacation.end;
        vacations[index].days = vacation.days;
        vacations[index].workingDays = vacation.workingDays;
        saveVacations(vacations);
        return true;
    }
    return false;
}

function addEmployee(employee) {
    const employees = loadEmployees();
    employees.push({
        id: Date.now(),
        name: employee.name,
        totalVacationDays: parseInt(employee.totalVacationDays),
        usedVacationDays: 0
    });
    saveEmployees(employees);
}

function updateEmployee(employee) {
    const employees = loadEmployees();
    const index = employees.findIndex(e => e.id == employee.id);
    if (index !== -1) {
        employees[index].name = employee.name;
        employees[index].totalVacationDays = parseInt(employee.totalVacationDays);
        saveEmployees(employees);
        return true;
    }
    return false;
}
