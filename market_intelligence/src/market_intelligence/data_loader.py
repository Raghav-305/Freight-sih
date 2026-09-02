"""
Data loading and inspection module for Market Intelligence Model.

Handles:
- Loading market intelligence data from CSV
- Initial data inspection and validation
- Basic data cleaning
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Tuple, Dict, List, Optional
from .config import Config

logger = logging.getLogger(__name__)

class DataLoader:
    """Load and inspect market intelligence data."""
    
    def __init__(self, config: Config = None):
        """
        Initialize data loader.
        
        Args:
            config: Configuration object containing data paths and settings
        """
        self.config = config or Config()
        self.df: Optional[pd.DataFrame] = None
        self.original_df: Optional[pd.DataFrame] = None
        
    def load_data(self, filepath: Optional[Path] = None) -> pd.DataFrame:
        """
        Load market intelligence data from CSV file.
        
        Args:
            filepath: Path to CSV file. Uses config default if not provided.
            
        Returns:
            Loaded DataFrame
        """
        filepath = filepath or self.config.DATA_FILE
        
        logger.info(f"Loading data from: {filepath}")
        
        try:
            self.df = pd.read_csv(filepath, low_memory=False)
            # Store original for reference
            self.original_df = self.df.copy()
            
            logger.info(f"Data loaded successfully: {self.df.shape[0]:,} rows × {self.df.shape[1]} columns")
            
            return self.df
            
        except FileNotFoundError:
            logger.error(f"Data file not found: {filepath}")
            raise
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise
    
    def inspect_data(self) -> Dict:
        """
        Perform comprehensive data inspection.
        
        Returns:
            Dictionary containing inspection results
        """
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        df = self.df
        inspection = {
            'shape': df.shape,
            'memory_usage': df.memory_usage(deep=True).sum() / 1024**2,  # MB
            'date_range': {
                'min': df['date'].min(),
                'max': df['date'].max(),
                'unique': df['date'].nunique()
            },
            'duplicates': df.duplicated().sum(),
            'null_counts': df.isnull().sum().to_dict(),
            'null_percentages': (df.isnull().sum() / len(df) * 100).to_dict(),
            'dtypes': df.dtypes.to_dict(),
            'numeric_summary': df.describe().to_dict(),
            'categorical_summary': {}
        }
        
        # Categorical columns summary
        for col in df.select_dtypes(include=['object']).columns:
            inspection['categorical_summary'][col] = {
                'unique_values': df[col].nunique(),
                'values': df[col].unique().tolist() if df[col].nunique() <= 20 else None
            }
        
        logger.info(f"Data inspection complete: {df.shape[0]:,} rows, {df.shape[1]} columns")
        
        return inspection
    
    def get_date_range(self) -> Tuple[str, str]:
        """
        Get date range of the data.
        
        Returns:
            Tuple of (min_date, max_date)
        """
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        return str(self.df['date'].min()), str(self.df['date'].max())
    
    def get_routes(self) -> Dict[str, List[str]]:
        """
        Get available routes in the data.
        
        Returns:
            Dictionary with origins as keys and list of destinations as values
        """
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        routes = {}
        for origin in self.df['origin'].unique():
            routes[origin] = self.df[self.df['origin'] == origin]['destination_port'].unique().tolist()
        
        return routes
    
    def get_vessel_classes(self) -> List[str]:
        """
        Get unique vessel classes in the data.
        
        Returns:
            List of vessel classes
        """
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        return self.df['vessel_class'].unique().tolist()
    
    def get_numeric_columns(self) -> List[str]:
        """
        Get list of numeric columns.
        
        Returns:
            List of numeric column names
        """
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        return self.df.select_dtypes(include=[np.number]).columns.tolist()
    
    def get_categorical_columns(self) -> List[str]:
        """
        Get list of categorical columns.
        
        Returns:
            List of categorical column names
        """
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        return self.df.select_dtypes(include=['object']).columns.tolist()
    
    def convert_date_column(self) -> None:
        """Convert date column to datetime if not already."""
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if self.df['date'].dtype == 'object':
            self.df['date'] = pd.to_datetime(self.df['date'])
            logger.info("Date column converted to datetime")
    
    def sort_by_date(self) -> None:
        """Sort dataframe by date."""
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        self.df = self.df.sort_values('date').reset_index(drop=True)
        logger.info("Data sorted by date")
    
    def get_subset(self, start_date: Optional[str] = None, 
                   end_date: Optional[str] = None,
                   route_ids: Optional[List[str]] = None) -> pd.DataFrame:
        """
        Get subset of data based on date range and/or route IDs.
        
        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            route_ids: List of route IDs to include
            
        Returns:
            Filtered DataFrame
        """
        if self.df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        df = self.df.copy()
        
        if start_date:
            df = df[df['date'] >= start_date]
        
        if end_date:
            df = df[df['date'] <= end_date]
        
        if route_ids:
            df = df[df['route_id'].isin(route_ids)]
        
        return df
