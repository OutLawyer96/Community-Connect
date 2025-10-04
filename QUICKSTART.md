# 🚀 Quick Start Guide - Community Connect with Docker PostgreSQL

## ✅ What's Been Set Up

1. **Docker Compose Configuration** - Updated with PostgreSQL 15 Alpine
2. **Database Credentials** - Configured in `.env` file
3. **PostgreSQL Container** - Running and healthy
4. **Data Persistence** - Using `postgres_data` volume

## 📋 Current Status

```bash
✅ PostgreSQL 15.14 running on port 5432
✅ Container: community-connect-db
✅ Database: mydatabase
✅ User: myuser
✅ Password: mypassword
```

## 🎯 Quick Commands

### Start Database Only

```bash
docker-compose up -d db
```

### Start All Services

```bash
docker-compose up -d
```

### Stop All Services

```bash
docker-compose down
```

### View Database Logs

```bash
docker-compose logs -f db
```

### Connect to Database

```bash
docker exec -it community-connect-db psql -U myuser -d mydatabase
```

## 🔧 Next Steps to Run Your Application

### 1. Install PostgreSQL Python Driver

```bash
pip install psycopg2-binary
```

### 2. Run Django Migrations

```bash
python manage.py migrate
```

### 3. Create Superuser

```bash
python manage.py createsuperuser
```

### 4. Start Django Backend

```bash
python manage.py runserver
```

### 5. Start React Frontend (in another terminal)

```bash
cd frontend
npm start
```

## 🔌 Connection Details

### From Django/Python (localhost)

```
HOST: localhost
PORT: 5432
DATABASE: mydatabase
USER: myuser
PASSWORD: mypassword
```

### From Docker containers

```
HOST: db
PORT: 5432
DATABASE: mydatabase
USER: myuser
PASSWORD: mypassword
```

### Connection URL

```
postgres://myuser:mypassword@localhost:5432/mydatabase
```

## 📁 File Changes Made

1. ✅ `docker-compose.yml` - Updated database service with your configuration
2. ✅ `.env` - Updated to use PostgreSQL instead of SQLite
3. ✅ `DOCKER_DATABASE_GUIDE.md` - Complete setup documentation
4. ✅ Database container is running and tested

## 🐛 Troubleshooting

### If Django can't connect to database:

```bash
# Check if container is running
docker-compose ps

# Check database logs
docker-compose logs db

# Verify .env file has correct credentials
cat .env | grep DATABASE
```

### If port 5432 is busy:

**Option A: Simple Port Remapping (Recommended)**

1. Edit `docker-compose.yml` and change the `db` service ports to:

```yaml
ports:
  - "5433:5432" # Use different host port (5433), container still uses 5432
```

2. **Important:** When connecting from your **local machine** (outside Docker), use port `5433`:

   - Django `settings.py` or `.env` should use `localhost:5433`
   - Any local database tools should connect to `localhost:5433`

3. **Note:** The `DATABASE_URL` in `docker-compose.yml` stays the same (`@db:5432`) because containers communicate internally using the container port (5432).

**Option B: Using Environment Variable for Host Port**

1. Add to `.env`:

```properties
POSTGRES_HOST_PORT=5433
```

2. Edit `docker-compose.yml` `db` service ports:

```yaml
ports:
  - "${POSTGRES_HOST_PORT:-5432}:5432"
```

3. When connecting from local machine, use `localhost:5433` (or whatever `POSTGRES_HOST_PORT` is set to).

## 📚 Documentation Files

- `DOCKER_DATABASE_GUIDE.md` - Comprehensive database setup guide
- `.env` - Environment configuration (never commit to git!)
- `docker-compose.yml` - Docker services configuration

## 🔒 Security Reminder

⚠️ For production:

- Change default passwords
- Use environment-specific .env files
- Never commit .env to version control
- Add `.env` to `.gitignore`

## ✨ You're All Set!

Your PostgreSQL database is ready. Follow the "Next Steps" above to complete your application setup.
