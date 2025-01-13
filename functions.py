import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import cv2
import json
import time
from flask import render_template


def read_file(file_path):
    try:
        with open(file_path, 'r') as file:
            content: str = file.read()
        return content
    except FileNotFoundError:
        return f"Error: The file at {file_path} was not found."
    except IOError:
        return f"Error: An error occurred while reading the file at {file_path}."


def gen_camera_feed():
    try:
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            raise Exception("No camera was found.")

        while True:
            start_time = time.time()
            success, frame = camera.read()
            if not success:
                raise Exception("Frame couldn't be read.")

            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                raise Exception("Image couldn't be encoded.")

            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(max(0, 1 / 10 - (time.time() - start_time)))

            time.sleep(max(0, 1 / 10 - (time.time() - start_time)))
    except Exception as e:
        print(f"Not defined Error: {e}")


def get_Temperature(file_path):
    try:
        with open(file_path, 'r') as file:
            content: str = file.read()
        return content
    except FileNotFoundError:
        return f"Error: The file at {file_path} was not found."
    except IOError:
        return f"Error: An error occurred while reading the file at {file_path}."


def get_User(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data['users']


def save_User(filepath, data):
    with open(filepath, 'w') as file:
        json.dump(data, file, indent=4)


def get_AdminPage():
    users = get_User("data/user.json")
    return render_template("AdminPage.html", users=users)


def send_email(email, text):
    sender_email = "htlrennweg.heatseekers@gmail.com"
    subject = "Your New Account Password"

    msg = MIMEMultipart("related")
    msg['From'] = sender_email
    msg['To'] = email
    msg['Subject'] = subject

    msg_alternative = MIMEMultipart("alternative")
    msg.attach(msg_alternative)
    msg_alternative.attach(MIMEText(text, "html"))

    logo_path = "static/images/icon.png"
    with open(logo_path, "rb") as img:
        mime_img = MIMEImage(img.read())
        mime_img.add_header("Content-ID", "<logo_image>")
        mime_img.add_header("Content-Disposition", "inline", filename="icon.png")
        msg.attach(mime_img)

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender_email, "olra pafg dvmk alfv")
        server.sendmail(sender_email, email, msg.as_string())
