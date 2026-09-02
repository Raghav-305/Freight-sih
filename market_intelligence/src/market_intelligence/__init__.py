"""
Market Intelligence Prediction Module for AI-Powered Bulk Freight Chartering Platform

This module provides production-quality market intelligence prediction capabilities for the
dry-bulk freight chartering domain, supporting decision-making on freight market trends,
vessel chartering strategies, and risk assessment.
"""

__version__ = "1.0.0"
__author__ = "Market Intelligence Team"

from .config import Config
from .data_loader import DataLoader
from .data_quality import DataQualityChecker
from .feature_engineering import FeatureEngineer
from .target import TargetCreator
from .train import ModelTrainer
from .evaluate import ModelEvaluator
from .scoring import MarketIntelligenceScorer
from .predict import MarketIntelligencePredictor

__all__ = [
    'Config',
    'DataLoader',
    'DataQualityChecker',
    'FeatureEngineer',
    'TargetCreator',
    'ModelTrainer',
    'ModelEvaluator',
    'MarketIntelligenceScorer',
    'MarketIntelligencePredictor',
]
