"""
Configuration and constants for Market Intelligence Model.

Contains all configurable parameters including:
- Data paths
- Model hyperparameters
- Feature configurations
- Target thresholds
- Evaluation metrics
"""

import os
from pathlib import Path
from typing import Dict, List, Optional

_REPO_ROOT = Path(__file__).resolve().parents[2]


class Config:
    """Configuration class for Market Intelligence Model."""

    # ========== Paths ==========
    PROJECT_ROOT = Path(os.getenv("DATA_ROOT_PATH", str(_REPO_ROOT))).resolve()
    if not (PROJECT_ROOT / "data").exists() and _REPO_ROOT.exists():
        PROJECT_ROOT = _REPO_ROOT

    DATA_DIR = Path(os.getenv("MARKET_INTELLIGENCE_DATA_PATH", str(PROJECT_ROOT / "data" / "features" / "market_intelligence")))
    MODELS_DIR = Path(os.getenv("MODEL_ROOT_PATH", str(PROJECT_ROOT / "ml" / "models"))) / "market_intelligence" / "market_intelligence_v1"
    REPORTS_DIR = Path(os.getenv("MODEL_ARTIFACT_PATH", str(PROJECT_ROOT / "ml" / "artifacts"))) / "market_intelligence"

    # ========== Data Configuration ==========
    DATA_FILE = DATA_DIR / "market_intelligence_daily_complete.csv"
    
    # Columns to exclude (constant, metadata, or leakage)
    CONSTANT_COLUMNS = [
        'ais_observations', 'ais_unique_vessels', 'ais_low_speed_vessel_count',
        'flag_invalid_loa', 'flag_invalid_beam', 'flag_invalid_draft',
        'flag_invalid_dwt', 'flag_invalid_berth_length', 'flag_invalid_handling_rate',
        'has_tidal_restriction', 'constraint_completeness_pct', 'source_available'
    ]
    
    # Leakage columns (future targets)
    LEAKAGE_COLUMNS = [
        'future_freight_usd_mt_7d', 'future_freight_return_7d_pct',
        'future_freight_usd_mt_14d', 'future_freight_return_14d_pct',
        'future_freight_usd_mt_30d', 'future_freight_return_30d_pct',
        'future_freight_usd_mt_60d', 'future_freight_return_60d_pct'
    ]
    
    # Target column
    TARGET_COLUMN = 'market_regime_target_30d'
    
    # Metadata columns (not features)
    METADATA_COLUMNS = [
        'date', 'route_id', 'origin', 'destination_port', 'vessel_class',
        'destination_port_id', 'destination_port_unlocode', 'port_id', 'port_name',
        'country', 'source_date', 'effective_from', 'effective_to', 'berth_name',
        'equipment'
    ]
    
    # ========== Target Configuration ==========
    # Thresholds for classifying market regime
    TARGET_THRESHOLD_LOW = -0.05  # -5%
    TARGET_THRESHOLD_HIGH = 0.05  # +5%
    
    # Class mapping
    CLASS_MAPPING = {
        'BEARISH': 0,
        'NEUTRAL': 1,
        'BULLISH': 2
    }
    
    INVERSE_CLASS_MAPPING = {v: k for k, v in CLASS_MAPPING.items()}
    
    # ========== Feature Engineering Configuration ==========
    
    # Rolling window periods
    ROLLING_WINDOWS = [7, 14, 30, 90]
    
    # Baltic indices
    BALTIC_INDICES = ['bdi', 'bpi', 'bsi', 'bhsi', 'bci']
    
    # FFA contracts
    FFA_CONTRACTS = ['ffa_1m', 'ffa_3m', 'ffa_6m']
    
    # Main features groups
    FEATURE_GROUPS = {
        'price_features': [
            'freight_usd_mt', 'tce_usd_day', 'bunker_price_usd_mt', 'coal_price_usd_mt'
        ],
        'baltic_indices': BALTIC_INDICES,
        'ffa_features': FFA_CONTRACTS + [
            'ffa_1m_premium_usd', 'ffa_1m_premium_pct',
            'ffa_3m_premium_usd', 'ffa_3m_premium_pct',
            'ffa_curve_slope_1m_3m'
        ],
        'freight_technical': [
            'freight_ma7', 'freight_ma14', 'freight_ma30',
            'freight_change_7d_pct', 'freight_change_14d_pct', 'freight_change_30d_pct',
            'freight_volatility_7d', 'freight_volatility_14d', 'freight_volatility_30d',
            'freight_ema7', 'momentum_7d'
        ],
        'port_features': [
            'port_calls_count', 'avg_waiting_hours', 'median_waiting_hours',
            'max_waiting_hours', 'avg_port_stay_hours'
        ],
        'weather_features': [
            'avg_wind_speed', 'avg_wave_height', 'avg_wave_period',
            'avg_precipitation', 'avg_pressure', 'storm_flag', 'cyclone_flag'
        ],
        'vessel_features': [
            'max_loa_m', 'max_beam_m', 'max_draft_m', 'max_dwt_mt',
            'berth_length_m', 'handling_rate_mt_hr', 'tidal_restriction',
            'special_restriction', 'dwt_per_draft_m', 'max_vessel_footprint_m2',
            'berth_loa_margin_m', 'has_special_restriction'
        ],
        'temporal_features': [
            'month', 'day_of_year', 'sin_day', 'cos_day'
        ],
        'distance': ['distance_nm']
    }
    
    # ========== Model Configuration ==========
    
    # Random state for reproducibility
    RANDOM_STATE = 42
    
    # XGBoost parameters
    XGBOOST_PARAMS = {
        'n_estimators': 500,
        'max_depth': 5,
        'learning_rate': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'reg_alpha': 0.5,
        'reg_lambda': 1.0,
        'objective': 'multi:softprob',
        'num_class': 3,
        'eval_metric': 'mlogloss',
        'random_state': RANDOM_STATE,
        'n_jobs': -1,
        'verbosity': 0
    }
    
    # Random Forest parameters
    RF_PARAMS = {
        'n_estimators': 500,
        'max_depth': 10,
        'min_samples_split': 5,
        'min_samples_leaf': 2,
        'max_features': 'sqrt',
        'random_state': RANDOM_STATE,
        'n_jobs': -1,
        'class_weight': 'balanced'
    }
    
    # Logistic Regression parameters
    LR_PARAMS = {
        'max_iter': 1000,
        'random_state': RANDOM_STATE,
        'class_weight': 'balanced'
    }
    
    # ========== Train / Validation / Test Configuration ==========
    
    # Temporal split years
    TRAIN_START_YEAR = 2020
    TRAIN_END_YEAR = 2024
    VALIDATION_YEAR = 2025
    TEST_START_YEAR = 2025
    
    # ========== Evaluation Configuration ==========
    
    # Metrics to compute
    METRICS = [
        'accuracy', 'precision_macro', 'recall_macro', 'f1_macro',
        'balanced_accuracy', 'confusion_matrix'
    ]
    
    # ========== Market Intelligence Scoring Configuration ==========
    
    # Market score bounds
    MIN_MARKET_SCORE = 0
    MAX_MARKET_SCORE = 100
    
    # Market score interpretation thresholds
    MARKET_SCORE_THRESHOLDS = {
        'strong_bearish': (0, 30),
        'bearish': (30, 45),
        'neutral': (45, 55),
        'bullish': (55, 70),
        'strong_bullish': (70, 100)
    }
    
    # Volatility percentile thresholds
    VOLATILITY_PERCENTILES = {
        'low': 33,
        'medium': 67,
        'high': 100
    }
    
    # ========== File Names ==========
    
    MODEL_FILE = MODELS_DIR / 'market_intelligence_model.pkl'
    IMPUTER_FILE = MODELS_DIR / 'market_intelligence_imputer.pkl'
    SCALER_FILE = MODELS_DIR / 'market_intelligence_scaler.pkl'
    FEATURE_COLUMNS_FILE = MODELS_DIR / 'market_intelligence_feature_columns.json'
    METADATA_FILE = MODELS_DIR / 'market_intelligence_metadata.json'
    
    QUALITY_REPORT_CSV = REPORTS_DIR / 'data_quality_report.csv'
    QUALITY_REPORT_JSON = REPORTS_DIR / 'data_quality_report.json'
    FEATURE_IMPORTANCE_CSV = REPORTS_DIR / 'market_feature_importance.csv'
    FEATURE_IMPORTANCE_PNG = REPORTS_DIR / 'market_feature_importance.png'
    CONFUSION_MATRIX_PNG = REPORTS_DIR / 'confusion_matrix.png'
    EVALUATION_JSON = REPORTS_DIR / 'evaluation.json'
    WALK_FORWARD_CSV = REPORTS_DIR / 'walk_forward_results.csv'
    LATEST_OUTPUT_CSV = DATA_DIR / 'market_intelligence_latest.csv'
    
    # ========== Logging Configuration ==========
    
    LOG_LEVEL = 'INFO'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    @classmethod
    def create_directories(cls) -> None:
        """Create necessary directories if they don't exist."""
        cls.MODELS_DIR.mkdir(parents=True, exist_ok=True)
        cls.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_features_to_use(cls) -> List[str]:
        """Get list of feature columns to use in model training."""
        features = []
        for group_features in cls.FEATURE_GROUPS.values():
            features.extend(group_features)
        return features
    
    @classmethod
    def get_columns_to_exclude(cls) -> List[str]:
        """Get list of all columns to exclude from modeling."""
        exclude = cls.CONSTANT_COLUMNS + cls.LEAKAGE_COLUMNS + cls.METADATA_COLUMNS
        exclude.append(cls.TARGET_COLUMN)
        return list(set(exclude))
