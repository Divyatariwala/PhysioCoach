# TheraTrack

TheraTrack is a full-stack web application designed to support the management and tracking of therapy-related activities and user interactions.

The system consists of:

* A **Django backend**
* A **React frontend**

This guide provides step-by-step instructions to set up and run the project locally.

---

# Project Structure

```
venv/                         # Virtual environment (outside project root)

THERATRACK/
│
├── theratrack/              # Django backend (project root)
│   ├── manage.py
│   ├── requirements.txt
│
├── theratrack-frontend/     # React frontend
```

---

# System Requirements

## Backend

* Python 3.9 or higher
* pip
* Virtual environment (venv)

## Frontend

* Node.js 16 or higher
* npm

## General

* Git
* Modern web browser (Chrome, Firefox, etc.)

---

# Installation and Setup

## 1. Clone the Repository

```bash
git clone https://github.com/Divyatariwala/TheraTrack.git
cd TheraTrack
```

---

## 2. Create Virtual Environment (OUTSIDE project folder)

Create the virtual environment **outside the `theratrack` folder**:

### Windows:

```bash
python -m venv venv
```

### macOS/Linux:

```bash
python3 -m venv venv
```

---

## 3. Activate Virtual Environment

### Windows:

```bash
venv\Scripts\activate
```

### macOS/Linux:

```bash
source venv/bin/activate
```

### If activation fails 
You may see an error like:

Run the following command:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned

Then try activating again:

venv\Scripts\activate
---

## 4. Install Backend Dependencies

Navigate to backend folder:

```bash
cd theratrack
```

Install required packages:

```bash
pip install -r requirements.txt
```

---

### Environment Variables

Create a `.env` file in the backend root directory (`theratrack/` where manage.py is located):
The required environment variables are provided in a separate file and have been shared via email for security reasons. These credentials should not be hardcoded or committed to version control.

Example .env file:

```
# Backend Configuration
SECRET_KEY=your_django_secret_key

# Email Configuration
EMAIL_HOST_USER=email@gmail.com
EMAIL_HOST_PASSWORD=app_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
```

---

# Database Setup

Apply migrations:

```bash
python manage.py migrate
```

(Optional) Create admin user:

```bash
python manage.py createsuperuser
```

---

# Running the Application

## Start Backend Server

```bash
python manage.py runserver
```

Backend will run at:

```
http://127.0.0.1:8000/
```

---

## Start Frontend Server

Open a **new terminal**:

```bash
cd theratrack-frontend
npm install
npm start
```

Frontend will run at:

```
http://localhost:3000/
```

---

# Configuration

* Default database: **SQLite3**
* No additional setup required for local development

# Usage Notes

* Always activate the virtual environment before running backend
* Run backend and frontend in **separate terminals**
* Ensure ports are available:

  * 8000 → Backend
  * 3000 → Frontend

---

# Troubleshooting

## Upgrade pip

```bash
python -m pip install --upgrade pip
```

## Fix frontend issues

```bash
rm -rf node_modules
npm install
```

## Common Issues

* Backend not starting → Check virtual environment activation
* Email errors → Verify `.env` credentials
* Port conflicts → Change port or stop other services

TheraTrack is now ready to use locally 🚀
