function initializeDateRangePicker() {
    dateRangePicker = flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        minDate: "2026-01-01",
        maxDate: "2026-12-31",
        locale: "ru",
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length === 2) {
                calculateVacationDaysWithHolidays(selectedDates[0], selectedDates[1]);
            }
        }
    });
}

// Инициализация фильтров календаря

function initializeCalendarFilters() {
    const employeeFilter = document.getElementById('calendarEmployeeFilter');
    employeeFilter.innerHTML = '';

    const employees = loadEmployees();
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        option.selected = true;
        employeeFilter.appendChild(option);
    });
}


function applyCalendarFilter() {
    renderCalendar();
    if (currentView === 'quarter') {
        renderQuarterView();
    }
}

// Функции отображения

function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = '';

    // Получаем фильтры
    const employeeFilter = Array.from(document.getElementById('calendarEmployeeFilter').selectedOptions)
        .map(option => option.value);
    const statusFilter = Array.from(document.getElementById('calendarStatusFilter').selectedOptions)
        .map(option => option.value);

    // Обновляем заголовок месяца
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('currentMonthYear').textContent = 
        `${monthNames[currentMonth]} ${currentYear}`;

    // Получаем первый день месяца и количество дней в месяце
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Определяем день недели первого дня месяца (0 - воскресенье, 1 - понедельник, ...)
    let firstDayIndex = firstDay.getDay();
    // Корректируем для отображения понедельника первым днем
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarEl.appendChild(emptyDay);
    }

    // Добавляем ячейки для дней текущего месяца
    const vacations = loadVacations();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        const currentDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(currentDateStr);
        const dayOfWeek = dateObj.getDay();

        // Определяем классы для дня
        let dayClasses = ['calendar-day'];
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayClasses.push('weekend');
        }
        if (HOLIDAYS_2026.includes(currentDateStr)) {
            dayClasses.push('holiday');
        }
        if (PRE_HOLIDAYS_2026.includes(currentDateStr)) {
            dayClasses.push('pre-holiday');
        }

        dayEl.className = dayClasses.join(' ');

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.innerHTML = day;

        // Добавляем значок для праздников и предпраздничных дней
        if (HOLIDAYS_2026.includes(currentDateStr)) {
            dayNumber.innerHTML += '<span class="day-badge">В</span>';
        } else if (PRE_HOLIDAYS_2026.includes(currentDateStr)) {
            dayNumber.innerHTML += '<span class="day-badge pre-holiday">П</span>';
        }

        dayEl.appendChild(dayNumber);

        // Проверяем, есть ли отпуска на этот день
        const dayVacations = [];
        vacations.forEach(vacation => {
            // Применяем фильтры
            if (employeeFilter.length > 0 && !employeeFilter.includes(vacation.employeeId.toString())) {
                return;
            }
            if (statusFilter.length > 0 && !statusFilter.includes(vacation.status)) {
                return;
            }

            const startDate = new Date(vacation.start);
            const endDate = new Date(vacation.end);
            const checkDate = new Date(currentDateStr);

            if (checkDate >= startDate && checkDate <= endDate) {
                dayVacations.push(vacation);
            }
        });

        // Отображаем отпуска
        if (dayVacations.length > 0) {
            if (dayVacations.length === 1) {
                const eventEl = document.createElement('div');
                eventEl.className = `vacation-event ${getStatusClass(dayVacations[0].status)}`;
                eventEl.textContent = dayVacations[0].name;
                eventEl.title = `${dayVacations[0].name}: ${dayVacations[0].start} - ${dayVacations[0].end} (${dayVacations[0].status})`;
                eventEl.setAttribute('data-vacation', JSON.stringify(dayVacations[0]));
                eventEl.addEventListener('mouseenter', showVacationTooltip);
                eventEl.addEventListener('mouseleave', hideVacationTooltip);
                dayEl.appendChild(eventEl);
            } else {
                const eventEl = document.createElement('div');
                eventEl.className = 'vacation-event multiple';
                eventEl.textContent = `${dayVacations.length} отпусков`;
                eventEl.setAttribute('data-vacations', JSON.stringify(dayVacations));
                eventEl.addEventListener('mouseenter', showMultipleVacationsTooltip);
                eventEl.addEventListener('mouseleave', hideVacationTooltip);
                dayEl.appendChild(eventEl);
            }
        }

        calendarEl.appendChild(dayEl);
    }
}


