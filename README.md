TheraTrack

TheraTrack is a full-stack web application designed to support the management and tracking of therapy-related activities and user interactions.
The system consists of a Django-based backend and a React-based frontend.

This document provides step-by-step instructions for setting up and running the project locally.

Project Structure
THERATRACK/
venv/                    # Python virtual environment (outside project root)
theratrack/              # Project root
theratrack-frontend/ # React frontend
manage.py
requirements.txt


System Requirements
Ensure the following software is installed before running the application:
Backend Requirements
Python 3.9 or higher
pip (Python package manager)
Virtual Environment (venv)

Frontend Requirements
Node.js 16 or higher
npm (Node package manager)
General Tools
Git

Modern web browser (Google Chrome, Firefox, or equivalent)

Installation and Setup
1. Clone the Repository
git clone https://github.com/your-username/theratrack.git
cd project-folder

2. Activate Virtual Environment (Before Entering Project Root)
The virtual environment (venv) is located outside the TheraTrack project root and must be activated first.
Windows:
venv\Scripts\activate

macOS/Linux:
source venv/bin/activate

3. Install Backend Dependencies
Navigate to the project root:
cd theratrack

Install Python dependencies:
pip install -r requirements.txt

4. Database Setup
Apply database migrations:
python manage.py migrate

(Optional) Create a superuser for admin access:
python manage.py createsuperuser

Running the Application
Run the Backend Server (Django)

From the project root (theratrack):
python manage.py runserver


The backend server will run at:
http://127.0.0.1:8000/
Keep this terminal session running.

Run the Frontend Server (React)
Open a new terminal window.
Navigate to the frontend directory:
cd theratrack-frontend

Install frontend dependencies (first time only):
npm install

Start the frontend server:
npm start

The frontend application will be available at:
http://localhost:3000/

Configuration
Default database: SQLite3 (included with Django)
No additional database configuration is required for local development
If environment variables are required, create a .env file in the project root and configure accordingly


Usage Notes
The virtual environment must be activated before running the backend server.
Backend and frontend must run simultaneously in separate terminal windows.
Ensure that ports 8000 (backend) and 3000 (frontend) are available.

Troubleshooting
If dependency installation fails, upgrade pip:
python -m pip install --upgrade pip

Ensure Python and Node.js versions meet the minimum requirements.
If npm start fails, delete node_modules and reinstall dependencies:
npm install
