# Detection Module for S.A.R.V

This module handles real-time body part detection using a camera feed and streams the detection data to a dashboard.

## Prerequisites

- Raspberry Pi with Raspberry Pi OS
- Python 3.7+
- USB webcam or Raspberry Pi camera module
- Internet connection

## Required Dependencies

Install the following dependencies:
```bash
sudo apt-get update
sudo apt-get install -y espeak python3-pip
pip3 install opencv-python mediapipe requests
```

## Configuration

1. Open `detection.py` and update the `SERVER_URL` variable with your render app URL:
```python
SERVER_URL = "https://<your-render-app>.onrender.com/upload"
```

2. Make sure your dashboard application is running and accessible.

## Running the Detection Module

1. Navigate to the detection module directory:
```bash
cd detection_module
```

2. Run the detection script:
```bash
python3 detection.py
```

## Features

- Real-time detection of body parts (hands, legs)
- Visual overlay of detected landmarks
- Audio feedback using eSpeak
- Streams detection data and images to dashboard
- Press 'q' to quit the application

## Troubleshooting

- If camera fails to initialize, check if it's properly connected
- Ensure all dependencies are correctly installed
- Verify network connectivity to the dashboard server
- Check if eSpeak is properly installed for audio feedback

## Notes

- The detection feed is resized to 320x240 for better performance
- The module sends detection data to the dashboard at the same IP address
- Detection includes both pose estimation and hand tracking
- Audio feedback is provided through eSpeak for detected body parts

## Dashboard Integration

The detection module automatically streams data to the dashboard including:
- Timestamp of detections
- Detection logs
- Captured frames (encoded as base64)

Access the dashboard through your web browser using the same server URL to view the detection feed and logs.