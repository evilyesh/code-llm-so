import datetime
import json


def log_history(messages):
    """
    Log the chat history to a file with timestamps.
    Includes both user prompts and model responses.
    """
    d = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(f'log/history_{d}.txt', 'a') as history_file:
        for message in messages:
            history_file.write(f"{message.get('role')}: \n{message.get('content')}\n")

def log_chatml(prompt, model_response):
    """
    Store chat history in ChatML format in a JSONL file.

    Args:
        prompt (str): User's prompt
        model_response (str): Model's response
    """
    # Create chat history entry
    chat_entry = {
        "messages": [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": model_response}
        ]
    }

    # Convert to JSON string
    json_entry = json.dumps(chat_entry, ensure_ascii=False)

    # Write to file
    history_file_path = 'history/history.jsonl'
    with open(history_file_path, 'a') as f:
        f.write(json_entry + '\n')