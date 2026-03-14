from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Helper function to convert ObjectId to string
def str_object_id(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj


# Define Models
class MoodEntryCreate(BaseModel):
    mood: str
    user: str = "default_user"

class MoodEntryUpdate(BaseModel):
    racing_thoughts: Optional[bool] = False
    no_sleep: Optional[bool] = False
    over_interest: Optional[bool] = False
    lack_control: Optional[bool] = False
    anxiety: Optional[bool] = False
    ordering: Optional[bool] = False
    over_planning: Optional[bool] = False
    self_harm: Optional[bool] = False
    angry: Optional[bool] = False
    depressed_anxiety: Optional[bool] = False

class MoodEntry(BaseModel):
    id: str
    mood: str
    date: datetime
    user: str
    racing_thoughts: bool = False
    no_sleep: bool = False
    over_interest: bool = False
    lack_control: bool = False
    anxiety: bool = False
    ordering: bool = False
    over_planning: bool = False
    self_harm: bool = False
    angry: bool = False
    depressed_anxiety: bool = False

class GratitudeEntryCreate(BaseModel):
    title: str
    description: str
    user: str = "default_user"

class GratitudeEntry(BaseModel):
    id: str
    title: str
    description: str
    date: datetime
    user: str

class RoutineTaskCreate(BaseModel):
    taskName: str
    user: str = "default_user"

class RoutineTask(BaseModel):
    id: str
    taskName: str
    points: int = 10
    user: str

class DailyRoutineScoreCreate(BaseModel):
    total_points: int
    user: str = "default_user"

class DailyRoutineScore(BaseModel):
    id: str
    total_points: int
    score_date: datetime
    user: str


# Mood Endpoints
@api_router.post("/moods", response_model=MoodEntry)
async def create_mood_entry(input: MoodEntryCreate):
    mood_dict = {
        "mood": input.mood,
        "date": datetime.utcnow(),
        "user": input.user,
        "racing_thoughts": False,
        "no_sleep": False,
        "over_interest": False,
        "lack_control": False,
        "anxiety": False,
        "ordering": False,
        "over_planning": False,
        "self_harm": False,
        "angry": False,
        "depressed_anxiety": False
    }
    result = await db.mood_entries.insert_one(mood_dict)
    mood_dict["id"] = str(result.inserted_id)
    mood_dict.pop("_id", None)
    return MoodEntry(**mood_dict)

@api_router.put("/moods/{mood_id}")
async def update_mood_symptoms(mood_id: str, symptoms: MoodEntryUpdate):
    try:
        update_data = symptoms.dict(exclude_unset=True)
        result = await db.mood_entries.update_one(
            {"_id": ObjectId(mood_id)},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Mood entry not found")
        return {"status": "success", "message": "Symptoms updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/moods", response_model=List[MoodEntry])
async def get_mood_entries(user: str = "default_user"):
    moods = await db.mood_entries.find({"user": user}).sort("date", -1).to_list(1000)
    for mood in moods:
        mood["id"] = str(mood["_id"])
        mood.pop("_id", None)
    return [MoodEntry(**mood) for mood in moods]


# Gratitude Endpoints
@api_router.post("/gratitude", response_model=GratitudeEntry)
async def create_gratitude_entry(input: GratitudeEntryCreate):
    gratitude_dict = {
        "title": input.title,
        "description": input.description,
        "date": datetime.utcnow(),
        "user": input.user
    }
    result = await db.gratitude_entries.insert_one(gratitude_dict)
    gratitude_dict["id"] = str(result.inserted_id)
    gratitude_dict.pop("_id", None)
    return GratitudeEntry(**gratitude_dict)

@api_router.get("/gratitude", response_model=List[GratitudeEntry])
async def get_gratitude_entries(user: str = "default_user"):
    entries = await db.gratitude_entries.find({"user": user}).sort("date", -1).to_list(1000)
    for entry in entries:
        entry["id"] = str(entry["_id"])
        entry.pop("_id", None)
    return [GratitudeEntry(**entry) for entry in entries]


# Routine Task Endpoints
@api_router.post("/routine/tasks", response_model=RoutineTask)
async def create_routine_task(input: RoutineTaskCreate):
    task_dict = {
        "taskName": input.taskName,
        "points": 10,
        "user": input.user
    }
    result = await db.routine_tasks.insert_one(task_dict)
    task_dict["id"] = str(result.inserted_id)
    task_dict.pop("_id", None)
    return RoutineTask(**task_dict)

@api_router.get("/routine/tasks", response_model=List[RoutineTask])
async def get_routine_tasks(user: str = "default_user"):
    tasks = await db.routine_tasks.find({"user": user}).to_list(1000)
    for task in tasks:
        task["id"] = str(task["_id"])
        task.pop("_id", None)
    return [RoutineTask(**task) for task in tasks]


# Daily Routine Score Endpoints
@api_router.post("/routine/scores", response_model=DailyRoutineScore)
async def create_daily_score(input: DailyRoutineScoreCreate):
    # Get today's date (without time)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Check if there's already a score for today
    existing_score = await db.daily_routine_scores.find_one({
        "user": input.user,
        "score_date": {"$gte": today, "$lte": tomorrow}
    })
    
    if existing_score:
        # Update existing score
        await db.daily_routine_scores.update_one(
            {"_id": existing_score["_id"]},
            {"$set": {
                "total_points": input.total_points,
                "score_date": datetime.utcnow()
            }}
        )
        existing_score["id"] = str(existing_score["_id"])
        existing_score["total_points"] = input.total_points
        existing_score["score_date"] = datetime.utcnow()
        existing_score.pop("_id", None)
        return DailyRoutineScore(**existing_score)
    else:
        # Create new score
        score_dict = {
            "total_points": input.total_points,
            "score_date": datetime.utcnow(),
            "user": input.user
        }
        result = await db.daily_routine_scores.insert_one(score_dict)
        score_dict["id"] = str(result.inserted_id)
        score_dict.pop("_id", None)
        return DailyRoutineScore(**score_dict)

@api_router.get("/routine/scores", response_model=List[DailyRoutineScore])
async def get_daily_scores(user: str = "default_user"):
    scores = await db.daily_routine_scores.find({"user": user}).sort("score_date", -1).to_list(1000)
    for score in scores:
        score["id"] = str(score["_id"])
        score.pop("_id", None)
    return [DailyRoutineScore(**score) for score in scores]


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
