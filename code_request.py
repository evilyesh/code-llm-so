import json
import re

def process_model_response(model_response, db_handler):
    # Извлекаем JSON из текста ответа модели
    json_match = re.search(r'\{.*\}', model_response, re.DOTALL)
    if not json_match:
        print("Error: No valid JSON found in model response")
        return ""

    try:
        request_data = json.loads(json_match.group())
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in model response")
        return ""

    # Валидация структуры запроса
    if 'action' not in request_data or 'parameters' not in request_data:
        print("Error: Invalid request structure")
        return ""

    class_method_queries = []
    function_queries = []

    # Парсинг параметров запроса
    for param in request_data['parameters']:
        if param.get('class_name') and param.get('method_name'):
            # Запрос метода класса
            class_method_queries.append(
                (param['class_name'], param['method_name'])
            )
        elif param.get('class_name'):
            # Запрос всего класса
            class_method_queries.append(
                (param['class_name'], '')  # Пустой метод для обозначения класса
            )
        elif param.get('function_name'):
            # Запрос функции
            function_queries.append(param['function_name'])

    # Выполняем поиск в базе данных
    results = {}

    if class_method_queries:
        class_results = db_handler.search_by_class_and_method(class_method_queries)
        for item in class_results:
            key = f"{item['class']}.{item['method']}" if item['method'] else item['class']
            results[key] = {
                'type': item['type'],
                # 'path': item['path'],
                'short_description': item['short_description'],
                'description': item['full_code'],
                'decorators': item['decorations'].split(',') if item['decorations'] else []
            }

    if function_queries:
        function_results = db_handler.search_by_function(function_queries)
        for item in function_results:
            results[item['function']] = {
                'type': item['type'],
                # 'path': item['path'],
                'short_description': item['short_description'],
                'description': item['full_code'],
                'decorators': item['decorations'].split(',') if item['decorations'] else []
            }

    # Формируем ответ для модели
    response = []
    for key, data in results.items():
        response.append(
            f"\n{data['description']}"
            f"\n"
        )

    if not results:
        print("No matching code found in database")
        return ""

    return (
            "\n".join(response)
    )