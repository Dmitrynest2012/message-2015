// Отключаем все логирование
Object.keys(console).forEach(key => {
    if (typeof console[key] === 'function') {
        console[key] = function() {};
    }
});

function updateFlameVisibility() {
    const shouldBeVisible = (sendStatus === "В Посыле" && window.flameInPosylEnabled) || 
                           (sendStatus === "Вне Посыла" && window.flameOutsidePosylEnabled);
    flameVideo.style.display = "block";
    flameVideo.classList.toggle("visible", shouldBeVisible);
    if (shouldBeVisible && hasUserInteracted) {
        flameVideo.play().catch(error => console.error("Ошибка воспроизведения:", error));
    } else {
        flameVideo.pause();
    }
    // Вызываем обновление прозрачности после изменения видимости
    if (typeof updateFlameOpacity === "function") {
        updateFlameOpacity();
    }
}



// Переменные для катренов
let quatrainData = [];
let currentQuatrain = null;
let lastQuatrainBeforePosyl = null;
let quatrainContainer;
let quatrainTitle;
let quatrainDate;
let quatrainText;
let quatrainTransition;

document.addEventListener("DOMContentLoaded", () => {
    // Инициализация элементов катренов после загрузки DOM
    quatrainContainer = document.getElementById("quatrain-container");
    quatrainTitle = document.getElementById("quatrain-title");
    quatrainDate = document.getElementById("quatrain-date");
    quatrainText = document.getElementById("quatrain-text");
    quatrainTransition = document.getElementById("quatrain-transition");

    if (!quatrainContainer || !quatrainTitle || !quatrainDate || !quatrainText || !quatrainTransition) {
        console.error("Не найдены элементы контейнера катренов");
        return;
    }

    // Загружаем катрены при старте
    fetchQuatrains();
    // Проверяем катрены каждую минуту
    setInterval(fetchQuatrains, 60000);
    // Меняем катрен каждые 5 минут
    setInterval(updateQuatrain, 300000);

    // Добавляем обработчик клика на контейнер
    quatrainContainer.addEventListener("click", () => {
        if (currentQuatrain && currentQuatrain["ссылка на катрен:"]) {
            window.open(currentQuatrain["ссылка на катрен:"], "_blank");
        }
    });
});

// Загрузка данных катренов из Excel файла
async function fetchQuatrains() {
    try {
        const response = await fetch("quatrains_about_the_message.xlsx", { cache: "no-store" });
        if (!response.ok) throw new Error(`Не удалось загрузить файл катренов: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        quatrainData = XLSX.utils.sheet_to_json(sheet);

        // Приошибка при начальной загрузке данных:", error);
        // При первой загрузке или если вне посыла - сразу выбираем катрен
        if (!currentQuatrain && sendStatus === "Вне Посыла") {
            updateQuatrain(true);
        }
    } catch (error) {
        console.error("Ошибка загрузки катренов:", error);
    }
}

// Форматирование текста катрена
function formatQuatrainText(text) {
    return text.split("^").map(line => line.trim()).join("<br>");
}

// Форматирование даты катрена
function formatQuatrainDate(dateNum) {
    const date = new Date((dateNum - 25569) * 86400 * 1000); // Преобразование Excel даты
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `[Катрен от ${day}.${month}.${year}]`;
}

// Обновление катрена
function updateQuatrain(force = false) {
    if (quatrainData.length === 0 || sendStatus === "В Посыле" && !force) return;

    const newQuatrain = quatrainData[Math.floor(Math.random() * quatrainData.length)];
    
    // Если это не принудительное обновление и катрен совпадает с текущим, пропускаем
    if (!force && currentQuatrain && 
        currentQuatrain["номер катрена:"] === newQuatrain["номер катрена:"]) {
        return;
    }

    // Сохраняем текущий катрен перед сменой состояния, если вне посыла
    if (sendStatus === "Вне Посыла") {
        lastQuatrainBeforePosyl = currentQuatrain;
    }

    currentQuatrain = newQuatrain;

    // Анимация перехода
    quatrainTransition.classList.add("active");
    setTimeout(() => {
        quatrainTitle.textContent = currentQuatrain["название катрена:"] || "Без названия";
        quatrainDate.textContent = formatQuatrainDate(currentQuatrain["дата катрена:"]);
        quatrainText.innerHTML = formatQuatrainText(currentQuatrain["текст катрена:"] || "");
        quatrainTransition.classList.remove("active");
    }, 400); // Половина времени анимации (0.8s / 2)

    // Показываем контейнер, если вне посыла
    if (sendStatus === "Вне Посыла") {
        quatrainContainer.classList.add("visible");
    }
}

// Переопределяем updateDisplay для управления видимостью катренов
const originalUpdateDisplay = updateDisplay;
updateDisplay = function() {
    originalUpdateDisplay.apply(this, arguments);

    // Управление видимостью контейнера катренов
    if (sendStatus === "В Посыле") {
        quatrainContainer.classList.remove("visible");
    } else if (sendStatus === "Вне Посыла") {
        if (!currentQuatrain && quatrainData.length > 0) {
            updateQuatrain(true); // Принудительно выбираем катрен при выходе из посыла
        } else if (lastQuatrainBeforePosyl && !currentQuatrain) {
            currentQuatrain = lastQuatrainBeforePosyl;
            quatrainTitle.textContent = currentQuatrain["название катрена:"] || "Без названия";
            quatrainDate.textContent = formatQuatrainDate(currentQuatrain["дата катрена:"]);
            quatrainText.innerHTML = formatQuatrainText(currentQuatrain["текст катрена:"] || "");
        }
        quatrainContainer.classList.add("visible");
    }
};

// Проверяем, является ли устройство мобильным
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Функция для блокировки горизонтальной ориентации
function lockOrientation() {
    // Выполняем только для мобильных устройств
    if (isMobileDevice()) {
        // Проверяем ориентацию
        window.addEventListener('orientationchange', function() {
            if (window.orientation === 90 || window.orientation === -90) {
                // Если горизонтальная ориентация, показываем предупреждение
                document.body.style.display = 'none';
                alert('Пожалуйста, используйте портретную ориентацию для этого сайта.');
            } else {
                // Восстанавливаем видимость в портретной ориентации
                document.body.style.display = 'block';
            }
        });

        // Проверяем начальную ориентацию при загрузке
        if (window.orientation === 90 || window.orientation === -90) {
            document.body.style.display = 'none';
            alert('Пожалуйста, используйте портретную ориентацию для этого сайта.');
        }
    }
}

// Запускаем при загрузке страницы
window.onload = lockOrientation;