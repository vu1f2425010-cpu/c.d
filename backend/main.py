import os
import io
import time
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from PIL import Image

from database import init_db, get_all_institutions, get_all_verified_individuals
from sample_generator import generate_samples, SAMPLES_DIR
from forensics import run_full_forensic_analysis, HAS_PYTESSERACT

app = FastAPI(
    title="VerifEye Cyber-Forensics Engine",
    description="AI Fake Certificate & Credential Tamper Detection API",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    generate_samples()
    print("VerifEye Forensics Engine initialized.")

@app.get("/api/health")
def get_health():
    records = get_all_verified_individuals()
    return {
        "status": "online",
        "engine": "VerifEye Cyber-Forensics v1.0",
        "tesseract_ocr": HAS_PYTESSERACT,
        "database_records": len(records),
        "timestamp": time.time()
    }

@app.get("/api/samples")
def list_samples():
    samples_info = [
        {
            "id": "priyal_shukla_verified",
            "title": "Priyal Shukla (Verified Scholar)",
            "institution": "National Accreditation Board",
            "type": "AUTHENTIC",
            "description": "Accredited scholar record in central registry. 100% genuine verified certificate.",
            "filename": "priyal_shukla_verified.png"
        },
        {
            "id": "authentic_harvard",
            "title": "Harvard (Unverified Person)",
            "institution": "Harvard University",
            "type": "FORGED",
            "description": "Failed database check: Recipient name is not whitelisted in the admin panel. Classified as FAKE.",
            "filename": "authentic_harvard.png"
        },
        {
            "id": "forged_mit_grade",
            "title": "Grade Tampering (Text Splicing)",
            "institution": "MIT",
            "type": "FORGED",
            "description": "Failed database check: Recipient name is not whitelisted in the admin panel. Classified as FAKE.",
            "filename": "forged_mit_grade.png"
        },
        {
            "id": "tampered_oxford_seal",
            "title": "Seal Forgery (Emblem Splicing)",
            "institution": "University of Oxford",
            "type": "FORGED",
            "description": "Failed database check: Recipient name is not whitelisted in the admin panel. Classified as FAKE.",
            "filename": "tampered_oxford_seal.png"
        }
    ]
    return {"samples": samples_info}

@app.get("/api/sample_image/{filename}")
def get_sample_image(filename: str):
    file_path = os.path.join(SAMPLES_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Sample image not found")

@app.post("/api/verify")
async def verify_certificate(
    file: Optional[UploadFile] = File(None),
    sample_key: Optional[str] = Form(None)
):
    try:
        filename = "certificate.png"
        pil_img = None

        if sample_key:
            sample_filename = f"{sample_key}.png"
            sample_path = os.path.join(SAMPLES_DIR, sample_filename)
            if not os.path.exists(sample_path):
                # Try jpg fallback
                sample_filename = f"{sample_key}.jpg"
                sample_path = os.path.join(SAMPLES_DIR, sample_filename)
                
            if os.path.exists(sample_path):
                pil_img = Image.open(sample_path).convert("RGB")
                filename = sample_filename
            else:
                raise HTTPException(status_code=404, detail=f"Sample key {sample_key} not found")
        elif file:
            filename = file.filename
            contents = await file.read()
            pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        else:
            raise HTTPException(status_code=400, detail="Either file upload or sample_key must be provided")

        if pil_img is None:
            raise HTTPException(status_code=400, detail="Invalid image payload")

        # Run forensic analysis
        start_time = time.time()
        report = run_full_forensic_analysis(pil_img, filename)
        execution_time = round((time.time() - start_time) * 1000, 2)
        
        report["processing_time_ms"] = execution_time
        report["filename"] = filename
        
        return JSONResponse(content=report)

    except Exception as e:
        print(f"Error during verification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forensic engine processing failure: {str(e)}")

# Cross-Verification Structural Template Comparison Endpoint
from cross_verifier import cross_verify_certificates

@app.post("/api/cross-verify")
async def cross_verify_certificates_endpoint(
    real_file: Optional[UploadFile] = File(None),
    test_file: Optional[UploadFile] = File(None),
    real_sample_key: Optional[str] = Form(None),
    test_sample_key: Optional[str] = Form(None)
):
    try:
        real_img = None
        test_img = None

        # Resolve Reference (Real) Image
        if real_sample_key:
            sample_path = os.path.join(SAMPLES_DIR, f"{real_sample_key}.png")
            if not os.path.exists(sample_path):
                sample_path = os.path.join(SAMPLES_DIR, f"{real_sample_key}.jpg")
            if os.path.exists(sample_path):
                real_img = Image.open(sample_path).convert("RGB")
        elif real_file:
            real_bytes = await real_file.read()
            real_img = Image.open(io.BytesIO(real_bytes)).convert("RGB")

        # Resolve Candidate (Test) Image
        if test_sample_key:
            sample_path = os.path.join(SAMPLES_DIR, f"{test_sample_key}.png")
            if not os.path.exists(sample_path):
                sample_path = os.path.join(SAMPLES_DIR, f"{test_sample_key}.jpg")
            if os.path.exists(sample_path):
                test_img = Image.open(sample_path).convert("RGB")
        elif test_file:
            test_bytes = await test_file.read()
            test_img = Image.open(io.BytesIO(test_bytes)).convert("RGB")

        if real_img is None or test_img is None:
            raise HTTPException(status_code=400, detail="Both Real Reference Certificate and Test Certificate must be uploaded.")

        start_time = time.time()
        result = cross_verify_certificates(real_img, test_img)
        result["execution_time_ms"] = round((time.time() - start_time) * 1000, 2)

        return JSONResponse(content=result)

    except Exception as e:
        print(f"Error during cross-verification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cross-verification failed: {str(e)}")

# Admin Authentication & Database Management
from pydantic import BaseModel
from database import (
    get_all_events, create_event, delete_event,
    get_all_verified_individuals, add_verified_individual, delete_verified_individual
)

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class CreateEventRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    event_date: Optional[str] = ""
    organizer: Optional[str] = ""

class AddIndividualRequest(BaseModel):
    full_name: str
    event_id: Optional[int] = None
    keywords: Optional[str] = ""
    status: Optional[str] = "AUTHENTIC"
    notes: Optional[str] = ""

@app.post("/api/admin/login")
def admin_login(creds: AdminLoginRequest):
    if creds.username == "shyam" and creds.password == "shyam2123":
        return {
            "success": True,
            "token": "auth_token_shyam_admin_session_2026",
            "user": "shyam",
            "message": "Authentication successful. Admin session active."
        }
    raise HTTPException(status_code=401, detail="Invalid username or password")

# Event Management Endpoints
@app.get("/api/admin/events")
def list_events():
    events = get_all_events()
    return {"events": events, "total": len(events)}

@app.post("/api/admin/events")
def add_event(data: CreateEventRequest):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Event name is required")
    event = create_event(
        name=data.name,
        description=data.description or "",
        event_date=data.event_date or "",
        organizer=data.organizer or ""
    )
    return {"success": True, "event": event, "message": f"Event '{data.name}' created successfully."}

@app.delete("/api/admin/events/{event_id}")
def remove_event(event_id: int):
    deleted = delete_event(event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True, "message": f"Event ID {event_id} deleted successfully."}

# Individuals Endpoints (Supports filtering by event_id)
@app.get("/api/admin/individuals")
def list_verified_individuals(event_id: Optional[int] = None):
    records = get_all_verified_individuals(event_id=event_id)
    return {"individuals": records, "total": len(records)}

@app.post("/api/admin/individuals")
def create_verified_individual(data: AddIndividualRequest):
    if not data.full_name or not data.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required")
    record = add_verified_individual(
        full_name=data.full_name,
        event_id=data.event_id,
        keywords=data.keywords or "",
        status=data.status or "AUTHENTIC",
        notes=data.notes or ""
    )
    return {"success": True, "record": record, "message": f"'{data.full_name}' added to event '{record.get('event_name', 'Registry')}'."}

@app.delete("/api/admin/individuals/{individual_id}")
def remove_verified_individual(individual_id: int):
    deleted = delete_verified_individual(individual_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found or already deleted")
    return {"success": True, "message": f"Individual ID {individual_id} deleted successfully."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

