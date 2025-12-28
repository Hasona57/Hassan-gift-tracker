import flask
import sqlite3
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import os

load_dotenv()

app = flask.Flask(
    __name__,
    static_folder="static",
    static_url_path="/"
)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day"],
    storage_uri="memory://"
)

conn = sqlite3.connect('gifts.db')
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS gifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gift TEXT NOT NULL,
        complete INTEGER DEFAULT 0
    )
''')
conn.commit()
conn.close()

@app.get("/")
@limiter.exempt
def index():
    return flask.send_from_directory("static", "index.html")

@app.get("/gifts")
@limiter.exempt
def get_gifts():
    conn = sqlite3.connect('gifts.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM gifts ORDER BY id DESC')
    gifts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return flask.jsonify(gifts), 200

ADD_PASSWORD = os.getenv("GIFT_ADD_PASSWORD")
COMPLETE_PASSWORD = os.getenv("GIFT_COMPLETE_PASSWORD")

@app.post("/gifts")
@limiter.limit("5 per minute")
def create_gift():
    data = flask.request.get_json()
    password = data.get('password')
    if password != ADD_PASSWORD:
        return flask.jsonify({"error": "Wrong password for adding gift"}), 401

    name = data.get('name')
    gift = data.get('gift')

    conn = sqlite3.connect('gifts.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO gifts (name, gift) VALUES (?, ?)', (name, gift))
    conn.commit()
    conn.close()

    return flask.jsonify({"success": "Gift added successfully"}), 201

@app.post("/gifts/<int:gift_id>/complete")
@limiter.limit("5 per minute")
def complete_gift(gift_id):
    data = flask.request.get_json()
    password = data.get('password')
    if password != COMPLETE_PASSWORD:
        return flask.jsonify({"error": "Wrong password for completing gift"}), 401

    conn = sqlite3.connect('gifts.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE gifts SET complete = 1 WHERE id = ?', (gift_id,))
    conn.commit()
    conn.close()
    return flask.jsonify({"success": "Gift marked as complete"}), 200

if __name__ == "__main__":
    app.run()
