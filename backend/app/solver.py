"""Solvers for the 0/1 knapsack budget-allocation problem.

The problem, in the terms this codebase already uses: given a catalogue of
products, each with a ``price`` and a ``utility``, pick the subset that
maximises total utility while total price stays within ``budget``. Every product
may be taken at most once, which makes it 0/1 knapsack (not unbounded).

Design notes
------------
*Money is integer.* Prices are converted to minor units (paise) before any
comparison, so ``0.1 + 0.2`` style drift can never make a subset look cheaper or
dearer than it is.

*Capacity is gcd-reduced.* If every price is a multiple of 100 paise the DP
width shrinks by that factor. A 1000-rupee budget against 300/400-rupee items
becomes a 10-wide table instead of a 100000-wide one, which is the difference
between instant and hopeless.

*Reconstruction is cheap.* Only the 1-D rolling value row is kept in memory;
the include/exclude choice for every (item, capacity) pair is packed into a
``bytearray``. That is one byte per cell rather than a float per cell.
"""

from __future__ import annotations

import math
from array import array
from dataclasses import dataclass
from math import gcd
from typing import Iterable, Sequence

from .config import (
    MAX_CAPACITY,
    MAX_CELLS,
    MAX_GRID_CELLS,
    MINOR_UNITS_PER_MAJOR,
)


class ProblemTooLarge(ValueError):
    """Raised when a request would need more DP work than the limits allow."""


def to_minor(amount: float) -> int:
    """Convert a major-unit amount to integer minor units."""
    return int(round(amount * MINOR_UNITS_PER_MAJOR))


def from_minor(units: int) -> float:
    """Convert integer minor units back to a rounded major-unit amount."""
    return round(units / MINOR_UNITS_PER_MAJOR, 2)


@dataclass(frozen=True, slots=True)
class Item:
    """The solver's view of a product — identity and the two DP inputs."""

    id: str
    name: str
    price: float
    utility: float


@dataclass(frozen=True, slots=True)
class Problem:
    """A knapsack instance with integer weights and a gcd-reduced capacity.

    ``weights`` are in reduced minor units. ``scale`` is the gcd that was
    divided out, so ``original_weights[i] == weights[i] * scale``.
    """

    items: tuple[Item, ...]
    weights: tuple[int, ...]
    values: tuple[float, ...]
    original_weights: tuple[int, ...]
    capacity: int
    scale: int

    @property
    def count(self) -> int:
        return len(self.items)

    @property
    def stride(self) -> int:
        return self.capacity + 1

    @property
    def cells(self) -> int:
        return self.count * self.stride


