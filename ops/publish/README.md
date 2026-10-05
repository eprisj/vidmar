# Публикация сайта из админки

Сайт собирается в статический экспорт (`output: "export"`). Каталог, SEO и
тексты вшиваются в HTML при сборке. Читатели видят цены, наличие и тексты
сразу, потому что страницы дотягивают их из API. А вот поиск, карточки ссылок
в соцсетях, `sitemap.xml` и собственная страница новой книги меняются только
после пересборки.

Кнопка «Опублікувати» внизу меню админки запускает такую пересборку на
сервере. Без `deploy.sh` с ноутбука это не обойдётся.

```
админка ──POST /admin/publish──▶ API ──пишет──▶ /var/lib/vidmar-publish/request.json
   ▲                                                   │ (vidmar-publish.path видит файл)
   │                                                   ▼
   └──GET /admin/publish◀── API ◀──читает── status.json ◀── vidmar-publish.sh
                                                         git pull → npm run build → rsync в /var/www/vidmar
```

Пока API не умеет `/admin/publish` (отвечает 404), админка просто не
показывает кнопку. Значит, фронтенд можно выкладывать раньше сервера.

## Что делает скрипт

`vidmar-publish.sh` по шагам:

1. Забирает `request.json` (кто и когда попросил), пишет `state: "building"`.
2. Делает `git fetch` и `reset --hard origin/$BRANCH` в отдельном клоне `$SRC_DIR`.
3. Выполняет `npm ci`, но только если поменялся `package-lock.json`.
4. Удаляет кэш fetch, копирует `app/_admin` по секретному пути и запускает `npm run build`.
5. Проверяет результат:
   - если в собранном сайте нет ни одной страницы книги, а на живом они есть,
     значит, во время сборки не ответил API. Публикация останавливается,
     сайт не трогается;
   - если админка не собралась, сайт тоже не трогается.
6. Синхронизирует файлы командой `rsync --delete out/ $WEB_ROOT/` и пишет `state: "ok"`.

Ещё два свойства:
- если во время сборки кто-то снова нажал кнопку, скрипт сразу соберёт ещё раз;
- если systemd убил сборку по таймауту, `ExecStopPost` переводит зависший
  `building` в `failed`.

Проверено локально с заглушкой API: успешная публикация, пустой каталог,
повторный запрос во время сборки, прерванная сборка.

## Установка на VPS

Нужны Node 20+, git и rsync. Сборке Next нужно около 1–1,5 ГБ памяти, поэтому
на маленьком VPS стоит включить swap.

```bash
# пользователь для сборки и группа, через которую API пишет запросы
useradd --system --create-home --home-dir /srv/vidmar-build-home vidmar-build
groupadd --system vidmar-publish
usermod -aG vidmar-publish vidmar-build
usermod -aG vidmar-publish <пользователь, под которым работает API>

install -d -o vidmar-build -g vidmar-publish -m 2775 /var/lib/vidmar-publish
install -d -o vidmar-build -g vidmar-build /srv/vidmar-build
chown -R vidmar-build /var/www/vidmar

install -d /usr/local/lib/vidmar-publish
install -m 755 vidmar-publish.sh status.mjs /usr/local/lib/vidmar-publish/
install -d -m 750 -g vidmar-build /etc/vidmar
install -m 640 -g vidmar-build publish.env.example /etc/vidmar/publish.env
#   впишите VIDMAR_ADMIN_PATH (последняя часть ADMIN_URL из ~/.vidmar-admin)

cp vidmar-publish.path vidmar-publish.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now vidmar-publish.path

# проверка без API
echo '{"by":"root","at":"'"$(date -Is)"'"}' > /var/lib/vidmar-publish/request.json
journalctl -fu vidmar-publish
cat /var/lib/vidmar-publish/status.json
```

Скрипт берётся из `/usr/local/lib`, а не из клона: клон переписывается во
время сборки. После изменений в этой папке файлы нужно установить заново.

`deploy.sh` с ноутбука продолжает работать как запасной путь.

## API

Эндпоинты лежат в `vidmar-backend/publish.js`. Оба только для вошедшего админа,
а POST сам записывается в журнал действий.

- `POST /admin/publish` атомарно записывает `request.json` вида
  `{ "by": "<логин>", "at": "<время>" }`. Если файл уже есть, его просто
  перезаписывают: несколько нажатий до старта сборки дают одну сборку.
  Отвечает 202 и тем же телом, что `GET`.
- `GET /admin/publish` отдаёт `status.json`, а к нему `queued` (есть ли
  `request.json`) и `pending`:
  - книги с `updated_at` позже `published_at`;
  - удалённые книги, по журналу действий;
  - тексты, по `site_content` и его истории, включая возврат к встроенному тексту;
  - флаг, менялись ли настройки SEO.

  До первой публикации в `pending` попадает всё за последние 30 дней.

Папка берётся из `PUBLISH_DIR` в `.env` API, по умолчанию
`/var/lib/vidmar-publish`. Пока её нет, оба эндпоинта отвечают 501, и админка
не показывает кнопку. Поэтому порядок выкладки любой: API, сайт, сервер.

Пользователь, под которым работает API, должен быть в группе
`vidmar-publish` (см. установку выше). После `usermod` перезапустите
`vidmar-api`, иначе процесс не увидит новую группу.
