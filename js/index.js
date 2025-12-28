const jsonInput = document.getElementById('jsonInput');
const loadDataBtn = document.getElementById('loadDataBtn');
const settingsSection = document.getElementById('settingsSection');
const statusMessage = document.getElementById('statusMessage');
const generateBtn = document.getElementById('generateBtn');
const cardsContainer = document.getElementById('cardsContainer');

const modeRandom = document.getElementById('modeRandom');
const modeCount = document.getElementById('modeCount');
const countInput = document.getElementById('countInput');

document.addEventListener('DOMContentLoaded', () => {
    let parsedData = [];

    function initFilterButtons() {
        const btns = document.querySelectorAll('.filter-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await onFilterButtonClick(btn)
            });
        })
    }

    async function onFilterButtonClick(btn) {
        const jsonFiles = btn.dataset.json.split(' ');

        try {
            // Загружаем данные из всех указанных файлов
            const allData = [];

            for (const fileName of jsonFiles) {
                const response = await fetch(`../assets/data/${fileName}.json`);

                if (!response.ok) {
                    throw new Error(`Файл ${fileName}.json не найден`);
                }

                const data = await response.json();

                if (Array.isArray(data)) {
                    allData.push(...data);
                } else {
                    console.warn(`Данные в ${fileName}.json не являются массивом`);
                }
            }

            if (allData.length === 0) {
                throw new Error('Нет данных для отображения');
            }

            // Заполняем textarea и загружаем данные
            jsonInput.value = JSON.stringify(allData, null, 2);
            loadAndParseData();

            showMessage(`Загружено ${allData.length} элементов из ${jsonFiles.length} файлов`, 'success');

        } catch (error) {
            console.error("Ошибка загрузки файла:", error);
            showMessage(`Ошибка: ${error.message}`, 'error');
        }
    }

    function loadAndParseData() {
        cardsContainer.innerHTML = '';
        const jsonString = jsonInput.value.trim();

        if (!jsonString) {
            showMessage('Введите JSON данные.', 'error');
            settingsSection.classList.add('hidden');
            return;
        }

        try {
            const data = JSON.parse(jsonString);

            if (!Array.isArray(data) || data.some(item => !item.question || !item.answer)) {
                throw new Error('Неверный формат JSON.');
            }

            parsedData = data;
            showMessage(`Успешно загружено ${parsedData.length} элементов.`, 'success');
            settingsSection.classList.remove('hidden');

            countInput.max = parsedData.length;
            if (parseInt(countInput.value) > parsedData.length) {
                countInput.value = parsedData.length;
            }

        } catch (error) {
            console.error("Ошибка парсинга:", error);
            showMessage(`Ошибка: ${error.message}. Проверьте синтаксис.`, 'error');
            settingsSection.classList.add('hidden');
            parsedData = [];
        }
    }

    function generateCards() {
        const items = getItemsToDisplay();
        cardsContainer.innerHTML = '';

        if (items.length === 0 && parsedData.length > 0) {
            showMessage('Генерация невозможна. Проверьте настройки.', 'error');
            return;
        }

        items.forEach(item => {
            cardsContainer.appendChild(createCardElement(item));
        });
    }

    function getItemsToDisplay() {
        if (parsedData.length === 0) return [];

        if (modeRandom.checked) {
            // Один случайный вопрос
            const randomIndex = Math.floor(Math.random() * parsedData.length);
            return [parsedData[randomIndex]];
        }

        if (modeCount.checked) {
            // Заданное количество (используем перемешанный массив для разнообразия)
            const count = parseInt(countInput.value);

            if (count <= 0 || count > parsedData.length) {
                showMessage(`Введите количество от 1 до ${parsedData.length}.`, 'error');
                return [];
            }

            const shuffledData = [...parsedData].sort(() => 0.5 - Math.random());
            return shuffledData.slice(0, count);
        }
        return [];
    }

    loadDataBtn.addEventListener('click', loadAndParseData);
    generateBtn.addEventListener('click', generateCards);
    modeRandom.addEventListener('change', toggleCountInput);
    modeCount.addEventListener('change', toggleCountInput);

    initFilterButtons();
    toggleCountInput();
});

function createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.revealed = 'false';

    const question = document.createElement('h4');
    question.textContent = item.question;

    const answerContainer = document.createElement('div');
    answerContainer.className = 'answer-container';

    const answerText = document.createElement('p');
    answerText.textContent = item.answer;
    answerText.className = 'blurred-text';

    const prompt = document.createElement('span');
    prompt.textContent = 'Нажмите, чтобы увидеть ответ';
    prompt.className = 'reveal-prompt';

    answerContainer.appendChild(prompt);
    answerContainer.appendChild(answerText);

    // Обработчик клика: Раскрыть ответ ИЛИ перейти к следующему вопросу
    answerContainer.addEventListener('click', () => {

        if (card.dataset.revealed === 'false') {
            // Состояние 1: Раскрыть ответ
            answerText.classList.remove('blurred-text');
            answerText.classList.add('revealed-text');
            prompt.style.display = 'none';
            card.dataset.revealed = 'true';
            prompt.textContent = 'Нажмите, чтобы перейти к следующему вопросу';

        } else {
            // Состояние 2: Ответ раскрыт, генерируем следующий
            generateCards();
        }
    });

    card.appendChild(question);
    card.appendChild(answerContainer);

    return card;
}

function showMessage(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = type;
}

function toggleCountInput() {
    countInput.disabled = modeRandom.checked;
}