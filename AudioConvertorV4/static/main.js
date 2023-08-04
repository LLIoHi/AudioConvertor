const form = document.querySelector('form');
const convertBtn = document.querySelector('#convert-btn');
var xhr = new XMLHttpRequest();

// Додаємо обробник події при надсиланні форми
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Блокування форми
  form.classList.add('disabled');
  convertBtn.disabled = true;
  convertBtn.innerText = 'Конвертація в процесі...';

  // Отримуємо значення вибраного файлу та формату конвертації
  const fileInput = document.querySelector('input[type="file"]');
  const selectedFormat = document.querySelector('select').value;
  const allowedFormats = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff'];

  // Перевірка підтримуваного формату аудіофайлу
  const fileExtension = fileInput.value.split('.').pop();
  if (!allowedFormats.includes(fileExtension.toLowerCase())) {
    alert('Непідтримуваний формат аудіофайлу!');
    resetForm(); // Скидання форми
    return;
  }

  // Перевірка розміру аудіофайлу
  const file = fileInput.files[0];
  const fileSize = file.size / (1024 * 1024);
  const maxFileSize = 10; // Максимальний розмір файлу в МБ
  if (fileSize > maxFileSize) {
    alert(`Файл занадто великий! Максимальний розмір: ${maxFileSize} МБ`);
    resetForm(); // Скидання форми
    return;
  }

  // Відправка запиту на сервер для конвертації
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('format', selectedFormat);

  //Виконується запит fetch на URL /convert з методом POST та передачею даних formData
  fetch('/convert', {
    method: 'POST',
    body: formData
  })
    .then(response => {
      //Перевіряється відповідь сервера
      if (response.ok) {
        return response.blob();
      } else {
        throw new Error('Помилка конвертації.');
      }
    })
    .then(blob => {
      // Створення посилання для скачування
      const downloadLink = document.createElement('a');
      const convertedFilename = `converted_${file.name.replace(/\.[^/.]+$/, '')}.${selectedFormat}`;
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = convertedFilename;
      document.body.appendChild(downloadLink);

      // Клік на посиланні для початку завантаження
      downloadLink.click();

      // Видалення посилання з DOM
      document.body.removeChild(downloadLink);

      // Розблокування форми
      resetForm();
    })
    .catch(error => {
      console.error(error);
      alert('Сталася помилка під час конвертації.');
      resetForm(); // Скидання форми
    });
});

// Відправка запиту на видалення файлу з сервера
function removeFile() {
  fetch('/remove_file', {
    method: 'POST'
  })
    .then(function (response) {
      if (response.ok) {
        console.log('File successfully deleted.');
      } else {
        console.log('Error deleting file.');
      }
    })
    .catch(function (error) {
      console.log('Error:', error);
    });
}

// Скидання форми та видалення конвертованого файлу на сервері
function resetForm() {
  // Розблокування форми
  form.classList.remove('disabled');
  convertBtn.disabled = false;
  convertBtn.innerText = 'Конвертувати';
  form.reset();

  // Видалення конвертованого файлу на сервері
  removeFile();
}

// Отримати поточну схему кольорів користувача
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Функція для переключення теми
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('dark-theme');
}

// Застосувати потрібну тему при завантаженні сторінки
window.addEventListener('load', () => {
  if (prefersDarkScheme) {
    toggleTheme(); // Застосувати темну тему, якщо користувач вибрав темну схему кольорів
  }
});

// Слухач події на зміну схеми кольорів
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const newScheme = e.matches;
  if (newScheme) {
    toggleTheme(); // Застосувати темну тему при зміні схеми кольорів на темну
  } else {
    toggleTheme(); // Застосувати світлу тему при зміні схеми кольорів на світлу
  }
});