# Mini Project Management System

A multi-tenant web application for managing projects, tasks, and team collaboration built with Django and React.

## Backend Setup

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip or pipenv

### Installation

1. Create and activate virtual environment:
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up PostgreSQL database:
```bash
# Create database
createdb mini_project_management
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser (optional):
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

The GraphQL endpoint will be available at: http://localhost:8000/graphql/

## Project Structure

```
mini_project_management/
├── mini_project_management/    # Main Django project
│   ├── settings.py            # Django settings
│   ├── urls.py               # URL configuration
│   └── schema.py             # GraphQL schema
├── core/                     # Core app (organizations, middleware)
├── projects/                 # Projects app
├── tasks/                    # Tasks app
├── manage.py                 # Django management script
└── requirements.txt          # Python dependencies
```

## Development

- GraphiQL interface: http://localhost:8000/graphql/
- Django admin: http://localhost:8000/admin/