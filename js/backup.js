// Функции для резервного копирования
function exportData() {
    try {
        const data = {
            employees: loadEmployees(),
            vacations: loadVacations(),
            conflictGroups: loadConflictGroups(),
            exportDate: new Date().toISOString(),
            version: '1.1'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `vacation_system_backup_${formatDateToString(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Данные успешно экспортированы в файл!');
    } catch (error) {
        alert('Ошибка при экспорте данных: ' + error.message);
        console.error('Export error:', error);
    }
}

function triggerImport() {
    document.getElementById('fileInput').click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // Проверяем структуру файла
            if (!data.employees || !data.vacations) {
                alert('Ошибка: неправильный формат файла. Файл должен содержать данные сотрудников и отпусков.');
                return;
            }

            if (confirm('Вы уверены, что хотите импортировать данные? Текущие данные будут перезаписаны.')) {
                // Сохраняем данные
                saveEmployees(data.employees);
                saveVacations(data.vacations);

                // Сохраняем группы пересечения, если они есть
                if (data.conflictGroups) {
                    saveConflictGroups(data.conflictGroups);
                }

                // Обновляем интерфейс
                renderEmployeesTable();
                updateEmployeeSelect();
                updateConflictGroupSelects();
                renderCalendar();
                updateStats();
                renderUpcomingVacations();
                renderVacationsTable();
                renderManagementTable();
                renderConflicts();
                renderReports();
                updateBackupInfo();

                alert('Данные успешно импортированы!');
            }
        } catch (error) {
            alert('Ошибка при чтении файла: ' + error.message);
            console.error('Import error:', error);
        }
    };

    reader.onerror = function() {
        alert('Ошибка при чтении файла');
    };

    reader.readAsText(file);

    // Сбрасываем значение input
    event.target.value = '';
}

function updateBackupInfo() {
    const employees = loadEmployees();
    const vacations = loadVacations();
    const conflictGroups = loadConflictGroups();
    const info = document.getElementById('backupInfo');

    let text = `Всего сотрудников: ${employees.length}\n`;
    text += `Всего отпусков: ${vacations.length}\n`;
    text += `Групп пересечения: ${conflictGroups.length}\n`;

    if (employees.length > 0 || vacations.length > 0) {
        text += `Последнее изменение: ${new Date().toLocaleString('ru-RU')}\n`;
    } else {
        text += `Нет данных для резервного копирования\n`;
    }

    info.value = text;
}
