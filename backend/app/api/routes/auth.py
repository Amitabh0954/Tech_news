import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import create_access_token, get_password_hash, verify_password, verify_token
from app.models.news import PasswordResetToken, User
from app.schemas.auth import (
    AuthResponse,
    GoogleAuthRequest,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RegisterRequest,
    UserRead,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth")

PASSWORD_RESET_TOKEN_TTL = timedelta(hours=1)


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def get_current_user(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    """Get the current authenticated user from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    email = verify_token(token)
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/register", response_model=AuthResponse)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Register a new user."""
    # Check if user already exists
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        id=uuid.uuid4(),
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        display_name=payload.display_name,
        theme="dark"
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = create_access_token(email=new_user.email)
    
    return AuthResponse(
        access_token=access_token,
        user=UserRead(
            id=str(new_user.id),
            email=new_user.email,
            display_name=new_user.display_name,
            theme=new_user.theme,
        ),
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Login user with email and password."""
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(email=user.email)
    
    return AuthResponse(
        access_token=access_token,
        user=UserRead(
            id=str(user.id),
            email=user.email,
            display_name=user.display_name,
            theme=user.theme,
        ),
    )


@router.post("/google", response_model=AuthResponse)
@limiter.limit("10/minute")
async def google_auth(request: Request, payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Exchange a Google Identity Services ID token for our own access token.

    Verification is delegated to Google's tokeninfo endpoint (it checks the JWT
    signature against Google's rotating keys server-side) — we only need to confirm
    the token was actually issued for *this* app and the email is verified.
    """
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo", params={"id_token": payload.credential}
            )
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail="Could not reach Google to verify sign-in")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google sign-in token")

    claims = response.json()
    if claims.get("aud") != settings.google_client_id:
        raise HTTPException(status_code=401, detail="Google token was not issued for this app")
    if claims.get("email_verified") not in ("true", True):
        raise HTTPException(status_code=401, detail="Google account email is not verified")

    email = claims["email"]
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if user is None:
        user = User(
            id=uuid.uuid4(),
            email=email,
            # Google-authenticated accounts have no password of their own; this hash
            # is unguessable so password login for the account stays disabled.
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            display_name=claims.get("name") or email.split("@")[0],
            theme="dark",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(email=user.email)

    return AuthResponse(
        access_token=access_token,
        user=UserRead(
            id=str(user.id),
            email=user.email,
            display_name=user.display_name,
            theme=user.theme,
        ),
    )


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("3/hour")
async def request_password_reset(
    request: Request, payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    """Start a password reset. Always responds the same way regardless of whether the
    email is registered, so this endpoint can't be used to enumerate accounts.
    """
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if user is not None:
        raw_token = secrets.token_urlsafe(32)
        db.add(
            PasswordResetToken(
                id=uuid.uuid4(),
                user_id=user.id,
                token_hash=_hash_reset_token(raw_token),
                expires_at=datetime.now(timezone.utc) + PASSWORD_RESET_TOKEN_TTL,
            )
        )
        await db.commit()

        # No email provider is wired up yet, so the reset link is logged instead of
        # sent — replace with a real transactional email send (SES/Postmark/SendGrid)
        # before relying on this in production.
        reset_link = f"{settings.public_base_url}/reset-password?token={raw_token}"
        logger.info("password reset requested for %s: %s", user.email, reset_link)

    return {"status": "if that email is registered, a reset link has been sent"}


@router.post("/password-reset/confirm")
@limiter.limit("5/hour")
async def confirm_password_reset(
    request: Request, payload: PasswordResetConfirm, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    token_hash = _hash_reset_token(payload.token)
    stmt = select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    result = await db.execute(stmt)
    reset_token = result.scalars().first()

    now = datetime.now(timezone.utc)
    expires_at = reset_token.expires_at if reset_token else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if reset_token is None or reset_token.used_at is not None or expires_at < now:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = await db.get(User, reset_token.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.hashed_password = get_password_hash(payload.new_password)
    reset_token.used_at = now
    await db.commit()

    return {"status": "password updated"}


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> UserRead:
    """Get current user profile."""
    return UserRead(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        theme=user.theme,
    )



