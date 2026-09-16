"""
Grizon Agri — Farm Financial Assistance API Routes
Tracks farming expenses, estimates production costs, revenue, and profit per acre.
"""
import structlog
from fastapi import APIRouter
from pydantic import BaseModel

logger = structlog.get_logger()
router = APIRouter()


class ExpenseBreakdown(BaseModel):
    category: str
    amount_per_acre: float
    total_amount: float


class CostProfitRequest(BaseModel):
    crop: str = "Wheat"
    acreage: float = 5.0
    expected_yield_quintals_per_acre: float = 22.5
    mandi_price_per_quintal: float = 2275.0


class CostProfitResponse(BaseModel):
    crop: str
    acreage: float
    total_cost: float
    cost_per_acre: float
    gross_revenue: float
    net_profit: float
    profit_per_acre: float
    roi_percentage: float
    expenses: list[ExpenseBreakdown]


@router.post("/estimate", response_model=CostProfitResponse)
async def calculate_cost_profit(request: CostProfitRequest):
    """
    Calculate cost of production, gross revenue, and net profit per acre.
    """
    logger.info("calculating_farm_financials", crop=request.crop, acreage=request.acreage)

    acres = max(request.acreage, 0.5)

    # Standard benchmark costs per acre in Punjab/Haryana (in INR)
    if "wheat" in request.crop.lower() or "ਕਣਕ" in request.crop or "ਗੇਹੂ" in request.crop:
        seed_cost = 1400.0
        fertilizer_cost = 3200.0
        pesticide_cost = 1800.0
        field_prep_combine = 4500.0
        irrigation_power = 1200.0
    else:
        seed_cost = 1800.0
        fertilizer_cost = 4000.0
        pesticide_cost = 2500.0
        field_prep_combine = 5500.0
        irrigation_power = 1500.0

    cost_per_acre = seed_cost + fertilizer_cost + pesticide_cost + field_prep_combine + irrigation_power
    total_cost = cost_per_acre * acres

    total_yield_quintals = request.expected_yield_quintals_per_acre * acres
    gross_revenue = total_yield_quintals * request.mandi_price_per_quintal

    net_profit = gross_revenue - total_cost
    profit_per_acre = net_profit / acres
    roi = (net_profit / total_cost * 100) if total_cost > 0 else 0.0

    expenses = [
        ExpenseBreakdown(category="Seeds & Seed Treatment", amount_per_acre=seed_cost, total_amount=seed_cost * acres),
        ExpenseBreakdown(category="Fertilizers (DAP, Urea, Zinc)", amount_per_acre=fertilizer_cost, total_amount=fertilizer_cost * acres),
        ExpenseBreakdown(category="Pesticides & Fungicides", amount_per_acre=pesticide_cost, total_amount=pesticide_cost * acres),
        ExpenseBreakdown(category="Tractor Tillage & Combine Harvesting", amount_per_acre=field_prep_combine, total_amount=field_prep_combine * acres),
        ExpenseBreakdown(category="Tubewell Irrigation & Power", amount_per_acre=irrigation_power, total_amount=irrigation_power * acres),
    ]

    return CostProfitResponse(
        crop=request.crop,
        acreage=acres,
        total_cost=round(total_cost, 2),
        cost_per_acre=round(cost_per_acre, 2),
        gross_revenue=round(gross_revenue, 2),
        net_profit=round(net_profit, 2),
        profit_per_acre=round(profit_per_acre, 2),
        roi_percentage=round(roi, 1),
        expenses=expenses,
    )
