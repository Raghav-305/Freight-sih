"""
Market Intelligence Prediction Module for AI-Powered Bulk Freight Chartering Platform
"""

__version__ = "1.0.0"
__author__ = "Market Intelligence Team"

from .config import Config
from .scoring import MarketIntelligenceScorer
from .predict import MarketIntelligencePredictor

__all__ = [
    "Config",
    "MarketIntelligenceScorer",
    "MarketIntelligencePredictor",
]
