import uuid
from datetime import UTC, datetime

from sqlalchemy import select

from app.models.news import Article, Bookmark, Source


async def _register_and_get_token(client, email="bookmarker@example.com"):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "s3cret-pass", "display_name": "Bookmarker"},
    )
    return response.json()["access_token"]


async def _seed_article(db_session, slug="test-article") -> Article:
    source = Source(
        id=uuid.uuid4(),
        name="Test Source",
        slug=f"test-source-{slug}",
        source_type="rss",
        trust_score=8.0,
    )
    db_session.add(source)
    await db_session.flush()

    article = Article(
        id=uuid.uuid4(),
        source_id=source.id,
        title="A test article",
        slug=slug,
        canonical_url=f"https://example.com/{slug}",
        normalized_url=f"https://example.com/{slug}",
        urgency="medium",
        impact_score=5.0,
        published_at=datetime.now(UTC),
        ingested_at=datetime.now(UTC),
    )
    db_session.add(article)
    await db_session.commit()
    await db_session.refresh(article)
    return article


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_list_bookmarks_requires_auth(client):
    response = await client.get("/api/v1/bookmarks")
    assert response.status_code == 401


async def test_list_bookmarks_is_empty_for_new_user(client):
    token = await _register_and_get_token(client)

    response = await client.get("/api/v1/bookmarks", headers=_auth_headers(token))

    assert response.status_code == 200
    assert response.json() == []


async def test_create_bookmark_then_list_returns_it(client, db_session):
    token = await _register_and_get_token(client)
    article = await _seed_article(db_session)

    create_response = await client.post(
        "/api/v1/bookmarks", json={"article_id": str(article.id)}, headers=_auth_headers(token)
    )
    assert create_response.status_code == 201

    list_response = await client.get("/api/v1/bookmarks", headers=_auth_headers(token))
    assert list_response.status_code == 200
    slugs = [item["slug"] for item in list_response.json()]
    assert slugs == [article.slug]


async def test_create_bookmark_twice_is_idempotent(client, db_session):
    token = await _register_and_get_token(client)
    article = await _seed_article(db_session)

    for _ in range(2):
        response = await client.post(
            "/api/v1/bookmarks", json={"article_id": str(article.id)}, headers=_auth_headers(token)
        )
        assert response.status_code == 201

    rows = (await db_session.execute(select(Bookmark))).scalars().all()
    assert len(rows) == 1


async def test_delete_bookmark_removes_it(client, db_session):
    token = await _register_and_get_token(client)
    article = await _seed_article(db_session)

    await client.post("/api/v1/bookmarks", json={"article_id": str(article.id)}, headers=_auth_headers(token))

    delete_response = await client.delete(f"/api/v1/bookmarks/{article.id}", headers=_auth_headers(token))
    assert delete_response.status_code == 204

    list_response = await client.get("/api/v1/bookmarks", headers=_auth_headers(token))
    assert list_response.json() == []


async def test_bookmarks_are_scoped_per_user(client, db_session):
    token_a = await _register_and_get_token(client, email="user-a@example.com")
    token_b = await _register_and_get_token(client, email="user-b@example.com")
    article = await _seed_article(db_session)

    await client.post("/api/v1/bookmarks", json={"article_id": str(article.id)}, headers=_auth_headers(token_a))

    a_bookmarks = await client.get("/api/v1/bookmarks", headers=_auth_headers(token_a))
    b_bookmarks = await client.get("/api/v1/bookmarks", headers=_auth_headers(token_b))

    assert len(a_bookmarks.json()) == 1
    assert len(b_bookmarks.json()) == 0
