# ScrapperShield (v4.0 Enterprise)

An enterprise-grade, privacy-first web utility engineered to protect digital images and artwork from automated AI web scrapers and crawlers. ScrapperShield modifies image files at a microscopic pixel level to disrupt data gathering while remaining completely invisible to the human eye.

---

## 🔒 Zero-Trust Core Architecture

ScrapperShield is built on a strict **Zero-Server, Zero-Trust Architecture**. 

* **100% Client-Side Processing:** All cryptographic image stripping and pixel modifications occur entirely within the memory bounds allocated to your local browser instance sandbox.
* **0-Byte Network Footprint:** Your raw images are never transmitted over the network, uploaded to a cloud server, or stored in an external database. 
* **Operational Costs:** $0.00 infrastructure overhead, allowing the tool to scale seamlessly to millions of users without hosting resource dependencies.

---

## 🛠️ Key Features

* **Anti-AI Protection Engine:** Modifies the least significant bits (LSB) of image channel arrays using custom mathematical pattern disruption. This confuses AI model feature-detectors and vector scanners if they attempt to ingest the file.
* **Metadata & GPS Eraser:** Automatically wipes hidden EXIF text blocks, destroying embedded tracking data like smartphone models, precise camera capture settings, timestamps, and exact GPS location coordinates.
* **Synchronized 8× Verification Loupe:** An interactive side-by-side zoom layout that maps cursor coordinates simultaneously across both the original and protected image frames, proving zero human visual degradation.
* **Universal Browser Compatibility:** Natively exports processed images to highly optimized modern web formats (such as WebP) directly inside the browser window.

---

## 💻 Tech Stack & Architecture

This software is built entirely with high-performance, modern frontend components to maintain a lightweight bundle size (<100KB):

* **Framework:** React 19 (Initialized via Vite)
* **Styling System:** Tailwind CSS v4 (Utilizing native CSS variables and hardware-accelerated layouts)
* **Icons:** Lucide React
* **Engine Pipeline:** HTML5 Canvas API & Uint8ClampedArray bitstream processing

---

## 🚀 Local Installation & Deployment

To run ScrapperShield locally on your machine or deploy it to a free hosting provider like Vercel, follow these steps:

### Prerequisites
Ensure you have Node.js installed on your computer.

### 1. Clone & Install Dependencies
Navigate into your project workspace directory and run the installation script:
```bash
cd scrapper-shield
npm install
