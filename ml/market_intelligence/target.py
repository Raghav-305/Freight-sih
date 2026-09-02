"""
Target creation and leakage prevention module for Market Intelligence Model.

Handles:
- Target variable creation from future freight returns
- Class balancing and threshold configuration
- Validation to prevent data leakage
- Target distribution analysis
"""

import pandas as pd
import numpy as np
import logging
from typing import Tuple, Dict, Optional
from .config import Config

logger = logging.getLogger(__name__)

class TargetCreator:
    """Create and manage target variable for market regime classification."""
    
    def __init__(self, config: Config = None):
        """
        Initialize target creator.
        
        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.target_column = config.TARGET_COLUMN
        self.class_mapping = config.CLASS_MAPPING
    
    def create_target(self, df: pd.DataFrame, 
                     return_column: str = 'future_freight_return_30d_pct',
                     threshold_low: Optional[float] = None,
                     threshold_high: Optional[float] = None) -> pd.DataFrame:
        """
        Create target variable from freight returns.
        
        Args:
            df: Input DataFrame
            return_column: Column containing future returns percentage
            threshold_low: Lower threshold for BEARISH classification
            threshold_high: Upper threshold for BULLISH classification
            
        Returns:
            DataFrame with target variable added
        """
        df = df.copy()
        
        threshold_low = threshold_low or self.config.TARGET_THRESHOLD_LOW
        threshold_high = threshold_high or self.config.TARGET_THRESHOLD_HIGH
        
        logger.info(f"Creating target from {return_column}")
        logger.info(f"Thresholds: BEARISH <= {threshold_low:.1%}, BULLISH >= {threshold_high:.1%}")
        
        if return_column not in df.columns:
            raise ValueError(f"Column {return_column} not found in DataFrame")
        
        # Create target based on thresholds
        target = np.where(df[return_column] <= threshold_low, 'BEARISH',
                         np.where(df[return_column] >= threshold_high, 'BULLISH', 'NEUTRAL'))
        
        df['market_regime_predicted'] = target
        
        # Encode as integers
        df['market_regime_encoded'] = df['market_regime_predicted'].map(self.class_mapping)
        
        # Log distribution
        value_counts = df['market_regime_predicted'].value_counts()
        logger.info("Target distribution:")
        for regime, count in value_counts.items():
            pct = count / len(df) * 100
            logger.info(f"  {regime}: {count:,} ({pct:.1f}%)")
        
        return df
    
    def validate_no_leakage(self, df: pd.DataFrame, 
                           feature_columns: list) -> Dict[str, bool]:
        """
        Validate that feature columns don't contain leakage.
        
        Args:
            df: DataFrame with features
            feature_columns: List of feature column names
            
        Returns:
            Dictionary indicating leakage status for each check
        """
        validation = {
            'no_future_columns': True,
            'no_target_column': True,
            'no_leakage_columns': True,
            'issues': []
        }
        
        # Check for future columns
        future_cols_in_features = [col for col in feature_columns 
                                   if 'future_' in col.lower()]
        if future_cols_in_features:
            validation['no_future_columns'] = False
            validation['issues'].append(f"Found future columns in features: {future_cols_in_features}")
        
        # Check for target column
        if self.target_column in feature_columns:
            validation['no_target_column'] = False
            validation['issues'].append(f"Target column {self.target_column} in features")
        
        # Check for leakage columns
        leakage_in_features = [col for col in feature_columns 
                              if col in self.config.LEAKAGE_COLUMNS]
        if leakage_in_features:
            validation['no_leakage_columns'] = False
            validation['issues'].append(f"Found leakage columns in features: {leakage_in_features}")
        
        if validation['issues']:
            logger.error("Data leakage detected:")
            for issue in validation['issues']:
                logger.error(f"  - {issue}")
        else:
            logger.info("✓ No data leakage detected")
        
        return validation
    
    def remove_rows_with_missing_target(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove rows where target is missing.
        
        Args:
            df: Input DataFrame
            
        Returns:
            DataFrame with rows containing missing targets removed
        """
        df = df.copy()
        
        initial_rows = len(df)
        
        # Remove rows with missing target values
        df = df.dropna(subset=['market_regime_predicted'])
        
        rows_removed = initial_rows - len(df)
        logger.info(f"Removed {rows_removed} rows with missing target values")
        
        return df
    
    def get_class_distribution(self, df: pd.DataFrame) -> Dict:
        """
        Get class distribution statistics.
        
        Args:
            df: DataFrame with target column
            
        Returns:
            Dictionary with distribution statistics
        """
        if 'market_regime_predicted' not in df.columns:
            raise ValueError("Target column not found. Run create_target() first.")
        
        value_counts = df['market_regime_predicted'].value_counts()
        value_counts_pct = (value_counts / len(df) * 100).round(2)
        
        return {
            'total_samples': len(df),
            'distribution': value_counts.to_dict(),
            'distribution_pct': value_counts_pct.to_dict(),
            'imbalance_ratio': max(value_counts) / min(value_counts) if len(value_counts) > 1 else 1.0
        }
    
    def split_temporal(self, df: pd.DataFrame,
                      train_end_year: int = 2024,
                      val_year: int = 2025) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split data temporally (no data leakage from future).
        
        Args:
            df: DataFrame with date column
            train_end_year: Last year for training set
            val_year: Year for validation set
            
        Returns:
            Tuple of (train_df, val_df, test_df)
        """
        df = df.copy()
        df['year'] = pd.to_datetime(df['date']).dt.year
        
        train_df = df[df['year'] <= train_end_year].copy()
        val_df = df[df['year'] == val_year].copy()
        test_df = df[df['year'] > val_year].copy()
        
        logger.info(f"Temporal split:")
        logger.info(f"  Train: {len(train_df):,} rows (years up to {train_end_year})")
        logger.info(f"  Validation: {len(val_df):,} rows (year {val_year})")
        logger.info(f"  Test: {len(test_df):,} rows (years > {val_year})")
        
        # Check target distribution in each split
        for split_name, split_df in [('Train', train_df), ('Validation', val_df), ('Test', test_df)]:
            if len(split_df) > 0 and 'market_regime_predicted' in split_df.columns:
                dist = split_df['market_regime_predicted'].value_counts()
                logger.info(f"  {split_name} target distribution: {dist.to_dict()}")
        
        return train_df.drop('year', axis=1), val_df.drop('year', axis=1), test_df.drop('year', axis=1)
    
    def analyze_thresholds(self, df: pd.DataFrame, 
                          return_column: str = 'future_freight_return_30d_pct') -> Dict:
        """
        Analyze different threshold configurations.
        
        Args:
            df: DataFrame with returns column
            return_column: Column containing returns
            
        Returns:
            Dictionary with analysis for different thresholds
        """
        thresholds = [(-0.03, 0.03), (-0.05, 0.05), (-0.07, 0.07)]
        analysis = {}
        
        for low_thresh, high_thresh in thresholds:
            target = np.where(df[return_column] <= low_thresh, 0,
                             np.where(df[return_column] >= high_thresh, 2, 1))
            
            unique, counts = np.unique(target, return_counts=True)
            dist = {self.config.INVERSE_CLASS_MAPPING[u]: c for u, c in zip(unique, counts)}
            
            analysis[f"{low_thresh:.1%}_to_{high_thresh:.1%}"] = {
                'distribution': dist,
                'imbalance_ratio': max(counts) / min(counts) if len(counts) > 1 else 1.0
            }
        
        logger.info("Threshold sensitivity analysis:")
        for thresh_key, thresh_stats in analysis.items():
            logger.info(f"  {thresh_key}: {thresh_stats['distribution']}")
        
        return analysis
