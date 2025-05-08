"""
Handles interactions with language model API.
Includes functions for sending prompts, processing responses,
and managing chat history.
"""

import requests
import json
import hashlib
import lang
import re


def simple_hash(input_str):
	"""Generate a simple MD5 hash of the input string."""
	return hashlib.md5(input_str.encode()).hexdigest()

def chat_with_model(url, payload, headers):
	"""
	Send a prompt to the language model API and return the response.
	Raises an exception if the request fails.
	"""
	response = requests.post(url, headers=headers, data=json.dumps(payload))
	if response.status_code == 200:
		resp = response.json()
		print("response.json()", json.dumps(resp, indent=4, default=str))
		message = resp['choices'][0]['message']

		content = (message.get("content", '') or '').strip()
		content, thoughts = find_think_content(content)
		reasoning = (message.get("reasoning", '') or '').strip()

		if resp.get('model') == 'qwen/qwq-32b' and resp.get('provider') == 'Chutes':  # bug in openrouter or provider ? - provider
			content = reasoning + "\n" + content


		if content.startswith("```json"): # bug in openrouter or provider ?
			content = content.removeprefix("```json")

		if content.endswith("```"): # bug in openrouter or provider ?
			content = content.removesuffix("```")

		return {
			"content": content or reasoning,
			"reasoning": reasoning,
			"thoughts": thoughts,
		}
	else:
		raise Exception(f"API request failed with status code {response.status_code}: {response.text}")


def find_think_content(text: str) -> tuple[str, str]:
	pattern = lang.THINK_REGEXP
	think_content = re.findall(pattern, text, re.DOTALL)  # Extract all content inside tags
	cleaned_text = re.sub(pattern, '', text, flags=re.DOTALL)  # Remove tags
	return cleaned_text, think_content[0] if think_content else ''

def clean_think_content(text):
	return find_think_content(text)[0]
