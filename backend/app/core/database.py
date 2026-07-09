from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.core.config import settings


engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def _migrate(connection):
            try:
                connection.execute(text(
                    "ALTER TABLE videos ADD COLUMN thumbnail_path VARCHAR"
                ))
            except Exception:
                pass

            try:
                connection.execute(text("CREATE TABLE IF NOT EXISTS subtitle_preferences ("
                    "id INTEGER PRIMARY KEY, "
                    "profile_id INTEGER UNIQUE, "
                    "font_size INTEGER DEFAULT 24, "
                    "color VARCHAR DEFAULT '#FFFFFF', "
                    "background_opacity FLOAT DEFAULT 0.5, "
                    "background_color VARCHAR DEFAULT '#000000', "
                    "outline BOOLEAN DEFAULT 1, "
                    "outline_color VARCHAR DEFAULT '#000000', "
                    "outline_width INTEGER DEFAULT 2, "
                    "shadow BOOLEAN DEFAULT 1, "
                    "shadow_color VARCHAR DEFAULT '#000000', "
                    "shadow_offset INTEGER DEFAULT 2, "
                    "position INTEGER DEFAULT 100, "
                    "delay FLOAT DEFAULT 0.0, "
                    "FOREIGN KEY (profile_id) REFERENCES profiles(id)"
                ")"))
            except Exception:
                pass

        await conn.run_sync(_migrate)
