---
title: SportsVision AI
emoji: 🏟️
colorFrom: blue
colorTo: indigo
sdk: static
pinned: false
---

<div align="center">

# 🏟️ SportsVision AI

### Multi-Sport Computer Vision & Match Analytics Platform

[![Live App](https://img.shields.io/badge/🚀_Live_App-View_on_HuggingFace-FF9D00?style=for-the-badge&logoColor=white)](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![C++](https://img.shields.io/badge/C++-17-00599C?style=for-the-badge&logo=cplusplus&logoColor=white)](https://isocpp.org)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-FF6D00?style=for-the-badge)](https://ultralytics.com)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.x-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

*Real-time player tracking · possession analysis · kinetic telemetry · heatmap generation*

### 👉 [View Live App →](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision)

</div>

---

## 🖥️ Live Web Dashboard

![SportsVision AI Dashboard](dashboard.png)

> **The interactive web dashboard** — live at **[huggingface.co/spaces/alwaysprince05/sports-analysis-vision](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision)** — shows the full CV pipeline in action with YOLO-style bounding boxes, real-time speed telemetry, tactical court minimap, possession analysis, and a detections console. Switch between **Basketball**, **Hockey**, and **Volleyball** from the sidebar. Drop any `.mp4` file to run the pipeline on your own footage.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Projects](#-projects)
  - [Basketball Match Analytics](#1-basketball-match-analytics)
  - [Hockey Match Analytics](#2-hockey-match-analytics)
  - [Volleyball Rally Analytics](#3-volleyball-rally-analytics)
- [Web Dashboard](#-web-dashboard-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Output Files](#-output-files)
- [Project Structure](#-project-structure)
- [Developer](#-developer--owner)

---

## 🔭 Overview

SportsVision AI is a collection of production-grade computer vision pipelines for real-time sports analytics. Each module processes broadcast-quality video to produce:

- **Player detections** with YOLOv8 bounding boxes
- **Multi-object tracking** across all frames
- **Team classification** by jersey color clustering
- **Ball / puck tracking** with trajectory overlays
- **Possession metrics**, heatmaps, and match dashboards
- **Camera motion compensation** via optical flow

All three pipelines share the same core architecture and ship with an **interactive browser dashboard** that visualises the CV output live.

---

## 🚀 Live Demo

The full dashboard is deployed and accessible directly in your browser — no installation required:

| | |
|---|---|
| 🌐 **Live URL** | **[huggingface.co/spaces/alwaysprince05/sports-analysis-vision](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision)** |
| 🏀 **Sports** | Basketball · Hockey · Volleyball |
| 🎮 **Controls** | Play / Pause / Seek / Sport Switch / CSV Export |
| 📁 **Upload** | Drag & drop your own `.mp4` footage |
| 💻 **Requires** | Just a modern browser — no Python, no GPU |

---

## 📦 Projects

### 1. Basketball Match Analytics

> Track all 10 players, the ball, referee positions, and team possession across an entire match.

**Features:**
| Feature | Details |
|---------|---------|
| 🎯 Player Detection | YOLOv8 bounding boxes at 25+ FPS |
| 🏀 Ball Tracking | Sub-pixel centroid tracking with Kalman filter |
| 👕 Team Classification | K-means jersey color clustering |
| 📊 Possession Meter | Rolling frame-level possession percentage |
| 🌡️ Spatial Heatmap | Per-team court coverage heatmap |
| 📹 Camera Compensation | Optical flow homography correction |
| 📈 Activity Analytics | Per-player speed, acceleration, distance |
| 🗺️ Tactical Minimap | 2D bird's-eye court projection |
| 📄 Match Dashboard | Post-match PNG summary card |

**Run:**
```bash
python basketball_match_analytics/basketball.py --input match.mp4
```

---

### 2. Hockey Match Analytics

> Track skaters and puck at high velocity across ice rink zones with collision event detection.

**Features:**
| Feature | Details |
|---------|---------|
| 🎯 Player + Puck Detection | YOLOv8 model fine-tuned on hockey footage |
| 🏒 Puck Velocity Estimation | Frame-differential speed in km/h |
| ❄️ Zone Occupancy | Offensive / defensive / neutral zone occupancy |
| ⚡ Collision Events | Contact event detection & logging |
| 🌡️ Spatial Heatmap | Per-team ice coverage |
| 🥅 Shot Detection | Goal-crease entry event alerts |
| 📹 Camera Tracking | Broadcast-style panning compensation |
| 📈 Speed Telemetry | Real-time kinetics chart for both teams |

**Run:**
```bash
python hockey_match_analytics/hockey.py --input match.mp4
```

---

### 3. Volleyball Rally Analytics

> Classify serves, sets, spikes, and digs. Track rally length and team rotations.

**Features:**
| Feature | Details |
|---------|---------|
| 🎯 Player Detection | 12-player detection with position zones |
| 🏐 Ball Flight Tracking | Parabolic trajectory modelling |
| 🔥 Spike Detection | High-velocity downward impact classifier |
| 🔄 Rally Classification | Serve / receive / set / attack / block / dig |
| 🌐 Net Touch Alert | Sub-50cm net proximity detection |
| 📊 Rally Statistics | Points per rally, rally duration histogram |
| 🌡️ Player Heatmaps | Zone-based team coverage maps |
| 📈 Match Analytics | Win probability and momentum tracker |

**Run:**
```bash
python volleyball_analytics/volleyball.py --input match.mp4
```

---

## 🌐 Web Dashboard Features

The interactive dashboard — live at **[huggingface.co/spaces/alwaysprince05/sports-analysis-vision](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision)** — provides:

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar                  │  Main Canvas                        │
│  ─ Basketball Analytics   │  • Live court render (16:9)         │
│  ─ Hockey Tracking        │  • YOLO bounding boxes + labels     │
│  ─ Volleyball Rally  Live │  • Ball trail + glow effect         │
│                           │  • Camera drift overlay             │
│  WORKSPACE                ├─────────────────────────────────────│
│  ─ Project Docs           │  FPS | FRAME | DETECTIONS HUD       │
│                           │  Play / Pause / Stop / Scrub        │
├───────────────────────────┴─────────────────────────────────────┤
│  Ball Possession   │  Kinetics Chart     │  Detections Console  │
│  73% Team A        │  Speed over time    │  YOLOv8 event log    │
├────────────────────┴──────────┬──────────┴──────────────────────┤
│  Team Spatial Heatmap         │  Performance Analytics Dashboard │
└───────────────────────────────┴──────────────────────────────────┘
```

**Dashboard Controls:**

| Action | Result |
|--------|--------|
| Sidebar sport click | Switch CV pipeline + court theme |
| Drag & drop `.mp4` | Run pipeline on your footage |
| ▶ / ⏸ Button | Play / pause simulation |
| ⏹ Button | Reset to frame 0 |
| Timeline slider | Seek to any frame |
| Export CSV | Download speed telemetry spreadsheet |
| Download Artifacts | Save heatmap PNG + dashboard card |

**Run locally:**
```bash
git clone https://github.com/alwaysprince05/sports_analysis_vision.git
cd sports_analysis_vision
python3 -m http.server 8000
# open http://localhost:8000
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Object Detection | [YOLOv8](https://ultralytics.com) (Ultralytics) |
| Tracking | ByteTrack / DeepSORT |
| Vision | OpenCV 4.x |
| Deep Learning | PyTorch + TorchVision |
| Numerics | NumPy, SciPy |
| Visualisation | Matplotlib, OpenCV overlays |
| C++ Implementation | OpenCV C++17 (`basketball_match_analytics.cpp`, etc.) |
| Web Dashboard | HTML5 Canvas · Vanilla CSS · Vanilla JS |
| Animation | `requestAnimationFrame` · `ResizeObserver` · View Transitions API |
| Hosting | [Hugging Face Spaces](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision) (Static SDK) |

---

## ⚙️ Installation

**Python dependencies:**
```bash
pip install ultralytics opencv-python torch torchvision numpy matplotlib scipy
```

**C++ build (optional — requires OpenCV 4.x):**
```bash
# Basketball
g++ -std=c++17 basketball_match_analytics/basketball_match_analytics.cpp \
    $(pkg-config --cflags --libs opencv4) -o basketball_analytics

# Hockey
g++ -std=c++17 hockey_match_analytics/hockey_match_analytics.cpp \
    $(pkg-config --cflags --libs opencv4) -o hockey_analytics

# Volleyball
g++ -std=c++17 volleyball_analytics/volleyball_analytics.cpp \
    $(pkg-config --cflags --libs opencv4) -o volleyball_analytics
```

---

## 🚀 Usage

### Web Dashboard (no install — live on Hugging Face)
> 🌐 **[huggingface.co/spaces/alwaysprince05/sports-analysis-vision](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision)**  
> Click "Start Analysis" and switch between sports from the sidebar. No Python or GPU needed.

### Python Pipeline
```bash
# Basketball
python basketball_match_analytics/basketball.py --input your_match.mp4

# Hockey
python hockey_match_analytics/hockey.py --input your_match.mp4

# Volleyball
python volleyball_analytics/volleyball.py --input your_match.mp4
```

### Run Dashboard Locally
```bash
git clone https://github.com/alwaysprince05/sports_analysis_vision.git
cd sports_analysis_vision
python3 -m http.server 8000
# open http://localhost:8000
```

---

## 📂 Output Files

Each pipeline generates three output files in the same directory as the input video:

| File | Description |
|------|-------------|
| `*_output.mp4` | Annotated video with bounding boxes, labels, and overlays |
| `*_heatmap.png` | Team spatial heatmap (court coverage density) |
| `*_dashboard.png` | Post-match analytics summary card |

---

## 📁 Project Structure

```
sports_analysis_vision/
├── dashboard.png                          ← Web dashboard screenshot
├── README.md
├── LICENSE
├── index.html                             ← Web dashboard entry point
├── index.css                              ← Dashboard styles
├── index.js                               ← CV simulation engine
├── README_viewer.html
│
├── basketball_match_analytics/
│   ├── basketball.py                      ← Python pipeline
│   └── basketball_match_analytics.cpp     ← C++ implementation
│
├── hockey_match_analytics/
│   ├── hockey.py
│   └── hockey_match_analytics.cpp
│
└── volleyball_analytics/
    ├── volleyball.py
    └── volleyball_analytics.cpp
```

---

## 👨‍💻 Developer / Owner

<div align="center">

**alwaysprince05**  
Developer · Owner · Computer Vision Engineer

[![GitHub](https://img.shields.io/badge/GitHub-alwaysprince05-181717?style=for-the-badge&logo=github)](https://github.com/alwaysprince05)
[![Live App](https://img.shields.io/badge/🚀_Live_App-HuggingFace_Space-FF9D00?style=for-the-badge)](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision)

</div>

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

*Built with ❤️ for sports analytics and computer vision research.*

**[🚀 View Live App on Hugging Face →](https://huggingface.co/spaces/alwaysprince05/sports-analysis-vision)**

</div>
