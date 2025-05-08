import csv
import requests
import html
from bs4 import BeautifulSoup
from time import sleep
from colorama import Fore, Style

# Настройки
CSV_FILE = '/home/yesh/Downloads/seo теги правки года1.csv'
DELAY = 1
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
HEADERS = {'User-Agent': USER_AGENT}

def decode_html_entities(text):
    return html.unescape(text) if text else ''

def check_columns(row):
    """Проверяет наличие обязательных колонок с учетом регистра и пробелов"""
    required = ['address', 'title 1', 'meta description 1']
    existing = [k.strip().lower() for k in row.keys()]

    missing = [col for col in required if col not in existing]
    if missing:
        print(f"{Fore.RED}Ошибка: В CSV отсутствуют колонки {missing}!")
        print(f"Обнаруженные колонки: {list(row.keys())}{Style.RESET_ALL}")
        exit(1)

def check_page(url, expected_title, expected_desc):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # Получаем title
        title_tag = soup.title
        actual_title = decode_html_entities(title_tag.string.strip()) if title_tag else ''
        actual_title = actual_title.replace('"', '')

        # Получаем meta description
        meta_tag = soup.find('meta', {'name': 'description'}) or soup.find('meta', {'property': 'og:description'})
        actual_desc = decode_html_entities(meta_tag.get('content', '').strip()) if meta_tag else ''
        actual_desc = actual_desc.replace('"', '')

        # Нормализация для сравнения
        expected_title = ' '.join(expected_title.strip().replace('"', '').split())
        expected_desc = ' '.join(expected_desc.strip().replace('"', '').split())

        title_match = actual_title == expected_title
        desc_match = actual_desc == expected_desc

        return title_match, desc_match, actual_title, actual_desc

    except Exception as e:
        print(f"{Fore.RED}Ошибка при проверке {url}: {e}{Style.RESET_ALL}")
        return False, False, '', ''

def main():
    try:
        with open(CSV_FILE, 'r', encoding='utf-8') as file:
            # Автоопределение разделителя
            dialect = csv.Sniffer().sniff(file.read(1024))
            file.seek(0)

            reader = csv.DictReader(file, dialect=dialect)
            first_row = next(reader)
            check_columns(first_row)

            # Возврат в начало файла
            file.seek(0)
            reader = csv.DictReader(file, dialect=dialect)

            total = 0
            passed = 0

            for row in reader:
                total += 1
                url = row.get('Address') or row.get('address') or row.get('URL')
                title = row.get('Title 1') or row.get('title')
                desc = row.get('Meta Description 1') or row.get('meta description')

                print(f"\nПроверяем {url}...")

                title_match, desc_match, actual_title, actual_desc = check_page(
                    url, title, desc
                )

                # Вывод результатов
                status = []
                status.append(f"Title: {Fore.GREEN}OK{Style.RESET_ALL}" if title_match else f"Title: {Fore.RED}ERROR{Style.RESET_ALL}")
                status.append(f"Description: {Fore.GREEN}OK{Style.RESET_ALL}" if desc_match else f"Description: {Fore.RED}ERROR{Style.RESET_ALL}")

                print(" | ".join(status))

                if not title_match or not desc_match:
                    if not title_match:
                        print(f"Ожидалось: {title}")
                        print(f"Получено:  {Fore.RED}{actual_title}{Style.RESET_ALL}")
                    if not desc_match:
                        print(f"Ожидалось: {desc}")
                        print(f"Получено:  {Fore.RED}{actual_desc}{Style.RESET_ALL}")
                else:
                    passed += 1

                sleep(DELAY)

            print(f"\nИтог: {Fore.GREEN}{passed}/{total} прошли проверку{Style.RESET_ALL}")

    except Exception as e:
        print(f"{Fore.RED}Критическая ошибка: {e}{Style.RESET_ALL}")
        exit(1)

if __name__ == "__main__":
    main()