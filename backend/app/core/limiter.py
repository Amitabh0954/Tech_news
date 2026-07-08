from slowapi import Limiter
from slowapi.util import get_remote_address

# Single shared limiter instance: imported by app.main to register the middleware
# and exception handler, and by route modules to decorate individual endpoints.
# In-memory storage is fine as long as the backend runs as a single instance (see
# deployment notes) — a multi-instance deployment would need a shared backend
# (e.g. Redis) for the limits to apply across processes.
limiter = Limiter(key_func=get_remote_address)
