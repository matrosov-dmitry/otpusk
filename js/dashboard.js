function updateStats() {
    const vacations = loadVacations();
    const planned = vacations.filter(v => v.status === 'Запланирован').length;
    const taken = vacations.filter(v => v.status === 'Использован').length;
    const cancelled = vacations.filter(v => v.status === 'Отменен').length;
    const postponed = vacations.filter(v => v.status === 'Перенесен').length;

    document.getElementById('plannedCount').textContent = planned;
    document.getElementById('takenCount').textContent = taken;
    document.getElementById('cancelledCount').textContent = cancelled;
    document.getElementById('postponedCount').textContent = postponed;
}


function renderUpcomingVacations() {
    const container = document.getElementById('upcomingVacations');
    container.innerHTML = '';

    const vacations = loadVacations()
        .filter(v => v.status === 'Запланирован')
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 5); // Показываем только 5 ближайших отпусков

    if (vacations.length === 0) {
        container.innerHTML = '<p>Нет запланированных отпусков</p>';
        return;
    }

    vacations.forEach(vacation => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const date = document.createElement('div');
        date.className = 'timeline-date';
        date.textContent = formatDate(new Date(vacation.start));

        const content = document.createElement('div');
        content.className = 'timeline-content';

        const name = document.createElement('div');
        name.className = 'employee-name';
        name.textContent = vacation.name;

        const dates = document.createElement('div');
        dates.className = 'vacation-dates';
        dates.textContent = `${formatDate(new Date(vacation.start))} - ${formatDate(new Date(vacation.end))} (${vacation.days} дней)`;

        const status = document.createElement('div');
        status.className = `status-badge ${getStatusClass(vacation.status)}`;
        status.textContent = vacation.status;

        content.appendChild(name);
        content.appendChild(dates);
        content.appendChild(status);

        item.appendChild(date);
        item.appendChild(content);

        container.appendChild(item);
    });
}


function formatDate(date) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}


function renderReports() {
    renderEmployeeSummary();
    renderGeneralStatistics();
    renderMonthlySummary();
    renderQuarterSummary();
}


function renderEmployeeSummary() {
    const tbody = document.querySelector('#employeeSummaryTable tbody');
    tbody.innerHTML = '';

    const employees = loadEmployees();
    const vacations = loadVacations();

    // Обновляем общую статистику
    document.getElementById('totalEmployees').textContent = employees.length;

    let totalVacationDaysUsed = 0;
    employees.forEach(employee => {
        totalVacationDaysUsed += employee.usedVacationDays;
    });

    document.getElementById('totalVacationDaysUsed').textContent = totalVacationDaysUsed;

    let totalAvailableDays = 0;
    employees.forEach(employee => {
        totalAvailableDays += employee.totalVacationDays;
    });

    const avgUsage = totalAvailableDays > 0 ? Math.round((totalVacationDaysUsed / totalAvailableDays) * 100) : 0;
    document.getElementById('avgUsage').textContent = `${avgUsage}%`;

    // Заполняем таблицу
    employees.forEach(employee => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = employee.name;
        row.insertCell(1).textContent = employee.totalVacationDays;
        row.insertCell(2).textContent = employee.usedVacationDays;

        const remainingCell = row.insertCell(3);
        remainingCell.textContent = employee.totalVacationDays - employee.usedVacationDays;

        const usageCell = row.insertCell(4);
        const usagePercent = employee.totalVacationDays > 0 ? 
            Math.round((employee.usedVacationDays / employee.totalVacationDays) * 100) : 0;

        // Создаем элемент с цветовой градацией
        usageCell.className = 'usage-cell';
        usageCell.textContent = `${usagePercent}%`;

        // Градация цвета от красного (0%) до зеленого (100%)
        const hue = (usagePercent / 100) * 120; // 0 = красный, 120 = зеленый
        usageCell.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
        usageCell.style.color = 'white';
    });
}


