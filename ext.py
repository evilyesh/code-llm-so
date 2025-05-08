# Standard Library Imports
import os
import json
import copy
import re
from typing import Dict, List, Optional

# Third-party Imports
import requests

# Local Imports
import lang
from chat import chat_with_model, clean_think_content
from loging import log_chatml, log_history
from files import _get_files_content, find_retrieve_code


def calculate_total_tokens(messages):
    """Calculate total tokens for messages (preserved as-is)"""
    return sum(len(message["content"].split()) * 3 for message in messages)


def get_settings_list() -> List[Dict]:
    """Return list of all available settings files."""
    config_dir = 'config/'
    config_files = [f for f in os.listdir(config_dir) if f.endswith('.json')]
    return [
        {
            "file_name": config_file,
            "settings": json.load(open(os.path.join(config_dir, config_file), 'r'))
        }
        for config_file in config_files
    ]


def set_selected_settings(data: Dict, settings) -> Dict:
    """Set the currently selected settings configuration."""
    selected_settings = data.get('selectedSettings')
    settings.loadSettings(selected_settings)
    return {"error": "", "msg": f"Selected settings set to {selected_settings}"}


def record_audio(data: Dict, settings) -> Dict:
    """Transcribe audio using Whisper service."""
    whisper_address = settings.get("whisper_address")
    response = requests.post(whisper_address, files=data)

    if response.status_code == 200:
        return {"transcription": response.json().get('text', '')}
    return {"error": "Failed to transcribe audio"}


def _generate_files_prompt(files_list: Dict) -> str:
    """Generate formatted prompt section for file contents."""
    files_content = _get_files_content(files_list) if files_list else {}
    return ''.join(
        lang.FILES_CONTENT_WRAPPER.format(
            file.replace(files_list.get(file, {}).get('project_path'), ''),
            lang.CONTENT_DELIMITER,
            content,
            lang.CONTENT_DELIMITER
        )
        for file, content in files_content.items()
    )


def _adjust_payload_size(task_content: str, payload: Dict) -> None:
    """Trim payload messages to fit token limits."""
    try:
        if (calculate_total_tokens([{'content': task_content}]) +
            calculate_total_tokens([{'content': payload["messages"][0].get('content')}])
            > payload["max_tokens"]):
            payload["messages"] = [payload["messages"][0]]
        else:
            while (calculate_total_tokens(payload["messages"]) + 
                   calculate_total_tokens([{'content': task_content}])
                   > payload["max_tokens"]):
                if len(payload["messages"]) > 1:
                    payload["messages"].pop(1)
    except Exception as e:
        print(e)


def prepare_send_prompt(data: Dict, settings) -> Dict:
    """
    Orchestrate prompt preparation, model interaction, and logging.
    Preserves token calculation logic exactly.
    """
    url = settings.get("url")
    headers = settings.get("headers")
    initial_prompt = data.get('prompt')
    files_list = data.get('files_list')
    use_descriptions = data.get('use_descriptions', False)
    prepare_plan = data.get('prepare_plan', False)
    check_answer = data.get('check_answer', False)
    prompt_prefix = data.get('prompt_prefix', '')

    additional_prompt = _generate_files_prompt(files_list)

    prompt = (
        f"{lang.PROMPT_PREFIX}{initial_prompt}\n"
        f"{lang.PROMPT_PREFIX_PREFIX + prompt_prefix + '\n' if prompt_prefix else ''}"
        f"{lang.PREFIX + additional_prompt + '\n' if additional_prompt else ''}"
        f"{lang.POSTFIX}"
    )

    payload = settings.get("payload_init")
    if data.get('clear_input') or not payload["messages"]:
        payload["messages"] = [{"role": "system", "content": lang.SYSTEM_PROMPT}]

    _adjust_payload_size(prompt, payload)
    payload["messages"].append({"role": "user", "content": prompt})

    payload['response_format'] =  {
        "type": "json_schema",
        "json_schema": {
            "name": "CodeAssistantResponse",
            "strict": True,
            "schema": {
                "properties": {
                    "thoughts": {
                        "type": "string",
                        "description": "Internal reasoning about the solution approach"
                    },
                    "answer": {
                        "type": "string",
                        "description": "Plain-text response to the user's question"
                    },
                    "files": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["path", "language", "thoughts", "content", "reasoning", "changes_verified"],
                            "properties": {
                                "path": {
                                    "type": "string",
                                    "description": "Full file path (e.g., '/src/index.js')"
                                },
                                "language": {
                                    "type": "string",
                                    "description": "Programming language (e.g., 'python', 'javascript')"
                                },
                                "thoughts": {
                                    "type": "string",
                                    "description": "Thoughts about the solution approach"
                                },
                                "content": {
                                    "type": "string",
                                    "description": "Complete file content"
                                },
                                "reasoning": {
                                    "type": "string",
                                    "description": "Explanation of changes made"
                                },
                                "changes_verified": {
                                    "type": "boolean",
                                    "default": False,
                                    "description": "Whether changes were validated"
                                }
                            }
                        }
                    },
                    "final_check": {
                        "type": "boolean",
                        "default": False,
                        "description": "Overall validation of all changes"
                    }
                },
                "required": ["answer", "thoughts", "files", "final_check"]
            }
        }
    }

    model_response = {}
    model_response_text = ''
    model_thoughts = ''
    try:
        response = chat_with_model(url, payload, headers)
        model_response_text = response.get("content", {})
        model_response = json.loads(model_response_text)
        model_thoughts = response.get("thoughts") or response.get("reasoning")
    except Exception as e:
        print(e)

    payload["messages"].append({"role": "assistant", "content": model_response_text})

    log_chatml(prompt, model_response)
    log_history(payload["messages"])

    return {
        "error": "",
        "data": model_response,
        "thoughts": model_thoughts
    }


