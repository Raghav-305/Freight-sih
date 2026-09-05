import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from app.db import reset_db_for_tests


@pytest.fixture(autouse=True)
def clean_db():
    reset_db_for_tests()
    yield