function renderGeneralStatistics() {
    const employees = loadEmployees();
    const vacations = loadVacations();

    // Базовые показатели
    document.getElementById('totalEmployees').textContent = employees.length;
    document.getElementById('totalVacations').textContent = vacations.length;

    let totalVacationDaysUsed = 0;
    let totalAvailableDays = 0;
    let plannedVacations = 0;

    employees.forEach(employee => {
        totalVacationDaysUsed += employee.usedVacationDays;
        totalAvailableDays += employee.totalVacationDays;
    });

    vacations.forEach(vacation => {
        if (vacation.status === 'Запланирован') {
            plannedVacations++;
        }
    });

    document.getElementById('totalVacationDaysUsed').textContent = totalVacationDaysUsed;
    document.getElementById('plannedVacations').textContent = plannedVacations;

    // Средняя продолжительность отпуска
    const avgVacationLength = vacations.length > 0 ? 
        Math.round(vacations.reduce((sum, v) => sum + v.days, 0) / vacations.length) : 0;
    document.getElementById('avgVacationLength').textContent = avgVacationLength;

    // Среднее использование отпусков
    const avgUsage = totalAvailableDays > 0 ? 
        Math.round((totalVacationDaysUsed / totalAvailableDays) * 100) : 0;
    document.getElementById('avgUsage').textContent = `${avgUsage}%`;

    // Уровень утилизации (сколько от общего доступного времени использовано)
    const utilizationRate = totalAvailableDays > 0 ?
        Math.round((totalVacationDaysUsed / totalAvailableDays) * 100) : 0;
    document.getElementById('utilizationRate').textContent = `${utilizationRate}%`;

    // Подсчет конфликтов
    const conflictCount = findVacationConflicts().length;
    document.getElementById('conflictCount').textContent = conflictCount;

    // Тренды (можно расширить для сравнения с предыдущими периодами)
    updateStatisticsTrends(avgUsage, utilizationRate, conflictCount);
}


function updateStatisticsTrends(avgUsage, utilizationRate, conflictCount) {
    // Здесь можно добавить логику сравнения с предыдущими периодами
    // Покажем статичные подписи

    const usageElement = document.getElementById('usageTrend');
    const utilizationElement = document.getElementById('utilizationTrend');
    const conflictElement = document.getElementById('conflictTrend');

    // Пример логики для трендов (можно расширить)
    if (avgUsage > 50) {
        usageElement.className = 'stat-trend trend-up';
        usageElement.innerHTML = '↑ высокий';
    } else if (avgUsage > 25) {
        usageElement.className = 'stat-trend trend-neutral';
        usageElement.innerHTML = '→ средний';
    } else {
        usageElement.className = 'stat-trend trend-down';
        usageElement.innerHTML = '↓ низкий';
    }

    if (utilizationRate > 60) {
        utilizationElement.className = 'stat-trend trend-up';
        utilizationElement.innerHTML = '↑ активное';
    } else if (utilizationRate > 30) {
        utilizationElement.className = 'stat-trend trend-neutral';
        utilizationElement.innerHTML = '→ умеренное';
    } else {
        utilizationElement.className = 'stat-trend trend-down';
        utilizationElement.innerHTML = '↓ низкое';
    }

    if (conflictCount > 5) {
        conflictElement.className = 'stat-trend trend-up';
        conflictElement.innerHTML = '↑ много';
    } else if (conflictCount > 0) {
        conflictElement.className = 'stat-trend trend-neutral';
        conflictElement.innerHTML = '→ есть';
    } else {
        conflictElement.className = 'stat-trend trend-down';
        conflictElement.innerHTML = '↓ нет';
    }
}


function renderMonthlySummary() {
    const tbody = document.querySelector('#monthlySummaryTable tbody');
    tbody.innerHTML = '';

    const vacations = loadVacations();
    const employees = loadEmployees();
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

    // Собираем статистику по месяцам
    const monthlyStats = {};
    for (let i = 0; i < 12; i++) {
        monthlyStats[i] = {
            vacations: 0,
            days: 0,
            employees: new Set()
        };
    }

    vacations.forEach(vacation => {
        const startDate = new Date(vacation.start);
        const endDate = new Date(vacation.end);
        const startMonth = startDate.getMonth();
        const endMonth = endDate.getMonth();

        // Для отпусков, которые пересекают несколько месяцев
        if (startMonth === endMonth) {
            // Отпуск в пределах одного месяца
            monthlyStats[startMonth].vacations++;
            monthlyStats[startMonth].days += vacation.days;
            monthlyStats[startMonth].employees.add(vacation.employeeId);
        } else {
            // Отпуск пересекает несколько месяцев
            // Упрощенный расчет - считаем отпуск в месяце начала
            monthlyStats[startMonth].vacations++;
            monthlyStats[startMonth].days += vacation.days;
            monthlyStats[startMonth].employees.add(vacation.employeeId);
        }
    });

    // Заполняем таблицу
    for (let i = 0; i < 12; i++) {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = monthNames[i];
        row.insertCell(1).textContent = monthlyStats[i].vacations;
        row.insertCell(2).textContent = monthlyStats[i].days;
        row.insertCell(3).textContent = monthlyStats[i].employees.size;

        const occupancyCell = row.insertCell(4);
        const occupancyPercent = employees.length > 0 ? 
            Math.round((monthlyStats[i].employees.size / employees.length) * 100) : 0;
        occupancyCell.textContent = `${occupancyPercent}%`;

        // Цветовое кодирование
        if (occupancyPercent > 50) {
            occupancyCell.style.color = 'var(--md-error)';
            occupancyCell.style.fontWeight = '600';
        } else if (occupancyPercent > 30) {
            occupancyCell.style.color = 'var(--md-warning)';
        } else {
            occupancyCell.style.color = 'var(--md-success)';
        }
    }
}


