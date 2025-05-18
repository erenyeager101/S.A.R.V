SARV stands for search and recognition vehicle for NDRF teams. 
# SARV - Semi-Autonomous Rover Vehicle for NDRF Teams

**SARV** is a semi-autonomous robotic system designed to assist NDRF teams in search and rescue operations. It combines real-time video surveillance, thermal sensing, GPS tracking, and obstacle avoidance in a single integrated platform.

## Project Overview

SARV provides:
- Manual and automatic rover control via Blynk IoT.
- Real-time human detection using Raspberry Pi camera with OpenCV.
- Temperature measurement using MLX90614 to verify human presence.
- GPS tracking using NEO-6M for locating detected humans.
- Obstacle avoidance using ultrasonic sensors.
- A live dashboard to monitor video feed, GPS coordinates, and sensor data.
- MongoDB for storing temperature and location data for trend analysis.

---

## Features

- **Live Stream & Detection**: Stream video feed from the rover and detect humans using Python and OpenCV.
- **Sensor Integration**: Collect data from MLX90614, ultrasonic sensor, and GPS.
- **Smart Control**: Blynk-based manual controls + semi-autonomous navigation.
- **Dashboard Interface**: Web dashboard for NDRF teams to monitor feed and real-time data.
- **Data Logging**: All readings (location + temperature) are logged for analytics.

---

## Repository Structure

```bash
SARV/
â”œâ”€â”€ detection_module/         # Raspberry Pi camera + human detection (OpenCV)
â”œâ”€â”€ maneuvering_module/       # NodeMCU-based motor control & obstacle avoidance
â”œâ”€â”€ sensor_module/            # Thermal sensor (MLX90614), GPS (NEO6M), Ultrasonic
â”œâ”€â”€ software_dashboard/       # Frontend dashboard with live video + sensor data
â”œâ”€â”€ database/                 # MongoDB integration for data logging
â”œâ”€â”€ utils/                    # Common scripts, configurations, hardware diagrams
â”œâ”€â”€ README.md                 # Root README file
```

---

## Getting Started

### 1. Prerequisites

- Raspberry Pi 4 (with Raspbian OS)
- NodeMCU (ESP8266)
- MLX90614 temperature sensor
- NEO-6M GPS Module
- Ultrasonic Sensor (HC-SR04)
- Motor Driver (L298N)
- MongoDB (Cloud/local)
- Blynk IoT App (configured)

### 2. Clone the Repository

```bash
git clone https://github.com/erenyeager101/S. A.R.V.git
cd S.A.R.V
```

### 3. Install Dependencies

Install required Python packages:

```bash
pip install -r requirements.txt
```

Set up NodeMCU using Arduino IDE with relevant libraries.

---

## How to Run

1. **Start Raspberry Pi Stream + Detection**  
   Go to `detection_module/` and run:
   ```bash
   python3 detect_stream.py
   ```

2. **Sensor Reading Scripts**  
   - GPS and Temperature data collection scripts in `sensor_module/`.
   - Sends data to MongoDB and dashboard.

3. **Control Bot**  
   Use the Blynk IoT app for manual control. Auto mode uses ultrasonic for navigation.

4. **Dashboard**  
   Open `software_dashboard/index.html` to view the live stream and data.

---

## Contribution Guide

We welcome contributions! Follow these steps:

1. Fork the repo and clone your fork.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes.
4. Commit and push:
   ```bash
   git commit -m "Added new feature"
   git push origin feature/your-feature-name
   ```
5. Create a Pull Request.

---


---

## Acknowledgements

- Blynk IoT Platform
- Raspberry Pi Foundation
- OpenCV
- NDRF use-case reference