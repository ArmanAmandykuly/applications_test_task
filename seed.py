import sqlite3
import uuid


def seed_database():
    conn = sqlite3.connect("applications.db")
    cursor = conn.cursor()

    sample_data = [
        (
            str(uuid.uuid4()),
            "Abdraka dabra",
            "This is a certificed hood classic",
            "new",
            "high"
        ),
        (
            str(uuid.uuid4()),
            "Abdraka dabra 2",
            "This is a certificed hood classic",
            "new",
            "low"
        ),
        (
            str(uuid.uuid4()),
            "Abdraka dabra 3",
            "This is a certificed hood classic",
            "new",
            "normal"
        ),
        (
            str(uuid.uuid4()),
            "Abdraka dabra 4",
            "This is a certificed hood classic",
            "new",
            "normal"
        ),
    ]

    print("Inserting sample rows...")
    try:
        cursor.executemany(
            """
                INSERT INTO applications (id, title, description, status, priority)
                VALUES (?, ?, ?, ?, ?)
            """,
            sample_data
        )
        conn.commit()
        print("Seeding done")
    except sqlite3.Error as e:
        print(f"ERROR: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_database()