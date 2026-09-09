import os
from pathlib import Path

import psycopg2

DB_URL = os.environ.get("FREIGHT_DATABASE_URL")

def initialize_database():
    if not DB_URL:
        raise RuntimeError("Set FREIGHT_DATABASE_URL before initializing freight-database.")
    print("Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    print("Executing init.sql...")
    with open(Path(__file__).with_name("init.sql"), "r", encoding="utf-8") as f:
        sql_script = f.read()

    cursor.execute(sql_script)
    conn.commit()

    cursor.close()
    conn.close()
    print("Database tables and seed data created successfully!")

if __name__ == "__main__":
    initialize_database()