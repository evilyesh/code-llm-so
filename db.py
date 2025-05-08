"""
SQLite database class for storing and retrieving code information.
Manages tables for codebase and file metadata.
"""

import sqlite3


class Database:
	"""
	Manages SQLite database operations for storing code information.
	Includes methods for creating tables, adding records, searching,
	and updating data.
	"""
	def __init__(self):
		self.conn = None
		self.cursor = None

	def get_conn(self):
		"""Establish a connection to the SQLite database."""
		self.conn = sqlite3.connect('db.db')
		self.cursor = self.conn.cursor()

	def db_init(self):
		"""Initialize the database by creating necessary tables."""
		self.execute_query('''
		CREATE TABLE IF NOT EXISTS codebase (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT,
			path TEXT,
			class TEXT,
			method TEXT,
			function TEXT,
			short_description TEXT,
			full_code TEXT,
			decorations TEXT
		);
		''')

		self.execute_query('''
		CREATE TABLE IF NOT EXISTS files (
			path TEXT,
			checksum TEXT,
			size INTEGER,
			mtime REAL,
			PRIMARY KEY (path)
		);
		''')

	def add_record(self, type, path, class_name, method, function, short_description, full_code, decorations):
		"""Add a single record to the codebase table."""
		self.execute_query('''
		INSERT INTO codebase (type, path, class, method, function, short_description, full_code, decorations)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		''', (type, path, class_name, method, function, short_description, full_code, decorations))

	def add_records(self, records):
		"""Add multiple records to the codebase table."""
		self.execute_query('''
		INSERT INTO codebase (type, path, class, method, function, short_description, full_code, decorations)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		''', records, many=True)

	def search_texts(self, query):
		"""Search the codebase table for records containing the query in full_code."""
		return self.execute_query('''
		SELECT * FROM codebase
		WHERE full_code LIKE ?
		ORDER BY id DESC
		''', ('%' + query + '%',))

	def search_by_class_and_method(self, queries):
		"""Search the codebase table for records matching the class and method pairs."""
		placeholders = ', '.join(['(?, ?)'] * len(queries))
		query = f'''
		SELECT * FROM codebase
		WHERE (class, method) IN ({placeholders})
		ORDER BY id DESC
		'''
		params = [item for sublist in queries for item in sublist]
		return self.execute_query(query, params)

	def search_by_function(self, functions):
		"""Search the codebase table for records matching the function names."""
		placeholders = ', '.join(['?'] * len(functions))
		query = f'''
		SELECT * FROM codebase
		WHERE function IN ({placeholders})
		ORDER BY id DESC
		'''
		return self.execute_query(query, functions)

	def update_record(self, record_id, type, path, class_name, method, function, short_description, full_code, decorations):
		"""Update an existing record in the codebase table."""
		self.execute_query('''
		UPDATE codebase
		SET type = ?, path = ?, class = ?, method = ?, function = ?, short_description = ?, full_code = ?, decorations = ?
		WHERE id = ?
		''', (type, path, class_name, method, function, short_description, full_code, decorations, record_id))

	def delete_record(self, record_id):
		"""Delete a record from the codebase table by its ID."""
		self.execute_query('DELETE FROM codebase WHERE id = ?', (record_id,))

	def get_all_records(self):
		"""Retrieve all records from the codebase table."""
		return self.execute_query('SELECT * FROM codebase ORDER BY id DESC')

	def categorize_search_queries(self, queries):
		"""
		Categorize search queries into class/method pairs and function names.
		Returns two lists: class_method_queries and function_queries.
		"""
		class_method_queries = []
		function_queries = []

		for query in queries:
			if 'class' in query and 'method' in query:
				class_method_queries.append((query['class'], query['method']))
			elif 'function' in query:
				function_queries.append(query['function'])

		return class_method_queries, function_queries

	def delete_record_by_path(self, path):
		"""Delete records from the codebase table by file path."""
		self.execute_query('DELETE FROM codebase WHERE path = ?', (path,))

	def execute_query(self, query, params=None, many=False):
		"""
		Execute a SQL query with optional parameters.
		Returns the results as a list of dictionaries if applicable.
		"""
		self.get_conn()
		if params:
			if many:
				self.cursor.executemany(query, params)
			else:
				self.cursor.execute(query, params)
		else:
			self.cursor.execute(query)

		results = []
		if self.cursor.description:
			# Get column names
			columns = [description[0] for description in self.cursor.description]

			# Fetch data and convert to dictionary
			results = []
			for row in self.cursor.fetchall():
				results.append(dict(zip(columns, row)))

		self.conn.commit()
		self.conn.close()
		self.conn = None
		self.cursor = None
		return results

	def get_file_info(self, paths):
		"""Retrieve file metadata from the files table by paths."""
		if isinstance(paths, str):
			paths = [paths]
		placeholders = ', '.join(['?'] * len(paths))
		query = f'''
		SELECT * FROM files WHERE path IN ({placeholders})
		'''
		return self.execute_query(query, paths)

	def add_or_update_file_info(self, files_data):
		"""
		Add or update file metadata in the files table.
		Includes checksum, size, and modification time.
		"""
		for file_data in files_data:
			path, checksum, size, mtime = file_data
			self.execute_query('''
			INSERT INTO files (path, checksum, size, mtime) VALUES (?, ?, ?, ?)
			ON CONFLICT(path) DO UPDATE SET checksum = ?, size = ?, mtime = ?
			''', (path, checksum, size, mtime, checksum, size, mtime))


	def add_or_update_file_info_short(self, files_data):
		"""
		Add or update file metadata in the files table.
		Includes only size and modification time.
		"""
		for file_data in files_data:
			path, size, mtime = file_data
			self.execute_query('''
			INSERT INTO files (path, size, mtime) VALUES (?, ?, ?)
			ON CONFLICT(path) DO UPDATE SET size = ?, mtime = ?
			''', (path, size, mtime, size, mtime))

	def delete_file_info_by_path(self, path):
		"""Delete file metadata from the files table by path."""
		self.execute_query('DELETE FROM files WHERE path = ?', (path,))