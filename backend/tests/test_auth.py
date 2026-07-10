from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy import select

from app.api.routes import auth as auth_module
from app.models.news import PasswordResetToken


async def _register(client, email="alex@example.com", password="s3cret-pass", display_name="Alex"):
    return await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "display_name": display_name},
    )


class FakeGoogleResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


# --- register -----------------------------------------------------------------


async def test_register_creates_user_and_returns_token(client):
    response = await _register(client)

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == "alex@example.com"
    assert body["user"]["display_name"] == "Alex"


async def test_register_rejects_duplicate_email(client):
    await _register(client)
    response = await _register(client)

    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


# --- login ----------------------------------------------------------------------


async def test_login_succeeds_with_correct_credentials(client):
    await _register(client, email="login@example.com", password="correct-horse")

    response = await client.post(
        "/api/v1/auth/login", json={"email": "login@example.com", "password": "correct-horse"}
    )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == "login@example.com"


async def test_login_rejects_wrong_password(client):
    await _register(client, email="login2@example.com", password="correct-horse")

    response = await client.post(
        "/api/v1/auth/login", json={"email": "login2@example.com", "password": "wrong-password"}
    )

    assert response.status_code == 401


async def test_login_rejects_unknown_email(client):
    response = await client.post(
        "/api/v1/auth/login", json={"email": "nobody@example.com", "password": "whatever"}
    )

    assert response.status_code == 401


async def test_me_requires_bearer_token(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


async def test_me_returns_current_user_for_valid_token(client):
    register_response = await _register(client, email="me@example.com")
    token = register_response.json()["access_token"]

    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


# --- google sign-in ---------------------------------------------------------------


async def test_google_auth_returns_503_when_not_configured(client, monkeypatch):
    monkeypatch.setattr(auth_module.settings, "google_client_id", None)

    response = await client.post("/api/v1/auth/google", json={"credential": "whatever"})

    assert response.status_code == 503


async def test_google_auth_creates_user_from_verified_token(client, monkeypatch):
    monkeypatch.setattr(auth_module.settings, "google_client_id", "test-client-id")

    async def fake_get(self, url, params=None, **kwargs):
        return FakeGoogleResponse(
            200,
            {
                "aud": "test-client-id",
                "email": "googler@example.com",
                "email_verified": "true",
                "name": "Googler",
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    response = await client.post("/api/v1/auth/google", json={"credential": "google-id-token"})

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "googler@example.com"
    assert body["user"]["display_name"] == "Googler"


async def test_google_auth_rejects_token_issued_for_another_app(client, monkeypatch):
    monkeypatch.setattr(auth_module.settings, "google_client_id", "test-client-id")

    async def fake_get(self, url, params=None, **kwargs):
        return FakeGoogleResponse(
            200, {"aud": "someone-elses-client-id", "email": "x@example.com", "email_verified": "true"}
        )

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    response = await client.post("/api/v1/auth/google", json={"credential": "google-id-token"})

    assert response.status_code == 401


async def test_google_auth_rejects_unverified_email(client, monkeypatch):
    monkeypatch.setattr(auth_module.settings, "google_client_id", "test-client-id")

    async def fake_get(self, url, params=None, **kwargs):
        return FakeGoogleResponse(
            200, {"aud": "test-client-id", "email": "x@example.com", "email_verified": "false"}
        )

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    response = await client.post("/api/v1/auth/google", json={"credential": "google-id-token"})

    assert response.status_code == 401


# --- password reset ---------------------------------------------------------------


async def test_password_reset_request_is_silent_for_unknown_email(client):
    response = await client.post("/api/v1/auth/password-reset/request", json={"email": "nobody@example.com"})

    assert response.status_code == 202


async def test_password_reset_request_creates_token_for_known_user(client, db_session):
    await _register(client, email="reset@example.com", password="original-pass")

    response = await client.post("/api/v1/auth/password-reset/request", json={"email": "reset@example.com"})
    assert response.status_code == 202

    tokens = (await db_session.execute(select(PasswordResetToken))).scalars().all()
    assert len(tokens) == 1
    assert tokens[0].used_at is None


async def test_password_reset_confirm_updates_password_and_is_single_use(client, db_session, monkeypatch):
    await _register(client, email="reset2@example.com", password="original-pass")

    captured_token = {}
    original_token_urlsafe = auth_module.secrets.token_urlsafe

    def capturing_token_urlsafe(n):
        raw = original_token_urlsafe(n)
        captured_token["raw"] = raw
        return raw

    monkeypatch.setattr(auth_module.secrets, "token_urlsafe", capturing_token_urlsafe)

    await client.post("/api/v1/auth/password-reset/request", json={"email": "reset2@example.com"})
    raw_token = captured_token["raw"]

    confirm_response = await client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": raw_token, "new_password": "new-pass-123"}
    )
    assert confirm_response.status_code == 200

    # Old password no longer works, new one does.
    old_login = await client.post(
        "/api/v1/auth/login", json={"email": "reset2@example.com", "password": "original-pass"}
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/api/v1/auth/login", json={"email": "reset2@example.com", "password": "new-pass-123"}
    )
    assert new_login.status_code == 200

    # The same token can't be replayed a second time.
    replay_response = await client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": raw_token, "new_password": "another-pass"}
    )
    assert replay_response.status_code == 400


async def test_password_reset_confirm_rejects_expired_token(client, db_session):
    register_response = await _register(client, email="expired@example.com", password="original-pass")
    user_id = register_response.json()["user"]["id"]

    raw_token = "a-raw-token-value"
    db_session.add(
        PasswordResetToken(
            user_id=user_id,
            token_hash=auth_module._hash_reset_token(raw_token),
            expires_at=datetime.now(UTC) - timedelta(minutes=1),
        )
    )
    await db_session.commit()

    response = await client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": raw_token, "new_password": "new-pass"}
    )

    assert response.status_code == 400


async def test_password_reset_confirm_rejects_unknown_token(client):
    response = await client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": "does-not-exist", "new_password": "new-pass"}
    )

    assert response.status_code == 400
