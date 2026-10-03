"""Request and response schemas for the optimizer API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .config import (
    MAX_BUDGET,
    MAX_BUDGETS_PER_CURVE,
    MAX_BUDGETS_PER_REQUEST,
    MAX_PRODUCTS,
)


class Product(BaseModel):
    """A catalogue entry and the two numbers the optimiser cares about."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=200)
    price: float = Field(ge=0, le=MAX_BUDGET, description="Cost of one unit.")
    utility: float = Field(
        ge=0, le=1_000_000, description="Value gained by taking this product."
    )
    emoji: str | None = Field(default=None, max_length=16)
    image: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=64)

    @field_validator("id", "name")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be blank")
        return stripped


class Scenario(BaseModel):
    """A saved budget to evaluate against a catalogue."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    budget: float = Field(gt=0, le=MAX_BUDGET)


class SolveRequest(BaseModel):
    """Solve one catalogue against one budget."""

    model_config = ConfigDict(extra="forbid")

    products: list[Product] = Field(min_length=1, max_length=MAX_PRODUCTS)
    budget: float = Field(gt=0, le=MAX_BUDGET)
    currency: str = Field(default="INR", max_length=8)

    @model_validator(mode="after")
    def _unique_ids(self) -> "SolveRequest":
        ids = [product.id for product in self.products]
        duplicates = sorted({pid for pid in ids if ids.count(pid) > 1})
        if duplicates:
            raise ValueError(f"duplicate product ids: {', '.join(duplicates)}")
        return self

    @property
    def total_price(self) -> float:
        return round(sum(product.price for product in self.products), 2)


class ScenarioRequest(BaseModel):
    """Solve one catalogue against several budgets."""

    model_config = ConfigDict(extra="forbid")

    products: list[Product] = Field(min_length=1, max_length=MAX_PRODUCTS)
    scenarios: list[Scenario] = Field(min_length=1, max_length=MAX_BUDGETS_PER_REQUEST)
    currency: str = Field(default="INR", max_length=8)

    @model_validator(mode="after")
    def _unique_names(self) -> "ScenarioRequest":
        names = [scenario.name for scenario in self.scenarios]
        duplicates = sorted({name for name in names if names.count(name) > 1})
        if duplicates:
            raise ValueError(f"duplicate scenario names: {', '.join(duplicates)}")
        return self

    @property
    def total_price(self) -> float:
        return round(sum(product.price for product in self.products), 2)


class PathRequest(BaseModel):
    """Explain the optimal subset for one catalogue and budget."""

    model_config = ConfigDict(extra="forbid")

    products: list[Product] = Field(min_length=1, max_length=MAX_PRODUCTS)
    budget: float = Field(gt=0, le=MAX_BUDGET)

    @model_validator(mode="after")
    def _unique_ids(self) -> "PathRequest":
        ids = [product.id for product in self.products]
        if len(set(ids)) != len(ids):
            raise ValueError("product ids must be unique")
        return self


class BudgetCurveRequest(BaseModel):
    """Sweep a range of budgets to show how utility grows with money."""

    model_config = ConfigDict(extra="forbid")

    products: list[Product] = Field(min_length=1, max_length=MAX_PRODUCTS)
    budgets: list[float] = Field(min_length=1, max_length=MAX_BUDGETS_PER_CURVE)
    currency: str = Field(default="INR", max_length=8)

    @model_validator(mode="after")
    def _valid_budgets(self) -> "BudgetCurveRequest":
        if any(budget <= 0 for budget in self.budgets):
            raise ValueError("every budget must be greater than zero")
        return self

    @property
    def total_price(self) -> float:
        return round(sum(product.price for product in self.products), 2)


class SelectedItem(BaseModel):
    """A product the optimiser chose, with its contribution to the totals."""

    product: Product
    line_total: float


class AlgorithmInfo(BaseModel):
    """How the answer was produced, for transparency and benchmarking."""

    name: str
    exact: bool
    complexity: str
    items_considered: int
    reduced_capacity: int
    capacity_scale: int
    dp_cells: int
    solve_time_ms: float


class SolveResponse(BaseModel):
    """The chosen subset plus the totals that justify it."""

    selected: list[SelectedItem]
    selected_ids: list[str]
    total_cost: float
    total_utility: float
    remaining_budget: float
    budget_used_pct: float
    catalogue_total: float
    currency: str
    algorithm: AlgorithmInfo


class StrategyResult(BaseModel):
    """One strategy's answer, with its shortfall against the exact optimum."""

    strategy: str
    exact: bool
    selected_ids: list[str]
    total_cost: float
    total_utility: float
    gap_vs_optimum_pct: float | None
    solve_time_ms: float


class CompareResponse(BaseModel):
    """Exact DP against the heuristics, so the gap is visible."""

    strategies: list[StrategyResult]
    optimal_utility: float
    fractional_upper_bound: float
    currency: str


class ScenarioResult(BaseModel):
    """One budget's outcome within a multi-scenario run."""

    name: str
    budget: float
    selected_ids: list[str]
    total_cost: float
    total_utility: float
    remaining_budget: float
    budget_used_pct: float
    items_selected: int


class ScenarioResponse(BaseModel):
    """A catalogue solved across several budgets."""

    scenarios: list[ScenarioResult]
    currency: str


class PathStepModel(BaseModel):
    """One product's role in the reconstruction."""

    index: int
    product_id: str
    product_name: str
    price: float
    utility: float
    decision: Literal["include", "exclude", "skip"]
    budget_remaining_before: float
    running_cost: float
    running_utility: float
    explanation: str


class PathResponse(BaseModel):
    """A narrated walk through the optimal subset."""

    selected_ids: list[str]
    total_cost: float
    total_utility: float
    steps: list[PathStepModel]


class GridStepModel(BaseModel):
    """One filled DP cell."""

    item_index: int
    product_id: str | None
    capacity: float
    include: float | None
    exclude: float
    decision: Literal["include", "exclude", "skip"]
    best: float
    explanation: str


class TraceResponse(BaseModel):
    """The full DP table, cell by cell, for a step-through visualiser."""

    budget: float
    steps: list[GridStepModel]
    truncated: bool
    cells: int


class BudgetPoint(BaseModel):
    """Utility achievable at one budget on the sweep."""

    budget: float
    total_utility: float
    total_cost: float
    items_selected: int
    remaining_budget: float


class BudgetCurveResponse(BaseModel):
    """Utility as a function of budget, one point per requested budget."""

    points: list[BudgetPoint]
    catalogue_total: float
    currency: str


class HealthResponse(BaseModel):
    """Liveness probe payload, also reports what the instance is allowed to do."""

    status: Literal["ok"]
    version: str
    products_max: int
    budget_max: float
    capacity_max: int
    cells_max: int


class ServiceInfo(BaseModel):
    """Static description of the API, served from the root path."""

    name: str
    version: str
    problem: str
    endpoints: list[str]