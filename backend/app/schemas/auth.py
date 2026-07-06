from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class GoogleAuthRequest(BaseModel):
    # The Google Identity Services button hands back an ID token JWT in a field
    # named "credential" — kept as-is here so the frontend can forward it untouched.
    credential: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class UserRead(BaseModel):
    id: str
    email: EmailStr
    display_name: str
    theme: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
