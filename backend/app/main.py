"""SmartCart Optimizer API — FastAPI application.

Endpoints mirror the solver capabilities:
  GET  /              service info
  GET  /health        liveness + limits
  POST /solve         exact 0/1 knapsack for one budget
  POST /scenarios     same catalogue solved at several budgets
  POST /compare       exact DP vs greedy-density heuristic
  POST /path          narrated reconstruction of the optimal subset
  POST /trace         full DP grid for the step-through visualiser
  POST /curve         utility as a function of budget
"""

from __future__ import annotations

import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import (
    APP_NAME,
    APP_VERSION,
    MAX_BUDGET,
    MAX_CAPACITY,
    MAX_CELLS,
    MAX_PRODUCTS,
)
from .models import (
    AlgorithmInfo,
    BudgetCurveRequest,
    BudgetCurveResponse,
    BudgetPoint,
    CompareResponse,
    GridStepModel,
    HealthResponse,
    PathRequest,
    PathResponse,
    PathStepModel,
    ScenarioRequest,
    ScenarioResponse,
    ScenarioResult,
    SelectedItem,
    ServiceInfo,
    SolveRequest,
    SolveResponse,
    StrategyResult,
)
from .solver import (
    Item,
    ProblemTooLarge,
    build_grid_trace,
    decision_path,
    fractional_upper_bound,
    greedy_density,
    optimality_gap,
    prepare,
    solve_exact,
    solve_multiple_budgets,
)

