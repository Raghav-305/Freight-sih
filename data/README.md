# Data Layout

Keep source and production data out of the frontend.

- `raw/`: original received files, unchanged
- `clean/`: validated and normalized data
- `processed/`: joined analytical tables
- `features/`: model-ready feature tables
- `fixtures/`: small non-confidential test fixtures

Do not commit confidential government or company datasets.