def prepare(items: Sequence[Item], budget: float) -> Problem:
    """Convert prices to integer minor units and gcd-reduce the capacity."""
    original_weights = tuple(to_minor(item.price) for item in items)
    capacity_minor = to_minor(budget)

    scale = 0
    for weight in original_weights:
        if weight > 0:
            scale = gcd(scale, weight)
    # Every item is free (or the catalogue is empty): gcd is 0, so there is
    # nothing to divide out.
    if scale <= 0:
        scale = 1

    weights = tuple(weight // scale for weight in original_weights)
    capacity = capacity_minor // scale

    if capacity > MAX_CAPACITY:
        raise ProblemTooLarge(
            f"Reduced budget of {capacity} exceeds the solver capacity limit of "
            f"{MAX_CAPACITY}. Reduce the budget or use prices with a larger "
            f"common factor."
        )
    if len(weights) * (capacity + 1) > MAX_CELLS:
        raise ProblemTooLarge(
            f"Problem needs {len(weights) * (capacity + 1)} DP cells, above the "
            f"limit of {MAX_CELLS}. Reduce the number of products or the budget."
        )

    return Problem(
        items=tuple(items),
        weights=weights,
        values=tuple(item.utility for item in items),
        original_weights=original_weights,
        capacity=capacity,
        scale=scale,
    )


@dataclass(frozen=True, slots=True)
class Outcome:
    """Result of a solve: which items were picked and what they are worth."""

    chosen: tuple[int, ...]
    utility: float
    cost_minor: int

    @property
    def exact(self) -> bool:
        return True


def _alloc_row() -> array:
    return array("d")


def solve_exact(problem: Problem) -> Outcome:
    """Solve 0/1 knapsack exactly in O(n * capacity).

    Ties resolve to *exclude*, both when filling the table and when walking it
    back, so the reported cost can never exceed the capacity.
    """
    count = problem.count
    capacity = problem.capacity
    stride = problem.stride
    weights = problem.weights
    values = problem.values

    previous = _alloc_row()
    decisions = bytearray(count * stride)

    for index in range(count):
        weight = weights[index]
        value = values[index]
        base = index * stride

        if weight == 0:
            # A free item: take it whenever it adds utility, at any capacity.
            current = array("d", previous)
            for cell in range(stride):
                excluded = previous[cell]
                included = value + excluded
                if included > excluded:
                    decisions[base + cell] = 1
                    current[cell] = included
        elif weight > capacity:
            # Too heavy to ever fit, so the row is a straight copy.
            current = array("d", previous)
        else:
            # Cells below the weight cannot include this item, so they carry
            # over unchanged and the inner loop starts at the weight.
            current = array("d", previous[:weight])
            for cell in range(weight, stride):
                excluded = previous[cell]
                included = value + previous[cell - weight]
                if included > excluded:
                    decisions[base + cell] = 1
                    current[cell] = included
                else:
                    current[cell] = excluded

        previous = current

    chosen: list[int] = []
    cell = capacity
    for index in range(count - 1, -1, -1):
        if decisions[index * stride + cell]:
            chosen.append(index)
            cell -= weights[index]
    chosen.reverse()

    cost_minor = sum(problem.original_weights[index] for index in chosen)
    return Outcome(chosen=tuple(chosen), utility=previous[capacity], cost_minor=cost_minor)


def _density(weight: int, value: float) -> float:
    """Utility per unit of weight; free items are infinitely dense."""
    if weight == 0:
        return math.inf if value > 0 else 0.0
    return value / weight


def _density_order(problem: Problem) -> list[int]:
    return sorted(
        range(problem.count),
        key=lambda index: (-_density(problem.weights[index], problem.values[index]), index),
    )


def greedy_density(problem: Problem) -> Outcome:
    """Classic ratio heuristic — cheap, but not guaranteed optimal.

    Included as a baseline so callers can see how much the exact DP actually
    buys them on their data.
    """
    capacity = problem.capacity
    spent = 0
    utility = 0.0
    chosen: list[int] = []

    for index in _density_order(problem):
        weight = problem.weights[index]
        if spent + weight <= capacity:
            chosen.append(index)
            spent += weight
            utility += problem.values[index]

    chosen.sort()
    return Outcome(
        chosen=tuple(chosen),
        utility=utility,
        cost_minor=sum(problem.original_weights[index] for index in chosen),
    )


def fractional_upper_bound(problem: Problem) -> float:
    """LP relaxation of the knapsack: a valid upper bound on the optimum.

    Filling greedily by density but allowing the last item to be taken
    fractionally can only beat the integral optimum, so the gap between this
    and the exact answer measures how hard the instance is.
    """
    capacity = problem.capacity
    remaining = capacity
    total = 0.0

    for index in _density_order(problem):
        weight = problem.weights[index]
        value = problem.values[index]
        if weight == 0:
            total += value
        elif weight <= remaining:
            total += value
            remaining -= weight
        else:
            total += value * (remaining / weight)
            break

    return total


def optimality_gap(utility: float, bound: float) -> float | None:
    """Percent by which ``utility`` falls short of ``bound``."""
    if bound <= 0:
        return 0.0 if utility <= 0 else None
    return round(max(0.0, (bound - utility) / bound) * 100, 4)


def solve_multiple_budgets(
    items: Sequence[Item], budgets: Iterable[float]
) -> list[tuple[int, Outcome]]:
    """Solve the same catalogue at several budgets, cheapest first.

    Sorting lets the solver reuse nothing, but it keeps the output ordered the
    way a caller reads a budget slider.
    """
    prepared_items = list(items)
    ordered = sorted(budgets)
    return [(budget, solve_exact(prepare(prepared_items, budget))) for budget in ordered]


# ---------------------------------------------------------------------------
# Explainability
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class PathStep:
    """One row of the reconstruction: what happened to a single product."""

    index: int
    product_id: str
    product_name: str
    price: float
    utility: float
    decision: str
    budget_remaining_before: float
    running_cost: float
    running_utility: float
    explanation: str


def decision_path(problem: Problem, chosen: Iterable[int]) -> list[PathStep]:
    """Replay the optimal subset and narrate it, one step per product.

    This is O(n) and always available, unlike the full DP grid below.
    """
    chosen_set = set(chosen)
    remaining = problem.capacity
    running_cost = 0
    running_utility = 0.0
    steps: list[PathStep] = []

    for index, item in enumerate(problem.items):
        weight = problem.weights[index]
        value = problem.values[index]
        before_minor = remaining * problem.scale

        if index in chosen_set:
            decision = "include"
            remaining -= weight
            running_cost += problem.original_weights[index]
            running_utility += value
            explanation = (
                f"Take {item.name}: it fits in the {from_minor(before_minor)} left "
                f"and adds {round(value, 2)} utility."
            )
        elif weight > remaining:
            decision = "skip"
            explanation = (
                f"Skip {item.name}: {from_minor(problem.original_weights[index])} costs "
                f"more than the {from_minor(before_minor)} still available."
            )
        else:
            decision = "exclude"
            explanation = (
                f"Skip {item.name}: keeping the {from_minor(before_minor)} unspent "
                f"still beats including it."
            )

        steps.append(
            PathStep(
                index=index,
                product_id=item.id,
                product_name=item.name,
                price=item.price,
                utility=value,
                decision=decision,
                budget_remaining_before=from_minor(before_minor),
                running_cost=from_minor(running_cost),
                running_utility=round(running_utility, 2),
                explanation=explanation,
            )
        )

    return steps


@dataclass(frozen=True, slots=True)
class GridStep:
    """One filled cell of the DP table, for a step-through visualiser."""

    item_index: int
    product_id: str | None
    capacity: float
    include: float | None
    exclude: float
    decision: str
    best: float
    explanation: str


def build_grid_trace(problem: Problem) -> list[GridStep]:
    """Materialise the whole DP table as narratable cells.

    Deliberately refused above ``MAX_GRID_CELLS`` — the table grows as
    n * (capacity + 1) and the JSON response would be unusable long before the
    solver itself struggled.
    """
    if problem.cells > MAX_GRID_CELLS:
        raise ProblemTooLarge(
            f"Trace needs {problem.cells} cells, above the trace limit of "
            f"{MAX_GRID_CELLS}. Lower the budget or pass fewer products."
        )

    capacity = problem.capacity
    stride = problem.stride
    weights = problem.weights
    values = problem.values
    items = problem.items

    steps: list[GridStep] = []
    # previous[cell] is the best utility from the items already considered.
    previous = [0.0] * stride

    for index in range(problem.count):
        weight = weights[index]
        value = values[index]
        item = items[index]
        current = [0.0] * stride

        for cell in range(stride):
            excluded = previous[cell]
            included = value + previous[cell - weight] if cell >= weight else None

            if included is None:
                decision = "skip"
                current[cell] = excluded
                explanation = (
                    f"{item.name} costs {from_minor(problem.original_weights[index])}, "
                    f"which is more than the {from_minor(cell * problem.scale)} "
                    f"available. Skip it."
                )
                steps.append(
                    GridStep(
                        item_index=index + 1,
                        product_id=item.id,
                        capacity=from_minor(cell * problem.scale),
                        include=None,
                        exclude=excluded,
                        decision=decision,
                        best=excluded,
                        explanation=explanation,
                    )
                )
                continue

            if included > excluded:
                decision = "include"
                current[cell] = included
                best = included
                explanation = (
                    f"Include {item.name}: utility {round(included, 2)} beats "
                    f"excluding it ({round(excluded, 2)})."
                )
            else:
                decision = "exclude"
                current[cell] = excluded
                best = excluded
                explanation = (
                    f"Exclude {item.name}: the previous best of {round(excluded, 2)} "
                    f"is at least as good as including it ({round(included, 2)})."
                )

            steps.append(
                GridStep(
                    item_index=index + 1,
                    product_id=item.id,
                    capacity=from_minor(cell * problem.scale),
                    include=round(included, 2),
                    exclude=round(excluded, 2),
                    decision=decision,
                    best=round(best, 2),
                    explanation=explanation,
                )
            )

        previous = current

    return steps