import hashlib

from flask import Flask, Response, request, redirect, url_for, send_file, render_template, render_template_string, \
    session
import logging
from datetime import datetime
import functions

app = Flask(__name__)
app.config['DEBUG'] = True

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

app.config['SECRET_KEY'] = 'cisco'

@app.route('/')
def index():
    app.logger.info('Login page accessed')
    return render_template("LoginPage.html")


@app.route('/admin')
def admin_page():
    # Prüfen, ob der Benutzer eingeloggt ist
    if 'user_email' not in session:
        app.logger.info('Unauthorized access to admin page')
        return redirect(url_for('index'))

    # Benutzer-Daten laden
    app.logger.info('Admin page accessed')
    users = functions.get_User("data/user.json")
    current_user_email = session['user_email']  # E-Mail des eingeloggten Benutzers
    return render_template_string(
        functions.get_AdminPage(),
        users=users,
        current_user_email=current_user_email
    )


@app.route('/delete-user', methods=['POST'])
def delete_user():
    if 'user_email' not in session:
        return redirect(url_for('index'))

    user_id = request.form.get('id')
    app.logger.info(f"Attempt to delete user ID: {user_id}")

    # Benutzer-Daten laden
    users = functions.get_User("data/user.json")
    current_user_email = session['user_email']

    # Prüfen, ob der Benutzer sich selbst löschen möchte
    user_to_delete = next((user for user in users if user['id'] == user_id), None)
    if user_to_delete and user_to_delete['email'] == current_user_email:
        app.logger.info("Attempted to delete the currently logged-in user")
        return redirect(url_for('admin_page'))

    # Benutzer löschen
    users = [user for user in users if user['id'] != user_id]
    functions.save_User("data/user.json", {"users": users})
    return redirect(url_for('admin_page'))

@app.route('/create-user', methods=['POST'])
def create_user():
    email = request.form.get('email')
    password = request.form.get('password')
    admin = request.form.get('admin') == 'true'

    users = functions.get_User("data/user.json")

    if any(user['email'] == email for user in users):
        app.logger.info(f"Attempt to create a user with existing email: {email}")
        return render_template_string(
            functions.read_file("templates/AdminPage.html") + "<p>Email already exists!</p>"
        )


    new_id = str(len(users) + 1)

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    new_user = {
        "id": new_id,
        "email": email,
        "password": hashed_password,
        "admin": str(admin).lower()
    }

    users.append(new_user)
    functions.save_User("data/user.json", {"users": users})

    return redirect(url_for('admin_page'))


@app.route('/view', methods=['POST'])
def view():
    email = request.form.get('email')
    password = request.form.get('password')

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    # Benutzer auslesen
    users = functions.get_User("data/user.json")
    for tmp in users:
        if email == tmp['email'] and hashed_password == tmp['password']:
            app.logger.info(f"User logged in: {email}")

            # Aktuelle Benutzer-E-Mail in der Session speichern
            session['user_email'] = email

            # Überprüfen, ob der Benutzer ein Admin ist
            is_admin = tmp['admin'] == 'true'

            # Weiterleitung je nach Admin-Status
            return render_template_string(functions.read_file("templates/MainPage.html"), isAdmin=is_admin)

    # Login fehlgeschlagen
    app.logger.info('Login failed')
    return render_template_string(
        functions.read_file("templates/LoginPage.html") + "<p>Password or email incorrect!</p>")


@app.route('/video_feed')
def video_feed():
    app.logger.info('Video feed accessed')
    return Response(functions.gen_camera_feed(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/error')
def error():
    app.logger.info('Error page accessed')
    return render_template("ErrorPage.html")


@app.route('/data/raspberrydata.txt')
def serve_data():
    response = send_file('data/raspberrydata.txt')
    response.cache_control.no_cache = True
    response.cache_control.no_store = True
    response.cache_control.max_age = 0
    response.expires = -1
    return response


@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f'An error occurred: {e}')
    return redirect(url_for('error'))


if __name__ == '__main__':
    app.logger.info(f'Server started, log file: {log_filename}')
    app.run(host='0.0.0.0', port=8001, debug=False)
