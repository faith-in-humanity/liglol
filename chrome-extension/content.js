(function () {
  'use strict';

  // Feature switches. Whole-script on/off lives in chrome://extensions.
  const SKIP_ADS = true;
  const SKIP_INTRO = true;
  const DEBUG = false;

  function log(msg) {
    if (DEBUG) console.log('[AutoSkip] ' + msg);
  }

  const SITE_CONFIGS = [
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
      ad: { selectors: [], texts: ['Пропустить рекламу', 'Пропустить', 'Skip Ad', 'Skip'] },
      intro: { selectors: [], texts: ['Пропустить интро', 'Skip Intro', 'Пропустить опенинг'] },
    },
    {
      hostnames: ['animego.org'],
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
      hostnames: ['yummyanime.tv'],
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
    cfg.hostnames.some((h) => currentHost === h || currentHost.endsWith('.' + h))
  );
  const isYoutube = currentHost === 'youtube.com';

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

  // YouTube: two states driven by the ad class on #movie_player.
  //   ad present -> mute + 16x + seek to end (+ best-effort Skip click);
  //                 if the ad is frozen (media blocked), reload it ad-free;
  //   ad gone    -> restore speed and mute state.
  const AD_RATE = 16.0;
  const RELOAD_AFTER_MS = 500;
  const RELOAD_LIMIT = 3;
  const RELOAD_WINDOW_MS = 60000;
  const POST_AD_WATCH_MS = 20000;
  const STALL_MS = 1500;
  const NUDGE_COOLDOWN_MS = 4000;
  const REWIND_S = 2;
  const TRACK_GAP_CAP_S = 3;
  const AD_CLASSES = ['ad-showing', 'ad-interrupting'];
  const SKIP_BUTTON_SELECTOR = '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button';
  let ytAdActive = false;
  let ytSavedMuted = false;
  let ytAdStartedAt = 0;
  let ytAdSeenTime = -1;
  let ytAdProgressAt = 0;
  let ytReloadedThisBreak = false;
  let ytReloadTimes = [];
  let ytAdEndedAt = 0;
  let ytStallSeenTime = -1;
  let ytStallProgressAt = 0;
  let ytLastNudgeAt = 0;
  let lastContentVideoId = null;
  let lastContentTime = 0;
  let lastContentSavedAt = 0;

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
        ytReloadedThisBreak = false;
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

      // A frozen ad (media blocked upstream) never advances and can't be seeked
      // past; a normal ad advances at 16x and the seek finishes it. When frozen,
      // reload the same video — it comes back without the ad break.
      const t = video ? video.currentTime : 0;
      if (t !== ytAdSeenTime) { ytAdSeenTime = t; ytAdProgressAt = now; }
      const frozen = now - ytAdProgressAt > RELOAD_AFTER_MS;
      const durationBad = !video || !isFinite(video.duration) || video.duration <= 0;
      if (!ytReloadedThisBreak && now - ytAdStartedAt > RELOAD_AFTER_MS && (frozen || durationBad)) {
        ytReloadedThisBreak = true;
        ytReloadTimes = ytReloadTimes.filter((x) => now - x < RELOAD_WINDOW_MS);
        const id = getWatchVideoId();
        if (id && ytReloadTimes.length < RELOAD_LIMIT && typeof player.loadVideoById === 'function') {
          ytReloadTimes.push(now);
          // Estimate the true interruption point: tracking stops a moment before
          // the ad class appears, so add that gap back (capped), then step back
          // REWIND_S on purpose — a small controlled rewind, never a skip forward.
          let start = 0;
          if (id === lastContentVideoId && lastContentSavedAt) {
            const gap = Math.min(Math.max((ytAdStartedAt - lastContentSavedAt) / 1000, 0), TRACK_GAP_CAP_S);
            start = lastContentTime + gap - REWIND_S;
          }
          start = start < 2 ? 0 : Math.round(start * 10) / 10;
          log('Ad stuck — reloading video ad-free at ' + start + 's');
          try { player.loadVideoById({ videoId: id, startSeconds: start }); } catch (e) {}
        }
      }
    } else {
      if (ytAdActive) {
        ytAdActive = false;
        ytAdEndedAt = Date.now();
        ytStallSeenTime = -1;
        ytStallProgressAt = Date.now();
        if (video) {
          video.playbackRate = 1.0;
          video.muted = ytSavedMuted;
        }
        log('Ad mode OFF — playback restored');
      }

      // Post-ad stall watchdog: the player sometimes hangs on a black buffering
      // screen after an ad break; a pause/play nudge unfreezes it. Never fires
      // while the user has the video paused.
      if (video && !video.paused && ytAdEndedAt && Date.now() - ytAdEndedAt < POST_AD_WATCH_MS) {
        const now = Date.now();
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
      // Track the content position; ignore ticks where an ad is still loading.
      const id = getWatchVideoId();
      if (id && typeof player.getCurrentTime === 'function') {
        try {
          const data = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
          if (!data || !data.video_id || data.video_id === id) {
            lastContentVideoId = id;
            lastContentTime = player.getCurrentTime() || 0;
            lastContentSavedAt = Date.now();
          }
        } catch (e) {}
      }
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
})();
