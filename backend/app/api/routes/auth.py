import secrets
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password, verify_token
from app.models.news import User
from app.schemas.auth import AuthResponse, GoogleAuthRequest, LoginRequest, RegisterRequest, UserRead

router = APIRouter(prefix="/auth")


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
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
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
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
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
async def google_auth(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
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


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> UserRead:
    """Get current user profile."""
    return UserRead(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        theme=user.theme,
    )



