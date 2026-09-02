"""
Model evaluation module for Market Intelligence Model.

Handles:
- Model evaluation on test sets
- Metrics computation (accuracy, F1, balanced accuracy, etc.)
- Confusion matrix generation
- Walk-forward validation
"""

import pandas as pd
import numpy as np
import logging
import json
from typing import Dict, List, Tuple, Optional, Any
from sklearn.metrics import (
    confusion_matrix, classification_report, accuracy_score,
    f1_score, balanced_accuracy_score, precision_recall_fscore_support
)
import matplotlib.pyplot as plt
from .config import Config

logger = logging.getLogger(__name__)

class ModelEvaluator:
    """Evaluate model performance."""
    
    def __init__(self, config: Config = None):
        """
        Initialize model evaluator.
        
        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.evaluation_results: Dict = {}
    
    def evaluate_model(self, model: Any, X_test: pd.DataFrame, y_test: pd.Series,
                      model_name: str = 'Model') -> Dict:
        """
        Evaluate a model on test data.
        
        Args:
            model: Fitted model
            X_test: Test features
            y_test: Test target values
            model_name: Name of the model for logging
            
        Returns:
            Dictionary with evaluation metrics
        """
        logger.info(f"Evaluating {model_name}...")
        
        # Get predictions
        y_pred = model.predict(X_test)
        
        # Get probabilities if available
        y_proba = None
        if hasattr(model, 'predict_proba'):
            y_proba = model.predict_proba(X_test)
        
        # Compute metrics
        metrics = self._compute_metrics(y_test, y_pred, y_proba)
        metrics['model_name'] = model_name
        
        self.evaluation_results[model_name] = metrics
        
        # Log summary
        logger.info(f"  Accuracy: {metrics['accuracy']:.4f}")
        logger.info(f"  Macro F1: {metrics['f1_macro']:.4f}")
        logger.info(f"  Balanced Accuracy: {metrics['balanced_accuracy']:.4f}")
        
        return metrics
    
    def _compute_metrics(self, y_true: pd.Series, y_pred: np.ndarray,
                        y_proba: Optional[np.ndarray] = None) -> Dict:
        """Compute evaluation metrics."""
        metrics = {
            'accuracy': float(accuracy_score(y_true, y_pred)),
            'balanced_accuracy': float(balanced_accuracy_score(y_true, y_pred)),
            'f1_macro': float(f1_score(y_true, y_pred, average='macro', zero_division=0)),
            'f1_weighted': float(f1_score(y_true, y_pred, average='weighted', zero_division=0)),
            'confusion_matrix': confusion_matrix(y_true, y_pred).tolist(),
            'classification_report': classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        }
        
        # Per-class metrics
        precision, recall, f1, support = precision_recall_fscore_support(
            y_true, y_pred, average=None, zero_division=0
        )
        
        classes = sorted(set(y_true))
        metrics['per_class_metrics'] = {}
        for i, cls in enumerate(classes):
            metrics['per_class_metrics'][str(cls)] = {
                'precision': float(precision[i]),
                'recall': float(recall[i]),
                'f1': float(f1[i]),
                'support': int(support[i])
            }
        
        # Add probabilities if available
        if y_proba is not None:
            metrics['mean_probability_max'] = float(np.mean(np.max(y_proba, axis=1)))
        
        return metrics
    
    def compare_models(self, results_dict: Dict[str, Dict]) -> pd.DataFrame:
        """
        Compare multiple models side by side.
        
        Args:
            results_dict: Dictionary of model evaluation results
            
        Returns:
            DataFrame with comparison
        """
        comparison_data = []
        
        for model_name, metrics in results_dict.items():
            comparison_data.append({
                'Model': model_name,
                'Accuracy': metrics.get('accuracy', 0),
                'Balanced Accuracy': metrics.get('balanced_accuracy', 0),
                'Macro F1': metrics.get('f1_macro', 0),
                'Weighted F1': metrics.get('f1_weighted', 0)
            })
        
        comparison_df = pd.DataFrame(comparison_data).sort_values('Macro F1', ascending=False)
        
        logger.info("\nModel Comparison:")
        logger.info(comparison_df.to_string())
        
        return comparison_df
    
    def plot_confusion_matrix(self, y_true: pd.Series, y_pred: np.ndarray,
                            model_name: str = 'Model',
                            filepath: Optional[str] = None) -> None:
        """
        Plot and save confusion matrix.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            model_name: Name of the model
            filepath: Optional path to save the plot
        """
        cm = confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(8, 6))
        plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
        plt.title(f'Confusion Matrix - {model_name}')
        plt.colorbar()
        
        classes = sorted(set(y_true))
        tick_marks = np.arange(len(classes))
        plt.xticks(tick_marks, classes)
        plt.yticks(tick_marks, classes)
        
        # Add text annotations
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                plt.text(j, i, str(cm[i, j]), ha='center', va='center',
                        color='white' if cm[i, j] > cm.max() / 2 else 'black')
        
        plt.ylabel('True label')
        plt.xlabel('Predicted label')
        plt.tight_layout()
        
        filepath = filepath or str(self.config.CONFUSION_MATRIX_PNG)
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        logger.info(f"Confusion matrix saved to: {filepath}")
        plt.close()
    
    def walk_forward_validation(self, df: pd.DataFrame, 
                               feature_engineer: Any,
                               model_trainer: Any,
                               feature_columns: List[str]) -> pd.DataFrame:
        """
        Perform walk-forward validation on time-series data.
        
        Args:
            df: DataFrame with date, features, and target
            feature_engineer: Feature engineering object
            model_trainer: Model trainer object
            feature_columns: List of feature columns
            
        Returns:
            DataFrame with walk-forward results
        """
        logger.info("Starting walk-forward validation...")
        
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        results = []
        
        # Define folds
        folds = [
            {'name': 'Fold 1', 'train_end': 2022, 'val_year': 2023},
            {'name': 'Fold 2', 'train_end': 2023, 'val_year': 2024},
            {'name': 'Fold 3', 'train_end': 2024, 'val_year': 2025},
        ]
        
        for fold in folds:
            logger.info(f"Running {fold['name']}: Train until {fold['train_end']}, Validate {fold['val_year']}")
            
            df['year'] = df['date'].dt.year
            
            train_df = df[df['year'] <= fold['train_end']].copy()
            val_df = df[df['year'] == fold['val_year']].copy()
            
            if len(train_df) == 0 or len(val_df) == 0:
                logger.warning(f"  Skipping {fold['name']}: insufficient data")
                continue
            
            X_train = train_df[feature_columns]
            y_train = train_df['market_regime_encoded']
            X_val = val_df[feature_columns]
            y_val = val_df['market_regime_encoded']
            
            # Train and evaluate
            from .train import ModelTrainer
            trainer = ModelTrainer(self.config)
            trainer.set_feature_names(feature_columns)
            
            # Train XGBoost
            model = trainer.train_xgboost(X_train, y_train, X_val, y_val)
            
            # Evaluate
            metrics = self.evaluate_model(model, X_val, y_val, fold['name'])
            
            results.append({
                'fold': fold['name'],
                'train_end_year': fold['train_end'],
                'val_year': fold['val_year'],
                'train_size': len(train_df),
                'val_size': len(val_df),
                'accuracy': metrics['accuracy'],
                'macro_f1': metrics['f1_macro'],
                'balanced_accuracy': metrics['balanced_accuracy']
            })
        
        results_df = pd.DataFrame(results)
        
        # Save results
        filepath = str(self.config.WALK_FORWARD_CSV)
        results_df.to_csv(filepath, index=False)
        logger.info(f"Walk-forward results saved to: {filepath}")
        
        return results_df
    
    def save_evaluation(self, filepath: Optional[str] = None) -> None:
        """Save evaluation results to JSON."""
        filepath = filepath or str(self.config.EVALUATION_JSON)
        
        # Convert to JSON-serializable format
        results = {}
        for model_name, metrics in self.evaluation_results.items():
            results[model_name] = metrics
        
        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"Evaluation results saved to: {filepath}")
