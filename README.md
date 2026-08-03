![License](https://img.shields.io/github/license/faith-in-humanity/liglol?color=blue)
![Stage](https://img.shields.io/badge/stage-beta-orange)
# Auto-Skip Ads & Intro ⏭

**Hands-free ad skipping for YouTube, TikTok, and anime sites — plus a "still watching?" dialog killer and best-quality auto-select.**
Available as a userscript (Safari, Tampermonkey, Violentmonkey) or as a zero-permission browser extension (Chrome, Brave, Edge) — no external dependencies, no network requests, no tracking.

> Start a video, walk away, cook, wash the dishes. Ads die on their own — muted, in about a second.

[Русская версия ниже ⬇](#-русская-версия)

---

## What it does

- **YouTube:** detects any ad (pre-roll, mid-roll, bumper, "1 of 2", unskippable) and removes it hands-free, muted, resuming exactly where it was interrupted. Auto-selects the best available video quality. Auto-dismisses the "Video paused. Continue watching?" dialog so long videos don't stall while you're away — cookie/consent prompts are never touched.
- **TikTok:** detects sponsored/promoted videos in the feed and scrolls past them automatically.
- **Anime sites** (jut.su, animego.org/.me, anilibria.tv, animevost.org, 2anime.ru, yummyanime.tv, gogoanime.run/.sk, 9anime.to, zoro.to, animixplay.to, twist.moe, kickassanime.ro): auto-clicks "Skip Ad" / "Skip Intro" / "Skip Opening" buttons the moment they appear.

## How it works (short version)

YouTube marks every ad with a CSS class on the player. While that class is present, the script:

1. mutes the ad and plays it at 16× speed, seeking to its end;
2. clicks the Skip button as a best-effort bonus (YouTube ignores programmatic clicks, so this alone is never relied upon);
3. if the ad is stuck or YouTube refuses the seek (common when a network ad blocker cuts the ad's media files), it reloads the same video via the player API — the reload comes back ad-free and resumes at the same second.

When the ad class disappears, your original speed and sound are restored.

## Install

### Option A — browser extension (Chrome, Brave, Edge) — recommended for most people

No Tampermonkey, no pasting code. Requests zero permissions.

1. Download this repo (Code → Download ZIP) and unzip it, or clone it.
2. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `chrome-extension` folder.
5. Done. To update later: pull the latest files, then click the refresh icon on the extension's card.

### Option B — userscript (Safari, or Tampermonkey/Violentmonkey)

1. **Safari (macOS/iOS):** install the free [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app, enable it in Safari settings, then put `auto-skip.user.js` in the Userscripts folder (or paste its contents into a new script in the app).
2. **Chrome/Firefox/Edge via Tampermonkey/Violentmonkey:** click the button below.

[![Install](https://img.shields.io/badge/Install-Click_to_Install-green)][raw-link]

Reload the tab after installing. Done — there is no on-page UI.

## On/off switch

There is deliberately **no floating button on the page**. Toggle the whole script/extension from its icon (Userscripts toolbar icon, Tampermonkey menu, or the extension's on/off switch in `chrome://extensions`). Fine-grained switches live at the top of the file:

```js
const SKIP_ADS = true;      // YouTube + TikTok + anime-site ads
const SKIP_INTRO = true;    // "Skip Intro" buttons on anime sites
const MAX_QUALITY = true;   // auto-select best YouTube video quality
const CLOSE_POPUPS = true;  // dismiss YouTube's "still watching?" dialog
const DEBUG = false;        // set true to see [AutoSkip] logs in the console
```

## Add your own site

1. Add a `@match https://your-site/*` line to the header (userscript) or to `matches` in `chrome-extension/manifest.json`.
2. Add an entry to `SITE_CONFIGS` (selectors may stay empty — the universal text search finds most "Skip" buttons by their label).

## Safety

- Zero network requests, zero external dependencies, zero data collection. The whole script is one readable file, shared verbatim between the userscript and the extension.
- Auto-clicks are guarded: the script refuses to click any link that would download a file or navigate to another domain.
- The "still watching?" dialog is only touched if both its element and its text match a known confirm dialog — and never if a cookie/consent prompt is visible on screen at the same time. Consent choices are always left to you.
- HTTPS-only site allowlist via `@match` (userscript) / `matches` (extension manifest, which requests zero `permissions`).

## Disclaimer

Skipping ads is against YouTube's Terms of Service, like any ad blocker. No account bans for client-side skipping are known, but you use this at your own risk. This project is for personal and educational use.

## License

[MIT](LICENSE)

---

# 🇷🇺 Русская версия

**Автопропуск рекламы на YouTube, TikTok и аниме-сайтах — плюс закрытие диалога «Вы ещё смотрите?» и автовыбор лучшего качества видео.**
Доступен как юзерскрипт (Safari, Tampermonkey, Violentmonkey) или как расширение браузера с нулевыми разрешениями (Chrome, Brave, Edge) — без зависимостей, без сетевых запросов, без слежки.

> Включи видео и уйди готовить. Реклама умрёт сама — без звука, примерно за секунду.

## Что делает

- **YouTube:** ловит любую рекламу (перед видео, посреди, «1 из 2», непропускаемую) и убирает её без рук, без звука, продолжая ровно с того места, где прервали. Сам ставит лучшее доступное качество видео. Сам закрывает диалог «Видео приостановлено. Продолжить просмотр?», чтобы длинные видео не стояли, пока тебя нет — куки-баннеры и согласия скрипт не трогает никогда.
- **TikTok:** находит рекламные/спонсорские видео в ленте и сам пролистывает их.
- **Аниме-сайты** (jut.su, animego.org/.me, anilibria.tv, animevost.org, 2anime.ru, yummyanime.tv, gogoanime.run/.sk, 9anime.to, zoro.to, animixplay.to, twist.moe, kickassanime.ro): сам жмёт кнопки «Пропустить рекламу» / «Пропустить интро» / «Пропустить опенинг», как только они появляются.

## Установка

### Вариант А — расширение браузера (Chrome, Brave, Edge) — проще всего

Не нужен Tampermonkey, не нужно вставлять код руками. Разрешений — ноль.

1. Скачай этот репозиторий (Code → Download ZIP) и распакуй, или склонируй.
2. Открой `chrome://extensions` (или `brave://extensions`, `edge://extensions`).
3. Включи **Режим разработчика** (сверху справа).
4. Нажми **Загрузить распакованное расширение** и выбери папку `chrome-extension`.
5. Готово. Чтобы обновить позже: подтяни свежие файлы, потом нажми значок обновления на карточке расширения.

### Вариант Б — юзерскрипт (Safari, или Tampermonkey/Violentmonkey)

1. **Safari (macOS/iOS):** поставь бесплатное приложение [Userscripts](https://apps.apple.com/app/userscripts/id1463298887), включи его в настройках Safari, положи `auto-skip.user.js` в папку Userscripts (или вставь содержимое файла в новый скрипт в приложении).
2. **Chrome/Firefox/Edge через Tampermonkey/Violentmonkey:** нажми кнопку ниже.

[![Install](https://img.shields.io/badge/Install-Click_to_Install-green)][raw-link]

Перезагрузи вкладку после установки. Готово — кнопок на странице нет.

## Включение и выключение

Плавающей кнопки на странице **нет специально**. Всё включается и выключается через значок расширения/скрипта (значок Userscripts в Safari, меню Tampermonkey, или переключатель расширения в `chrome://extensions`). Тонкие настройки — в начале файла:

```js
const SKIP_ADS = true;      // реклама на YouTube + TikTok + кнопки на аниме-сайтах
const SKIP_INTRO = true;    // кнопки «Пропустить интро» на аниме-сайтах
const MAX_QUALITY = true;   // автовыбор лучшего качества видео на YouTube
const CLOSE_POPUPS = true;  // закрытие диалога «Вы ещё смотрите?» на YouTube
const DEBUG = false;        // поставь true, чтобы видеть логи [AutoSkip] в консоли
```

## Безопасность

- Ни одного сетевого запроса, ни одной внешней зависимости, ноль сбора данных. Весь скрипт — один читаемый файл, одинаковый в юзерскрипте и в расширении.
- Автоклики защищены: скрипт отказывается кликать ссылки, которые скачивают файл или ведут на чужой домен.
- Диалог «Вы ещё смотрите?» трогается только если совпали И тег элемента, И текст — и никогда, если на экране одновременно виден баннер согласия на куки. Решение про куки — всегда твоё.
- Белый список сайтов только по HTTPS через `@match` (юзерскрипт) / `matches` (манифест расширения, который не просит НИ ОДНОГО `permission`).

## Важно знать

Пропуск рекламы противоречит правилам YouTube — как и любой блокировщик рекламы. Случаев бана аккаунтов за такое неизвестно, но используешь на свой страх и риск. Проект — для личного и учебного использования.

## Лицензия

[MIT](LICENSE) — можно свободно использовать, менять и распространять.

[raw-link]: https://github.com/faith-in-humanity/liglol/raw/main/auto-skip.user.js
