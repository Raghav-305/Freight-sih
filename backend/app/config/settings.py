from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "local"
    database_url: str = "postgresql+psycopg://freight_user:freight_password@localhost:5432/freight_intelligence"
    cors_origins: str = "http://localhost:5173"
    model_root_path: str = "./ml/models"
    model_artifact_path: str = "./ml/artifacts"
    model_registry_path: str = "./ml/registry/model_registry.json"
    data_root_path: str = "./data"
    market_intelligence_data_path: str = "./data/features/market_intelligence"
    mlflow_tracking_uri: str = "./ml/mlruns"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
