import cv2
import json
import time


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
