import os
import sqlite3

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.normpath(os.path.join(CURRENT_DIR, "..", "..", "applications.db"))

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL CHECK(LENGTH(title) >= 3 AND LENGTH(title) <= 120),
        description TEXT CHECK(description IS NULL OR LENGTH(description) <= 1000),

        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'done')),
        priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high')),
        created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'utc')),
        updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'utc'))
    );
    """)

    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS ts_lock_done_update
    BEFORE UPDATE ON applications
    WHEN OLD.status = 'done'
    BEGIN
        SELECT RAISE(ABORT, 'Cannot update an application that is already DONE.');
    END;
    """)
    
    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS ts_lock_done_delete
    BEFORE DELETE ON applications
    WHEN OLD.status = 'done'
    BEGIN
        SELECT RAISE(ABORT, 'Cannot delete an application that is already DONE.');
    END;
    """)
    
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()