function renderQuarterView() {
    const quarterView = document.getElementById('quarterView');
    quarterView.innerHTML = '';

    const vacations = loadVacations();
    const employees = loadEmployees();

    // Получаем фильтры
    const employeeFilter = Array.from(document.getElementById('calendarEmployeeFilter').selectedOptions)
        .map(option => option.value);
    const statusFilter = Array.from(document.getElementById('calendarStatusFilter').selectedOptions)
        .map(option => option.value);

    for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterEl = document.createElement('div');
        quarterEl.className = 'quarter-calendar';

        const quarterTitle = document.createElement('div');
        quarterTitle.className = 'quarter-title';
        quarterTitle.textContent = `${quarter} квартал 2026`;
        quarterEl.appendChild(quarterTitle);

        // Определяем месяцы в квартале
        const startMonth = (quarter - 1) * 3;
        const months = [startMonth, startMonth + 1, startMonth + 2];

        const quarterMonths = document.createElement('div');
        quarterMonths.className = 'quarter-months';

        months.forEach(month => {
            const monthEl = document.createElement('div');
            monthEl.className = 'month-mini';
            monthEl.setAttribute('data-month', month);

            // Добавляем обработчик клика для перехода к месяцу
            monthEl.addEventListener('click', function() {
                const monthIndex = parseInt(this.getAttribute('data-month'));
                currentMonth = monthIndex;
                currentYear = 2026;

                // Переключаемся на помесячный вид
                document.querySelector('.view-switch[data-view="month"]').click();

                // Обновляем календарь
                renderCalendar();
            });

            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-mini-header';
            const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
                               "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
            monthHeader.textContent = monthNames[month];
            monthEl.appendChild(monthHeader);

            const monthDays = document.createElement('div');
            monthDays.className = 'month-mini-days';

            // Заголовки дней недели
            const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            dayNames.forEach(dayName => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'day-mini';
                dayHeader.textContent = dayName;
                dayHeader.style.fontWeight = 'bold';
                monthDays.appendChild(dayHeader);
            });

            // Получаем первый день месяца и количество дней в месяце
            const firstDay = new Date(2026, month, 1);
            const lastDay = new Date(2026, month + 1, 0);
            const daysInMonth = lastDay.getDate();

            // Определяем день недели первого дня месяца
            let firstDayIndex = firstDay.getDay();
            firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

            // Добавляем пустые ячейки для дней предыдущего месяца
            for (let i = 0; i < firstDayIndex; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'day-mini';
                monthDays.appendChild(emptyDay);
            }

            // Добавляем ячейки для дней текущего месяца
            for (let day = 1; day <= daysInMonth; day++) {
                const dayEl = document.createElement('div');
                const currentDateStr = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(currentDateStr);
                const dayOfWeek = dateObj.getDay();

                // Определяем классы для дня
                let dayClasses = ['day-mini'];
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    dayClasses.push('weekend');
                }
                if (HOLIDAYS_2026.includes(currentDateStr)) {
                    dayClasses.push('holiday');
                }
                if (PRE_HOLIDAYS_2026.includes(currentDateStr)) {
                    dayClasses.push('pre-holiday');
                }

                // Проверяем, есть ли отпуска на этот день
                const hasVacation = vacations.some(vacation => {
                    // Применяем фильтры
                    if (employeeFilter.length > 0 && !employeeFilter.includes(vacation.employeeId.toString())) {
                        return false;
                    }
                    if (statusFilter.length > 0 && !statusFilter.includes(vacation.status)) {
                        return false;
                    }

                    const startDate = new Date(vacation.start);
                    const endDate = new Date(vacation.end);
                    const checkDate = new Date(currentDateStr);
                    return checkDate >= startDate && checkDate <= endDate;
                });

                if (hasVacation) {
                    dayClasses.push('has-vacation');
                }

                dayEl.className = dayClasses.join(' ');
                dayEl.textContent = day;
                dayEl.title = currentDateStr;

                monthDays.appendChild(dayEl);
            }

            monthEl.appendChild(monthDays);
            quarterMonths.appendChild(monthEl);
        });

        quarterEl.appendChild(quarterMonths);

        // Добавляем список отпусков в этом квартале
        const quarterVacations = vacations.filter(v => {
            // Применяем фильтры
            if (employeeFilter.length > 0 && !employeeFilter.includes(v.employeeId.toString())) {
                return false;
            }
            if (statusFilter.length > 0 && !statusFilter.includes(v.status)) {
                return false;
            }

            const startDate = new Date(v.start);
            const month = startDate.getMonth();
            return month >= startMonth && month <= startMonth + 2;
        });

        if (quarterVacations.length > 0) {
            const vacationsList = document.createElement('div');
            vacationsList.style.marginTop = '20px';
            vacationsList.style.paddingTop = '20px';
            vacationsList.style.borderTop = '1px solid var(--md-outline-variant)';

            const listHeader = document.createElement('div');
            listHeader.style.display = 'flex';
            listHeader.style.justifyContent = 'space-between';
            listHeader.style.alignItems = 'center';
            listHeader.style.marginBottom = '12px';

            const listTitle = document.createElement('div');
            listTitle.textContent = 'Отпуска в этом квартале:';
            listTitle.style.fontWeight = '600';
            listTitle.style.fontSize = '15px';

            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-quarter-vacations';
            toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Скрыть';
            toggleButton.onclick = function() {
                const content = this.parentElement.nextElementSibling;
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i> Скрыть';
                } else {
                    content.style.display = 'none';
                    this.innerHTML = '<i class="fas fa-eye"></i> Показать';
                }
            };

            listHeader.appendChild(listTitle);
            listHeader.appendChild(toggleButton);
            vacationsList.appendChild(listHeader);

            const listContent = document.createElement('div');

            // Группируем отпуска по сотрудникам
            const employeeVacations = {};
            quarterVacations.forEach(vacation => {
                if (!employeeVacations[vacation.name]) {
                    employeeVacations[vacation.name] = [];
                }
                employeeVacations[vacation.name].push(vacation);
            });

            Object.keys(employeeVacations).forEach(employeeName => {
                const employeeItem = document.createElement('div');
                employeeItem.style.marginBottom = '12px';

                const nameDiv = document.createElement('div');
                nameDiv.textContent = employeeName;
                nameDiv.style.fontWeight = '600';
                nameDiv.style.marginBottom = '6px';
                employeeItem.appendChild(nameDiv);

                employeeVacations[employeeName].forEach(vacation => {
                    const vacationDiv = document.createElement('div');
                    vacationDiv.style.display = 'flex';
                    vacationDiv.style.justifyContent = 'space-between';
                    vacationDiv.style.fontSize = '13px';
                    vacationDiv.style.marginBottom = '4px';
                    vacationDiv.style.paddingLeft = '12px';

                    const datesSpan = document.createElement('span');
                    datesSpan.textContent = `${vacation.start} - ${vacation.end}`;

                    const daysSpan = document.createElement('span');
                    daysSpan.textContent = `${vacation.days} д.`;
                    daysSpan.style.color = 'var(--md-on-surface-variant)';

                    vacationDiv.appendChild(datesSpan);
                    vacationDiv.appendChild(daysSpan);
                    employeeItem.appendChild(vacationDiv);
                });

                listContent.appendChild(employeeItem);
            });

            vacationsList.appendChild(listContent);
            quarterEl.appendChild(vacationsList);
        }

        quarterView.appendChild(quarterEl);
    }
}


