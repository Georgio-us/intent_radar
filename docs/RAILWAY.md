# Развёртывание Railway

Владелец разрешил переход с localhost на Railway. Сервис опубликован: https://intentradar-production.up.railway.app.

Один сервис, Dockerfile, один экземпляр. Добавить volume с mount path `/data` и переменную `RADAR_DATA_DIR=/data`. Миграции SQLite выполняются при первом обращении к базе, volume сохраняет данные при redeploy. PostgreSQL сейчас не используется.

Variables:
- `THREADS_ACCESS_TOKEN`: новый пользовательский токен из Meta, вводится владельцем в Railway.
- `RADAR_PASSWORD`: пароль входа в скринер, вводится владельцем; логин `reset`. Без пароля production закрыт (503).
- `RADAR_DATA_DIR`: `/data`.
- `APP_ORIGIN`: точный HTTPS адрес сервиса без завершающего слеша. Если не задан, используется `RAILWAY_PUBLIC_DOMAIN`.

Railway задаёт PORT. Healthcheck `/api/health` публичен и не возвращает секреты/данные. Страницы /privacy и /data-deletion и ресурсы /_next/static/ также публичны. Рабочий интерфейс и остальные API защищены Basic Auth через HTTPS. Исходные `.env*` и `data/` не включаются в Docker image или загрузку через CLI. Новый токен не отправлять в GitHub или чат.

Проверка после deployment: health 200; без пароля скринер 401; вход reset + пароль; сохранение запроса; пробный сбор; проверка данных после redeploy. Старый токен выдавал OAuth 190 Failed to decrypt — перенос хостинга не является исправлением ошибки авторизации. Новый токен на Railway дал успешные пустые ответы; доступ к чужим публичным публикациям пока не подтверждён.
