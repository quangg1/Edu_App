from datetime import datetime
from pydantic import BaseModel, validator
from typing import List, Optional

class RubricLevel(BaseModel):
    label: str
    score_range: str
    description: str

class RubricCriterion(BaseModel):
    name: str
    weight_percent: float
    levels: List[RubricLevel]

class RubricScale(BaseModel):
    type: int 
    max_score: int
    levels: List[str]

# class RubricMetadata(BaseModel):
#     created_at: datetime
#     modified_at: datetime

class RubricSchema(BaseModel):
    rubric_title: str
    subject: str
    grade_level: str
    assessment_type: Optional[str]
    criteria: List[RubricCriterion]
    scale: RubricScale
    # metadata: RubricMetadata
    
    @validator("criteria")
    def _weights_sum_to_100(cls, v: List[RubricCriterion]):
        """Ensure the total weight is exactly 100% (with small tolerance)."""
        s = sum(c.weight_percent for c in v)
        if abs(s - 100.0) > 1e-6:
            raise ValueError(f"Sum of weight_percent must be 100, got {s}")
        return v
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
class RubricResponse(BaseModel):
    rubric: RubricSchema
