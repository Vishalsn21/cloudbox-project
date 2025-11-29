# ☁️ CloudBox - Premium Cloud Storage SaaS

![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white)

**CloudBox** is a full-stack SaaS (Software as a Service) application offering secure, scalable cloud storage. Designed with a luxury "Earth & Tan" Glassmorphism aesthetic, it provides a premium user experience comparable to Google Drive or Dropbox.

🚀 **[View Live Demo](https://cloudbox-project.vercel.app)**

![CloudBox Dashboard](https://github.com/user-attachments/assets/75c23db5-7823-4bc8-b28e-d267ff265574)

---

## ✨ Key Features

### **🎨 Luxury UI/UX**
* **Earth Tone Theme:** A custom `#D5B893` Tan palette with sophisticated Glassmorphism effects.
* **Responsive Layout:** Fully adaptive design with a mobile-friendly slide-out menu.
* **Smart Interactions:** Smooth animations powered by `Framer Motion`.

### **☁️ Intelligent Storage**
* **AWS S3 Engine:** Enterprise-grade file storage security and reliability.
* **Auto-Categorization:** System automatically detects and sorts files into *Images, Videos, Audio,* and *Documents*.
* **Visual Analytics:** Real-time, color-coded storage bar showing usage per category.

### **💾 Data Persistence**
* **MongoDB Atlas:** Persists user data, favorites, and trash bin status.
* **Soft Delete:** "Trash" system allows file recovery before permanent deletion.
* **User Dashboard:** Sessions are persisted using local storage and database synchronization.

### **💳 Subscription System**
* **Stripe Integration:** Seamless "Pro Plan" upgrade workflow using Stripe Checkout.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose) |
| **Storage** | AWS S3 (Simple Storage Service) |
| **Payments** | Stripe API |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 🏗️ Architecture

```mermaid
graph LR
    User[User] -->|Uploads File| Client[React Frontend]
    Client -->|API Request| Server[Node.js Backend]
    Server -->|Stream File| Bucket[AWS S3]
    Server -->|Save Metadata| DB[(MongoDB)]
    Client -->|Payment| Stripe[Stripe Gateway]
    Bucket -->|File URL| Server
    Server -->|JSON Data| Client
