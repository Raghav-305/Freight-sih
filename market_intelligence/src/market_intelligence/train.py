"""
Model training module for Market Intelligence Model.

Handles:
- Training multiple baseline and main models
- Hyperparameter configuration
- Training with appropriate class weights
- Model serialization
"""

import pandas as pd
import numpy as np
import logging
import pickle
from typing import Dict, List, Optional, Tuple, Any
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from .config import Config

logger = logging.getLogger(__name__)

class ModelTrainer:
    """Train multiple models for market regime classification."""
    
    def __init__(self, config: Config = None):
        """
        Initialize model trainer.
        
        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.models: Dict[str, Any] = {}
        self.feature_names: List[str] = []
    
    def train_majority_baseline(self, y_train: pd.Series) -> Dict:
        """
        Train majority class baseline model.
        
        Args:
            y_train: Training target values
            
        Returns:
            Dictionary containing baseline predictions
        """
        logger.info("Training MAJORITY CLASS baseline...")
        
        majority_class = y_train.value_counts().idxmax()
        baseline_pred = np.array([majority_class] * len(y_train))
        
        self.models['majority_baseline'] = {'prediction': majority_class}
        
        logger.info(f"  Majority class: {majority_class}")
        
        return {'prediction': majority_class, 'y_pred': baseline_pred}
    
    def train_momentum_baseline(self, X_train: pd.DataFrame, 
                               y_train: pd.Series) -> Dict:
        """
        Train momentum-based baseline model.
        
        Args:
            X_train: Training features
            y_train: Training target values
            
        Returns:
            Dictionary containing baseline predictions
        """
        logger.info("Training MOMENTUM baseline...")
        
        # Use freight momentum to predict
        if 'momentum_7d' in X_train.columns:
            momentum = X_train['momentum_7d']
            y_pred = np.where(momentum > 0, 'BULLISH',
                             np.where(momentum < 0, 'BEARISH', 'NEUTRAL'))
        else:
            # Fallback
            y_pred = ['NEUTRAL'] * len(X_train)
        
        self.models['momentum_baseline'] = {'feature': 'momentum_7d'}
        
        logger.info(f"  Using feature: momentum_7d")
        
        return {'y_pred': y_pred}
    
    def train_logistic_regression(self, X_train: pd.DataFrame,
                                 y_train: pd.Series) -> LogisticRegression:
        """
        Train Logistic Regression baseline model.
        
        Args:
            X_train: Training features
            y_train: Training target values
            
        Returns:
            Fitted Logistic Regression model
        """
        logger.info("Training LOGISTIC REGRESSION...")
        
        model = LogisticRegression(**self.config.LR_PARAMS)
        model.fit(X_train, y_train)
        
        self.models['logistic_regression'] = model
        
        logger.info(f"  Model trained")
        
        return model
    
    def train_random_forest(self, X_train: pd.DataFrame,
                           y_train: pd.Series) -> RandomForestClassifier:
        """
        Train Random Forest model.
        
        Args:
            X_train: Training features
            y_train: Training target values
            
        Returns:
            Fitted Random Forest model
        """
        logger.info("Training RANDOM FOREST...")
        
        model = RandomForestClassifier(**self.config.RF_PARAMS)
        model.fit(X_train, y_train)
        
        self.models['random_forest'] = model
        
        logger.info(f"  Model trained with {model.n_estimators} trees")
        
        return model
    
    def train_xgboost(self, X_train: pd.DataFrame, y_train: pd.Series,
                     X_val: Optional[pd.DataFrame] = None,
                     y_val: Optional[pd.Series] = None) -> XGBClassifier:
        """
        Train XGBoost model with optional early stopping.
        
        Args:
            X_train: Training features
            y_train: Training target values
            X_val: Optional validation features for early stopping
            y_val: Optional validation target values
            
        Returns:
            Fitted XGBoost model
        """
        logger.info("Training XGBOOST...")
        
        # Encode target for XGBoost
        le = LabelEncoder()
        y_train_encoded = le.fit_transform(y_train)
        if X_val is not None:
            y_val_encoded = le.transform(y_val)
        
        model = XGBClassifier(**self.config.XGBOOST_PARAMS)
        
        # Prepare evaluation set for early stopping
        eval_set = None
        if X_val is not None:
            eval_set = [(X_val, y_val_encoded)]
        
        model.fit(
            X_train, y_train_encoded,
            eval_set=eval_set,
            verbose=False
        )
        
        self.models['xgboost'] = model
        
        # Store label encoder
        self.models['label_encoder'] = le
        
        logger.info(f"  Model trained with {model.n_estimators} boosting rounds")
        
        return model
    
    def get_feature_importance(self, model_name: str) -> Optional[pd.DataFrame]:
        """
        Get feature importance from a trained model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            DataFrame with feature importance or None if not available
        """
        if model_name not in self.models:
            logger.warning(f"Model {model_name} not found")
            return None
        
        model = self.models[model_name]
        
        # XGBoost
        if hasattr(model, 'feature_importances_'):
            importance = model.feature_importances_
        elif hasattr(model, 'coef_'):
            # Logistic regression
            importance = np.abs(model.coef_).mean(axis=0)
        else:
            return None
        
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
        
        importance_df['rank'] = range(1, len(importance_df) + 1)
        
        return importance_df
    
    def save_model(self, model_name: str, filepath: Optional[str] = None) -> None:
        """
        Save a trained model to disk.
        
        Args:
            model_name: Name of the model to save
            filepath: Optional path to save to
        """
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
        
        model = self.models[model_name]
        filepath = filepath or str(self.config.MODEL_FILE)
        
        with open(filepath, 'wb') as f:
            pickle.dump(model, f)
        
        logger.info(f"Model {model_name} saved to: {filepath}")
    
    def load_model(self, filepath: Optional[str] = None) -> Any:
        """
        Load a trained model from disk.
        
        Args:
            filepath: Path to model file
            
        Returns:
            Loaded model
        """
        filepath = filepath or str(self.config.MODEL_FILE)
        
        with open(filepath, 'rb') as f:
            model = pickle.load(f)
        
        logger.info(f"Model loaded from: {filepath}")
        
        return model
    
    def set_feature_names(self, feature_names: List[str]) -> None:
        """Set feature names for later use."""
        self.feature_names = feature_names
        logger.info(f"Set feature names: {len(feature_names)} features")
    
    def get_model(self, model_name: str) -> Optional[Any]:
        """Get a trained model by name."""
        return self.models.get(model_name)
    
    def list_trained_models(self) -> List[str]:
        """Get list of trained model names."""
        return list(self.models.keys())
