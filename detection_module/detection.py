import cv2
import subprocess
import threading
import mediapipe as mp
import time
import requests
import base64
from datetime import datetime 
SERVER_URL = "https://<your-render-app>.onrender.com/upload"
 
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

last_spoken = ""

def speak_espeak(text):
    global last_spoken
    if text != last_spoken:
        last_spoken = text
        subprocess.run(['espeak', text])


def send_detection(frame, logs):
    # Encode image as JPEG
    success, buffer = cv2.imencode('.jpg', frame)
    if not success:
        return
    jpg_base64 = base64.b64encode(buffer).decode('utf-8')

    payload = {
        'timestamp': datetime.utcnow().isoformat(),
        'logs': logs,
        'image': jpg_base64
    }
    try:
        # send JSON payload
        requests.post(SERVER_URL, json=payload, timeout=5)
    except requests.exceptions.RequestException as e:
        print(f"Failed to send data: {e}")


def process_camera():
    cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
    if not cap.isOpened():
        print("Camera error")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (320, 240))
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        body_parts = []

        # Pose detection
        pose_result = pose.process(rgb)
        if pose_result.pose_landmarks:
            mp_drawing.draw_landmarks(frame, pose_result.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            lm = pose_result.pose_landmarks.landmark

            if lm[mp_pose.PoseLandmark.LEFT_WRIST.value].visibility > 0.6 and \
               lm[mp_pose.PoseLandmark.LEFT_ELBOW.value].visibility > 0.6:
                body_parts.append("left hand")

            if lm[mp_pose.PoseLandmark.RIGHT_WRIST.value].visibility > 0.6 and \
               lm[mp_pose.PoseLandmark.RIGHT_ELBOW.value].visibility > 0.6:
                body_parts.append("right hand")

            if lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].visibility > 0.6 and \
               lm[mp_pose.PoseLandmark.LEFT_KNEE.value].visibility > 0.6:
                body_parts.append("left leg")

            if lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value].visibility > 0.6 and \
               lm[mp_pose.PoseLandmark.RIGHT_KNEE.value].visibility > 0.6:
                body_parts.append("right leg")

        # Hand detection
        hand_result = hands.process(rgb)
        if hand_result.multi_hand_landmarks:
            for i, hand_landmark in enumerate(hand_result.multi_hand_landmarks):
                mp_drawing.draw_landmarks(frame, hand_landmark, mp_hands.HAND_CONNECTIONS)
                if hand_result.multi_handedness:
                    label = hand_result.multi_handedness[i].classification[0].label
                    body_parts.append(f"{label.lower()} hand")

        if body_parts:
            spoken = "Detected: " + ", ".join(set(body_parts))
            print(spoken)
            # speak audio
            threading.Thread(target=speak_espeak, args=(spoken,), daemon=True).start()
  
            send_detection(frame, spoken)

        cv2.imshow("Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        time.sleep(0.05)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    process_camera()
