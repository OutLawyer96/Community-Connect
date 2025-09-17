# Community Connect

A modern, full-stack web application for connecting communities with trusted local service providers.

## Features

- **User Authentication**: Secure registration and login with role-based access (Customer/Provider)
- **Interactive Search**: Find service providers by category, location, and rating
- **Review System**: Community-driven reviews and ratings
- **Provider Profiles**: Comprehensive business profiles with contact information
- **Responsive Design**: Beautiful, professional UI that works on all devices
- **Real-time Updates**: Dynamic content updates and search functionality

## Tech Stack

### Backend
- **Django 5.2**: Web framework
- **Django REST Framework**: API development
- **PostgreSQL/SQLite**: Database
- **Token Authentication**: Secure user sessions

### Frontend
- **React 18**: Modern UI library
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons
- **Axios**: HTTP client for API calls
- **React Router**: Navigation

## Color Scheme

The application uses a professional and modern color palette:

- **Primary**: Blue gradient (#0ea5e9 to #0284c7)
- **Secondary**: Purple gradient (#d946ef to #c026d3)
- **Success**: Green (#22c55e)
- **Warning**: Yellow/Orange (#f59e0b)
- **Danger**: Red (#ef4444)
- **Gray Scale**: Modern gray palette for UI elements

## Getting Started

### Backend Setup

1. Navigate to the project directory:
   ```bash
   cd c:/python/Community_connect
   ```

2. Activate the virtual environment:
   ```bash
   venv/Scripts/activate
   ```

3. Install dependencies (already done):
   ```bash
   pip install django djangorestframework django-cors-headers psycopg2-binary
   ```

4. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at:
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/dashboard/` - User dashboard data

### Providers
- `GET /api/providers/` - List all providers (with search/filter)
- `GET /api/providers/{id}/` - Get provider details
- `POST /api/providers/create/` - Create provider profile
- `PUT /api/providers/{id}/update/` - Update provider profile

### Categories
- `GET /api/categories/` - List all categories

### Reviews
- `GET /api/providers/{id}/reviews/` - Get provider reviews
- `POST /api/providers/{id}/reviews/create/` - Create review

### Search
- `GET /api/search/` - Advanced search with filters

## Project Structure

```
Community_connect/
├── backend/                 # Django project settings
├── api/                     # Main API app
│   ├── models.py           # Database models
│   ├── serializers.py      # API serializers
│   ├── views.py            # API views
│   └── urls.py             # API URLs
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── App.js          # Main app component
│   └── public/             # Static files
└── README.md
```

## Features Implemented

✅ **Backend Complete**
- User authentication with roles
- Provider management
- Review and rating system
- Search and filtering
- Recommendation engine
- RESTful API endpoints

✅ **Frontend Complete**
- Beautiful, professional design
- Responsive layout
- User authentication
- Provider search and filtering
- Interactive components
- Modern color scheme

## Next Steps

1. Run database migrations
2. Start both backend and frontend servers
3. Test the application
4. Add sample data
5. Deploy to production

The application is ready for development and testing!# Community-Connect