function renderQuarterSummary() {
    const quarterSummary = document.getElementById('quarterSummary');
    quarterSummary.innerHTML = '';

    const vacations = loadVacations();
    const employees = loadEmployees();

    // Собираем статистику по кварталам
    const quarterStats = {
        1: { vacations: 0, days: 0, employees: new Set() },
        2: { vacations: 0, days: 0, employees: new Set() },
        3: { vacations: 0, days: 0, employees: new Set() },
        4: { vacations: 0, days: 0, employees: new Set() }
    };

    vacations.forEach(vacation => {
        const startDate = new Date(vacation.start);
        const month = startDate.getMonth();
        let quarter;

        if (month >= 0 && month <= 2) quarter = 1;
        else if (month >= 3 && month <= 5) quarter = 2;
        else if (month >= 6 && month <= 8) quarter = 3;
        else quarter = 4;

        quarterStats[quarter].vacations++;
        quarterStats[quarter].days += vacation.days;
        quarterStats[quarter].employees.add(vacation.employeeId);
    });

    // Создаем карточки для каждого квартала
    for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterItem = document.createElement('div');
        quarterItem.className = 'quarter-summary-item';

        const quarterName = document.createElement('div');
        quarterName.className = 'quarter-name';
        quarterName.textContent = `${quarter} квартал 2026`;
        quarterItem.appendChild(quarterName);

        const quarterStatsDiv = document.createElement('div');
        quarterStatsDiv.className = 'quarter-stats';

        // Количество отпусков
        const vacationsStat = document.createElement('div');
        vacationsStat.className = 'quarter-stat';
        const vacationsValue = document.createElement('div');
        vacationsValue.className = 'quarter-value';
        vacationsValue.textContent = quarterStats[quarter].vacations;
        const vacationsLabel = document.createElement('div');
        vacationsLabel.className = 'quarter-label';
        vacationsLabel.textContent = 'Отпусков';
        vacationsStat.appendChild(vacationsValue);
        vacationsStat.appendChild(vacationsLabel);
        quarterStatsDiv.appendChild(vacationsStat);

        // Количество дней
        const daysStat = document.createElement('div');
        daysStat.className = 'quarter-stat';
        const daysValue = document.createElement('div');
        daysValue.className = 'quarter-value';
        daysValue.textContent = quarterStats[quarter].days;
        const daysLabel = document.createElement('div');
        daysLabel.className = 'quarter-label';
        daysLabel.textContent = 'Дней';
        daysStat.appendChild(daysValue);
        daysStat.appendChild(daysLabel);
        quarterStatsDiv.appendChild(daysStat);

        // Количество сотрудников
        const employeesStat = document.createElement('div');
        employeesStat.className = 'quarter-stat';
        const employeesValue = document.createElement('div');
        employeesValue.className = 'quarter-value';
        employeesValue.textContent = quarterStats[quarter].employees.size;
        const employeesLabel = document.createElement('div');
        employeesLabel.className = 'quarter-label';
        employeesLabel.textContent = 'Сотрудников';
        employeesStat.appendChild(employeesValue);
        employeesStat.appendChild(employeesLabel);
        quarterStatsDiv.appendChild(employeesStat);

        quarterItem.appendChild(quarterStatsDiv);
        quarterSummary.appendChild(quarterItem);
    }
}
