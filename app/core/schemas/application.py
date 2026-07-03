from enum import Enum
from uuid import UUID, uuid4
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime

class ApplicationStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    done = "done"

class ApplicationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"

class ApplicationCreate(BaseModel):
    title: str = Field(
        min_length = 3,
        max_length = 120
    )
    description: str | None = Field(
        None,
        max_length = 1000
    )
    priority: ApplicationPriority = Field(default=ApplicationPriority.NORMAL)

class ApplicationUpdate(BaseModel):
    status: str = Field()

class ApplicationResponse(BaseModel):
    id: str
    title: str
    description: str | None
    status: ApplicationStatus
    priority: ApplicationPriority

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)