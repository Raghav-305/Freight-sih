POST /api/decisions
POST /api/decisions/{id}/submit
POST /api/decisions/{id}/approve
POST /api/decisions/{id}/return
POST /api/decisions/{id}/reject
GET /api/decisions/{id}
GET /api/decisions/{id}/audit
GET /api/decisions/{id}/report

Recommended free implementation:
SQLite/PostgreSQL
JSON canonicalization
hashlib SHA-256
ReportLab for PDF
openpyxl for XLSX

Tests:
- historical snapshot cannot mutate
- self-approval blocked by configured policy
- audit chain detects tampering
- report matches frozen snapshot
