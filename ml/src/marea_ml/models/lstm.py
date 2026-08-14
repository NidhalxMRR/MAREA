"""LSTM neural network model for temperature forecasting.

Long Short-Term Memory (LSTM) networks are used ONLY after baselines
justify the added complexity (typically > 10% performance improvement).

This module provides the architecture and training interface.
Note: TensorFlow/Keras will be added in requirements when needed.
"""

# Future implementation will use TensorFlow/Keras when added to requirements.txt
# Placeholder for LSTM architecture and training loop.


class LSTMForecaster:
    """
    LSTM neural network for multi-step temperature forecasting.
    
    **Use only if baselines justify it.**
    
    Architecture:
    - Input layer: (batch_size, lookback_steps)
    - LSTM layer(s) with dropout for regularization
    - Dense output layer: (batch_size, 1)
    
    Training:
    - Fit only on training data
    - Validate on held-out validation set
    - Early stopping to prevent overfitting
    - Evaluate on final test set
    """
    
    def __init__(
        self,
        lookback_steps: int = 48,
        lstm_units: int = 64,
        dropout_rate: float = 0.2,
        learning_rate: float = 0.001
    ):
        """
        Initialize LSTM forecaster.
        
        Args:
            lookback_steps: Number of historical steps (e.g., 48 for 12 hours)
            lstm_units: Number of LSTM units per layer
            dropout_rate: Dropout rate for regularization
            learning_rate: Learning rate for optimizer
            
        Note:
            Full implementation will be added when TensorFlow is included in requirements.
        """
        self.lookback_steps = lookback_steps
        self.lstm_units = lstm_units
        self.dropout_rate = dropout_rate
        self.learning_rate = learning_rate
        self._is_built = False
        self._is_fitted = False
    
    def build(self):
        """
        Build the LSTM model.
        
        Future implementation will:
        - Create Keras Sequential or Functional model
        - Add LSTM layers with dropout
        - Add Dense output layer
        - Compile with optimizer (Adam) and loss (MSE)
        """
        raise NotImplementedError("LSTM implementation requires TensorFlow. "
                                "Add to requirements.txt when needed.")
    
    def fit(self, X_train, y_train, X_val=None, y_val=None, epochs: int = 100):
        """
        Train the LSTM model.
        
        Args:
            X_train: Training sequences (n_samples, lookback_steps)
            y_train: Training targets (n_samples,)
            X_val: Validation sequences (optional for early stopping)
            y_val: Validation targets (optional)
            epochs: Maximum number of training epochs
            
        Future implementation will:
        - Use early stopping if validation data provided
        - Log training history
        - Save best model checkpoint
        """
        raise NotImplementedError("LSTM implementation requires TensorFlow. "
                                "Add to requirements.txt when needed.")
    
    def predict(self, X_test):
        """
        Generate predictions.
        
        Args:
            X_test: Test sequences (n_samples, lookback_steps)
            
        Returns:
            Predictions (n_samples,)
        """
        raise NotImplementedError("LSTM implementation requires TensorFlow. "
                                "Add to requirements.txt when needed.")
    
    def save(self, filepath: str):
        """
        Save trained model to disk.
        
        Args:
            filepath: Path to save model (e.g., 'models/lstm_v001.keras')
        """
        raise NotImplementedError("LSTM implementation requires TensorFlow. "
                                "Add to requirements.txt when needed.")
    
    @staticmethod
    def load(filepath: str) -> 'LSTMForecaster':
        """
        Load pre-trained LSTM model.
        
        Args:
            filepath: Path to model file
            
        Returns:
            LSTMForecaster instance with loaded weights
        """
        raise NotImplementedError("LSTM implementation requires TensorFlow. "
                                "Add to requirements.txt when needed.")
