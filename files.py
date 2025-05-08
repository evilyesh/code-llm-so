import os
from db import Database
from code_request import process_model_response

db = Database()
db.db_init()

def get_files_content(data):
    files = data.get('files')
    path = data.get('path')

    if not files or not path:
        return {"error": "No files provided"}, 400

    return _get_files_content(files)

def _get_files_content(files):
    return {file.get('path'): open(file.get('path'), 'r').read() for file in files.values()}

def get_files_list(data):
    path = data.get('path') or data.get('project_path')
    current_path = data.get('current_path')

    if not path or not current_path:
        return {"error": "No directory provided"}, 400

    files_list = [
        {
            "name": entry.name,
            "type": 'file' if entry.is_file() else 'dir',
            "path": entry.path,
            "directory": current_path,
            "project_path": path,
            "content": '',
            "data": '',
            "relative_path": entry.path.replace(path, ''),
            "code_type": get_file_code_type(entry.name),
            "reasoning": '',
            "language": '',
            "thoughts": '',
        }
        for entry in os.scandir(current_path)
    ]

    files_list.sort(key=lambda x: (x['type'] == 'file', x['name']))

    return files_list

def get_project_files(path, exclude_items=None):
    exclude_items = exclude_items or []

    def get_files_recursively(current_path):
        files = []
        for item in os.scandir(current_path):
            if os.path.abspath(item.path) not in exclude_items.keys() and not check_binary_extension(item.name):
                files.extend(get_files_recursively(item.path)) if item.is_dir() else files.append(os.path.abspath(item.path))
        return files

    return get_files_recursively(path)

def check_files_for_updates(files, path):
    files_info_dict = {info['path']: info for info in db.get_file_info(files)}
    files_to_parse = [
        file
        for file in files
        if not (files_info_dict.get(file) and files_info_dict[file]['mtime'] == os.path.getmtime(file) and files_info_dict[file]['size'] == os.path.getsize(file))
    ]

    files_content = _get_files_content({file: {'path': file} for file in files_to_parse}) if files_to_parse else {}
    db.add_or_update_file_info_short([(file, os.path.getsize(file), os.path.getmtime(file)) for file in files_to_parse])

    return files_to_parse, files_content

def save_file(data):
    path = data.get('path')
    file_name = data.get('file_name')
    file_path = data.get('file_path')
    file_content = data.get('data')

    if not all([path, file_name, file_path, file_content]):
        return {"error": f"File {os.path.join(path, file_name)} was not updated."}

    with open(file_path, 'w') as file:
        file.write(file_content)

    return {"error": "", "msg": f"File {os.path.join(path, file_name)} updated"}

def find_retrieve_code(model_response):
    return process_model_response(model_response, db)

def get_file_code_type(file_name):
    extension = os.path.splitext(file_name)[1].lower()
    code_types = {
        '.py': 'python',
        '.js': 'javascript',
        '.html': 'html',
        '.css': 'css',
        '.php': 'php',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.go': 'go',
        '.rb': 'ruby',
        '.swift': 'swift',
        '.ts': 'typescript',
        '.jsx': 'jsx',
        '.tsx': 'tsx',
        '.vue': 'vue',
        '.md': 'markdown',
        '.json': 'json',
        '.xml': 'xml',
        '.yml': 'yaml',
        '.sh': 'bash',
        '.bat': 'batch',
        '.sql': 'sql',
        '.rs': 'rust',
        '.dart': 'dart',
        '.scala': 'scala',
        '.kotlin': 'kotlin',
        '.perl': 'perl',
        '.r': 'r',
        '.lua': 'lua',
        '.groovy': 'groovy',
        '.h': 'c_header',
        '.hpp': 'cpp_header',
        '.cs': 'csharp',
        '.elm': 'elm',
        '.erl': 'erlang',
        '.ex': 'elixir',
        '.exs': 'elixir_script',
        '.fs': 'fsharp',
        '.fsi': 'fsharp_interactive',
        '.fsx': 'fsharp_script',
        '.hs': 'haskell',
        '.lhs': 'literate_haskell',
        '.jl': 'julia',
        '.nim': 'nim',
        '.nix': 'nix',
        '.pl': 'perl',
        '.pm': 'perl_module',
        '.pm6': 'perl6',
        '.pod': 'perl_pod',
        '.pod6': 'perl6_pod',
        '.raku': 'raku',
        '.rakumod': 'raku_module',
        '.rakutest': 'raku_test',
        '.rhtml': 'rhtml',
        '.sml': 'sml',
        '.t': 'test',
        '.v': 'verilog',
        '.vhdl': 'vhdl',
        '.wat': 'webassembly',
        '.wasm': 'webassembly',
        '.xhtml': 'xhtml',
        '.yaml': 'yaml',
        '.zig': 'zig'
    }
    return code_types.get(extension, 'plaintext')

def check_binary_extension(file_name):
    binary_extensions = {
        '.exe', '.dll', '.so', '.bin', '.app', '.apk', '.jar', '.msi',
        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.z', '.iso',
        '.mp3', '.wav', '.flac', '.aac', '.ogg', '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.mpeg',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.psd', '.raw', '.ico',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
        '.db', '.sqlite', '.mdb', '.accdb', '.dbf', '.sql', '.dump',
        '.vmdk', '.vdi', '.qcow2', '.ova', '.ovf',
        '.pem', '.key', '.crt', '.cer', '.pfx', '.p12', '.gpg', '.pgp',
        '.log', '.core', '.crash',
        '.pak', '.dat', '.save', '.rom', '.sav',
        '.img', '.hex', '.fw', '.rom',
        '.dmg', '.pkg', '.deb', '.rpm', '.cab', '.swf', '.fla', '.ps', '.eps',
    }

    extension = os.path.splitext(file_name)[1].lower()
    return extension in binary_extensions