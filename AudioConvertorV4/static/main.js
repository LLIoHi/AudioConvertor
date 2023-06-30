$(document).ready(function() {
    var socket = io('http://127.0.0.1:5000/');

    socket.on('connect', function() {
      console.log('Socket connected');
    });

    socket.on('progress', function(data) {
      var progress = data.progress.toFixed(2);
      $('#progress-bar').css('width', progress + '%');
      $('#progress-label').text(progress + '%');
    });

 
  $('form').submit(function(e) {
    e.preventDefault();
    var fileInput = $('input[type="file"]')[0];
    var selectedFormat = $('select').val();
    var allowedFormats = ['mp3', 'wav', 'ogg'];

    var fileExtension = fileInput.value.split('.').pop();
    if (!allowedFormats.includes(fileExtension.toLowerCase())) {
      alert('Непідтримуваний формат аудіофайлу!');
      return;
    }

    var file = fileInput.files[0];
    var fileSize = file.size / (1024 * 1024);
    var maxFileSize = 10; // Максимальний розмір файлу в МБ
    if (fileSize > maxFileSize) {
      alert(`Файл занадто великий! Максимальний розмір: ${maxFileSize} МБ`);
      return;
    }

    var formData = new FormData();
    formData.append('audio', file);
    formData.append('format', selectedFormat);

    $.ajax({
      url: '/convert',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      beforeSend: function() {
        // Блокування кнопки та показ прогрес-бару
        $('#convert-btn').prop('disabled', true);
        $('#status').show();
        $('#progress-bar').css('width', '0%');
        $('#progress-label').text('0%');
      },
      xhr: function() {
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener('progress', function(e) {
          if (e.lengthComputable) {
            var progress = (e.loaded / e.total) * 100;
            socket.emit('progress', { progress: progress });
          }
        }, false);
        return xhr;
      },
      success: function(response) {
        // Розблокування кнопки та сховання прогрес-бару
        $('#convert-btn').prop('disabled', false);
        $('#status').hide();

        // Очищення вибраного файлу
        $('input[type="file"]').val('');

        // Завантаження конвертованого файлу
        window.location.href = '/download/' + response.filename;
      },
      error: function(xhr, status, error) {
        // Розблокування кнопки та сховання прогрес-бару
        $('#convert-btn').prop('disabled', false);
        $('#status').hide();

        alert('Помилка конвертації: ' + error);
      }
    });
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