function showVacationTooltip(e) {
    const vacation = JSON.parse(e.target.getAttribute('data-vacation'));
    const tooltip = document.getElementById('vacationTooltip');
    tooltip.innerHTML = `
        <strong>${vacation.name}</strong><br>
        ${vacation.start} - ${vacation.end}<br>
        ${vacation.days} дней<br>
        Статус: ${vacation.status}
    `;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.pageX + 10) + 'px';
    tooltip.style.top = (e.pageY + 10) + 'px';
}


function showMultipleVacationsTooltip(e) {
    const vacations = JSON.parse(e.target.getAttribute('data-vacations'));
    const tooltip = document.getElementById('vacationTooltip');
    let html = `<strong>${vacations.length} отпусков в этот день:</strong><br>`;
    vacations.forEach(v => {
        html += `• ${v.name} (${v.status})<br>`;
    });
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.pageX + 10) + 'px';
    tooltip.style.top = (e.pageY + 10) + 'px';
}


function hideVacationTooltip() {
    document.getElementById('vacationTooltip').style.display = 'none';
}


function getStatusClass(status) {
    switch(status) {
        case 'Запланирован': return 'planned';
        case 'Использован': return 'taken';
        case 'Отменен': return 'cancelled';
        case 'Перенесен': return 'postponed';
        default: return 'planned';
    }
}


