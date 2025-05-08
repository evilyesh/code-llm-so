"""
Code parsing using Tree-sitter for Python/JS/PHP extraction.
Provides functions to parse source code files, extract functions/classes,
and store the results in a database.
"""

from tree_sitter import Language, Parser
import tree_sitter_python as py_language
import tree_sitter_javascript as js_language
import tree_sitter_php as php_language
from db import Database
from ext import get_short_description
from files import get_file_code_type
import os

def parse_file(file_path):
	"""Parse file content with appropriate Tree-sitter language."""
	with open(file_path, 'r', encoding='utf-8') as file:
		content = file.read()

	language_map = {
		'.php': php_language.language_php(),
		'.js': js_language.language(),
		'.jsx': js_language.language(),
		'.py': py_language.language()
	}

	file_extension = os.path.splitext(file_path)[1].lower()
	if file_extension not in language_map:
		print('file path: ', file_path)
		raise ValueError("Unsupported file type")

	parser = Parser(Language(language_map[file_extension]))
	tree = parser.parse(content.encode('utf-8'))
	return tree.root_node, content

def extract_decorations(node, content):
	"""Extract decorators from Python definitions."""
	decorations = []
	if node.type == 'decorated_definition':
		for child in node.children:
			if child.type == 'decorator':
				decorations.append(content[child.start_byte:child.end_byte])
	return decorations

def get_parameters(params_node, content, file_type):
	"""Extract function/method parameters with types and defaults."""
	parameters = []
	for child in params_node.children:
		if child.type == 'identifier':
			param = content[child.start_byte:child.end_byte]
			# Handle type annotations (Python, PHP)
			if file_type == 'python' and child.next_sibling and child.next_sibling.type == 'type_annotation':
				param += content[child.next_sibling.start_byte:child.next_sibling.end_byte]
			elif file_type == 'php' and child.next_sibling and child.next_sibling.type == 'type_identifier':
				param += f": {content[child.next_sibling.start_byte:child.next_sibling.end_byte]}"
			# Handle default values (Python, PHP)
			if child.next_sibling and child.next_sibling.type == 'default_argument':
				param += f" = {content[child.next_sibling.start_byte:child.next_sibling.end_byte]}"
			parameters.append(param)
	return parameters

def get_return_type(node, content, file_type):
	"""Extract return type for functions/methods."""
	if file_type == 'python' and node.type == 'function_definition':
		return_node = node.child_by_field_name('return_type')
		if return_node:
			return content[return_node.start_byte:return_node.end_byte]
	elif file_type == 'php' and node.type == 'function_definition':
		return_node = node.child_by_field_name('return_type')
		if return_node:
			return content[return_node.start_byte:return_node.end_byte]
	return None

def extract_functions_and_classes(node, content, file_path, file_type):
	"""Recursively extract code structures from AST."""
	results = []

	def process_node(node, source_code, current_class=''):
		if node.type == 'decorated_definition':
			decorations = extract_decorations(node, source_code)
			for child in node.children:
				if child.type in ('function_definition', 'method_definition'):
					function_name = child.child_by_field_name('name').text.decode('utf-8') if child.child_by_field_name('name') else ''
					full_code = node.text.decode('utf-8')
					function_type = 'method' if current_class else 'function'
					results.append({
						"file_type": file_type,
						"type": function_type,
						"path": file_path,
						"class": current_class,
						"method": function_name if function_type == 'method' else '',
						"function": function_name if function_type == 'function' else '',
						"short_description": '',
						"full_code": full_code,
						"decorations": ', '.join(decorations)
					})

		elif node.type in ('function_definition', 'function_declaration', 'method_definition', 'arrow_function'):
			function_name = node.child_by_field_name('name').text.decode('utf-8') if node.child_by_field_name('name') else ''
			full_code = node.text.decode('utf-8')

			# Determine function type based on language and context
			if file_type == 'javascript':
				if node.type == 'method_definition':
					function_type = 'method'
				elif node.type in ['function_declaration', 'arrow_function']:
					function_type = 'function'
				else:
					function_type = 'function'
			else:
				function_type = 'function' if not current_class else 'method'

			results.append({
				"file_type": file_type,
				"type": function_type,
				"path": file_path,
				"class": current_class,
				"method": function_name if function_type == 'method' else '',
				"function": function_name if function_type == 'function' else '',
				"short_description": '',
				"full_code": full_code,
				"decorations": ''
			})

		elif node.type in ('class_declaration', 'class_definition'):
			class_name = node.child_by_field_name('name').text.decode('utf-8') if node.child_by_field_name('name') else ''
			full_code = node.text.decode('utf-8')
			results.append({
				"file_type": file_type,
				"type": "class",
				"path": file_path,
				"class": class_name,
				"method": "",
				"function": "",
				"short_description": '',
				"full_code": full_code,
				"decorations": ''
			})
			for child in node.children:
				if child.type in ('class_body', 'declaration_list', 'block'):
					for subchild in child.children:
						process_node(subchild, source_code, class_name)

		elif node.type in ('program', 'module'):
			for child in node.children:
				process_node(child, source_code)

		elif node.type in ('expression_statement', 'statement_block'):
			for child in node.children:
				process_node(child, source_code)

	process_node(node, content)
	return results

def save_to_db(results, settings):
	"""Store parsed code structures in database."""
	db = Database()
	db.db_init()
	db.get_conn()

	records = [
		(
			result['type'],
			result['path'],
			result['class'],
			result['method'],
			result['function'],
			'',
			# get_description(f"code block type: {result['type']}\n{'class: ' + result['class'] + '\n\n' if result['class'] else ''}```{result['file_type']}\n\n{result['full_code']}\n```", settings),
			# result['short_description'],
			result['full_code'],
			result['decorations']
		) for result in results
	]

	if records:
		db.add_records(records)

def get_description(full_code, settings):
	"""Generate description for code block using LLM."""
	r = get_short_description(full_code, settings)
	return r

def parse_file_to_db(file_path, settings=None):
	"""Main pipeline: parse file and save results to database."""
	root_node, content = parse_file(file_path)
	file_type = get_file_code_type(file_path)
	results = extract_functions_and_classes(root_node, content, file_path, file_type)
	save_to_db(results, settings)

if __name__ == "__main__":
	file_src_path = '/home/yesh/Projects/PycharmProjects/AI/web_llm_test/tree_sitter_t.py'
	db_path = 'db.db'
	parse_file_to_db(file_src_path)