def check_model_result(prompt: str, result: str, settings) -> str:
    """Validate model response quality against original prompt."""
    url = settings.get("think_model_address") or settings.get("url")
    headers = settings.get("headers")

    check_prompt = f"{lang.CHECK_USER_PREFIX}{prompt}{lang.CHECK_MODEL_ANSWER}{result}"
    messages = {
        "messages": [
            {"role": "system", "content": lang.SYSTEM_CHECK_PROMPT},
            {"role": "user", "content": check_prompt}
        ]
    }

    payload = copy.deepcopy(settings.get('payload_init', {}))
    payload.update(messages)

    if settings.get("think_model"):
        payload.update({"model": settings.get("think_model")})

    response = chat_with_model(url, payload, headers).get("content")
    return clean_think_content(response)


def analise_send_prompt(data: Dict, settings) -> str:
    """Analyze task and prepare execution plan."""
    url = settings.get("think_model_address") or settings.get("url")
    headers = settings.get("headers")

    payload = copy.deepcopy(settings.get('payload_init', {}))
    if settings.get("think_model"):
        payload.update({"model": settings.get("think_model")})

    task_prompt = (
        f"{lang.THINK_ADD_PROMPT}{data.get('prompt')}"
        f"{lang.THINK_FILES_LIST}{_generate_files_prompt(data.get('files_list'))}"
    )

    payload.update({
        "messages": [
            {"role": "system", "content": lang.SYSTEM_THINK_PROMPT},
            {"role": "user", "content": task_prompt}
        ]
    })

    response = chat_with_model(url, payload, headers).get("content")
    return clean_think_content(response)


def send_prompt_for_improve(data: Dict, settings) -> Dict:
    """Send prompt to model for prompt improving task."""
    prompt = data.get('prompt')
    if not prompt:
        return {"error": "No prompt provided"}

    url = settings.get("small_model_address") or settings.get("url")
    headers = settings.get("headers")
    payload = copy.deepcopy(settings.get("payload_init"))

    if data.get('clear_input') or not payload["messages"]:
        payload["messages"] = [{"role": "system", "content": lang.SYSTEM_PROMPT}]

    edit_prompt = f"{lang.EDIT_PROMPT_PREFIX} \n{prompt}"
    _adjust_payload_size(edit_prompt, payload)

    payload["messages"].append({"role": "user", "content": edit_prompt})
    response = chat_with_model(url, payload, headers).get("content")
    payload["messages"].append({"role": "assistant", "content": response})

    return {"error": "", "data": response}


def retrieve_send_prompt(data: Dict, settings) -> Optional[str]:
    """Retrieve relevant code based on prompt and files."""
    url = settings.get("url")
    headers = settings.get("headers")

    prompt = (
        f"{lang.GET_CODE_ADD_PROMPT}{data.get('prompt')}"
        f"{lang.GET_CODE_FILES_LIST}{_generate_files_prompt(data.get('files_list'))}"
    )

    payload = copy.deepcopy(settings.get('payload_init', {}))
    payload.update({
        "messages": [
            {"role": "system", "content": lang.SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    })

    if settings.get("think_model"):
        payload.update({"model": settings.get("think_model")})

    response = chat_with_model(url, payload, headers).get("content")
    retrieved_code = find_retrieve_code(response)

    if retrieved_code:
        return f"{lang.GET_CODE_FOR_INFORMATION}\n{retrieved_code}"
    return None


def get_short_description(code: str, settings) -> str:
    """Generate short description for code snippet."""
    url = settings.get("url")
    headers = settings.get("headers")

    payload = copy.deepcopy(settings.get('payload_init', {}))
    payload.update({
        "messages": [
            {"role": "system", "content": lang.PARSE_SHORT_DESCRIPTION_DB_SYSTEM},
            {"role": "user", "content": f"{lang.PARSE_SHORT_DESCRIPTION_DB_PROMPT}{code}"}
        ]
    })

    return chat_with_model(url, payload, headers).get("content")
