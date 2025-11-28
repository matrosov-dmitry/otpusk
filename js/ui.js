function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('ru-RU', options);
}


function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс у всех вкладок
            tabs.forEach(t => t.classList.remove('active'));
            // Добавляем активный класс текущей вкладке
            this.classList.add('active');

            // Скрываем все содержимое вкладок
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Показываем содержимое активной вкладки
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Если перешли на вкладку планирования, обновляем список сотрудников
            if (tabId === 'planning') {
                updateEmployeeSelect();
            }

            // Если перешли на вкладку сводов, обновляем отчеты
            if (tabId === 'reports') {
                renderReports();
            }

            // Если перешли на вкладку конфликтов, обновляем конфликты
            if (tabId === 'conflicts') {
                renderConflicts();
            }

            // Если перешли на вкладку резервного копирования, обновляем информацию
            if (tabId === 'backup') {
                updateBackupInfo();
            }
        });
    });
}


function initializeViewSwitcher() {
    const viewSwitches = document.querySelectorAll('.view-switch');
    viewSwitches.forEach(switchEl => {
        switchEl.addEventListener('click', function() {
            viewSwitches.forEach(s => s.classList.remove('active'));
            this.classList.add('active');

            currentView = this.getAttribute('data-view');

            if (currentView === 'month') {
                document.querySelector('.month-view').style.display = 'block';
                document.getElementById('quarterView').classList.remove('active');
            } else {
                document.querySelector('.month-view').style.display = 'none';
                document.getElementById('quarterView').classList.add('active');
                renderQuarterView();
            }
        });
    });
}
