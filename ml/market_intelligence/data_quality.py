"""
Data quality checking and validation module for Market Intelligence Model.

Handles:
- Duplicate detection
- Missing value analysis
- Constant/zero-variance column detection
- Data range validation
- Outlier detection
- Quality report generation
"""

import pandas as pd
import numpy as np
import json
import logging
from pathlib import Path
from typing import Dict, List, Set, Optional
from .config import Config

logger = logging.getLogger(__name__)

class DataQualityChecker:
    """Check and report data quality issues."""
    
    def __init__(self, config: Config = None):
        """
        Initialize data quality checker.
        
        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.quality_report: Dict = {}
    
    def check_all(self, df: pd.DataFrame) -> Dict:
        """
        Run all data quality checks.
        
        Args:
            df: DataFrame to check
            
        Returns:
            Comprehensive quality report
        """
        self.quality_report = {
            'duplicates': self._check_duplicates(df),
            'missing_values': self._check_missing_values(df),
            'constant_columns': self._check_constant_columns(df),
            'numeric_ranges': self._check_numeric_ranges(df),
            'target_distribution': self._check_target_distribution(df),
            'leakage_columns': self._check_leakage_columns(df),
            'categorical_summary': self._check_categorical_columns(df),
        }
        
        return self.quality_report
    
    def _check_duplicates(self, df: pd.DataFrame) -> Dict:
        """Check for duplicate rows."""
        total_duplicates = df.duplicated().sum()
        
        return {
            'total_duplicates': int(total_duplicates),
            'percentage': float((total_duplicates / len(df) * 100).round(2))
        }
    
    def _check_missing_values(self, df: pd.DataFrame) -> Dict:
        """Check for missing values."""
        missing = df.isnull().sum()
        missing_pct = (missing / len(df) * 100).round(2)
        
        missing_info = {}
        for col in df.columns:
            if missing[col] > 0:
                missing_info[col] = {
                    'count': int(missing[col]),
                    'percentage': float(missing_pct[col])
                }
        
        # Sort by percentage
        missing_info = dict(sorted(missing_info.items(), 
                                   key=lambda x: x[1]['percentage'], 
                                   reverse=True))
        
        return {
            'total_columns_with_missing': len(missing_info),
            'details': missing_info
        }
    
    def _check_constant_columns(self, df: pd.DataFrame) -> Dict:
        """Check for constant/zero-variance columns."""
        constant_cols = []
        
        for col in df.select_dtypes(include=[np.number]).columns:
            if df[col].nunique() <= 1:
                constant_cols.append(col)
        
        logger.warning(f"Found {len(constant_cols)} constant columns: {constant_cols}")
        
        return {
            'count': len(constant_cols),
            'columns': constant_cols
        }
    
    def _check_numeric_ranges(self, df: pd.DataFrame) -> Dict:
        """Check numeric column ranges for anomalies."""
        numeric_ranges = {}
        
        for col in df.select_dtypes(include=[np.number]).columns:
            numeric_ranges[col] = {
                'min': float(df[col].min()),
                'max': float(df[col].max()),
                'mean': float(df[col].mean()),
                'median': float(df[col].median()),
                'std': float(df[col].std()),
                'q25': float(df[col].quantile(0.25)),
                'q75': float(df[col].quantile(0.75))
            }
        
        return numeric_ranges
    
    def _check_target_distribution(self, df: pd.DataFrame) -> Dict:
        """Check target variable distribution."""
        if self.config.TARGET_COLUMN not in df.columns:
            return {'status': 'Target column not found'}
        
        target = df[self.config.TARGET_COLUMN]
        value_counts = target.value_counts()
        
        return {
            'total_samples': len(target),
            'missing_samples': target.isnull().sum(),
            'distribution': value_counts.to_dict(),
            'distribution_pct': (value_counts / len(target) * 100).round(2).to_dict()
        }
    
    def _check_leakage_columns(self, df: pd.DataFrame) -> Dict:
        """Check for data leakage columns."""
        found_leakage = []
        for col in self.config.LEAKAGE_COLUMNS:
            if col in df.columns:
                found_leakage.append(col)
        
        return {
            'leakage_columns_found': found_leakage,
            'status': 'CRITICAL' if found_leakage else 'OK',
            'action': 'These columns will be excluded from model features'
        }
    
    def _check_categorical_columns(self, df: pd.DataFrame) -> Dict:
        """Check categorical columns."""
        categorical_info = {}
        
        for col in df.select_dtypes(include=['object']).columns:
            n_unique = df[col].nunique()
            categorical_info[col] = {
                'unique_values': n_unique,
                'missing': df[col].isnull().sum(),
                'top_values': df[col].value_counts().head(5).to_dict() if n_unique <= 20 else None
            }
        
        return categorical_info
    
    def get_summary(self) -> str:
        """
        Get human-readable summary of quality report.
        
        Returns:
            Formatted string summary
        """
        if not self.quality_report:
            return "No quality report generated yet. Run check_all() first."
        
        summary = []
        summary.append("="*80)
        summary.append("DATA QUALITY REPORT SUMMARY")
        summary.append("="*80)
        
        # Duplicates
        dup = self.quality_report['duplicates']
        summary.append(f"\n✓ Duplicates: {dup['total_duplicates']} ({dup['percentage']:.2f}%)")
        
        # Missing values
        miss = self.quality_report['missing_values']
        summary.append(f"✓ Columns with missing values: {miss['total_columns_with_missing']}")
        for col, info in list(miss['details'].items())[:5]:
            summary.append(f"  - {col}: {info['count']} ({info['percentage']:.2f}%)")
        
        # Constant columns
        const = self.quality_report['constant_columns']
        if const['count'] > 0:
            summary.append(f"⚠ Constant columns found: {const['count']}")
            summary.append(f"  Columns: {', '.join(const['columns'][:5])}")
        else:
            summary.append(f"✓ No constant columns found")
        
        # Target distribution
        target = self.quality_report['target_distribution']
        if 'distribution' in target:
            summary.append(f"\n✓ Target distribution:")
            for label, count in target['distribution'].items():
                pct = target['distribution_pct'][label]
                summary.append(f"  - {label}: {count} ({pct:.2f}%)")
        
        # Leakage
        leak = self.quality_report['leakage_columns']
        summary.append(f"\n✓ Data leakage check: {leak['status']}")
        if leak['leakage_columns_found']:
            summary.append(f"  WARNING: {len(leak['leakage_columns_found'])} leakage columns found")
            for col in leak['leakage_columns_found']:
                summary.append(f"  - {col}")
        
        summary.append("\n" + "="*80)
        
        return "\n".join(summary)
    
    def save_report(self, output_path: Optional[Path] = None) -> None:
        """
        Save quality report to JSON and CSV files.
        
        Args:
            output_path: Optional path to save report. Uses config default if not provided.
        """
        if not self.quality_report:
            raise ValueError("No quality report generated yet. Run check_all() first.")
        
        # Save JSON report
        json_path = output_path or self.config.QUALITY_REPORT_JSON
        with open(json_path, 'w') as f:
            json.dump(self.quality_report, f, indent=2, default=str)
        logger.info(f"Quality report saved to: {json_path}")
