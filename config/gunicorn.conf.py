import multiprocessing
import os

# Bind to 0.0.0.0 to allow external access but on a specific port
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# Set number of workers based on CPU cores - using the recommended formula
workers = multiprocessing.cpu_count() * 2 + 1

# Use sync worker class for compatibility with geospatial features
worker_class = 'sync'

# Worker timeout for long-running requests (ML recommendations, etc.)
timeout = 120

# Keep-alive settings
keepalive = 65

# Maximum number of simultaneous clients
worker_connections = 1000

# Maximum number of requests a worker will process before restarting
max_requests = 1000
max_requests_jitter = 50

# Process naming
proc_name = 'community_connect_backend'

# Logging configuration
accesslog = '-'  # Log to stdout
errorlog = '-'   # Log to stderr
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'

# SSL configuration (if not terminated at load balancer)
# keyfile = '/etc/ssl/private/server.key'
# certfile = '/etc/ssl/certs/server.crt'

# Security settings
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

# Graceful timeout
graceful_timeout = 30

# Server mechanics
daemon = False
raw_env = [
    'DJANGO_SETTINGS_MODULE=backend.settings'
]

# When using supervisor, enable this for proper signal handling
forwarded_allow_ips = '*'

def when_ready(server):
    """Run once when server is ready to accept connections"""
    # Could add startup notifications or warm-up tasks here
    pass

def on_exit(server):
    """Run cleanup tasks before server exits"""
    pass