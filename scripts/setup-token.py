"""Save a user-entered token locally without echo, shell history, or network requests."""
from pathlib import Path
import getpass, os, re, sys
os.chdir(Path(__file__).resolve().parent.parent)
if not sys.stdin.isatty():
    sys.exit('Запустите npm run setup:token в обычном терминале. Токен не передаётся аргументом команды.')
token = getpass.getpass('Вставьте токен Threads (ввод скрыт): ').strip()
if not re.fullmatch(r'[A-Za-z0-9_.|~-]{20,4096}', token):
    sys.exit('Не похоже на токен. Файл не изменён.')
path = Path('.env.local')
old = path.read_text() if path.exists() else ''
lines = [line for line in old.splitlines() if not re.match(r'^\s*THREADS_ACCESS_TOKEN\s*=', line)]
lines.append('THREADS_ACCESS_TOKEN=' + token)
tmp = Path('.env.local.tmp')
fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as f:
    f.write('\n'.join(lines) + '\n')
os.chmod(tmp, 0o600)
os.replace(tmp, path)
print('Токен сохранён локально. Перезапустите npm run dev и выполните один поиск в разделе «Подключение».')
