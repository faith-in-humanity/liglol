// ==UserScript==
// @name         Auto-Skip Ads & Intro (YouTube + Anime sites)
// @namespace    local.autoskip
// @version      1.0.0-beta.18
// @description  Hands-free ad skipping on YouTube and auto "Skip Intro" on anime sites
// @author       faith-in-humanity
// @license      MIT
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @match        https://www.tiktok.com/*
// @match        https://tiktok.com/*
// @match        https://jut.su/*
// @match        https://*.jut.su/*
// @include      /^https:\/\/[a-z0-9-]+-jut\.su\//
// @match        https://animego.org/*
// @match        https://animego.me/*
// @match        https://anilibria.tv/*
// @match        https://animevost.org/*
// @match        https://2anime.ru/*
// @match        https://yummyanime.tv/*
// @match        https://yummyani.me/*
// @match        https://*.yummyani.me/*
// @match        https://gogoanime.run/*
// @match        https://gogoanime.sk/*
// @match        https://9anime.to/*
// @match        https://zoro.to/*
// @match        https://animixplay.to/*
// @match        https://twist.moe/*
// @match        https://kickassanime.ro/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Feature switches. Whole-script on/off lives in the Userscripts toolbar icon.
  const SKIP_ADS = true;
  const SKIP_INTRO = true;
  const MAX_QUALITY = true;
  const CLOSE_POPUPS = true;
  const CLOSE_BANNERS = true;
  const DEBUG = false;

  function log(msg) {
    if (DEBUG) console.log('[AutoSkip] ' + msg);
  }

  const SITE_CONFIGS = [
    {
      hostnames: ['tiktok.com', 'www.tiktok.com'],
      ad: { selectors: [], texts: [] },
      intro: { selectors: [], texts: [] },
    },
    {
      hostnames: ['youtube.com', 'www.youtube.com'],
      ad: {
        selectors: [
          '.ytp-ad-skip-button',
          '.ytp-ad-skip-button-modern',
          '.ytp-skip-ad-button',
          '.ytp-ad-skip-button-container button',
          '[class*="ytp-ad-skip"]',
          '[class*="ytp-skip-ad"]',
        ],
        texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip Ads', 'Skip'],
      },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro', 'Skip Recap'] },
    },
    {
      hostnames: ['jut.su'],
      hostSuffix: '-jut.su',
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro', 'Пропустить опенинг'] },
    },
    {
      hostnames: ['animego.org', 'animego.me'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['anilibria.tv'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['animevost.org'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['2anime.ru'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['yummyanime.tv', 'yummyani.me', 'old.yummyani.me'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['gogoanime.run', 'gogoanime.sk', 'gogoanime.info'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['9anime.to'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['zoro.to'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['animixplay.to'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['twist.moe'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
    {
      hostnames: ['kickassanime.ro'],
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro'] },
    },
  ];

  const UNIVERSAL_AD_TEXTS = ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip Ads', 'Skip'];
  const UNIVERSAL_INTRO_TEXTS = ['Пропустить интро', 'Пропустить опенинг', 'Skip Intro', 'Skip Recap', 'Skip Opening'];

  const currentHost = location.hostname.replace(/^www\./, '');
  const siteConfig = SITE_CONFIGS.find((cfg) =>
    cfg.hostnames.some((h) => currentHost === h || currentHost.endsWith('.' + h)) ||
    (cfg.hostSuffix && currentHost.endsWith(cfg.hostSuffix))
  );
  const isYoutube = currentHost === 'youtube.com';
  const isTiktok = currentHost === 'tiktok.com';

  const adSelectors = siteConfig ? siteConfig.ad.selectors : [];
  const adTexts = siteConfig ? [...new Set([...siteConfig.ad.texts, ...UNIVERSAL_AD_TEXTS])] : UNIVERSAL_AD_TEXTS;
  const introSelectors = siteConfig ? siteConfig.intro.selectors : [];
  const introTexts = siteConfig ? [...new Set([...siteConfig.intro.texts, ...UNIVERSAL_INTRO_TEXTS])] : UNIVERSAL_INTRO_TEXTS;

  const lastClickAt = new WeakMap();
  const CLICK_COOLDOWN_MS = 700;

  function isElementClickable(el) {
    if (!el || !(el instanceof Element)) return false;
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-disabled') === 'true') return false;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;

    const opacity = parseFloat(style.opacity);
    if (!isNaN(opacity) && opacity < 0.05) return false;

    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Ad state is driven by the ad class on #movie_player.
  const AD_RATE = 16.0;
  const RELOAD_AFTER_MS = 500;
  const RELOAD_LIMIT = 6;
  const RELOAD_WINDOW_MS = 60000;
  // Reload can land on another frozen ad, so retry with growing gaps.
  const RELOAD_BACKOFF_MS = [0, 400, 3000, 9000];
  const RELOAD_COOLDOWN_MS = 15000;
  const CLEAN_CONTENT_MS = 5000;
  // YouTube often blocks seek-to-end, so a long ad crawls at 16x. Stop waiting.
  const AD_HARD_LIMIT_MS = 900;
  // If the seek-to-end was refused the ad will never end on its own, so detect
  // that directly instead of waiting out the hard limit.
  const SEEK_PROBE_MS = 250;
  const POST_AD_WATCH_MS = 20000;
  const STALL_MS = 1500;
  const NUDGE_COOLDOWN_MS = 4000;
  const REWIND_S = 0.7;
  const TRACK_GAP_CAP_S = 2.5;
  const TRACK_TICK_MS = 100;
  const SEEK_FIX_MS = 10000;
  const AD_CLASSES = ['ad-showing', 'ad-interrupting'];
  const SKIP_BUTTON_SELECTOR = '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button';
  let ytAdActive = false;
  let ytSavedMuted = false;
  let ytAdStartedAt = 0;
  let ytAdSeenTime = -1;
  let ytAdProgressAt = 0;
  let ytReloadStreak = 0;
  let ytReloadTimes = [];
  let ytAdEndedAt = 0;
  let ytStallSeenTime = -1;
  let ytStallProgressAt = 0;
  let ytLastNudgeAt = 0;
  let lastContentVideoId = null;
  let lastContentTime = 0;
  let lastContentSavedAt = 0;
  let ytAdGoneAt = 0;
  let ytLastReloadAt = 0;
  let ytSeekTarget = null;
  let ytSeekFixUntil = 0;
  let lastContentPlaying = false;
  let ytQualitySetForVideo = null;
  let ytQualityAttemptsVideoId = null;
  let ytQualityAttempts = 0;
  let ytQualityLastAttemptAt = 0;
  let ytContentDuration = 0;

  // --- TikTok: detect sponsored / promoted videos and scroll past them ---
  const TT_AD_LABELS = ['sponsored', 'реклама', 'promoted', 'gesponsert', 'sponsorisé', 'patrocinado', 'sponsorizzato', 'sponsorlu', '广告', '광고'];
  const TT_SKIP_COOLDOWN_MS = 2500;
  let ttLastSkipAt = 0;

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
      rect.top >= -50 && rect.bottom <= window.innerHeight + 50;
  }

  function isTiktokAdVisible() {
    for (const el of document.querySelectorAll('[data-e2e*="browse-ad"], [data-e2e*="ad-badge"]')) {
      if (isInViewport(el)) return true;
    }
    for (const el of document.querySelectorAll('span, a, div')) {
      if (el.children.length > 0) continue;
      const text = (el.textContent || '').trim();
      if (text.length < 2 || text.length > 20) continue;
      if (TT_AD_LABELS.includes(text.toLowerCase()) && isInViewport(el)) return true;
    }
    return false;
  }

  function handleTiktokAd() {
    if (!SKIP_ADS) return;
    const now = Date.now();
    if (now - ttLastSkipAt < TT_SKIP_COOLDOWN_MS) return;

    if (!isTiktokAdVisible()) return;
    ttLastSkipAt = now;
    log('TikTok sponsored video — scrolling past');

    const downBtn = document.querySelector(
      'button[data-e2e="arrow-right"], button[data-e2e="arrow-down"]'
    );
    if (downBtn && isElementClickable(downBtn)) {
      safeClick(downBtn, 'tt-next');
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  }

  function getYoutubeVideo(player) {
    return player.querySelector('video.html5-main-video') || player.querySelector('video');
  }

  function getWatchVideoId() {
    try { return new URLSearchParams(location.search).get('v'); } catch (e) { return null; }
  }

  function handleYoutubeAd() {
    const player = document.getElementById('movie_player');
    if (!player) return;

    const adShowing = AD_CLASSES.some((c) => player.classList.contains(c));
    const video = getYoutubeVideo(player);

    if (adShowing && SKIP_ADS) {
      const now = Date.now();
      if (!ytAdActive) {
        ytAdActive = true;
        ytAdStartedAt = now;
        ytAdProgressAt = now;
        ytAdSeenTime = -1;
        ytAdGoneAt = 0;
        ytSavedMuted = video ? video.muted : false;
        log('Ad mode ON');
      }

      player.querySelectorAll(SKIP_BUTTON_SELECTOR).forEach((b) => safeClick(b, 'yt-skip'));

      if (video) {
        if (!video.muted) video.muted = true;
        if (video.playbackRate !== AD_RATE) video.playbackRate = AD_RATE;
        if (isFinite(video.duration) && video.duration > 1 && video.currentTime < video.duration - 0.5) {
          video.currentTime = video.duration - 0.1;
          const p = video.play();
          if (p && p.catch) p.catch(() => {});
        }
      }

      // Frozen ad can't be seeked past; reload returns the video ad-free.
      const t = video ? video.currentTime : 0;
      if (t !== ytAdSeenTime) { ytAdSeenTime = t; ytAdProgressAt = now; }
      const frozen = now - ytAdProgressAt > RELOAD_AFTER_MS;
      const durationBad = !video || !isFinite(video.duration) || video.duration <= 0;
      const dragging = now - ytAdStartedAt > AD_HARD_LIMIT_MS;
      const seekRefused = video && isFinite(video.duration) && video.duration > 1 &&
        now - ytAdStartedAt > SEEK_PROBE_MS && video.currentTime < video.duration - 2;
      ytReloadTimes = ytReloadTimes.filter((x) => now - x < RELOAD_WINDOW_MS);
      const backoff = ytReloadTimes.length >= RELOAD_LIMIT
        ? RELOAD_COOLDOWN_MS
        : RELOAD_BACKOFF_MS[Math.min(ytReloadStreak, RELOAD_BACKOFF_MS.length - 1)];
      const reloadReady =
        now - ytAdStartedAt > SEEK_PROBE_MS &&
        now - ytLastReloadAt >= backoff;
      if (reloadReady && (frozen || durationBad || dragging || seekRefused)) {
        const id = getWatchVideoId();
        if (id && typeof player.loadVideoById === 'function') {
          ytReloadStreak++;
          ytLastReloadAt = now;
          ytReloadTimes.push(now);
          // Add back the untracked gap, then rewind slightly. Never skip forward.
          let start = 0;
          let src = 'tracked';
          // getProgressState() reports content progress and survives the ad
          // swap, so trust it over a sample that may already be stale.
          let live = null;
          try {
            const ps = typeof player.getProgressState === 'function' ? player.getProgressState() : null;
            if (ps && isFinite(ps.current) && ps.current > 1 &&
                isFinite(ps.duration) && ps.duration > 60 && ps.current < ps.duration) {
              live = ps.current;
            }
          } catch (e) {}
          if (live !== null && (!lastContentTime || live >= lastContentTime - 1)) {
            start = live - REWIND_S;
            src = 'progress';
          } else if (id === lastContentVideoId && lastContentSavedAt) {
            const gap = lastContentPlaying
              ? Math.min(Math.max((ytAdStartedAt - lastContentSavedAt) / 1000, 0), TRACK_GAP_CAP_S)
              : 0;
            start = lastContentTime + gap - REWIND_S;
          }
          start = start < 2 ? 0 : Math.round(start * 10) / 10;
          console.log('[AutoSkip] reload src=' + src + ' start=' + start.toFixed(1) +
            ' tracked=' + lastContentTime.toFixed(1) +
            ' staleMs=' + (ytAdStartedAt - lastContentSavedAt) +
            ' live=' + (live === null ? 'n/a' : live.toFixed(1)) +
            ' adMs=' + (now - ytAdStartedAt));
          // YouTube snaps startSeconds to a segment boundary; corrected once playing.
          ytSeekTarget = start > 0 ? start : null;
          ytSeekFixUntil = now + SEEK_FIX_MS;
          log('Ad stuck — reloading video ad-free at ' + start + 's');
          try { player.loadVideoById({ videoId: id, startSeconds: start }); } catch (e) {}
        }
      }
    } else {
      const now = Date.now();
      if (ytAdActive) {
        ytAdActive = false;
        ytAdGoneAt = now;
        ytAdEndedAt = now;
        ytStallSeenTime = -1;
        ytStallProgressAt = now;
        if (video) {
          video.playbackRate = 1.0;
          video.muted = ytSavedMuted;
        }
        log('Ad mode OFF — playback restored');
      }

      // Content played clean, so the last reload worked: reset the backoff.
      if (ytReloadStreak && ytAdGoneAt && now - ytAdGoneAt > CLEAN_CONTENT_MS) {
        ytReloadStreak = 0;
      }

      // Undo a start position that YouTube snapped back to a segment boundary.
      if (ytSeekTarget !== null) {
        if (now >= ytSeekFixUntil) {
          ytSeekTarget = null;
        } else if (video && !video.paused) {
          let cur = 0;
          try {
            cur = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : video.currentTime;
          } catch (e) {}
          if (cur > 0.1) {
            if (cur < ytSeekTarget - 0.6) {
              try { player.seekTo(ytSeekTarget, true); } catch (e) {}
            }
            ytSeekTarget = null;
          }
        }
      }

      // Player sometimes hangs after an ad break; a pause/play nudge unfreezes it.
      if (video && !video.paused && ytAdEndedAt && now - ytAdEndedAt < POST_AD_WATCH_MS) {
        const t = video.currentTime;
        if (t !== ytStallSeenTime) {
          ytStallSeenTime = t;
          ytStallProgressAt = now;
        } else if (now - ytStallProgressAt > STALL_MS && now - ytLastNudgeAt > NUDGE_COOLDOWN_MS) {
          ytLastNudgeAt = now;
          try {
            if (typeof player.pauseVideo === 'function' && typeof player.playVideo === 'function') {
              player.pauseVideo();
              player.playVideo();
            } else {
              video.pause();
              const p = video.play();
              if (p && p.catch) p.catch(() => {});
            }
            log('Post-ad stall — nudged playback');
          } catch (e) {}
        }
      }
      trackContentPosition(player);
      ensureMaxQuality(player);
    }
  }

  // Sampled often: the fresher the stored position, the smaller the rewind.
  // Reads content progress from the player, which keeps describing the content
  // even while an ad is on screen. Only trusted when the reported duration
  // matches the content duration seen before the break — an ad reports its own.
  function readContentProgress(player) {
    try {
      const ps = typeof player.getProgressState === 'function' ? player.getProgressState() : null;
      if (!ps || !isFinite(ps.current) || !isFinite(ps.duration)) return null;
      if (!ytContentDuration || Math.abs(ps.duration - ytContentDuration) > 1) return null;
      if (ps.current <= 0 || ps.current >= ps.duration) return null;
      return ps.current;
    } catch (e) { return null; }
  }

  function trackContentPosition(player) {
    if (!player) player = document.getElementById('movie_player');
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const id = getWatchVideoId();
    if (!id) return;

    // During an ad the media element reports the ad, so the sampled position
    // would freeze and go stale — the old cause of large rewinds. The player's
    // progress state still tracks the content, so keep following it.
    if (AD_CLASSES.some((c) => player.classList.contains(c))) {
      const live = readContentProgress(player);
      if (live !== null && live > lastContentTime) {
        lastContentTime = live;
        lastContentSavedAt = Date.now();
      }
      return;
    }

    try {
      const d = typeof player.getDuration === 'function' ? player.getDuration() : 0;
      const data = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
      const idMatches = !data || !data.video_id || data.video_id === id;

      // YouTube swaps in the ad's video_id seconds before the ad actually
      // starts. Bailing on that alone froze the saved position early and made
      // the resume point stale, which is what produced large rewinds. The
      // duration is the honest signal: while it still matches the content, the
      // stream playing really is the content.
      const durationKnown = isFinite(d) && d > 60;
      const stillContent = durationKnown &&
        (!ytContentDuration || Math.abs(d - ytContentDuration) <= 1);

      // Metadata is not trustworthy on its own: YouTube can swap both the ad's
      // video_id AND its duration in well before the ad plays, so every label
      // says "ad" while the content is still on screen. Playback continuity
      // cannot be faked that way — a position that keeps advancing from the
      // last known one at roughly wall-clock speed is still the same stream.
      const t0 = player.getCurrentTime() || 0;
      const elapsed = lastContentSavedAt ? (Date.now() - lastContentSavedAt) / 1000 : 0;
      const drift = t0 - lastContentTime;
      const continues = lastContentSavedAt > 0 && lastContentTime > 0 &&
        elapsed < 3 && drift >= -0.5 && drift <= elapsed + 1;

      if (!idMatches && !stillContent && !continues) return;

      const t = player.getCurrentTime() || 0;
      // A splice-in ad reports a near-zero time; don't overwrite a real position.
      if (t <= 0.3 && lastContentVideoId === id && lastContentTime > 5) return;
      if (ytContentDuration && t > ytContentDuration) return;

      const v = getYoutubeVideo(player);
      if (durationKnown) ytContentDuration = d;
      lastContentPlaying = !!v && !v.paused;
      lastContentVideoId = id;
      lastContentTime = t;
      lastContentSavedAt = Date.now();
    } catch (e) {}
  }

  // setPlaybackQuality() is ignored by YouTube; only the settings menu works.
  const QUALITY_MENU_WORDS = ['quality', 'качество', 'qualität', 'calidad', 'qualité', 'qualità', 'jakość', 'kalite', '画質', '화질', '画质'];
  const QUALITY_MAX_ATTEMPTS = 5;
  const QUALITY_ATTEMPT_COOLDOWN_MS = 1500;

  function findMenuItemByWords(root, words) {
    const items = [...root.querySelectorAll('.ytp-menuitem')];
    return items.find((it) => {
      const label = it.querySelector('.ytp-menuitem-label') || it;
      const text = (label.textContent || '').trim().toLowerCase();
      return words.some((w) => text.includes(w));
    }) || null;
  }

  const RESOLUTION_RADIO_RE = /^(2160|1440|1080|720|480|360|240|144)p/;

  // The panel reopens on its last submenu, so verify every step before clicking.
  function closeSettingsMenu(player) {
    const menu = document.querySelector('.ytp-settings-menu');
    if (menu && player) {
      const gear = player.querySelector('.ytp-settings-button');
      if (gear) activate(gear);
    }
  }

  function ensureMaxQuality(player) {
    if (!MAX_QUALITY || !player) return;
    if (AD_CLASSES.some((c) => player.classList.contains(c))) return;
    if (typeof player.getPlaybackQuality !== 'function' || typeof player.getAvailableQualityLevels !== 'function') return;

    const id = getWatchVideoId();
    if (!id || id === ytQualitySetForVideo) return;

    if (ytQualityAttemptsVideoId !== id) {
      ytQualityAttemptsVideoId = id;
      ytQualityAttempts = 0;
    }
    if (ytQualityAttempts >= QUALITY_MAX_ATTEMPTS) { ytQualitySetForVideo = id; return; }

    let levels, current;
    try { levels = player.getAvailableQualityLevels(); current = player.getPlaybackQuality(); }
    catch (e) { return; }
    if (!levels || !levels.length) return; // metadata not ready yet — retry later, don't burn an attempt

    const best = levels.find((l) => l !== 'auto');
    if (!best) return;
    if (current === best) { ytQualitySetForVideo = id; return; }

    const now = Date.now();
    if (now - ytQualityLastAttemptAt < QUALITY_ATTEMPT_COOLDOWN_MS) return;

    const gear = player.querySelector('.ytp-settings-button');
    if (!gear || !isElementClickable(gear)) return;
    if (document.querySelector('.ytp-settings-menu')) return; // already open — don't fight it, wait

    ytQualityAttempts++;
    ytQualityLastAttemptAt = now;

    activate(gear);
    const menu = document.querySelector('.ytp-settings-menu');
    if (!menu) return; // menu never opened — nothing was clicked, safe no-op

    const qualityItem = findMenuItemByWords(menu, QUALITY_MENU_WORDS);
    // No blind fallback: unconfirmed label means back out, never guess.
    if (!qualityItem) { closeSettingsMenu(player); return; }
    activate(qualityItem);

    const radios = [...document.querySelectorAll('.ytp-menuitem[role="menuitemradio"]')]
      .filter((r) => isElementClickable(r));
    const looksLikeQuality = radios.length >= 2 &&
      (RESOLUTION_RADIO_RE.test(radios[0].textContent.trim()) ||
       radios.some((r) => /auto/i.test(r.textContent)));
    if (!looksLikeQuality) { closeSettingsMenu(player); return; }
    activate(radios[0]); // resolutions are listed highest-first, Auto last
  }

  // Dialogs need tag AND text to match: a blind click could accept terms.
  const POPUP_CONFIRM_TEXTS = [
    'still watching', 'still listening', 'continue watching', 'video paused',
    'вы ещё смотрите', 'вы еще смотрите', 'продолжить просмотр', 'видео приостановлено',
  ];
  const CONSENT_SELECTOR =
    'ytd-consent-bump-v2-lightbox, ytd-consent-bump-lightbox, ytd-consent-bump-renderer';
  const CONFIRM_DIALOG_SELECTOR =
    'yt-confirm-dialog-renderer, ytmusic-confirm-dialog-renderer';

  function dismissYoutubePopups() {
    if (!CLOSE_POPUPS) return;
    // Cookie choices belong to the user, so a visible consent prompt means stop.
    if (document.querySelector(CONSENT_SELECTOR)) return;

    const dialog = document.querySelector(CONFIRM_DIALOG_SELECTOR);
    if (dialog && isElementClickable(dialog)) {
      const text = (dialog.textContent || '').toLowerCase();
      if (POPUP_CONFIRM_TEXTS.some((t) => text.includes(t))) {
        const btn = dialog.querySelector('#confirm-button button') ||
          dialog.querySelector('#confirm-button') ||
          dialog.querySelector('button.yt-spec-button-shape-next--call-to-action');
        if (btn) { safeClick(btn, 'yt-keep-playing'); return; }
      }
    }

    // Dismiss only, so the offer is never accidentally accepted.
    const promo = document.querySelector('ytd-mealbar-promo-renderer');
    if (promo && isElementClickable(promo)) {
      const dismiss = promo.querySelector('#dismiss-button button') ||
        promo.querySelector('#dismiss-button');
      if (dismiss) safeClick(dismiss, 'yt-promo-dismiss');
    }
  }

  // Banner ads on anime sites: click their own close control, never the banner
  // itself. Ad networks like being clicked, so the close element must look like
  // a close control AND be small — a full-size "close" overlay is the ad link.
  const BANNER_HINT = /(^|[-_ ])(ads?|adv|advert|banner|reklama|promo|teaser|adfox|rtb)([-_ ]|$)/i;
  const CLOSE_HINT = /close|закр|dismiss|×|✕|✖/i;
  const CLOSE_MAX_PX = 60;

  function closeBannerAds() {
    if (!CLOSE_BANNERS) return;
    const boxes = document.querySelectorAll(
      '[class*="ad"],[id*="ad"],[class*="banner"],[id*="banner"],[class*="reklam"],[class*="promo"]'
    );
    for (const box of boxes) {
      const idcls = (box.id || '') + ' ' + (box.className || '').toString();
      if (!BANNER_HINT.test(idcls)) continue;
      if (!isElementClickable(box)) continue;
      const r = box.getBoundingClientRect();
      if (r.width < 50 || r.height < 30) continue;

      const closer = [...box.querySelectorAll('[class*="close"],[id*="close"],[aria-label],button,span,i')]
        .find((c) => {
          const label = ((c.getAttribute('aria-label') || '') + ' ' +
            (c.className || '').toString() + ' ' + (c.id || '') + ' ' +
            (c.textContent || '').trim()).toLowerCase();
          if (!CLOSE_HINT.test(label)) return false;
          const cr = c.getBoundingClientRect();
          return cr.width > 0 && cr.height > 0 &&
            cr.width <= CLOSE_MAX_PX && cr.height <= CLOSE_MAX_PX;
        });
      if (closer && safeClick(closer, 'banner-close')) return;
    }
  }

  function activate(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };

    try { el.dispatchEvent(new PointerEvent('pointerover', opts)); } catch (e) {}
    try { el.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch (e) {}
    try { el.dispatchEvent(new PointerEvent('pointerup', opts)); } catch (e) {}
    ['mouseover', 'mousemove', 'mousedown', 'mouseup', 'click'].forEach((type) => {
      try { el.dispatchEvent(new MouseEvent(type, opts)); } catch (e) {}
    });
    try { el.click(); } catch (e) {}
  }

  // Never auto-click a link that downloads a file or leaves the current site.
  function isSafeToAutoClick(el) {
    const anchor = el && el.closest ? el.closest('a[href]') : null;
    if (!anchor) return true;
    if (anchor.hasAttribute('download')) return false;
    if (/^\s*(javascript|data|blob|vbscript):/i.test(anchor.getAttribute('href') || '')) return false;
    try {
      if (new URL(anchor.href, location.href).origin !== location.origin) return false;
    } catch (e) {
      return false;
    }
    return true;
  }

  function safeClick(el, label) {
    const target = resolveClickTarget(el);
    if (!isElementClickable(target)) return false;
    if (!isSafeToAutoClick(target)) return false;

    const now = Date.now();
    if (now - (lastClickAt.get(target) || 0) < CLICK_COOLDOWN_MS) return false;
    lastClickAt.set(target, now);

    try {
      activate(target);
      log('Clicked: ' + label);
      return true;
    } catch (e) {
      return false;
    }
  }

  function findBySelectors(selectors) {
    const found = [];
    for (const sel of selectors) {
      try {
        document.querySelectorAll(sel).forEach((el) => found.push(el));
      } catch (e) {}
    }
    return found;
  }

  function findByText(texts) {
    const found = [];
    const candidates = document.querySelectorAll(
      'button, [role="button"], a, [class*="skip"], [id*="skip"], [aria-label]'
    );
    candidates.forEach((el) => {
      const content = (el.textContent || '').trim();
      const ariaLabel = (el.getAttribute('aria-label') || '').trim();
      for (const t of texts) {
        if (
          (content && content.length <= 40 && (content === t || content.includes(t))) ||
          (ariaLabel && (ariaLabel === t || ariaLabel.includes(t)))
        ) {
          found.push(el);
          break;
        }
      }
    });
    return found;
  }

  function collapseToClosestButton(el) {
    if (!el) return el;
    return el.closest('button, [role="button"], a') || el;
  }

  function dedupeElements(elements) {
    return [...new Set(elements)];
  }

  function resolveClickTarget(el) {
    if (!el) return null;
    const tag = el.tagName.toLowerCase();
    if (tag === 'button' || tag === 'a' || el.getAttribute('role') === 'button') return el;
    return el.querySelector('button, [role="button"], a') || el;
  }

  function tryAutoSkip() {
    if (isYoutube) {
      handleYoutubeAd();
      dismissYoutubePopups();
      return;
    }

    if (isTiktok) {
      handleTiktokAd();
      return;
    }

    if (SKIP_ADS) {
      const raw = [...findBySelectors(adSelectors), ...findByText(adTexts)];
      dedupeElements(raw.map(collapseToClosestButton)).forEach((el) => safeClick(el, 'ad'));
    }

    if (SKIP_INTRO) {
      const raw = [...findBySelectors(introSelectors), ...findByText(introTexts)];
      dedupeElements(raw.map(collapseToClosestButton)).forEach((el) => safeClick(el, 'intro'));
    }

    closeBannerAds();
  }

  let debounceTimer = null;
  function scheduleCheck() {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      tryAutoSkip();
    }, 60);
  }

  const observer = new MutationObserver(scheduleCheck);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'disabled'],
  });

  tryAutoSkip();
  setInterval(tryAutoSkip, 300);
  if (isYoutube) setInterval(() => trackContentPosition(), TRACK_TICK_MS);
})();
