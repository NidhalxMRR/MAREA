"""Configuration management for MAREA ML.

This module provides centralized configuration loading from YAML files
and environment variables.
"""

from pathlib import Path
import yaml
from typing import Dict, Any, Optional


class Config:
    """Load and access YAML configuration files."""
    
    _CONFIG_DIR = Path(__file__).resolve().parents[2] / "configs"
    
    @staticmethod
    def load(config_name: str) -> Dict[str, Any]:
        """
        Load a YAML configuration file.
        
        Args:
            config_name: Filename without extension (e.g., 'data' for 'data.yaml')
        
        Returns:
            Dictionary of configuration values
            
        Raises:
            FileNotFoundError: If config file does not exist
            yaml.YAMLError: If config file is malformed
        """
        config_path = Config._CONFIG_DIR / f"{config_name}.yaml"
        
        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")
        
        with open(config_path, 'r') as f:
            return yaml.safe_load(f) or {}
    
    @staticmethod
    def get(config_name: str, key: str, default: Optional[Any] = None) -> Any:
        """
        Retrieve a single configuration value.
        
        Args:
            config_name: Configuration file name
            key: Key path (supports dot notation for nested keys)
            default: Default value if key not found
            
        Returns:
            Configuration value or default
        """
        config = Config.load(config_name)
        
        # Support nested key access: "parent.child.key"
        for part in key.split('.'):
            if isinstance(config, dict):
                config = config.get(part)
            else:
                return default
        
        return config if config is not None else default
