"""Tunable limits and shared constants for the SmartCart optimizer API."""

from __future__ import annotations

MINOR_UNITS_PER_MAJOR = 100

# Request-shaped limits (enforced by Pydantic so bad input never reaches the solver).
MAX_PRODUCTS = 2_000
MAX_BUDGET = 10_000_000.0
MAX_BUDGETS_PER_REQUEST = 200
MAX_BUDGETS_PER_CURVE = 200

# Solver-shaped limits. The DP is O(n * capacity); these keep a single request
# inside a small, predictable amount of time and memory so the service also
# behaves on serverless platforms with a hard request timeout.
#
# `capacity` bounds the rolling value row (8 bytes per cell via array('d')).
# `cells` bounds the decision table (1 byte per cell via bytearray), which is
# what reconstruction needs.
MAX_CAPACITY = 2_000_000
MAX_CELLS = 20_000_000

# The full DP grid is only materialised for the explain-trace endpoint, and the
# response body has to stay reasonable, so it gets a much tighter budget.
MAX_GRID_CELLS = 20_000

APP_NAME = "SmartCart Optimizer API"
APP_VERSION = "1.0.0"