app = FastAPI(title=APP_NAME, version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _items(products) -> list[Item]:
    return [
        Item(id=p.id, name=p.name, price=p.price, utility=p.utility)
        for p in products
    ]


def _algo(problem, elapsed_ms: float) -> AlgorithmInfo:
    return AlgorithmInfo(
        name="exact-dp-01-knapsack",
        exact=True,
        complexity="O(n * capacity)",
        items_considered=problem.count,
        reduced_capacity=problem.capacity,
        capacity_scale=problem.scale,
        dp_cells=problem.cells,
        solve_time_ms=round(elapsed_ms, 3),
    )


@app.get("/", response_model=ServiceInfo)
def root() -> ServiceInfo:
    return ServiceInfo(
        name=APP_NAME,
        version=APP_VERSION,
        problem="0/1 knapsack budget allocation: maximise utility within budget",
        endpoints=["/health", "/solve", "/compare", "/path", "/trace", "/curve"],
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        products_max=MAX_PRODUCTS,
        budget_max=MAX_BUDGET,
        capacity_max=MAX_CAPACITY,
        cells_max=MAX_CELLS,
    )


@app.post("/solve", response_model=SolveResponse)
def solve(req: SolveRequest) -> SolveResponse:
    items = _items(req.products)
    started = time.perf_counter()
    try:
        problem = prepare(items, req.budget)
        outcome = solve_exact(problem)
    except ProblemTooLarge as exc:
        raise HTTPException(status_code=413, detail=str(exc))
    elapsed_ms = (time.perf_counter() - started) * 1000

    chosen = [req.products[i] for i in outcome.chosen]
    total_cost = round(sum(p.price for p in chosen), 2)
    total_utility = round(sum(p.utility for p in chosen), 2)
    remaining = round(req.budget - total_cost, 2)
    used_pct = round(min(100.0, (total_cost / req.budget) * 100), 2)
    return SolveResponse(
        selected=[SelectedItem(product=p, line_total=round(p.price, 2)) for p in chosen],
        selected_ids=[p.id for p in chosen],
        total_cost=total_cost,
        total_utility=total_utility,
        remaining_budget=remaining,
        budget_used_pct=used_pct,
        catalogue_total=round(sum(p.price for p in req.products), 2),
        currency=req.currency,
        algorithm=_algo(problem, elapsed_ms),
    )


@app.post("/scenarios", response_model=ScenarioResponse)
def solve_scenarios(req: ScenarioRequest) -> ScenarioResponse:
    items = _items(req.products)
    try:
        runs = solve_multiple_budgets(items, [s.budget for s in req.scenarios])
    except ProblemTooLarge as exc:
        raise HTTPException(status_code=413, detail=str(exc))
    by_budget = dict(runs)
    results: list[ScenarioResult] = []
    for scenario in req.scenarios:
        outcome = by_budget[scenario.budget]
        chosen = [req.products[i] for i in outcome.chosen]
        total_cost = round(sum(p.price for p in chosen), 2)
        total_utility = round(sum(p.utility for p in chosen), 2)
        results.append(
            ScenarioResult(
                name=scenario.name,
                budget=scenario.budget,
                selected_ids=[p.id for p in chosen],
                total_cost=total_cost,
                total_utility=total_utility,
                remaining_budget=round(scenario.budget - total_cost, 2),
                items_selected=len(chosen),
                budget_used_pct=round(min(100.0, (total_cost / scenario.budget) * 100), 2),
            )
        )
    return ScenarioResponse(scenarios=results, currency=req.currency)


@app.post("/compare", response_model=CompareResponse)
def compare(req: SolveRequest) -> CompareResponse:
    items = _items(req.products)
    try:
        problem = prepare(items, req.budget)
    except ProblemTooLarge as exc:
        raise HTTPException(status_code=413, detail=str(exc))
    started = time.perf_counter()
    exact = solve_exact(problem)
    exact_ms = (time.perf_counter() - started) * 1000
    started = time.perf_counter()
    greedy = greedy_density(problem)
    greedy_ms = (time.perf_counter() - started) * 1000
    bound = fractional_upper_bound(problem)
    return CompareResponse(
        strategies=[
            StrategyResult(
                strategy="exact-dp",
                exact=True,
                selected_ids=[req.products[i].id for i in exact.chosen],
                total_cost=round(sum(req.products[i].price for i in exact.chosen), 2),
                total_utility=round(float(exact.utility), 2),
                gap_vs_optimum_pct=0.0,
                solve_time_ms=round(exact_ms, 3),
            ),
            StrategyResult(
                strategy="greedy-density",
                exact=False,
                selected_ids=[req.products[i].id for i in greedy.chosen],
                total_cost=round(sum(req.products[i].price for i in greedy.chosen), 2),
                total_utility=round(float(greedy.utility), 2),
                gap_vs_optimum_pct=optimality_gap(float(greedy.utility), float(exact.utility)),
                solve_time_ms=round(greedy_ms, 3),
            ),
        ],
        optimal_utility=round(float(exact.utility), 2),
        fractional_upper_bound=round(float(bound), 2),
        currency=req.currency,
    )


@app.post("/path", response_model=PathResponse)
def explain_path(req: PathRequest) -> PathResponse:
    items = _items(req.products)
    try:
        problem = prepare(items, req.budget)
        outcome = solve_exact(problem)
    except ProblemTooLarge as exc:
        raise HTTPException(status_code=413, detail=str(exc))
    steps = decision_path(problem, outcome.chosen)
    chosen = [req.products[i] for i in outcome.chosen]
    return PathResponse(
        selected_ids=[p.id for p in chosen],
        total_cost=round(sum(p.price for p in chosen), 2),
        total_utility=round(sum(p.utility for p in chosen), 2),
        steps=[
            PathStepModel(
                index=s.index,
                product_id=s.product_id,
                product_name=s.product_name,
                price=s.price,
                utility=s.utility,
                decision=s.decision,  # type: ignore[arg-type]
                budget_remaining_before=s.budget_remaining_before,
                running_cost=s.running_cost,
                running_utility=s.running_utility,
                explanation=s.explanation,
            )
            for s in steps
        ],
    )


@app.post("/trace")
def grid_trace(req: PathRequest):
    items = _items(req.products)
    try:
        problem = prepare(items, req.budget)
        steps = build_grid_trace(problem)
    except ProblemTooLarge as exc:
        raise HTTPException(status_code=413, detail=str(exc))
    return {
        "budget": req.budget,
        "steps": [
            GridStepModel(
                item_index=s.item_index,
                product_id=s.product_id,
                capacity=s.capacity,
                include=s.include,
                exclude=s.exclude,
                decision=s.decision,  # type: ignore[arg-type]
                best=s.best,
                explanation=s.explanation,
            )
            for s in steps
        ],
        "truncated": False,
        "cells": len(steps),
    }


@app.post("/curve", response_model=BudgetCurveResponse)
def budget_curve(req: BudgetCurveRequest) -> BudgetCurveResponse:
    items = _items(req.products)
    try:
        runs = solve_multiple_budgets(items, req.budgets)
    except ProblemTooLarge as exc:
        raise HTTPException(status_code=413, detail=str(exc))
    points = []
    for budget, outcome in runs:
        chosen = [req.products[i] for i in outcome.chosen]
        total_cost = round(sum(p.price for p in chosen), 2)
        total_utility = round(sum(p.utility for p in chosen), 2)
        points.append(
            BudgetPoint(
                budget=budget,
                total_utility=total_utility,
                total_cost=total_cost,
                items_selected=len(chosen),
                remaining_budget=round(budget - total_cost, 2),
            )
        )
    return BudgetCurveResponse(
        points=points,
        catalogue_total=round(sum(p.price for p in req.products), 2),
        currency=req.currency,
    )