function setQuickVacation(days) {
    const dateRangeInput = document.getElementById('dateRange');
    if (!dateRangeInput.value) {
        alert('Сначала выберите дату начала отпуска');
        return;
    }

    const selectedDates = dateRangePicker.selectedDates;
    if (selectedDates.length === 0) {
        alert('Сначала выберите дату начала отпуска');
        return;
    }

    const startDate = selectedDates[0];
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);

    dateRangePicker.setDate([startDate, endDate]);
    calculateVacationDaysWithHolidays(startDate, endDate);
}


function updateVacationDays() {
    const days = document.getElementById('vacationDays').value;
    document.getElementById('dayCount').textContent = days;

    // Обновляем дату окончания на основе выбранного количества дней отпуска
    const selectedDates = dateRangePicker.selectedDates;
    if (selectedDates.length > 0) {
        const startDate = selectedDates[0];
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + parseInt(days) - 1);
        dateRangePicker.setDate([startDate, endDate]);
        // Пересчитываем с учетом праздников
        calculateVacationDaysWithHolidays(startDate, endDate);
    }
}

// Функция для преобразования даты в формат YYYY-MM-DD с учетом локальной временной зоны

function formatDateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function calculateVacationDaysWithHolidays(startDate, endDate) {
    if (!startDate || !endDate) return;

    let calendarDays = 0;
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        calendarDays++;
        current.setDate(current.getDate() + 1);
    }

    // Исключаем только праздничные дни (выходные не исключаются!)
    let vacationDays = calendarDays;
    current = new Date(startDate);

    while (current <= end) {
        const dateString = formatDateToString(current);
        if (HOLIDAYS_2026.includes(dateString)) {
            vacationDays--;
        }
        current.setDate(current.getDate() + 1);
    }

    document.getElementById('vacationDays').value = vacationDays;
    document.getElementById('dayCount').textContent = vacationDays;

    // Показываем информацию о календарных днях
    const workingDaysInfo = document.getElementById('workingDaysInfo');
    if (calendarDays !== vacationDays) {
        workingDaysInfo.textContent = `(из ${calendarDays} календарных дней, исключено ${calendarDays - vacationDays} праздников)`;
        workingDaysInfo.style.display = 'inline';
    } else {
        workingDaysInfo.style.display = 'none';
    }

    return vacationDays;
}

// Обработчики событий

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}


function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}
