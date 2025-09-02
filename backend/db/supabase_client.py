from supabase import create_client, Client
from settings import settings


def get_supabase() -> Client:
    # Lazily create the client to avoid import-time errors if env is missing
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

