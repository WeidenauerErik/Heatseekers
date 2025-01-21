import asyncio
import websockets
import os
import subprocess
from datetime import datetime as dt
import bluepy.btle as btle

PATH = "./journal.log"
ADDRESS = "a8:61:0a:43:67:07"

def has_network_connection():
    """Checks if there is a valid network connection by checking for an IP address."""

    try:
        # Parse the routing table
        with os.popen('ip route') as routes:
            route_table = routes.read()

        # Check for non-loopback routers
        if 'default' in route_table:
#            print(f"Active routes detected:\n{route_table}")
            ipv4 = os.popen('ip addr show wlan0').read().split("inet ")[1].split("/")[0]
            print(f"Webserver running on {ipv4}:8000")
            return True
        else:
            print("No active routers detected.")
            return False
    except Exception as e:
        print(f"Error checking network routes: {e}")
        return False


def bluetooth(address):
    """Handles Bluetooth communication by connecting to a BLE device."""
    try:
        print(f"Attempting BLE connection to {address}...")
        peripheralDevice = btle.Peripheral(address)
        services = peripheralDevice.getServices()
        s = peripheralDevice.getServiceByUUID(list(services)[2].uuid)
        c = s.getCharacteristics()[0]
        message = c.read()
        peripheralDevice.disconnect()
        return message.decode("utf-8")
    except Exception as e:
        print(f"Bluetooth communication failed: {e}")
        return None


def log_data(data):
    """Logs data to the specified journal file."""
    if os.path.isfile(PATH) and os.access(PATH, os.R_OK):
        with open(PATH, 'a') as logfile:
            logfile.write(f"{get_time()};{data}\n")
        print(f"Logged data: {data}")
    else:
        print("Log file not accessible. Skipping log.")


def get_time():
    """Returns the current time in a structured string format."""
    now = dt.now()
    return f"{now.year}_{now.month}_{now.day}-{now.hour}_{now.minute}_{now.second}"


async def websocket_server():
    """Handles WebSocket communication when WiFi is available."""
    async def handler(websocket, path):
        print("New WebSocket connection")
        try:
            data = await websocket.recv()
            print(f"Received via WiFi: {data}")
            log_data(data)

            reply = f"The Jonkler received this data: {data}!"
            await websocket.send(reply)
        except Exception as e:
            print(f"Error in WebSocket communication: {e}")

    server = await websockets.serve(handler, "0.0.0.0", 8000)
    print("WebSocket server running on ws://0.0.0.0:8000")
    await server.wait_closed()


async def ble_listener():
    """Handles BLE communication as a fallback."""
    while True:
        print("Checking for BLE communication...")
        message = bluetooth(ADDRESS)
        if message:
            print(f"Received via BLE: {message}")
            log_data(message)
        await asyncio.sleep(10)  # Wait before next BLE poll


async def main():
    """Main loop to monitor WiFi status and start the appropriate communication mode."""

    active_task = None
    using_wifi = None

    while True:
        connected = has_network_connection()

        if connected and using_wifi is not True:
            # WiFi detected and not using WiFi
            print("Switching to WiFi mode...")
            if active_task:
                active_task.cancel()
                await asyncio.sleep(1)
            active_task = asyncio.create_task(websocket_server())
            using_wifi = True

        elif not connected and using_wifi is not False:
            # WiFi lost and switching to BLE
            print("Switching to BLE mode...")
            if active_task:
                active_task.cancel()
                await asyncio.sleep(1)
            active_task = asyncio.create_task(ble_listener())
            using_wifi = False

        await asyncio.sleep(5)

# Start the event loop
asyncio.run(main())
