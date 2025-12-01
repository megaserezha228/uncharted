// Мобильное меню
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.classList.toggle('active');
        });
        
        // Закрытие меню при клике на ссылку
        const navLinks = document.querySelectorAll('.nav-list a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
        
        // Закрытие меню при ресайзе окна
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                nav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }

    // Функциональность фильтров
    const countryButtons = document.querySelectorAll('.country-btn');
    const cityCheckboxes = document.querySelectorAll('.cities-dropdown input[type="checkbox"]');
    const filterButtons = document.querySelectorAll('.filter-btn:not(.country-btn)');
    const searchButton = document.getElementById('searchButton');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const toursGrid = document.getElementById('toursGrid');
    const resultsPlaceholder = document.querySelector('.results-placeholder');

    let activeFilters = {
        countries: {},
        restTypes: [],
        price: null,
        hours: null
    };

    // Флаг для отслеживания, была ли нажата кнопка поиска
    let searchButtonClicked = false;

    // Инициализация структуры для хранения выбранных городов
    countryButtons.forEach(button => {
        const country = button.dataset.filter.split('-')[1];
        activeFilters.countries[country] = [];
    });

    // Функция для проверки условий показа результата (специальная комбинация)
    function shouldShowSpecialResults() {
        const isJapanSelected = document.querySelector('[data-filter="country-japan"]').classList.contains('active');
        const isOsakaSelected = activeFilters.countries.japan && activeFilters.countries.japan.includes('osaka');
        const isModerateSelected = activeFilters.restTypes.includes('moderate');
        const isPrice100Selected = activeFilters.price === '100';
        const isHours10Selected = activeFilters.hours === '10';
        const hasDates = startDateInput.value && endDateInput.value;
        
        // Проверяем конкретные даты
        let hasCorrectDates = false;
        if (hasDates) {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            hasCorrectDates = startDate === '2026-03-30' && endDate === '2026-03-31';
        }
        
        return isJapanSelected && isOsakaSelected && isModerateSelected && 
               isPrice100Selected && isHours10Selected && hasCorrectDates;
    }

    // Функция для обновления отображения результатов
    function updateResultsDisplay() {
        const resultsTitle = document.querySelector('.results h2');
        const resultsContent = document.querySelector('.results-placeholder');
        const mapContainer = document.querySelector('.map-container');
        const mapLinkContainer = document.querySelector('.map-link-container');
        
        // Показываем результаты только если была нажата кнопка поиска
        if (searchButtonClicked) {
            resultsTitle.textContent = 'Результат поиска';
            if (resultsContent) resultsContent.style.display = 'none';
            if (mapContainer) mapContainer.style.display = 'block';
            if (mapLinkContainer) mapLinkContainer.style.display = 'block';
        } else {
            resultsTitle.textContent = 'Выберите фильтры';
            if (resultsContent) resultsContent.style.display = 'block';
            if (mapContainer) mapContainer.style.display = 'none';
            if (mapLinkContainer) mapLinkContainer.style.display = 'none';
        }
    }

    // Обработчики для кнопок стран
    countryButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Закрываем другие выпадающие списки
            countryButtons.forEach(otherBtn => {
                if (otherBtn !== this) {
                    otherBtn.classList.remove('active');
                }
            });
            
            // НЕ обновляем отображение результатов при изменении фильтров
            // updateResultsDisplay(); // Убрано!
        });
    });

    // Обработчики для чекбоксов городов
    cityCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const city = this.dataset.city;
            const country = this.closest('.cities-dropdown').id.split('-')[1];
            
            if (this.checked) {
                if (!activeFilters.countries[country].includes(city)) {
                    activeFilters.countries[country].push(city);
                }
            } else {
                activeFilters.countries[country] = activeFilters.countries[country].filter(item => item !== city);
            }
            
            console.log('Выбранные города:', activeFilters.countries);
            // НЕ обновляем отображение результатов при изменении фильтров
            // updateResultsDisplay(); // Убрано!
        });
    });

    // Обработчики для остальных фильтров
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterType = this.dataset.filter.split('-')[0];
            const filterValue = this.dataset.filter.split('-')[1];
            
            if (this.classList.contains('multi-select')) {
                // Множественный выбор для типов отдыха
                this.classList.toggle('active');
                
                if (filterType === 'rest') {
                    if (this.classList.contains('active')) {
                        activeFilters.restTypes.push(filterValue);
                    } else {
                        activeFilters.restTypes = activeFilters.restTypes.filter(item => item !== filterValue);
                    }
                }
            } else {
                // Одиночный выбор для цены и часов
                document.querySelectorAll(`[data-filter^="${filterType}-"]`).forEach(btn => {
                    btn.classList.remove('active');
                });
                
                if (activeFilters[filterType] === filterValue) {
                    activeFilters[filterType] = null;
                } else {
                    this.classList.add('active');
                    activeFilters[filterType] = filterValue;
                }
            }
            
            // НЕ обновляем отображение результатов при изменении фильтров
            // updateResultsDisplay(); // Убрано!
        });
    });

    // Обработчик кнопки поиска
    searchButton.addEventListener('click', function() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Проверка дат
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            alert('Дата окончания не может быть раньше даты начала');
            return;
        }

        // Проверка выбора стран и городов
        const hasSelectedCities = Object.values(activeFilters.countries).some(cities => cities.length > 0);
        if (!hasSelectedCities) {
            alert('Пожалуйста, выберите хотя бы один город');
            return;
        }

        // Устанавливаем флаг, что кнопка поиска была нажата
        searchButtonClicked = true;
        
        // Проверяем специальную комбинацию для показа карты Осаки
        const isSpecialCombination = shouldShowSpecialResults();
        
        if (isSpecialCombination) {
            // Показываем карту Осаки
            updateResultsDisplay();
            alert('Найдены специальные туры в Осаку!');
        } else {
            // Показываем стандартные результаты или сообщение
            updateResultsDisplay();
            alert('Поиск выполнен! Результаты отображены ниже.');
        }
        
        // Скрываем placeholder
        if (resultsPlaceholder) {
            resultsPlaceholder.style.display = 'none';
        }
        
        // Очищаем grid для будущих туров (если есть)
        if (toursGrid) {
            toursGrid.innerHTML = '<p class="no-results">Туры будут загружены здесь после настройки бэкенда</p>';
        }
        
        // Выводим выбранные фильтры в консоль для отладки
        console.log('Выбранные фильтры:', {
            ...activeFilters,
            startDate,
            endDate
        });
        
        // Здесь будет подключение к API для загрузки реальных туров
    });

    // Устанавливаем минимальную дату как сегодня
    const today = new Date().toISOString().split('T')[0];
    if (startDateInput) startDateInput.min = today;
    if (endDateInput) endDateInput.min = today;

    // Обновляем минимальную дату для конечной даты при изменении начальной
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            if (endDateInput) endDateInput.min = this.value;
            // НЕ обновляем отображение результатов при изменении дат
        });
    }

    // Обновляем отображение при изменении конечной даты
    if (endDateInput) {
        endDateInput.addEventListener('change', function() {
            // НЕ обновляем отображение результатов при изменении дат
        });
    }

    // Закрытие выпадающих списков при клике вне их
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.filter-column')) {
            countryButtons.forEach(btn => {
                btn.classList.remove('active');
            });
        }
    });

    // Функциональность кнопки подписки и модального окна
    const subscriptionBtn = document.getElementById('subscriptionBtn');
    const subscriptionModal = document.getElementById('subscriptionModal');
    const modalClose = document.getElementById('modalClose');
    const purchaseBtn = document.getElementById('purchaseBtn');
    const subscriptionRadios = document.querySelectorAll('.subscription-radio');

    let selectedSubscription = null;

    // Открытие модального окна
    if (subscriptionBtn) {
        subscriptionBtn.addEventListener('click', function() {
            subscriptionModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
        });
    }

    // Закрытие модального окна
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = ''; // Восстанавливаем скролл
        });
    }

    // Закрытие модального окна при клике на overlay
    if (subscriptionModal) {
        subscriptionModal.addEventListener('click', function(event) {
            if (event.target === subscriptionModal) {
                subscriptionModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Закрытие модального окна клавишей Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && subscriptionModal && subscriptionModal.classList.contains('active')) {
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Выбор варианта подписки
    if (subscriptionRadios) {
        subscriptionRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                selectedSubscription = this.value;
                if (purchaseBtn) purchaseBtn.disabled = false;
            });
        });
    }

    // Обработчик кнопки "Приобрести подписку"
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', function() {
            if (!selectedSubscription) {
                alert('Пожалуйста, выберите вариант подписки');
                return;
            }

            // Здесь будет логика обработки покупки
            const subscriptionPrices = {
                '1000': '1 месяц',
                '2250': '3 месяца',
                '4950': '6 месяцев',
                '9300': '12 месяцев'
            };

            const duration = subscriptionPrices[selectedSubscription];
            alert(`Вы выбрали подписку на ${duration} за ${selectedSubscription} ₽\n\nВ реальном приложении здесь будет переход к оплате.`);
            
            // Закрываем модальное окно после "покупки"
            if (subscriptionModal) subscriptionModal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Сбрасываем выбор
            if (subscriptionRadios) {
                subscriptionRadios.forEach(radio => {
                    radio.checked = false;
                });
            }
            selectedSubscription = null;
            if (purchaseBtn) purchaseBtn.disabled = true;
        });
    }

    // Изначально кнопка покупки недоступна
    if (purchaseBtn) {
        purchaseBtn.disabled = true;
    }

    // Инициализация отображения при загрузке
    updateResultsDisplay();
});