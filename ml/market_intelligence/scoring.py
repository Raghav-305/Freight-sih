"""
Market Intelligence Scoring and Decision Support module.

Handles:
- Market score calculation from model probabilities
- Market regime interpretation
- Chartering signal generation
- Risk assessment
- Explanation generation
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, List, Optional, Tuple
from .config import Config

logger = logging.getLogger(__name__)

class MarketIntelligenceScorer:
    """Generate market intelligence scores and signals."""
    
    def __init__(self, config: Config = None):
        """
        Initialize market intelligence scorer.
        
        Args:
            config: Configuration object
        """
        self.config = config or Config()
    
    def calculate_market_score(self, probabilities: Dict[str, float]) -> float:
        """
        Calculate market score (0-100) from probabilities.
        
        Args:
            probabilities: Dict with keys 'bearish', 'neutral', 'bullish'
            
        Returns:
            Market score between 0 and 100
        """
        bearish_prob = probabilities.get('bearish', 0)
        bullish_prob = probabilities.get('bullish', 0)
        
        # Formula: 50 + 50 * (bullish_prob - bearish_prob)
        score = 50 + 50 * (bullish_prob - bearish_prob)
        
        # Clamp to 0-100
        score = max(0, min(100, score))
        
        return round(score, 1)
    
    def interpret_market_score(self, market_score: float) -> str:
        """
        Interpret market score into market regime.
        
        Args:
            market_score: Market score between 0 and 100
            
        Returns:
            Market regime interpretation
        """
        thresholds = self.config.MARKET_SCORE_THRESHOLDS
        
        if market_score <= thresholds['strong_bearish'][1]:
            return 'STRONG BEARISH'
        elif market_score <= thresholds['bearish'][1]:
            return 'BEARISH'
        elif market_score <= thresholds['neutral'][1]:
            return 'NEUTRAL'
        elif market_score <= thresholds['bullish'][1]:
            return 'BULLISH'
        else:
            return 'STRONG BULLISH'
    
    def generate_chartering_signal(self, market_score: float,
                                  market_regime: str,
                                  volatility: str,
                                  forward_signal: str,
                                  bunker_pressure: str,
                                  port_pressure: str) -> str:
        """
        Generate chartering recommendation signal.
        
        Args:
            market_score: Market score (0-100)
            market_regime: Market regime classification
            volatility: Market volatility level
            forward_signal: Forward market signal
            bunker_pressure: Bunker cost pressure
            port_pressure: Port congestion pressure
            
        Returns:
            Chartering signal recommendation
        """
        signals = []
        
        # Base signal on market regime and score
        if market_score >= 70:  # Strong bullish
            base_signal = 'ENTER / CONSIDER FIXING'
            signals.append('Strong bullish market provides attractive entry point')
        elif market_score >= 55:  # Bullish
            base_signal = 'CONSIDER FIXING / PARTIAL COVER'
            signals.append('Bullish market may justify early fixing')
        elif market_score >= 45:  # Neutral
            base_signal = 'MONITOR / PARTIAL COVER'
            signals.append('Neutral market suggests cautious approach')
        elif market_score >= 30:  # Bearish
            base_signal = 'WAIT / NEGOTIATE'
            signals.append('Bearish market suggests waiting for better terms')
        else:  # Strong bearish
            base_signal = 'WAIT / AVOID AGGRESSIVE FIXING'
            signals.append('Strong bearish market suggests avoiding forward contracts')
        
        # Adjust for volatility
        if volatility == 'HIGH':
            signals.append('High volatility increases risk - consider more frequent reviews')
        
        # Adjust for forward market
        if forward_signal == 'POSITIVE':
            signals.append('Positive forward market supports current pricing')
        elif forward_signal == 'NEGATIVE':
            signals.append('Negative forward market suggests caution')
        
        # Adjust for bunker pressure
        if bunker_pressure == 'HIGH':
            signals.append('High bunker costs reduce voyage economics')
        
        # Adjust for port pressure
        if port_pressure == 'HIGH':
            signals.append('High port congestion increases delay risk')
        
        return base_signal
    
    def assess_market_volatility(self, freight_volatility_30d: float,
                                current_freq: Optional[float] = None) -> str:
        """
        Assess market volatility level.
        
        Args:
            freight_volatility_30d: 30-day freight volatility
            current_freq: Optional current frequency data
            
        Returns:
            Volatility level (LOW, MEDIUM, HIGH)
        """
        # Use percentile-based classification
        # These are example thresholds - should be calibrated on historical data
        if freight_volatility_30d < 0.10:
            return 'LOW'
        elif freight_volatility_30d < 0.30:
            return 'MEDIUM'
        else:
            return 'HIGH'
    
    def assess_forward_signal(self, ffa_curve_slope: float,
                             ffa_1m_premium: float,
                             freight_level: float) -> str:
        """
        Assess forward market signal.
        
        Args:
            ffa_curve_slope: FFA curve slope (1M-3M)
            ffa_1m_premium: FFA 1M premium
            freight_level: Current freight level
            
        Returns:
            Signal (POSITIVE, NEUTRAL, NEGATIVE)
        """
        signals = []
        
        # Curve slope: positive = contango = bullish
        if ffa_curve_slope > 20:
            signals.append(1)  # Positive
        elif ffa_curve_slope < -20:
            signals.append(-1)  # Negative
        else:
            signals.append(0)  # Neutral
        
        # Premium: positive premium = bullish
        if ffa_1m_premium > 10:
            signals.append(1)
        elif ffa_1m_premium < -10:
            signals.append(-1)
        else:
            signals.append(0)
        
        # Overall signal
        signal_sum = sum(signals)
        if signal_sum >= 1:
            return 'POSITIVE'
        elif signal_sum <= -1:
            return 'NEGATIVE'
        else:
            return 'NEUTRAL'
    
    def assess_bunker_pressure(self, bunker_price: float,
                              freight_price: float,
                              bunker_volatility: Optional[float] = None) -> str:
        """
        Assess bunker cost pressure.
        
        Args:
            bunker_price: Current bunker price ($/MT)
            freight_price: Current freight price
            bunker_volatility: Optional bunker volatility
            
        Returns:
            Pressure level (LOW, MODERATE, HIGH)
        """
        # Bunker to freight ratio
        if freight_price > 0:
            bunker_freight_ratio = bunker_price / (freight_price * 1000)  # Rough conversion
            
            if bunker_freight_ratio < 0.05:
                return 'LOW'
            elif bunker_freight_ratio < 0.10:
                return 'MODERATE'
            else:
                return 'HIGH'
        else:
            return 'MODERATE'
    
    def assess_port_pressure(self, port_calls_count: int,
                            avg_waiting_hours: float,
                            historical_avg_wait: Optional[float] = None) -> str:
        """
        Assess port congestion pressure.
        
        Args:
            port_calls_count: Number of port calls
            avg_waiting_hours: Average waiting hours
            historical_avg_wait: Historical average for comparison
            
        Returns:
            Pressure level (LOW, MEDIUM, HIGH)
        """
        if historical_avg_wait:
            wait_ratio = avg_waiting_hours / historical_avg_wait
        else:
            wait_ratio = 1.0
        
        if avg_waiting_hours < 30:
            return 'LOW'
        elif avg_waiting_hours < 60 and wait_ratio < 1.5:
            return 'MEDIUM'
        else:
            return 'HIGH'
    
    def generate_top_factors(self, feature_importance: pd.DataFrame,
                            model_prediction: str,
                            n_factors: int = 5) -> List[str]:
        """
        Generate top contributing factors to prediction.
        
        Args:
            feature_importance: Feature importance DataFrame
            model_prediction: The model's prediction
            n_factors: Number of top factors to return
            
        Returns:
            List of top contributing factors
        """
        if feature_importance is None or len(feature_importance) == 0:
            return []
        
        # Get top positive and negative features
        top_features = feature_importance.head(n_factors)
        
        factors = []
        for _, row in top_features.iterrows():
            factors.append(f"{row['feature']} (importance: {row['importance']:.3f})")
        
        return factors
    
    def generate_score_report(self, probabilities: Dict,
                             feature_importance: Optional[pd.DataFrame] = None,
                             factors: Optional[List[str]] = None) -> Dict:
        """
        Generate comprehensive market intelligence report.
        
        Args:
            probabilities: Model probabilities
            feature_importance: Optional feature importance
            factors: Optional top factors list
            
        Returns:
            Comprehensive report dictionary
        """
        market_score = self.calculate_market_score(probabilities)
        regime_interpretation = self.interpret_market_score(market_score)
        
        report = {
            'market_score': market_score,
            'market_regime_interpretation': regime_interpretation,
            'probabilities': {
                'bearish': round(probabilities.get('bearish', 0), 3),
                'neutral': round(probabilities.get('neutral', 0), 3),
                'bullish': round(probabilities.get('bullish', 0), 3)
            },
            'confidence': round(max(probabilities.values()), 3),
            'top_factors': factors or [],
            'recommendation': 'Decision support signal - not a guaranteed outcome'
        }
        
        return report
