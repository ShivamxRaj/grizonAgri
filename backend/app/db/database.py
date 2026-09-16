"""
Grizon Agri — Async Database Connection Manager
Supports SQLite (zero-config) and PostgreSQL with automatic schema creation.
"""
import structlog
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text
from app.core.config import settings

logger = structlog.get_logger()

# Create async engine with appropriate parameters for SQLite/PostgreSQL
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Create database tables if they do not exist."""
    try:
        async with engine.begin() as conn:
            # Create core tables for chat & farm context
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS farmers (
                    farmer_id TEXT PRIMARY KEY,
                    phone_number TEXT UNIQUE,
                    name TEXT,
                    gender TEXT DEFAULT 'male',
                    preferred_language TEXT DEFAULT 'pa-IN',
                    district TEXT DEFAULT 'Ludhiana',
                    state TEXT DEFAULT 'Punjab',
                    primary_crops TEXT DEFAULT 'Wheat,Paddy',
                    otp_code TEXT,
                    otp_expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))

            # Ensure new columns exist if database was previously initialized
            try:
                await conn.execute(text("ALTER TABLE farmers ADD COLUMN gender TEXT DEFAULT 'male';"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE farmers ADD COLUMN primary_crops TEXT DEFAULT 'Wheat,Paddy';"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE farmers ADD COLUMN otp_code TEXT;"))
            except Exception:
                pass
            try:
                await conn.execute(text("ALTER TABLE farmers ADD COLUMN otp_expires_at TIMESTAMP;"))
            except Exception:
                pass

            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS conversations (
                    conversation_id TEXT PRIMARY KEY,
                    farmer_id TEXT NOT NULL,
                    title TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))

            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS messages (
                    message_id TEXT PRIMARY KEY,
                    conversation_id TEXT,
                    farmer_id TEXT,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    intent TEXT,
                    confidence_score REAL,
                    evidence_level TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))

            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS crop_cycles (
                    cycle_id TEXT PRIMARY KEY,
                    farmer_id TEXT NOT NULL,
                    crop_name TEXT NOT NULL,
                    crop_variety TEXT,
                    season TEXT,
                    sowing_date TEXT,
                    current_stage TEXT,
                    status TEXT DEFAULT 'ACTIVE'
                );
            """))

        logger.info("database_tables_initialized", engine="sqlite" if is_sqlite else "postgresql")
    except Exception as e:
        logger.error("database_init_error", error=str(e))


async def get_db():
    """FastAPI dependency — yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def save_chat_message(farmer_id: str, role: str, content: str, intent: str = "GENERAL", confidence: float = 0.85, evidence_level: str = "MODEL_INFERENCE"):
    """Helper to persist chat message in database."""
    import uuid
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    try:
        await init_db()
        async with async_session_factory() as session:
            await session.execute(
                text("""
                    INSERT INTO messages (message_id, farmer_id, role, content, intent, confidence_score, evidence_level)
                    VALUES (:msg_id, :farmer_id, :role, :content, :intent, :confidence, :evidence_level)
                """),
                {
                    "msg_id": msg_id,
                    "farmer_id": farmer_id,
                    "role": role,
                    "content": content,
                    "intent": intent,
                    "confidence": confidence,
                    "evidence_level": evidence_level,
                }
            )
            await session.commit()
    except Exception as e:
        logger.error("failed_to_save_message", error=str(e))

