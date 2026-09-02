"""
Prediction and Inference module for Market Intelligence Model.

Handles:
- Loading trained models for inference
- Making predictions on new data
- Generating comprehensive market intelligence output
- CSV output generation for dashboards
"""

import pandas as pd
import numpy as np
import logging
import pickle
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from .config import Config
from .scoring import MarketIntelligenceScorer

logger = logging.getLogger(__name__)

class MarketIntelligencePredictor:
    """Make predictions using trained models."""
    
    def __init__(self, config: Config = None):
        """
        Initialize predictor.
        
        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.model: Optional[Any] = None
        self.scaler: Optional[Any] = None
        self.imputer: Optional[Any] = None
        self.feature_columns: List[str] = []
        self.scorer = MarketIntelligenceScorer(config)
        self.label_encoder: Optional[Any] = None
    
    def load_model(self, model_path: Optional[str] = None) -> None:
        """Load trained model from disk."""
        model_path = model_path or str(self.config.MODEL_FILE)
        
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        
        logger.info(f"Model loaded from: {model_path}")
    
    def load_scaler(self, scaler_path: Optional[str] = None) -> None:
        """Load fitted scaler from disk."""
        scaler_path = scaler_path or str(self.config.SCALER_FILE)
        
        if Path(scaler_path).exists():
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            logger.info(f"Scaler loaded from: {scaler_path}")
    
    def load_imputer(self, imputer_path: Optional[str] = None) -> None:
        """Load fitted imputer from disk."""
        imputer_path = imputer_path or str(self.config.IMPUTER_FILE)
        
        if Path(imputer_path).exists():
            with open(imputer_path, 'rb') as f:
                self.imputer = pickle.load(f)
            logger.info(f"Imputer loaded from: {imputer_path}")
    
    def load_feature_columns(self, feature_path: Optional[str] = None) -> None:
        """Load feature column names from disk."""
        feature_path = feature_path or str(self.config.FEATURE_COLUMNS_FILE)
        
        if Path(feature_path).exists():
            with open(feature_path, 'r') as f:
                self.feature_columns = json.load(f)
            logger.info(f"Feature columns loaded: {len(self.feature_columns)} features")
    
    def predict(self, X: pd.DataFrame) -> Dict:
        """
        Make predictions on new data.
        
        Args:
            X: Input features DataFrame
            
        Returns:
            Dictionary with predictions and probabilities
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")

        missing_features = [col for col in self.feature_columns if col not in X.columns]
        if missing_features:
            for col in missing_features:
                X[col] = 0.0

        # Select only required features
        X_model = X[self.feature_columns].copy()
        for column in self.feature_columns:
            if pd.api.types.is_numeric_dtype(X_model[column]):
                X_model[column] = pd.to_numeric(X_model[column], errors='coerce')
                X_model[column] = X_model[column].fillna(X_model[column].median())
            else:
                X_model[column] = X_model[column].fillna('')
        
        # Handle missing values
        if self.imputer:
            X_model = self.imputer.transform(X_model)
            X_model = pd.DataFrame(X_model, columns=self.feature_columns)
        else:
            X_model = X_model.fillna(X_model.mean())
        
        # Scale if scaler available
        if self.scaler:
            X_scaled = self.scaler.transform(X_model)
            X_model = pd.DataFrame(X_scaled, columns=self.feature_columns)
        
        # Make predictions
        y_pred = self.model.predict(X_model)
        
        # Get probabilities
        y_proba = None
        if hasattr(self.model, 'predict_proba'):
            y_proba = self.model.predict_proba(X_model)
        
        # Decode predictions if using label encoder
        if hasattr(self.model, 'classes_'):
            classes = self.model.classes_
            y_pred_decoded = [classes[int(p)] if hasattr(p, '__int__') else self.config.INVERSE_CLASS_MAPPING.get(p, p)
                            for p in y_pred]
        else:
            y_pred_decoded = y_pred
        
        return {
            'predictions': y_pred_decoded,
            'probabilities': y_proba,
            'classes': self.model.classes_ if hasattr(self.model, 'classes_') else list(self.config.CLASS_MAPPING.keys())
        }
    
    def predict_market_intelligence(self, input_df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate complete market intelligence predictions for input data.
        
        Args:
            input_df: Input DataFrame with features
            
        Returns:
            DataFrame with market intelligence output
        """
        logger.info(f"Generating market intelligence predictions for {len(input_df)} records")
        
        # Make predictions
        pred_result = self.predict(input_df)
        
        output_df = input_df[['date', 'route_id', 'origin', 'destination_port', 
                             'vessel_class', 'freight_usd_mt']].copy()
        
        # Add predictions
        output_df['market_regime'] = pred_result['predictions']
        
        # Add probabilities
        if pred_result['probabilities'] is not None:
            prob_matrix = np.asarray(pred_result['probabilities'])
            class_names = [str(c).lower() for c in pred_result.get('classes', [])]
            if prob_matrix.ndim == 2 and len(class_names) == prob_matrix.shape[1]:
                for idx, class_name in enumerate(class_names):
                    output_df[f'{class_name}_probability'] = pd.to_numeric(prob_matrix[:, idx], errors='coerce')
            else:
                output_df['bearish_probability'] = pd.to_numeric(prob_matrix.ravel()[0], errors='coerce') if prob_matrix.size == 1 else 0.0
                output_df['neutral_probability'] = 0.0
                output_df['bullish_probability'] = 0.0

        # Calculate market score
        output_df['market_score'] = output_df.apply(
            lambda row: self.scorer.calculate_market_score({
                'bearish': row.get('bearish_probability', 0),
                'neutral': row.get('neutral_probability', 0),
                'bullish': row.get('bullish_probability', 0)
            }),
            axis=1
        )
        
        # Add additional intelligence
        if 'freight_change_30d_pct' in input_df.columns:
            output_df['freight_direction'] = input_df['freight_change_30d_pct'].apply(
                lambda x: 'RISING' if x > 0 else ('FALLING' if x < 0 else 'STABLE')
            )
        
        if 'freight_volatility_30d' in input_df.columns:
            output_df['market_volatility'] = input_df['freight_volatility_30d'].apply(
                self.scorer.assess_market_volatility
            )
        
        if 'ffa_curve_slope_1m_3m' in input_df.columns and 'ffa_1m_premium_usd' in input_df.columns:
            output_df['forward_market_signal'] = input_df.apply(
                lambda row: self.scorer.assess_forward_signal(
                    row.get('ffa_curve_slope_1m_3m', 0),
                    row.get('ffa_1m_premium_usd', 0),
                    row.get('freight_usd_mt', 0)
                ),
                axis=1
            )
        
        if 'bunker_price_usd_mt' in input_df.columns:
            output_df['bunker_pressure'] = input_df.apply(
                lambda row: self.scorer.assess_bunker_pressure(
                    row.get('bunker_price_usd_mt', 0),
                    row.get('freight_usd_mt', 1)
                ),
                axis=1
            )
        
        if 'avg_waiting_hours' in input_df.columns:
            output_df['port_pressure'] = input_df['avg_waiting_hours'].apply(
                lambda x: self.scorer.assess_port_pressure(0, x)
            )
        
        logger.info(f"Market intelligence predictions generated for {len(output_df)} records")
        
        return output_df
    
    def save_predictions(self, df: pd.DataFrame, 
                        filepath: Optional[str] = None) -> None:
        """
        Save predictions to CSV.
        
        Args:
            df: Predictions DataFrame
            filepath: Optional output path
        """
        filepath = filepath or str(self.config.LATEST_OUTPUT_CSV)
        
        df.to_csv(filepath, index=False)
        logger.info(f"Predictions saved to: {filepath}")
    
    def generate_decision_output(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate decision-support output with chartering signals.
        
        Args:
            df: Market intelligence predictions
            
        Returns:
            DataFrame with chartering signals
        """
        output_df = df.copy()
        
        # Generate chartering signals
        output_df['chartering_signal'] = output_df.apply(
            lambda row: self.scorer.generate_chartering_signal(
                market_score=row.get('market_score', 50),
                market_regime=row.get('market_regime', 'NEUTRAL'),
                volatility=row.get('market_volatility', 'MEDIUM'),
                forward_signal=row.get('forward_market_signal', 'NEUTRAL'),
                bunker_pressure=row.get('bunker_pressure', 'MODERATE'),
                port_pressure=row.get('port_pressure', 'MEDIUM')
            ),
            axis=1
        )
        
        # Select key output columns
        output_cols = [
            'date', 'route_id', 'origin', 'destination_port', 'vessel_class',
            'freight_usd_mt', 'market_regime', 'market_score',
            'bearish_probability', 'neutral_probability', 'bullish_probability',
            'freight_direction', 'market_volatility', 'forward_market_signal',
            'bunker_pressure', 'port_pressure', 'chartering_signal'
        ]
        
        output_df = output_df[[col for col in output_cols if col in output_df.columns]]
        
        return output_df
