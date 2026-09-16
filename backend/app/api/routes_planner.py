"""
Grizon Agri — Smart Crop Planner API Routes
Generates personalized crop schedules from sowing to harvest.
"""
import structlog
from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

logger = structlog.get_logger()
router = APIRouter()


class CropPlanRequest(BaseModel):
    crop: str = "Wheat"
    variety: Optional[str] = "HD-3086"
    acreage: float = 2.5
    sowing_date: str = "2025-11-10"
    language: str = "pa-IN"


class CropStageTask(BaseModel):
    stage_name: str
    days_after_sowing: int
    scheduled_date: str
    action_item: str
    dosage_recommendation: str
    status: str  # 'COMPLETED', 'UPCOMING', 'PENDING'


class CropPlanResponse(BaseModel):
    crop: str
    variety: str
    acreage: float
    season: str
    sowing_date: str
    expected_harvest: str
    total_stages: int
    tasks: list[CropStageTask]


@router.post("/generate", response_model=CropPlanResponse)
async def generate_crop_plan(request: CropPlanRequest):
    """
    Generate customized agronomic crop schedule based on PAU/HAU guidelines.
    """
    logger.info("generating_crop_plan", crop=request.crop, acreage=request.acreage)

    try:
        base_date = datetime.strptime(request.sowing_date, "%Y-%m-%d")
    except Exception:
        base_date = datetime.now()

    lang_code = request.language.split("-")[0].lower() if request.language else "pa"

    if "wheat" in request.crop.lower() or "ਕਣਕ" in request.crop or "गेहूं" in request.crop:
        harvest_date = base_date + timedelta(days=140)
        if lang_code == "pa":
            tasks = [
                CropStageTask(stage_name="ਬੀਜ ਸੋਧ ਅਤੇ ਬੀਜਾਈ", days_after_sowing=0, scheduled_date=base_date.strftime("%Y-%m-%d"), action_item="Raxil 2gm ਪ੍ਰਤੀ ਕਿੱਲੋ ਬੀਜ ਨਾਲ ਸੋਧੋ। 40-45 ਕਿੱਲੋ ਬੀਜ ਪ੍ਰਤੀ ਏਕੜ ਬੀਜੋ।", dosage_recommendation="45 kg Seed + 50 kg DAP / acre", status="COMPLETED"),
                CropStageTask(stage_name="ਪਹਿਲੀ ਸਿੰਚਾਈ (CRI Stage)", days_after_sowing=21, scheduled_date=(base_date + timedelta(days=21)).strftime("%Y-%m-%d"), action_item="ਜੜ੍ਹਾਂ ਬਣਨ ਸਮੇਂ ਪਹਿਲਾ ਪਾਣੀ ਲਾਓ। ਪਾਣੀ ਤੋਂ ਬਾਅਦ ਯੂਰੀਆ ਪਾਓ।", dosage_recommendation="45 kg Urea / acre", status="UPCOMING"),
                CropStageTask(stage_name="ਗੁੱਲੀ ਡੰਡਾ / ਨਦੀਨ ਰੋਕਥਾਮ", days_after_sowing=35, scheduled_date=(base_date + timedelta(days=35)).strftime("%Y-%m-%d"), action_item="ਅੈਕਸੀਅਲ (Pinoxaden 5 EC) 400ml ਛਿੜਕੋ।", dosage_recommendation="400 ml / 150L water per acre", status="PENDING"),
                CropStageTask(stage_name="ਦੂਜੀ ਸਿੰਚਾਈ + ਯੂਰੀਆ", days_after_sowing=45, scheduled_date=(base_date + timedelta(days=45)).strftime("%Y-%m-%d"), action_item="ਦੂਜਾ ਪਾਣੀ ਲਾਓ ਅਤੇ ਬਚੀ ਹੋਈ ਯੂਰੀਆ ਖਾਦ ਪਾਓ।", dosage_recommendation="45 kg Urea / acre", status="PENDING"),
                CropStageTask(stage_name="ਪੀਲੀ ਕੁੰਗੀ ਦੀ ਰੋਕਥਾਮ", days_after_sowing=75, scheduled_date=(base_date + timedelta(days=75)).strftime("%Y-%m-%d"), action_item="Tilt 25 EC 200ml ਦਾ ਪ੍ਰਤੀਬੰਧਕ ਛਿੜਕਾਅ ਕਰੋ।", dosage_recommendation="200 ml / 200L water per acre", status="PENDING"),
                CropStageTask(stage_name="ਕਟਾਈ (Harvesting)", days_after_sowing=140, scheduled_date=harvest_date.strftime("%Y-%m-%d"), action_item="ਫ਼ਸਲ ਸੁੱਕਣ ਤੇ ਕੰਬਾਈਨ ਨਾਲ ਕਟਾਈ ਕਰੋ।", dosage_recommendation="Final Yield Estimate: 22-24 quintals/acre", status="PENDING"),
            ]
        else:
            tasks = [
                CropStageTask(stage_name="Sowing & Seed Treatment", days_after_sowing=0, scheduled_date=base_date.strftime("%Y-%m-%d"), action_item="Treat seed with Raxil 2g/kg. Drill 45kg seed per acre with basal fertilizer.", dosage_recommendation="45 kg Seed + 50 kg DAP / acre", status="COMPLETED"),
                CropStageTask(stage_name="First Irrigation (CRI Stage)", days_after_sowing=21, scheduled_date=(base_date + timedelta(days=21)).strftime("%Y-%m-%d"), action_item="Apply 1st irrigation at Crown Root Initiation stage. Topdress Urea after watering.", dosage_recommendation="45 kg Urea / acre", status="UPCOMING"),
                CropStageTask(stage_name="Weed Control (Gulli Danda)", days_after_sowing=35, scheduled_date=(base_date + timedelta(days=35)).strftime("%Y-%m-%d"), action_item="Spray Axial (Pinoxaden 5 EC) at 400ml/acre for Phalaris minor control.", dosage_recommendation="400 ml in 150L water / acre", status="PENDING"),
                CropStageTask(stage_name="Second Irrigation & Topdress", days_after_sowing=45, scheduled_date=(base_date + timedelta(days=45)).strftime("%Y-%m-%d"), action_item="Apply 2nd irrigation and broadcast remaining Nitrogen fertilizer.", dosage_recommendation="45 kg Urea / acre", status="PENDING"),
                CropStageTask(stage_name="Yellow Rust Prevention", days_after_sowing=75, scheduled_date=(base_date + timedelta(days=75)).strftime("%Y-%m-%d"), action_item="Proactive spray of Tilt 25 EC (Propiconazole) to prevent yellow rust.", dosage_recommendation="200 ml in 200L water / acre", status="PENDING"),
                CropStageTask(stage_name="Combine Harvesting", days_after_sowing=140, scheduled_date=harvest_date.strftime("%Y-%m-%d"), action_item="Harvest when grain moisture reaches 12-14%.", dosage_recommendation="Target Yield: 22-25 Quintals/acre", status="PENDING"),
            ]
    else:
        harvest_date = base_date + timedelta(days=120)
        tasks = [
            CropStageTask(stage_name="Field Preparation & Sowing", days_after_sowing=0, scheduled_date=base_date.strftime("%Y-%m-%d"), action_item="Prepare seedbed and apply basal fertilizer dose.", dosage_recommendation="Standard NPK Basal Dose", status="COMPLETED"),
            CropStageTask(stage_name="Vegetative Care & First Water", days_after_sowing=25, scheduled_date=(base_date + timedelta(days=25)).strftime("%Y-%m-%d"), action_item="Apply first irrigation and weed management.", dosage_recommendation="1st Dose Urea", status="UPCOMING"),
            CropStageTask(stage_name="Flowering & Pest Inspection", days_after_sowing=60, scheduled_date=(base_date + timedelta(days=60)).strftime("%Y-%m-%d"), action_item="Inspect crop for sucking pests and apply recommended biopesticide.", dosage_recommendation="Proactive Spray", status="PENDING"),
            CropStageTask(stage_name="Harvesting & Storage", days_after_sowing=120, scheduled_date=harvest_date.strftime("%Y-%m-%d"), action_item="Harvest crop at full maturity.", dosage_recommendation="Optimal Moisture Storage", status="PENDING"),
        ]

    return CropPlanResponse(
        crop=request.crop,
        variety=request.variety or "Standard Recommended Variety",
        acreage=request.acreage,
        season="Rabi" if "wheat" in request.crop.lower() or "ਕਣਕ" in request.crop else "Kharif",
        sowing_date=request.sowing_date,
        expected_harvest=harvest_date.strftime("%Y-%m-%d"),
        total_stages=len(tasks),
        tasks=tasks,
    )
