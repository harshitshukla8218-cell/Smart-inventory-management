from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.SALES
    department_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    department_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}
