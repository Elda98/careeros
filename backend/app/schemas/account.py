from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.db.models import AccountType


class AccountTypeRead(BaseModel):
    account_type: AccountType | None


class AccountTypeUpdate(BaseModel):
    account_type: AccountType


class LocaleRead(BaseModel):
    locale: Literal["en", "ar"]


class LocaleUpdate(BaseModel):
    locale: Literal["en", "ar"]


class CompanyProfileUpdate(BaseModel):
    company_name: str | None = None
    industry: str | None = None
    description: str | None = None
    website: str | None = None


class CompanyProfileRead(BaseModel):
    id: UUID
    company_name: str
    industry: str
    description: str
    website: str

    model_config = {"from_attributes": True}


class ServiceProviderProfileUpdate(BaseModel):
    professional_title: str | None = None
    expertise: list[str] | None = None
    description: str | None = None
    contact_info: str | None = None


class ServiceProviderProfileRead(BaseModel):
    id: UUID
    professional_title: str
    expertise: list[str]
    description: str
    contact_info: str

    model_config = {"from_attributes": True}
