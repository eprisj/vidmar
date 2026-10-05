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

## Что нужно добавить в API

Оба эндпоинта только для вошедшего админа (та же cookie-сессия), с записью в
журнал действий.

### `POST /admin/publish`

Атомарно запишите `request.json` (во временный файл, затем `rename`):

```json
{ "by": "<логин админа>", "at": "2026-10-05T09:00:00.000Z" }
```

Если файл уже есть, его просто перезаписывают: несколько нажатий
объединяются в одну сборку. Ответ такой же, как у `GET`.

### `GET /admin/publish`

Ответ: содержимое `status.json` плюс два вычисляемых поля:

```jsonc
{
  // из status.json (если файла нет: state "idle", остальное null, log [])
  "state": "idle" | "building" | "ok" | "failed",
  "requested_by": "olena", "requested_at": "…",
  "started_at": "…", "finished_at": "…",
  "published_at": "…",       // когда последняя удачная сборка читала API
  "published_done_at": "…",  // когда она стала живой
  "commit": "3b5eb77…", "error": null, "log": [],

  // вычисляет API
  "queued": true,            // request.json существует
  "pending": {
    "books": [{ "id": 3, "title": "…", "updated_at": "…" }],   // updated_at > published_at
    "deleted_books": 0,                                          // удалены после published_at
    "texts": [{ "key": "home.slogan", "updated_at": "…" }],    // site texts, updated_at > published_at
    "seo": false                                                 // настройки SEO менялись после published_at
  }
}
```

Если `published_at` равен null (из админки ещё не публиковали), отдайте как
изменения всё, что менялось за последние, скажем, 30 дней. Иначе первый
список будет бесконечным.

Удалённые книги проще всего считать по журналу действий: записи `DELETE` по
сущности книги после `published_at`. Так же можно считать и всё остальное,
если удобнее.

Пример на Node (Express), чтобы было понятно, сколько тут работы:

```js
const DIR = "/var/lib/vidmar-publish";
const readJson = (f) => fs.promises.readFile(f, "utf8").then(JSON.parse).catch(() => null);

app.get("/admin/publish", requireAdmin, async (req, res) => {
  const st = (await readJson(`${DIR}/status.json`)) ?? { state: "idle", log: [] };
  const since = st.published_at ?? new Date(Date.now() - 30 * 864e5).toISOString();
  res.json({
    requested_by: null, requested_at: null, started_at: null, finished_at: null,
    published_at: null, published_done_at: null, commit: null, error: null,
    ...st,
    queued: fs.existsSync(`${DIR}/request.json`),
    pending: await pendingSince(since), // books / deleted_books / texts / seo из базы
  });
});

app.post("/admin/publish", requireAdmin, async (req, res) => {
  const tmp = `${DIR}/request.json.${process.pid}`;
  await fs.promises.writeFile(tmp, JSON.stringify({ by: req.admin.login, at: new Date().toISOString() }));
  await fs.promises.rename(tmp, `${DIR}/request.json`);
  // …и ответ как у GET
});
```
