"""
Feature engineering module for Market Intelligence Model.

Handles:
- Market indicator features (Baltic, FFA)
- Technical features (moving averages, volatility, momentum)
- Port and operational features
- Weather features
- Temporal features
- Feature scaling and normalization
"""

import pandas as pd
import numpy as np
import logging
from typing import List, Optional, Tuple
from sklearn.preprocessing import StandardScaler
from .config import Config

logger = logging.getLogger(__name__)

class FeatureEngineer:
    """Create and manage features for market intelligence model."""
    
    def __init__(self, config: Config = None):
        """
        Initialize feature engineer.
        
        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.scaler: Optional[StandardScaler] = None
        self.feature_columns: List[str] = []
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer all features from raw data.
        
        Args:
            df: Input DataFrame with raw data
            
        Returns:
            DataFrame with engineered features
        """
        df = df.copy()
        
        logger.info("Starting feature engineering...")
        
        # Ensure date is datetime
        df['date'] = pd.to_datetime(df['date'])
        
        # Group by route and create features
        df = self._engineer_route_features(df)
        
        logger.info(f"Feature engineering complete. Total features: {len(self.get_feature_columns(df))}")
        
        return df
    
    def _engineer_route_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features grouped by route."""
        
        # For each route, create features
        for route_id in df['route_id'].unique():
            route_mask = df['route_id'] == route_id
            route_indices = df[route_mask].index
            
            # Sort by date for this route
            route_df = df.loc[route_indices].sort_values('date')
            
            # Fill forward any missing values within route
            for col in df.select_dtypes(include=[np.number]).columns:
                if col in ['future_freight_usd_mt_7d', 'future_freight_usd_mt_14d',
                           'future_freight_usd_mt_30d', 'future_freight_usd_mt_60d']:
                    continue  # Don't fill forward target values
                
                # Simple forward fill for missing values (using newer pandas syntax)
                route_filled = route_df[col].ffill().bfill()
                df.loc[route_indices, col] = route_filled.values
        
        # Handle global missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        
        return df
    
    def get_feature_columns(self, df: pd.DataFrame) -> List[str]:
        """
        Get list of valid feature columns from DataFrame.
        
        Args:
            df: DataFrame with data
            
        Returns:
            List of feature column names
        """
        exclude = self.config.get_columns_to_exclude()
        features = [col for col in df.columns if col not in exclude]
        return features
    
    def select_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Select relevant features for modeling.
        
        Args:
            df: DataFrame with engineered features
            
        Returns:
            DataFrame with selected features only
        """
        feature_cols = self.get_feature_columns(df)
        
        # Filter to only numeric features
        numeric_feature_cols = [col for col in feature_cols 
                               if col in df.select_dtypes(include=[np.number]).columns]
        
        self.feature_columns = numeric_feature_cols
        
        logger.info(f"Selected {len(numeric_feature_cols)} numeric features for modeling")
        
        return df[numeric_feature_cols + ['date', 'route_id']]
    
    def scale_features(self, X_train: pd.DataFrame, X_test: pd.DataFrame,
                      fit: bool = True) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Scale features using StandardScaler.
        
        Args:
            X_train: Training features
            X_test: Test features
            fit: Whether to fit the scaler on training data
            
        Returns:
            Tuple of (scaled_X_train, scaled_X_test)
        """
        feature_cols = [col for col in X_train.columns 
                       if col not in ['date', 'route_id']]
        
        if fit:
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train[feature_cols])
            logger.info("Scaler fitted on training data")
        else:
            if self.scaler is None:
                raise ValueError("Scaler not fitted. Call with fit=True first.")
            X_train_scaled = self.scaler.transform(X_train[feature_cols])
        
        X_test_scaled = self.scaler.transform(X_test[feature_cols])
        
        # Reconstruct DataFrames
        X_train_result = pd.DataFrame(X_train_scaled, columns=feature_cols, index=X_train.index)
        X_test_result = pd.DataFrame(X_test_scaled, columns=feature_cols, index=X_test.index)
        
        # Add back metadata columns
        for col in ['date', 'route_id']:
            if col in X_train.columns:
                X_train_result[col] = X_train[col].values
                X_test_result[col] = X_test[col].values
        
        return X_train_result, X_test_result
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Handle missing values in the dataset.
        
        Args:
            df: DataFrame with potential missing values
            
        Returns:
            DataFrame with missing values handled
        """
        df = df.copy()
        
        # For numeric columns, use mean imputation
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df[col].isnull().any():
                mean_val = df[col].mean()
                df[col].fillna(mean_val, inplace=True)
                logger.info(f"Filled {col} missing values with mean: {mean_val:.2f}")
        
        # For categorical columns, use forward fill then backward fill
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if df[col].isnull().any():
                df[col] = df[col].ffill().bfill()
                logger.info(f"Filled {col} missing values using forward/backward fill")
        
        return df
    
    def remove_outliers(self, df: pd.DataFrame, threshold: float = 3.0) -> pd.DataFrame:
        """
        Remove outliers using z-score method.
        
        Args:
            df: DataFrame with data
            threshold: Z-score threshold for outlier detection
            
        Returns:
            DataFrame with outliers removed or clipped
        """
        df = df.copy()
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if col in ['future_freight_usd_mt_7d', 'future_freight_usd_mt_14d',
                       'future_freight_usd_mt_30d', 'future_freight_usd_mt_60d']:
                continue  # Don't modify target values
            
            mean = df[col].mean()
            std = df[col].std()
            
            # Clip outliers
            upper_bound = mean + (threshold * std)
            lower_bound = mean - (threshold * std)
            
            n_outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
            
            if n_outliers > 0:
                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                logger.info(f"Clipped {n_outliers} outliers in {col}")
        
        return df
    
    def create_vessel_class_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create vessel class specific features by mapping to appropriate Baltic index.
        
        Args:
            df: DataFrame with vessel data
            
        Returns:
            DataFrame with vessel class features
        """
        df = df.copy()
        
        # Vessel class to Baltic index mapping
        vessel_to_baltic = {
            'Handysize': 'bhsi',
            'Supramax': 'bsi',
            'Panamax': 'bpi',
            'Capesize': 'bci'
        }
        
        if 'vessel_class' in df.columns:
            df['vessel_class_index'] = df['vessel_class'].map(vessel_to_baltic)
            logger.info("Created vessel class to Baltic index mapping")
        
        return df
    
    def create_route_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create route-specific aggregated features.
        
        Args:
            df: DataFrame with route data
            
        Returns:
            DataFrame with route features
        """
        df = df.copy()
        
        # Route statistics
        if 'route_id' in df.columns:
            route_stats = df.groupby('route_id').agg({
                'freight_usd_mt': ['mean', 'std', 'min', 'max'],
                'tce_usd_day': 'mean',
                'distance_nm': 'mean'
            }).reset_index()
            
            route_stats.columns = ['route_id', 'route_freight_mean', 'route_freight_std',
                                  'route_freight_min', 'route_freight_max',
                                  'route_tce_mean', 'route_distance']
            
            df = df.merge(route_stats, on='route_id', how='left')
            logger.info("Created route-specific features")
        
        return df
    
    def save_scaler(self, filepath: Optional[str] = None) -> None:
        """Save fitted scaler to file."""
        if self.scaler is None:
            logger.warning("No scaler to save")
            return
        
        import pickle
        filepath = filepath or str(self.config.SCALER_FILE)
        
        with open(filepath, 'wb') as f:
            pickle.dump(self.scaler, f)
        logger.info(f"Scaler saved to: {filepath}")
    
    def load_scaler(self, filepath: Optional[str] = None) -> None:
        """Load fitted scaler from file."""
        import pickle
        filepath = filepath or str(self.config.SCALER_FILE)
        
        with open(filepath, 'rb') as f:
            self.scaler = pickle.load(f)
        logger.info(f"Scaler loaded from: {filepath}")
