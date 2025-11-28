// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    initializeTabs();
    initializeViewSwitcher();
    initializeEmployees();
    initializeConflictGroups();
    initializeDateRangePicker();
    renderCalendar();
    updateStats();
    renderUpcomingVacations();
    renderVacationsTable();
    renderManagementTable();
    renderEmployeesTable();
    renderReports();
    renderConflicts();
    updateBackupInfo();
    initializeCalendarFilters();

    // Обработчики событий
    document.getElementById('vacationForm').addEventListener('submit', handleVacationSubmit);
    document.getElementById('employeeForm').addEventListener('submit', handleEmployeeSubmit);
    document.getElementById('prevMonth').addEventListener('click', prevMonth);
    document.getElementById('nextMonth').addEventListener('click', nextMonth);
    document.getElementById('statusFilter').addEventListener('change', renderManagementTable);
    document.getElementById('employeeFilter').addEventListener('input', renderManagementTable);
    document.getElementById('quarterFilter').addEventListener('change', renderManagementTable);
    document.getElementById('employeeSelect').addEventListener('change', updateEmployeeInfo);
    document.getElementById('vacationDays').addEventListener('input', updateVacationDays);
    document.getElementById('cancelEditVacationButton').addEventListener('click', cancelEditVacation);
    document.getElementById('cancelEditButton').addEventListener('click', cancelEditEmployee);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', triggerImport);
    document.getElementById('fileInput').addEventListener('change', importData);
    document.getElementById('addConflictGroup').addEventListener('click', addConflictGroup);
    document.getElementById('applyCalendarFilter').addEventListener('click', applyCalendarFilter);

    // Инициализация быстрых дат
    document.querySelectorAll('.quick-date-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setQuickVacation(parseInt(this.getAttribute('data-days')));
        });
    });
});
