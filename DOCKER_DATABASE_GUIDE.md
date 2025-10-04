# Docker PostgreSQL Setup Guide

## ✅ Database Successfully Started!

Your PostgreSQL database is now running in a Docker container.

## Database Connection Details

- **Host:** localhost (or `db` from within Docker network)
- **Port:** 5432
- **Database:** mydatabase
- **Username:** myuser
- **Password:** mypassword
- **Container Name:** community-connect-db

## Connection String

```
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/mydatabase
```

## Docker Commands

### Start the database

```bash
docker-compose up -d db
```

### Stop the database

```bash
docker-compose stop db
```

### View database logs

```bash
docker-compose logs db
```

### Check database status

```bash
docker-compose ps
```

### Restart the database

```bash
docker-compose restart db
```

### Stop and remove the database (data persists in volume)

```bash
docker-compose down
```

### Stop and remove everything including data

```bash
docker-compose down -v
```

## Connecting to the Database

### Using psql from command line

```bash
docker exec -it community-connect-db psql -U myuser -d mydatabase
```

### Using Django

Update your `.env` file or `settings.py` with:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydatabase',
        'USER': 'myuser',
        'PASSWORD': 'mypassword',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Or use the DATABASE_URL:

```bash
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/mydatabase
```

### Using pgAdmin

The docker-compose.yml also includes pgAdmin for database management:

```bash
docker-compose up -d pgadmin
```

Access pgAdmin at: http://localhost:5050

- Email: admin@example.com
- Password: admin

## Running Django Migrations

Once your database is running, run migrations:

```bash
python manage.py migrate
```

## Creating a Superuser

```bash
python manage.py createsuperuser
```

## Data Persistence

Database data is stored in a Docker volume named `postgres_data`. This means your data persists even if you stop or remove the container.

To view volumes:

```bash
docker volume ls
```

## Troubleshooting

### Port Already in Use

If port 5432 is already in use, you can change it in docker-compose.yml:

```yaml
ports:
  - "5433:5432" # Use port 5433 on host instead
```

### Database Connection Refused

Make sure the container is running and healthy:

```bash
docker-compose ps
docker-compose logs db
```

### Reset Database

To completely reset the database:

```bash
docker-compose down -v  # Remove volumes
docker-compose up -d db  # Start fresh
```

## Security Notes

⚠️ **Important for Production:**

- Change the default credentials in docker-compose.yml
- Use environment variables from .env file
- Never commit .env file to version control
- Use strong passwords
- Restrict database access with firewall rules

## Next Steps

1. ✅ Database is running
2. Update your Django settings to use the new database
3. Run migrations: `python manage.py migrate`
4. Create a superuser: `python manage.py createsuperuser`
5. Start your Django backend: `python manage.py runserver`
6. Start your frontend: `cd frontend && npm start`
