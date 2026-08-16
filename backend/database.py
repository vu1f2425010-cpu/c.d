import os
import sqlite3

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "certificates.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Events Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        event_date TEXT,
        organizer TEXT,
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Verified Individuals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verified_individuals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        event_name TEXT,
        full_name TEXT NOT NULL,
        keywords TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'AUTHENTIC',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
    )
    """)

    # Check and add columns if upgrading from older schema
    cursor.execute("PRAGMA table_info(verified_individuals)")
    columns = [col[1] for col in cursor.fetchall()]
    if "event_id" not in columns:
        cursor.execute("ALTER TABLE verified_individuals ADD COLUMN event_id INTEGER")
    if "event_name" not in columns:
        cursor.execute("ALTER TABLE verified_individuals ADD COLUMN event_name TEXT")

    # Seed Default Events
    cursor.execute("""
    INSERT OR IGNORE INTO events (name, description, event_date, organizer)
    VALUES (?, ?, ?, ?)
    """, (
        "National Scholar Accreditation Registry",
        "Central registry for verified academic honors and distinguished scholar certificates",
        "2026-08-16",
        "Central Academic Board"
    ))
    cursor.execute("""
    INSERT OR IGNORE INTO events (name, description, event_date, organizer)
    VALUES (?, ?, ?, ?)
    """, (
        "Technetics 2k26 - Grand Talent Show",
        "Wizarding theme technical conclave & Grand Talent Show certificate accreditation",
        "2026-08-16",
        "Department of Computer Engineering"
    ))
    cursor.execute("SELECT id FROM events WHERE name = ?", ("Technetics 2k26 - Grand Talent Show",))
    technetics_event_id = cursor.fetchone()[0]

    # Seed Priyal Shukla as verified individual
    cursor.execute("SELECT id FROM verified_individuals WHERE full_name = ?", ("Priyal Shukla",))
    existing_priyal = cursor.fetchone()
    clean_priyal_keywords = "priyal shukla|priyal|shukla|priya|shukl"
    if not existing_priyal:
        cursor.execute("""
        INSERT INTO verified_individuals (event_id, event_name, full_name, keywords, status, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            technetics_event_id,
            "Technetics 2k26 - Grand Talent Show",
            "Priyal Shukla",
            clean_priyal_keywords,
            "AUTHENTIC",
            "Officially whitelisted authentic certificate holder - Technetics 2k26 Grand Talent Show"
        ))
    else:
        cursor.execute("""
        UPDATE verified_individuals 
        SET event_id = ?, event_name = ?, keywords = ?
        WHERE full_name = ?
        """, (
            technetics_event_id,
            "Technetics 2k26 - Grand Talent Show",
            clean_priyal_keywords,
            "Priyal Shukla"
        ))

    # Clean up any residual generic event keywords across database entries
    cursor.execute("SELECT id, keywords FROM verified_individuals")
    for r_id, kw in cursor.fetchall():
        if kw:
            cleaned_kw_parts = [
                p.strip() for p in kw.split('|') 
                if p.strip() and p.strip().lower() not in ['technetics', 'grand talent show', 'computer engineering', 'wizarding', 'general registry', 'academic board']
            ]
            cleaned_kw = "|".join(cleaned_kw_parts)
            cursor.execute("UPDATE verified_individuals SET keywords = ? WHERE id = ?", (cleaned_kw, r_id))

    # Seed Sample Institutions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS institutions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        seal_hash TEXT,
        regex_patterns TEXT,
        valid_signature_template TEXT
    )
    """)

    institutions_data = [
        ("Harvard University", "HARVARD", "seal_harvard_v1", "Harvard|VERITAS|President and Fellows", "sig_harvard_pres"),
        ("Massachusetts Institute of Technology", "MIT", "seal_mit_v1", "MIT|Massachusetts Institute of Technology|MENS ET MANUS", "sig_mit_chancellor"),
        ("Stanford University", "STANFORD", "seal_stanford_v1", "Stanford|Die Luft der Freiheit weht|Board of Trustees", "sig_stanford_pres"),
        ("University of Oxford", "OXFORD", "seal_oxford_v1", "Oxford|Dominus Illuminatio Mea|Chancellor", "sig_oxford_chancellor")
    ]
    
    for name, code, seal_hash, regex, sig in institutions_data:
        cursor.execute("""
        INSERT OR IGNORE INTO institutions (name, code, seal_hash, regex_patterns, valid_signature_template)
        VALUES (?, ?, ?, ?, ?)
        """, (name, code, seal_hash, regex, sig))
        
    conn.commit()
    conn.close()

# -------------------------------------------------------------
# EVENT MANAGEMENT CRUD
# -------------------------------------------------------------
def get_all_events():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT e.id, e.name, e.description, e.event_date, e.organizer, e.status,
           COUNT(v.id) as people_count
    FROM events e
    LEFT JOIN verified_individuals v ON e.id = v.event_id
    GROUP BY e.id
    ORDER BY e.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{
        "id": r[0],
        "name": r[1],
        "description": r[2] or "",
        "event_date": r[3] or "",
        "organizer": r[4] or "",
        "status": r[5],
        "people_count": r[6]
    } for r in rows]

def create_event(name: str, description: str = "", event_date: str = "", organizer: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    clean_name = name.strip()
    cursor.execute("""
    INSERT INTO events (name, description, event_date, organizer)
    VALUES (?, ?, ?, ?)
    """, (clean_name, description.strip(), event_date.strip(), organizer.strip()))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": new_id,
        "name": clean_name,
        "description": description,
        "event_date": event_date,
        "organizer": organizer,
        "status": "ACTIVE",
        "people_count": 0
    }

def delete_event(event_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM verified_individuals WHERE event_id = ?", (event_id,))
    cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# -------------------------------------------------------------
# INDIVIDUAL MANAGEMENT (BY EVENT OR GLOBAL)
# -------------------------------------------------------------
def get_all_verified_individuals(event_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if event_id:
        cursor.execute("""
        SELECT id, event_id, event_name, full_name, keywords, status, notes 
        FROM verified_individuals 
        WHERE event_id = ? 
        ORDER BY id DESC
        """, (event_id,))
    else:
        cursor.execute("""
        SELECT id, event_id, event_name, full_name, keywords, status, notes 
        FROM verified_individuals 
        ORDER BY id DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    return [{
        "id": r[0],
        "event_id": r[1],
        "event_name": r[2] or "Unassigned Event",
        "full_name": r[3],
        "keywords": r[4],
        "status": r[5],
        "notes": r[6] or ""
    } for r in rows]

