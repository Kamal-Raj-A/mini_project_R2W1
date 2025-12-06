# 🌐 Campus Connect  
A smart and interactive campus navigation and accessibility reporting system built using **React**, **Firebase**, and **Google Maps API**.  
Campus Connect helps students and staff report accessibility issues in real time, navigate the campus efficiently, and assists administrators in improving campus infrastructure.

---

## 🚀 Features

### 🔹 Real-time Issue Reporting
- Report issues like lift outages, blocked ramps, noise disturbances, safety hazards, etc.
- Double-click or long-press the map to select a location.
- Modal-based reporting with issue type & description.

### 🔹 Live Issue Map
- Issues update instantly using **Firestore realtime sync**.
- Emoji-based markers for visual clarity.
- InfoWindow shows issue details, reporter, and timestamp.

### 🔹 Admin Controls
- Admin user can delete reported issues.
- Ensures clean and manageable issue status.

### 🔹 Campus Navigation
- Route guidance between key campus locations.
- Uses Google Directions API for walking paths.
- Map type switching: Roadmap, Satellite, Terrain.

### 🔹 User-Friendly Utilities
- “My Location” button for instant centering.
- Filters for Lift, Ramp, Noise, etc.
- Fully responsive UI with long-press mobile support.

---

## 🛠️ Tech Stack

### Frontend
- React + Vite  
- Tailwind CSS  
- Lucide Icons  

### Backend / Cloud
- Firebase Firestore  
- Firebase Authentication  

### APIs
- Google Maps JavaScript API  
- Google Directions API  

---

## 📁 Folder Structure
```
campusconnect/
│── public/
│── src/
│ ├── components/
│ │ ├── MapContainer.jsx
│ │ ├── Login.jsx
│ │ ├── ReportIssueModal.tsx
│ │ └── ui/ (custom UI components)
│ ├── lib/
│ │ ├── firebase.js
│ │ └── utils.ts
│ ├── assets/
│ ├── App.jsx
│ ├── main.jsx
│── .env
│── package.json
│── vite.config.js

```
---

## ⚙️ Setup & Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/Kamal-Raj-A/mini_project_R2W1.git
cd mini_project_R2W1
```

### 2️⃣ Install dependencies
```
npm install
```


### 3️⃣ Create a .env file

Add the following environment variables:

VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

### 4️⃣ Run the project locally:
```
npm run dev
```

### 5️⃣ Build for production
```
npm run build
```

### 🌍 Deployment

✅ Vercel

Import GitHub repo

Add environment variables

Deploy automatically

✅ Netlify

Build: npm run build
Publish: dist

### 🧪 Test Cases

Issue reporting workflow

Live sync with Firestore

Admin deletion

Navigation routing tests

Map type switching

Long-press detection tests

### 🔮 Future Enhancements

AI-based automatic issue classification

Photo upload with ML-based issue detection

Issue resolution status tracking

Indoor navigation (WiFi/Bluetooth beacons)

Voice-activated reporting for accessibility

Heatmap of frequently reported areas

### 🏆 Conclusion

Campus Connect delivers a scalable, user-friendly, and impactful solution for enhancing campus accessibility and navigation. By integrating real-time reporting, map-based visualization, and smart navigation tools, it improves safety, efficiency, and inclusivity across the campus environment.

### 👨‍💻 Authors

Kamal Raj
Gmail : kamalraj3106@gmail.com
