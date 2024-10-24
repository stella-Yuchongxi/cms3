from flask import Flask, request, jsonify
import os
import openai
import sqlite3

# Set up OpenAI API key
os.environ["OPENAI_API_KEY"] = 'sk-xAfFbDC9Iwgb4NUIfTP03PpT-VPJRvK0OYno2qIK6ST3BlbkFJqM4m91rf8GtiW734nxo0fEixeL2Incj9ehwcbauJcA'
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Initialize Flask app
app = Flask(__name__)


# Initialize and connect to SQLite database
def init_db():
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    # Create table to store user ID and chat history
    cursor.execute('''CREATE TABLE IF NOT EXISTS chat_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        message TEXT NOT NULL
                      )''')
    conn.commit()
    conn.close()


# Initialize conversation history for new chats
def get_user_history(user_id):
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    cursor.execute('SELECT role, message FROM chat_history WHERE user_id = ?', (user_id,))
    rows = cursor.fetchall()
    conversation_history = [{"role": row[0], "content": row[1]} for row in rows]
    conn.close()
    return conversation_history


# Save message to database
def save_message(user_id, role, message):
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO chat_history (user_id, role, message) VALUES (?, ?, ?)', (user_id, role, message))
    conn.commit()
    conn.close()


# Chat with LLM function
def chat_with_llm(user_id, user_input):
    # Get user conversation history
    conversation_history = get_user_history(user_id)

    # Add the new user input to the conversation history
    conversation_history.append({"role": "user", "content": user_input})

    # Use the new `ChatCompletion.create()` method in the latest OpenAI API
    chat_completion = openai.chat.completions.create(
        model="gpt-3.5-turbo-16k",
        messages=conversation_history
    )

    # Get the LLM response
    response = chat_completion.choices[0].message.content

    # Save the new user message and the LLM response to the database
    save_message(user_id, "user", user_input)
    save_message(user_id, "assistant", response)

    return response

@app.route('/', methods=['GET'])
def home():
    return 'Welcome to the LLM service!'
# API endpoint for chat
@app.route('/llm', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    user_id = request.json.get('user_id')

    if not user_input or not user_id:
        return jsonify({"error": "No input or user ID provided"}), 400

    # Process chat and get the response
    response = chat_with_llm(user_id, user_input)

    return jsonify({"reply": response}), 200


# Run the Flask app
if __name__ == '__main__':
    # Initialize the database
    init_db()
    app.run(port=5001)