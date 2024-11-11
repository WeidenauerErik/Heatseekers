import os
import glob


def clear_log_folder():
    files = glob.glob(os.path.join('logs', '*'))

    for file in files:
        try:
            os.remove(file)
            print(f"{file} wurde gelöscht.")
        except Exception as e:
            print(f"Fehler beim Löschen von {file}: {e}")


clear_log_folder()
