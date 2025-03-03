"""
Configuration loader utilities for the API server.
"""
import os
import yaml
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

def load_mcp_config() -> List[Dict[str, Any]]:
    """
    Load MCP server configurations from YAML file.
    
    Returns:
        List[Dict[str, Any]]: A list of MCP server configurations that are enabled
                             and have all required environment variables set.
    """
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'mcp_config.yaml')
    
    try:
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        
        # Get the list of MCP server configs
        mcp_servers = config.get('mcp_servers', [])
        
        # Filter out disabled servers and process environment variables
        enabled_servers = []
        for server in mcp_servers:
            # Skip disabled servers
            if not server.get('enabled', True):
                logger.info(f"MCP server '{server['name']}' is disabled in config")
                continue
                
            # Process environment variables
            if 'env' in server:
                env_vars_valid = True
                for key, value in server['env'].items():
                    if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
                        env_var = value[2:-1]
                        env_value = os.environ.get(env_var)
                        
                        # Skip this server if required env var is missing or is default value
                        if not env_value or env_value == f"your_{env_var.lower()}":
                            logger.warning(f"Skipping MCP server '{server['name']}': "
                                          f"Environment variable {env_var} not set or has default value")
                            env_vars_valid = False
                            break
                        
                        server['env'][key] = env_value
                
                if not env_vars_valid:
                    continue
            
            # Add server to final list
            enabled_servers.append(server)
            logger.info(f"MCP server '{server['name']}' configuration loaded successfully")
        
        return enabled_servers
            
    except FileNotFoundError:
        logger.warning(f"MCP config file not found at {config_path}")
        return []
    except yaml.YAMLError as e:
        logger.error(f"Error parsing MCP config file: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error loading MCP config: {e}")
        return [] 