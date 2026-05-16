from fastapi import APIRouter

from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserRead


router = APIRouter(prefix="/auth")


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest) -> AuthResponse:
    return AuthResponse(
        access_token="demo-token",
        user=UserRead(
            id="00000000-0000-0000-0000-000000000001",
            email=payload.email,
            display_name="Engineering Reader",
            theme="dark",
        ),
    )


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest) -> AuthResponse:
    return AuthResponse(
        access_token="demo-token",
        user=UserRead(
            id="00000000-0000-0000-0000-000000000001",
            email=payload.email,
            display_name=payload.display_name,
            theme="dark",
        ),
    )


@router.get("/me", response_model=UserRead)
async def me() -> UserRead:
    return UserRead(
        id="00000000-0000-0000-0000-000000000001",
        email="reader@example.com",
        display_name="Engineering Reader",
        theme="dark",
    )
