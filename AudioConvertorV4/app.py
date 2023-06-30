from flask import Flask, render_template, request, send_file, redirect, url_for, flash, send_from_directory
import os
import subprocess
from flask_socketio import SocketIO, disconnect
from werkzeug.utils import secure_filename
from pydub import AudioSegment

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['CONVERTED_FOLDER'] = 'converted'
app.config['SECRET_KEY'] = 'secret!'
app.secret_key = 'your_secret_key'

conversion_in_progress = False

socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')
    disconnect()

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def delete_converted_file(filename):
    converted_path = os.path.join(app.config['CONVERTED_FOLDER'], filename)
    os.remove(converted_path)


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        global conversion_in_progress

        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)

        file = request.files['file']

        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)

        if file and allowed_file(file.filename):
            if conversion_in_progress:
                flash('Conversion is already in progress')
                return redirect(request.url)

            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            converted_filename = f"converted_{filename}"
            converted_path = os.path.join(app.config['CONVERTED_FOLDER'], converted_filename)

            file.save(file_path)

            # Оновлений код для конвертації з використанням прогрес-бару
            try:
                audio = AudioSegment.from_file(file_path)
                duration = len(audio) / 1000.0

                conversion_in_progress = True

                for i, chunk in enumerate(audio[:1000]):  # Приклад обробки перших 1000 мілісекунд (за потреби змініть це значення)
                    # Обробка кожного фрагменту

                    # Оновлення прогрес-бару на клієнтському боці
                    progress = (i + 1) / 1000 * 100
                    socketio.emit('progress', {'progress': progress}, namespace='/progress')

                    # Конвертація фрагменту

                audio.export(converted_path, format='wav')

                # Видалення оригінального файлу після завершення конвертації
                os.remove(file_path)

                conversion_in_progress = False

                flash('File converted successfully')
                return redirect(url_for('download_file', filename=converted_filename))

            except Exception as e:
                # Видалення конвертованого файлу у випадку помилки
                delete_converted_file(converted_filename)

                conversion_in_progress = False

                flash('Conversion error: ' + str(e))
                return redirect(request.url)

    return render_template('index.html')


@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['CONVERTED_FOLDER'], filename, as_attachment=True)


@app.route('/convert', methods=['POST'])
def convert():
    audio_file = request.files['audio']
    target_format = request.form['format']

    filename = secure_filename(audio_file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    converted_filename = f"converted_{filename}"
    converted_path = os.path.join(app.config['CONVERTED_FOLDER'], converted_filename)

    audio_file.save(file_path)

    try:
        audio = AudioSegment.from_file(file_path)
        duration = len(audio) / 1000.0

        for i, chunk in enumerate(audio[:1000]):
            # Обробка кожного фрагменту

            audio.export(converted_path, format=target_format)

        os.remove(file_path)

        return redirect(url_for('download_file', filename=converted_filename))

    except Exception as e:
        delete_converted_file(converted_filename)

        flash('Conversion error: ' + str(e))
        return redirect(request.url)


if __name__ == '__main__':
    socketio.run(app, debug=True)






#def convert_audio(input_file, output_file):
 #   command = ['ffmpeg', '-y', '-i', input_file, output_file]
 #   subprocess.call(command)


#    convert_audio(file_path, converted_file_path)

    # Видалення вхідного файлу після конвертації
#    os.remove(file_path)

#    return send_file(converted_file_path, as_attachment=True)