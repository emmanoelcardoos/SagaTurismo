# python -m venv venv
# venv/script/activate
# pip install fastapi uvicorn sqlalchemy datetime
# uvicorn swagger:app --reload
# http://127.0.0.1:8000/docs

from fastapi import FastAPI, HTTPException,Form
from pydantic import BaseModel,Field
from typing import List
import sqlite3
from enum import Enum
from datetime import date

app = FastAPI(title="Demo Swagger API", description="Exemplo simples para demonstração", version="1.0")

# -----------------------
# Base de dados SQLite
# -----------------------

conn = sqlite3.connect("database.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER
)
""")

conn.commit()

# -----------------------
# Modelo Pydantic
# -----------------------

class User(BaseModel):
    name: str
    age: int

# -----------------------
# Funções auxiliares
# -----------------------

def get_user_by_id(user_id: int):
    cursor.execute("SELECT * FROM users WHERE id=?", (user_id,))
    return cursor.fetchone()

# -----------------------
# GET (2 exemplos)
# -----------------------

@app.get("/users", response_model=List[User])
def get_all_users():
    cursor.execute("SELECT name, age FROM users")
    return [{"name": row[0], "age": row[1]} for row in cursor.fetchall()]

@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = get_user_by_id(user_id)
    if user:
        return {"id": user[0], "name": user[1], "age": user[2]}
    raise HTTPException(status_code=404, detail="User not found")

# -----------------------
# POST (2 exemplos)
# -----------------------

@app.post("/users")
def create_user(user: User):
    cursor.execute("INSERT INTO users (name, age) VALUES (?, ?)", (user.name, user.age))
    conn.commit()
    return {"message": "User created"}

@app.post("/users/bulk")
def create_multiple_users(users: List[User]):
    for user in users:
        cursor.execute("INSERT INTO users (name, age) VALUES (?, ?)", (user.name, user.age))
    conn.commit()
    return {"message": "Multiple users created"}

class Role(str, Enum):
    admin = "admin"
    user = "user"
    guest = "guest"

@app.post("/users/form")
def create_user_form(
    name: str = Form(..., description="Nome do utilizador"),
    role: Role = Form(..., description="Tipo de utilizador"),
    birth_date: date = Form(..., description="Data de nascimento")
):
    return {
        "name": name,
        "role": role,
        "birth_date": birth_date
    }



# -----------------------
# PUT (2 exemplos)
# -----------------------

@app.put("/users/{user_id}")
def update_user(user_id: int, user: User):
    if not get_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="User not found")

    cursor.execute("UPDATE users SET name=?, age=? WHERE id=?", (user.name, user.age, user_id))
    conn.commit()
    return {"message": "User updated"}

@app.put("/users/{user_id}/name")
def update_user_name(user_id: int, name: str):
    if not get_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="User not found")

    cursor.execute("UPDATE users SET name=? WHERE id=?", (name, user_id))
    conn.commit()
    return {"message": "User name updated"}

# -----------------------
# DELETE (2 exemplos)
# -----------------------

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    if not get_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="User not found")

    cursor.execute("DELETE FROM users WHERE id=?", (user_id,))
    conn.commit()
    return {"message": "User deleted"}

@app.delete("/users")
def delete_all_users():
    cursor.execute("DELETE FROM users")
    conn.commit()
    return {"message": "All users deleted"}