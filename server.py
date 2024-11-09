import hashlib
from flask import Flask, Response, render_template_string, request, redirect, url_for
import logging
from datetime import datetime
import functions
from functions import get_AdminPage

app = Flask(__name__)

logger = logging.getLogger()
logger.setLevel(logging.INFO)

log_filename = f'./logs/{datetime.now().strftime("%Y-%m-%d_%H-%M-%S")}.log'
file_handler = logging.FileHandler(log_filename)
file_handler.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

logger.addHandler(file_handler)
logger.addHandler(console_handler)


@app.route('/')
def index():
    app.logger.info('Login page accessed')
    return render_template_string(functions.read_file("templates/LoginPage.html"))


@app.route('/admin')
def admin_page():
    app.logger.info('Admin page accessed')
    return functions.get_AdminPage()


@app.route('/delete-user', methods=['POST'])
def delete_user():
    user_id = request.form.get('id')
    print(user_id)
    app.logger.info('Delete user page accessed')
    return get_AdminPage()


@app.route('/view', methods=['POST'])
def view():
    email = request.form.get('email')
    password = request.form.get('password')

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    user = functions.get_User("data/user.json")
    for tmp in user:
        if email == tmp['email'] and hashed_password == tmp['password']:
            app.logger.info('View page accessed')
            if tmp['admin'] == 'true':
                return render_template_string(functions.read_file("templates/MainPage-admin.html"))

            return render_template_string(functions.read_file("templates/MainPage.html"))

    app.logger.info('Login failed')
    return render_template_string(functions.read_file("templates/LoginPage.html") + "<p>Password or email incorrect!</p>")


@app.route('/video_feed')
def video_feed():
    app.logger.info('Video feed accessed')
    return Response(functions.gen_camera_feed(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/error')
def error():
    app.logger.info('Error page accessed')
    return render_template_string(functions.read_file("templates/ErrorPage.html"))


@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f'An error occurred: {e}')
    return redirect(url_for('error'))


if __name__ == '__main__':
    app.logger.info(f'Server started, log file: {log_filename}')
    app.run(host='0.0.0.0', port=8000, debug=False)
