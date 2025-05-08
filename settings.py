"""
Module for working with settings.
Includes methods for loading and saving configurations, as well as interacting with the file system.
"""
import json
import os.path
import re
import lang


class Settings:
	def __init__(self, file_path='settings.json'):
		self.file_path = os.path.join('config/', file_path)
		self.settings = self._read_settings()

	def _read_settings(self):
		try:
			with open(self.file_path, 'r') as file:
				return json.load(file)
		except FileNotFoundError:
			return {}
		except json.JSONDecodeError:
			return {}

	def get(self, key, default=None):
		return self.settings.get(key, default)

	def set(self, key, value):
		self.settings[key] = value
		self._write_settings()

	def _write_settings(self):
		try:
			with open(self.file_path, 'w') as file:
				json.dump(self.settings, file, indent=4)
		except IOError as e:
			print(f"Error writing settings file: {e}")

	@staticmethod
	def remove_tabs(text):
		pattern = re.compile(r'\t+')
		return pattern.sub('\t', text)

	@staticmethod
	def remove_spaces(text):
		pattern = re.compile(r' +')
		return pattern.sub(' ', text)

	def get_trimmed(self, key, default=None):
		return self.remove_spaces(self.remove_tabs(self.settings.get(key, default)))

	def loadSettings(self, file_path):
		self.file_path = os.path.join('config/', file_path)
		self.settings = self._read_settings()

	def __str__(self):
		return f"(prefix={lang.PREFIX}, postfix={lang.POSTFIX})"
