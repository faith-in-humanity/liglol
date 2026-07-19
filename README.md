![License](https://img.shields.io/github/license/faith-in-humanity/liglol?color=blue)
![Stage](https://img.shields.io/badge/stage-beta-orange)
# Auto-Skip Ads & Intro ⏭

**Hands-free ad skipping for YouTube + auto "Skip Intro" on anime sites.**
A single userscript for Safari (via the [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app) — no external dependencies, no network requests, no tracking.

> Start a video, walk away, cook, wash the dishes. Ads die on their own in about a second — muted.

[Русская версия ниже ⬇](#-русская-версия)

---

## What it does

- **YouTube:** detects any ad (pre-roll, mid-roll, bumper, "1 of 2", unskippable) and removes it hands-free in ~1–2 seconds, muted. Your video resumes exactly where it was interrupted.
- **Anime sites** (jut.su, animego.org, anilibria.tv, animevost.org, 2anime.ru): auto-clicks "Skip Ad" / "Skip Intro" / "Skip Opening" buttons the moment they appear.

## How it works (short version)

YouTube marks every ad with a CSS class on the player. While that class is present, the script:

1. mutes the ad and plays it at 16× speed, seeking to its end;
2. clicks the Skip button as a best-effort bonus (YouTube ignores programmatic clicks, so this alone is never relied upon);
3. if the ad is stuck (common when an ad blocker cuts the ad's media files), it reloads the same video via the player API — the reload comes back ad-free and resumes at the same second.

When the ad class disappears, your original speed and sound are restored.

## Install (Safari on macOS / iOS)

1. Install the free open-source [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app.
2. Enable the extension in Safari settings and allow it on the sites you need.
3. Put `auto-skip.user.js` into the Userscripts folder (or create a new script in the app and paste the file's contents).
4. Reload the tab. Done — there is no on-page UI.

Also works in Tampermonkey/Violentmonkey (Chrome, Firefox, Edge) — the script only uses standard web APIs.
![Install](https://img.shields.io/badge/Install-Click_to_Install-green)

## On/off switch

There is deliberately **no floating button on the page**. To toggle the whole script, use the **Userscripts icon in Safari's toolbar** — one tap on the script name. Fine-grained switches live at the top of the file:

```js
const SKIP_ADS = true;    // YouTube ads + ad buttons on anime sites
const SKIP_INTRO = true;  // "Skip Intro" buttons
const DEBUG = false;      // set true to see [AutoSkip] logs in the console
```

## Add your own site

1. Add a `@match https://your-site/*` line to the header.
2. Add an entry to `SITE_CONFIGS` (selectors may stay empty — the universal text search finds most "Skip" buttons by their label).

## Safety

- Zero network requests, zero external dependencies, zero data collection. The whole script is one readable file.
- Auto-clicks are guarded: the script refuses to click any link that would download a file or navigate to another domain.
- HTTPS-only site allowlist via `@match`.

## Disclaimer

Skipping ads is against YouTube's Terms of Service, like any ad blocker. No account bans for client-side skipping are known, but you use this at your own risk. This project is for personal and educational use.

## License

[MIT](LICENSE)

---

# 🇷🇺 Русская версия

**Автопропуск рекламы на YouTube + автонажатие «Пропустить интро» на аниме-сайтах.**
Один юзерскрипт для Safari (через бесплатное приложение [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)) — без зависимостей, без сетевых запросов, без слежки.

> Включи видео и уйди готовить. Реклама умрёт сама примерно за секунду — без звука.

## Что делает

- **YouTube:** ловит любую рекламу (перед видео, посреди, «1 из 2», непропускаемую) и убирает её без рук за ~1–2 секунды, без звука. Видео продолжается ровно с того места, где его прервали.
- **Аниме-сайты** (jut.su, animego.org, anilibria.tv, animevost.org, 2anime.ru): сам жмёт кнопки «Пропустить рекламу» / «Пропустить интро», как только они появляются.

## Установка (Safari на macOS / iOS)

1. Поставь бесплатное приложение [Userscripts](https://apps.apple.com/app/userscripts/id1463298887).
2. Включи расширение в настройках Safari и разреши его на нужных сайтах.
3. Положи файл `auto-skip.user.js` в папку Userscripts (или создай новый скрипт в приложении и вставь содержимое файла).
4. Перезагрузи вкладку. Всё — кнопок на странице нет, ничего настраивать не нужно.

Работает и в Tampermonkey/Violentmonkey (Chrome, Firefox, Edge).
![Install](https://img.shields.io/badge/Install-Click_to_Install-green)

## Включение и выключение

Плавающей кнопки на странице **нет специально**. Скрипт целиком включается и выключается через **значок Userscripts в панели Safari** — один тап по имени скрипта. Тонкие настройки — в начале файла:

```js
const SKIP_ADS = true;    // реклама на YouTube + кнопки на аниме-сайтах
const SKIP_INTRO = true;  // кнопки «Пропустить интро»
const DEBUG = false;      // поставь true, чтобы видеть логи [AutoSkip] в консоли
```

## Важно знать

Пропуск рекламы противоречит правилам YouTube — как и любой блокировщик рекламы. Случаев бана аккаунтов за такое неизвестно, но используешь на свой страх и риск. Проект — для личного и учебного использования.

## Лицензия

[MIT](LICENSE) — можно свободно использовать, менять и распространять.
[raw-link]: https://github.com/faith-in-humanity/liglol/raw/main/auto-skip.user.js
