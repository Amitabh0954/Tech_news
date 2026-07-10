import os

# Must happen before any `app.*` import: Settings() reads DATABASE_URL from the
# process environment first and backend/.env second, so setting it here points the
# whole app (and its `settings` singleton) at a throwaway test database instead of
# the real dev one, for every test in this session.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:amit%400954@localhost:5432/tech_news_test",
)

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.limiter import limiter
from app.db.base import Base
from app.db.session import get_db
from app.main import app as fastapi_app

test_engine = create_async_engine(os.environ["DATABASE_URL"], future=True)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _prepare_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await test_engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def _clean_tables():
    """Truncate every table before each test so tests never see another test's rows."""
    async with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())
    limiter.reset()
    yield


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=fastapi_app, client=("127.0.0.1", 123))
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def anyio_backend():
    return "asyncio"
