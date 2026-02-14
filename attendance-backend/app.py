import os
import base64
import cv2
import numpy as np
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION & FOLDERS ---
PROFILES_DIR = "photos/profiles"
LOGS_DIR = "attendance_logs"
os.makedirs(PROFILES_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# Cooldown dictionary to prevent duplicate logs (5 minutes)
last_recorded = {}

# --- GOOGLE SHEETS SETUP ---
# Ensure 'credentials.json' is in this folder.
# Share your Google Sheet with the email inside your credentials.json.
try:
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
    client = gspread.authorize(creds)
    # Replace with your exact Google Sheet name
    sheet = client.open("Sankalp_Attendance").sheet1
    print("✅ Google Sheets Connection: ACTIVE")
except Exception as e:
    print(f"⚠️ Google Sheets Connection: FAILED ({e})")
    sheet = None

# --- FACE COMPARISON LOGIC ---
def compare_faces(captured_img_base64, stored_img_path):
    try:
        encoded_data = captured_img_base64.split(',')[-1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img_captured = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        img_captured = cv2.GaussianBlur(img_captured, (5, 5), 0)
        img_captured = cv2.resize(img_captured, (200, 200))

        img_stored = cv2.imread(stored_img_path, cv2.IMREAD_GRAYSCALE)
        if img_stored is None: return False
        img_stored = cv2.GaussianBlur(img_stored, (5, 5), 0)
        img_stored = cv2.resize(img_stored, (200, 200))

        result = cv2.matchTemplate(img_captured, img_stored, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(result)
        return max_val > 0.72  # Threshold
    except Exception as e:
        return False

# --- ROUTES ---

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "online", "profiles": len(os.listdir(PROFILES_DIR))}), 200

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    photo_base64 = data.get("photo")
    
    if not name or not photo_base64:
        return jsonify({"success": False, "message": "Missing Name/Photo"}), 400

    try:
        filename = f"{name.replace(' ', '_')}.jpg"
        filepath = os.path.join(PROFILES_DIR, filename)
        
        img_data = base64.b64decode(photo_base64.split(',')[-1])
        with open(filepath, "wb") as f:
            f.write(img_data)
            
        print(f"👤 NEW REGISTRATION: {name}")
        return jsonify({"success": True, "message": f"{name} added to database."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/recognize", methods=["POST"])
def recognize():
    data = request.get_json()
    photo_base64 = data.get("photo")

    for filename in os.listdir(PROFILES_DIR):
        if filename.lower().endswith((".jpg", ".png", ".jpeg")):
            path = os.path.join(PROFILES_DIR, filename)
            if compare_faces(photo_base64, path):
                name = os.path.splitext(filename)[0].replace('_', ' ')
                
                # Cooldown Check
                now = datetime.now()
                if name in last_recorded and (now - last_recorded[name]).total_seconds() < 300:
                    return jsonify({"success": False, "message": "Already logged"}), 429
                
                return jsonify({"success": True, "name": name})

    return jsonify({"success": False, "message": "Unknown"}), 404

@app.route("/attendance", methods=["POST"])
def attendance():
    data = request.get_json()
    name = data.get("name")
    mode = data.get("type")
    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
    date_str = now.strftime("%Y-%m-%d")

    last_recorded[name] = now

    # 1. Local CSV Log
    log_file = os.path.join(LOGS_DIR, f"logs_{date_str}.csv")
    df = pd.DataFrame([[name, mode, timestamp]], columns=["Name", "Status", "Time"])
    df.to_csv(log_file, mode='a', header=not os.path.exists(log_file), index=False)

    # 2. Google Sheets Log
    if sheet:
        try:
            sheet.append_row([name, mode, timestamp])
        except Exception as e:
            print(f"⚠️ Sheets Sync Error: {e}")

    print(f"✅ RECORDED: {name} | {mode} at {timestamp}")
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)