import sqlite3
from typing import List, Optional
import uuid

import fastapi
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import verify_credentials
from app.core.db import get_db
from app.core.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate


router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/", response_model = ApplicationResponse)
def create_application(
    application: ApplicationCreate,
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()

    id = str(uuid.uuid4())

    query = "INSERT INTO applications (id, title, description, priority) VALUES (?, ?, ?, ?)"
    params = [id, application.title, application.description, application.priority]

    try:
        cursor.execute(query, params)
        db.commit()

        cursor.execute(
            """SELECT id, title, description, status, priority, created_at, updated_at
            FROM applications WHERE applications.id = ?""", (id,)
        )
        row = cursor.fetchone()

        return dict(row)
        
    except sqlite3.Error as e:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Database execution error: {str(e)}"
        )
    
@router.patch("/{application_id}")
def update_application(
    application: ApplicationUpdate,
    application_id: str,
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()

    cursor.execute("SELECT id FROM applications WHERE id = ?", (application_id,))
    if not cursor.fetchone():
        raise HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )

    query = "UPDATE applications SET status=?, updated_at=STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'utc') WHERE id=?"
    
    try:
        cursor.execute(query, (application.status,  application_id))
        db.commit()

        query = """SELECT id, title, description, status, priority, created_at, updated_at
                FROM applications WHERE id=?"""
        cursor.execute(query, (application_id,))

        row = cursor.fetchone()

        return dict(row)
    except sqlite3.Error as e:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Database execution error: {str(e)}"
        )

@router.delete("/{application_id}", status_code=fastapi.status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: str,
    username = Depends(verify_credentials),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()

    cursor.execute("SELECT id FROM applications WHERE id=?", (application_id,))
    if not cursor.fetchone():
        raise HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    try:
        cursor.execute("DELETE FROM applications WHERE id=?", (application_id,))
        db.commit()

        return
    except sqlite3.Error as e:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Database execution error: {str(e)}"
        )

@router.get("/", response_model=List[ApplicationResponse])
def list_applications(
    status: Optional[str] = Query(None, description="Filter by application status"),
    priority: Optional[str] = Query(None, description="Filter by application priority"),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()

    query = "SELECT * FROM applications WHERE 1=1"
    params = []
    
    if status is not None:
        query += " AND status = ?"
        params.append(status)

    if priority is not None:
        query += " AND priority = ?"
        params.append(priority)

    query += " ORDER BY created_at DESC;"

    try:
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
    except sqlite3.OperationalError as e:
        raise HTTPException(
            status_code=fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database execution error: {str(e)}"
        )
    
    return [dict(row) for row in rows]