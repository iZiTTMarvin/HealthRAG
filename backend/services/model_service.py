import os
import sys
from typing import Dict, List

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

import model_config


class ModelService:
    def get_available_models(self) -> Dict[str, List[str]]:
        return model_config.get_available_models()
