"""
Grizon Agri — Knowledge Base Ingestion Script
Populates agronomic_knowledge table with PAU/HAU Packages of Practices & Government Schemes.
"""
import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import asyncio
import structlog
from sqlalchemy import text
from app.db.database import async_session_factory, init_db

logger = structlog.get_logger()

AGRONOMIC_KNOWLEDGE_DOCS = [
    {
        "source_document": "PAU_Rabi_Package_of_Practices_2025_26.pdf",
        "source_university": "PAU Ludhiana",
        "crop": "Wheat",
        "season": "Rabi",
        "topic": "Yellow Rust (ਪੀਲੀ ਕੁੰਗੀ)",
        "content": "Yellow Rust symptoms appear as bright yellow powder stripes along leaf veins. Spray Tilt 25 EC (Propiconazole) 200ml in 200 litres of water per acre. Repeat after 15 days if yellow spots persist."
    },
    {
        "source_document": "PAU_Rabi_Package_of_Practices_2025_26.pdf",
        "source_university": "PAU Ludhiana",
        "crop": "Wheat",
        "season": "Rabi",
        "topic": "Gulli Danda Weed Control (ਗੁੱਲੀ ਡੰਡਾ)",
        "content": "Phalaris minor (Gulli Danda) control: Apply Pinoxaden 5 EC (Axial) @ 400 ml per acre in 150 litres of water at 30-35 days after sowing."
    },
    {
        "source_document": "PAU_Rabi_Package_of_Practices_2025_26.pdf",
        "source_university": "PAU Ludhiana",
        "crop": "Wheat",
        "season": "Rabi",
        "topic": "Fertilizer Schedule (ਖਾਦ ਦੀ ਮਾਤਰਾ)",
        "content": "Wheat Fertilizer Schedule per acre: 50 kg DAP + 20 kg MOP at sowing. Topdress 45 kg Urea at 1st irrigation (CRI stage) and 45 kg Urea at 2nd irrigation."
    },
    {
        "source_document": "PAU_Kharif_Package_of_Practices_2025.pdf",
        "source_university": "PAU Ludhiana",
        "crop": "Paddy",
        "season": "Kharif",
        "topic": "Bacterial Leaf Blight (ਝੁਲਸ ਰੋਗ)",
        "content": "Bacterial Leaf Blight causes yellowing and drying from leaf tips. Spray Copper Oxychloride 50 WP (500g) + Streptocycline (6g) in 200 litres of water per acre."
    },
    {
        "source_document": "PM_Kisan_Gov_Scheme_Guide.pdf",
        "source_university": "Ministry of Agriculture & Farmers Welfare",
        "crop": "General",
        "season": "All",
        "topic": "PM Kisan Samman Nidhi Scheme",
        "content": "PM-Kisan provides ₹6,000 per year in three equal installments of ₹2,000 to eligible farmer families directly into bank accounts via DBT. Documents needed: Aadhaar, Land Record (Khasra/Khatauni), and Bank Passbook."
    },
    {
        "source_document": "PMFBY_Crop_Insurance_Guide.pdf",
        "source_university": "Ministry of Agriculture & Farmers Welfare",
        "crop": "General",
        "season": "All",
        "topic": "PMFBY Crop Insurance",
        "content": "Pradhan Mantri Fasal Bima Yojana (PMFBY) covers crop loss due to non-preventable natural risks. Premium rate: 2% for Kharif crops, 1.5% for Rabi crops, and 5% for commercial/horticultural crops."
    }
]


async def run_ingestion():
    logger.info("starting_agronomic_ingestion")
    await init_db()

    async with async_session_factory() as session:
        # Create agronomic_knowledge table if not exists
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS agronomic_knowledge (
                id TEXT PRIMARY KEY,
                source_document TEXT NOT NULL,
                source_university TEXT,
                crop TEXT,
                season TEXT,
                topic TEXT,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))

        # Insert docs
        import uuid
        for doc in AGRONOMIC_KNOWLEDGE_DOCS:
            doc_id = f"doc-{uuid.uuid4().hex[:8]}"
            await session.execute(
                text("""
                    INSERT INTO agronomic_knowledge (id, source_document, source_university, crop, season, topic, content)
                    VALUES (:id, :source_document, :source_university, :crop, :season, :topic, :content)
                """),
                {
                    "id": doc_id,
                    "source_document": doc["source_document"],
                    "source_university": doc["source_university"],
                    "crop": doc["crop"],
                    "season": doc["season"],
                    "topic": doc["topic"],
                    "content": doc["content"],
                }
            )

        await session.commit()

    logger.info("agronomic_ingestion_complete", count=len(AGRONOMIC_KNOWLEDGE_DOCS))
    print(f"✅ Successfully ingested {len(AGRONOMIC_KNOWLEDGE_DOCS)} PAU/HAU & Scheme documents into Knowledge Base!")

if __name__ == "__main__":
    asyncio.run(run_ingestion())