def add_verified_individual(
    full_name: str,
    event_id: int = None,
    keywords: str = "",
    status: str = "AUTHENTIC",
    notes: str = ""
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Support multiple names separated by comma, newline, or pipe
    raw_names = [n.strip() for n in full_name.replace('\n', ',').replace('|', ',').split(',') if n.strip()]
    if not raw_names:
        conn.close()
        raise ValueError("Full name cannot be empty")

    event_name = "General Registry"
    if event_id:
        cursor.execute("SELECT name FROM events WHERE id = ?", (event_id,))
        ev_row = cursor.fetchone()
        if ev_row:
            event_name = ev_row[0]

    added_records = []

    for single_name in raw_names:
        clean_name = single_name.strip()
        if not clean_name:
            continue

        kw = keywords.lower() if keywords else clean_name.lower()
        if clean_name.lower() not in kw:
            kw = f"{clean_name.lower()}|{kw}"

        # UPSERT: Check if name already exists in database (case-insensitive)
        cursor.execute("SELECT id FROM verified_individuals WHERE LOWER(full_name) = LOWER(?)", (clean_name,))
        existing = cursor.fetchone()

        if existing:
            rec_id = existing[0]
            cursor.execute("""
            UPDATE verified_individuals
            SET event_id = ?, event_name = ?, full_name = ?, keywords = ?, status = ?, notes = ?
            WHERE id = ?
            """, (event_id, event_name, clean_name, kw, status, notes, rec_id))
        else:
            cursor.execute("""
            INSERT INTO verified_individuals (event_id, event_name, full_name, keywords, status, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (event_id, event_name, clean_name, kw, status, notes))
            rec_id = cursor.lastrowid

        added_records.append({
            "id": rec_id,
            "event_id": event_id,
            "event_name": event_name,
            "full_name": clean_name,
            "keywords": kw,
            "status": status,
            "notes": notes
        })

    conn.commit()
    conn.close()

    if len(added_records) == 1:
        return added_records[0]
    return {
        "id": added_records[0]["id"],
        "event_id": event_id,
        "event_name": event_name,
        "full_name": ", ".join([r["full_name"] for r in added_records]),
        "keywords": keywords,
        "status": status,
        "notes": notes,
        "count": len(added_records)
    }

def delete_verified_individual(individual_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM verified_individuals WHERE id = ?", (individual_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# -------------------------------------------------------------
# WHITELIST LOOKUP (PARTICIPANT NAME CHECK ONLY)
# -------------------------------------------------------------
def check_whitelisted_individual(text_query: str):
    """
    Check if the text contains any whitelisted participant name added in database.
    Checks ONLY participant names across all verified records.
    """
    if not text_query:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name, event_name, keywords, status, notes FROM verified_individuals")
    rows = cursor.fetchall()
    conn.close()

    query_clean = text_query.lower()
    for char in [',', '.', '-', '_', '/', '\\', ':', ';', '(', ')', '[', ']', '{', '}', '!', '@', '#', '$', '%', '^', '&', '*', '\n', '\t']:
        query_clean = query_clean.replace(char, ' ')

    query_tokens = set(query_clean.split())
    query_collapsed = "".join(query_clean.split())

    for rec_id, full_name, event_name, keywords, status, notes in rows:
        name_clean = full_name.lower().strip()
        if not name_clean:
            continue

        # 1. Direct full name match in query
        if name_clean in query_clean:
            return {"id": rec_id, "full_name": full_name, "event_name": event_name, "status": status, "notes": notes}

        # 2. Collapsed space match (e.g. "priyalshukla")
        name_collapsed = "".join(name_clean.split())
        if len(name_collapsed) >= 4 and name_collapsed in query_collapsed:
            return {"id": rec_id, "full_name": full_name, "event_name": event_name, "status": status, "notes": notes}

        # 3. Check keywords / aliases list (using word boundary check)
        keywords_list = [k.strip().lower() for k in keywords.split("|") if k.strip()]
        for kw in keywords_list:
            if kw in query_clean and len(kw) >= 3:
                # Ensure kw is not a short partial word inside an unrelated word
                if kw in query_tokens or len(kw.split()) > 1 or kw in query_clean:
                    return {"id": rec_id, "full_name": full_name, "event_name": event_name, "status": status, "notes": notes}

        # 4. First name and Last name co-occurrence match
        name_parts = [p for p in name_clean.split() if len(p) >= 2]
        if len(name_parts) >= 2 and all(part in query_tokens or part in query_clean for part in name_parts):
            return {"id": rec_id, "full_name": full_name, "event_name": event_name, "status": status, "notes": notes}

        # 5. Single distinct name token match (for single name records)
        if len(name_parts) == 1 and len(name_parts[0]) >= 3 and name_parts[0] in query_tokens:
            return {"id": rec_id, "full_name": full_name, "event_name": event_name, "status": status, "notes": notes}

    return None

def get_institution_by_name(name_query: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, code, seal_hash, regex_patterns FROM institutions")
    rows = cursor.fetchall()
    conn.close()
    
    query_lower = name_query.lower()
    for name, code, seal_hash, regex in rows:
        if name.lower() in query_lower or query_lower in name.lower() or code.lower() in query_lower:
            return {"name": name, "code": code, "seal_hash": seal_hash, "regex_patterns": regex}
    return None

def get_all_institutions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, code, seal_hash FROM institutions ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "code": r[2], "seal_hash": r[3]} for r in rows]

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")

