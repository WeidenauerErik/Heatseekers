from flask import Flask, Response, render_template_string, request
import logging
from datetime import datetime
import functions

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

@app.route('/view', methods=['POST'])
def view():

    email = request.form.get('email')
    password = request.form.get('password')

    user = functions.get_User("data/user.json")
    for tmp in user:
        if email == tmp['email'] and password == tmp['password']:
            app.logger.info('View page accessed')
            return render_template_string(functions.read_file("templates/MainPage.html"))

    app.logger.info('Login failed')
    return render_template_string(functions.read_file(
        "templates/LoginPage.html") + "<p>Password or email incorrect!</p>")


@app.route('/video_feed')
def video_feed():
    app.logger.info('Video feed accessed')
    return Response(functions.gen_camera_feed(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.errorhandler(Exception)
def errorhandler():
    app.logger.error('An error occurred')
    return render_template_string(functions.read_file("templates/ErrorPage.html"))

if __name__ == '__main__':
    app.logger.info(f'Server started, log file: {log_filename}')
    app.run(host='0.0.0.0', port=8000, debug=False)
