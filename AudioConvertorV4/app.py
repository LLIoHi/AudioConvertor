from flask import Flask, render_template, request, send_file, session
import os
import subprocess

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# Jбробляє GET-запит на головний шлях і повертає HTML-сторінку "index.html"
@app.route('/')
def index():
    return render_template('index.html')

# Функція, що приймає розширення вхідного файлу та формат конвертації і повертає розширення вихідного файлу залежно від обраних параметрів (потрібно для безпеки)
def get_output_extension(input_extension, target_format):
    if target_format == 'mp3':
        return 'mp3'
    elif target_format == 'wav':
        return 'wav'
    elif target_format == 'ogg':
        return 'ogg'
    elif target_format == 'flac':
        return 'flac'
    elif target_format == 'aac':
        return 'aac'
    elif target_format == 'm4a':
        return 'm4a'
    elif target_format == 'wma':
        return 'wma'
    elif target_format == 'aiff':
        return 'aiff'
    else:
        return input_extension[1:]  # Якщо формат не відповідає жодному з вказаних, використовуєть розширення вхідного файлу, за винятком першого символу (крапки)

# Функція, що обробляє POST-запит на маршрут "/convert" для конвертації аудіофайлу у вказаний формат
@app.route('/convert', methods=['POST'])
def convert():
    audio_file = request.files['audio'] # Отримання завантаженого аудіофайлу
    target_format = request.form['format']  # Отримання обраного формату конвертації

    file_path = os.path.join('uploads', audio_file.filename) # Шлях до завантаженого файлу
    audio_file.save(file_path) # Збереження аудіофайлу на сервері

    filename, extension = os.path.splitext(audio_file.filename) # Розбиття імені файлу та його розширення
    output_extension = get_output_extension(extension, target_format) # Отримання розширення вихідного файлу
    converted_file_path = os.path.join('converted', f'converted_{filename}.{output_extension}') # Шлях до конвертованого файлу

    try:
        command = ['ffmpeg', '-y', '-i', file_path, converted_file_path] # Команда для виклику ffmpeg для конвертації
        subprocess.call(command)  # Виклик команди для виконання конвертації

        session['converted_file'] = converted_file_path # Збереження шляху до конвертованого файлу в сесії

        return send_file(converted_file_path, as_attachment=True)  # Відправлення конвертованого файлу клієнту для завантаження
    except subprocess.CalledProcessError as e:
            print("Error:", e)
            return "Conversion failed.", 400 # Повернення повідомлення про невдалу конвертацію у випадку помилки
    finally:
            os.remove(file_path)  # Видалення завантаженого файлу після виконання конвертації

# Функція, що обробляє POST-запит на маршрут "/remove_file" для видалення конвертованого файлу
@app.route('/remove_file', methods=['POST'])
def download_complete():
    converted_file = session.get('converted_file') # Отримання шляху до конвертованого файлу з сесії
    if converted_file:
        os.remove(converted_file) # Видалення конвертованого файлу з сервера
        session.pop('converted_file', None) # Видалення шляху до конвертованого файлу з сесії
    return '', 200

if __name__ == '__main__':
    app.run(debug=True)