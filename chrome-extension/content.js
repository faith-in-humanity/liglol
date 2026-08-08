(function () {
  'use strict';

  // Feature switches. Whole-script on/off lives in chrome://extensions.
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

  const UNIVERSAL_AD_TEXTS = [
    'Пропустить рекламу', 'Пропустить объявление', 'Пропустить', 'Skip Ad', 'Skip Ads', 'Skip',
  ];
  // Anime players run their ads through rmp-vast, whose skip control is
  // div.rmp-ad-container-skip. Its label is configurable and its text is a
  // live countdown ("Skip ad 5 с"), so text is the wrong thing to match on —
  // the class name is fixed. Verified in the library source: the control has a
  // plain click listener and no isTrusted check, unlike YouTube's.
  const UNIVERSAL_AD_SELECTORS = ['.rmp-ad-container-skip'];
  const UNIVERSAL_INTRO_TEXTS = [
    'Пропустить заставку', 'Пропустить интро', 'Пропустить опенинг', 'Пропустить вступление',
    'Пропустить начало', 'Пропустить титры', 'Пропустить эндинг',
    'Skip Intro', 'Skip Recap', 'Skip Opening', 'Skip OP', 'Skip ED', 'Skip Titles',
  ];

  const currentHost = location.hostname.replace(/^www\./, '');
  const siteConfig = SITE_CONFIGS.find((cfg) =>
    cfg.hostnames.some((h) => currentHost === h || currentHost.endsWith('.' + h)) ||
    (cfg.hostSuffix && currentHost.endsWith(cfg.hostSuffix))
  );
  const isYoutube = currentHost === 'youtube.com';
  const isTiktok = currentHost === 'tiktok.com';

  const adSelectors = siteConfig
    ? [...new Set([...siteConfig.ad.selectors, ...UNIVERSAL_AD_SELECTORS])]
    : UNIVERSAL_AD_SELECTORS;
  const adTexts = siteConfig ? [...new Set([...siteConfig.ad.texts, ...UNIVERSAL_AD_TEXTS])] : UNIVERSAL_AD_TEXTS;
  const introSelectors = siteConfig ? siteConfig.intro.selectors : [];
  const introTexts = siteConfig ? [...new Set([...siteConfig.intro.texts, ...UNIVERSAL_INTRO_TEXTS])] : UNIVERSAL_INTRO_TEXTS;

  const lastClickAt = new WeakMap();
  const CLICK_COOLDOWN_MS = 700;

  // Anime sites and kinogo nest the player in iframes. Where the frame is
  // same-origin the controls are reachable, but only if we actually look
  // inside it — document alone is just the outer page.
  const FRAME_DEPTH = 3;
  function docs(root, depth) {
    const out = [root || document];
    if ((depth || 0) >= FRAME_DEPTH) return out;
    let frames;
    try { frames = (root || document).querySelectorAll('iframe,frame'); } catch (e) { return out; }
    for (const f of frames) {
      let inner = null;
      try { inner = f.contentDocument; } catch (e) { inner = null; }
      if (inner && inner.documentElement) out.push(...docs(inner, (depth || 0) + 1));
    }
    return out;
  }

  function viewOf(el) {
    return (el.ownerDocument && el.ownerDocument.defaultView) || window;
  }

  function isElementClickable(el) {
    // NOT `instanceof Element`: that compares against the top window's
    // constructor, so any element from an iframe document fails it and every
    // in-frame control silently counted as unclickable.
    if (!el || el.nodeType !== 1) return false;
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-disabled') === 'true') return false;

    const style = viewOf(el).getComputedStyle(el);
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

  // A hidden tab has its timers throttled to about once a minute, so every
  // stored timestamp goes stale while the user is away. On return Date.now()
  // has jumped minutes ahead and each "no progress for 500ms" test is true at
  // once — the script would declare the ad frozen and reload the whole video,
  // or nudge pause/play, which is the several-second freeze after Alt-Tab.
  const RESUME_GRACE_MS = 1800;
  // A reload with no resume point restarts the video at zero, and YouTube
  // serves the very same pre-roll pod again — measured: 42.4s of ads and six
  // wasted reloads, versus 0.8s for the identical pod mid-video. Allow one
  // such attempt (a reload does sometimes come back clean), then ride the ads
  // out at speed instead of looping.
  // One attempt was too few: when a reload comes back carrying another ad, the
  // script then sat idle for the whole gap — measured 15.8s of ads. A few
  // spaced tries, then a real rest, bounds both failure modes.
  const ZERO_START_RELOAD_GAP_MS = 4000;
  const ZERO_START_RELOAD_MAX = 3;
  const ZERO_START_REST_MS = 30000;
  let ytZeroStartReloadAt = 0;
  let ytZeroStartCount = 0;
  // Within one ad break the content position does not advance, so the resume
  // point must be decided once. Recomputing it per reload subtracted REWIND_S
  // again from the already-rewound position and stacked the rewind.
  let ytBreakResumeStart = null;
  let becameVisibleAt = 0;

  function settlingAfterResume() {
    return becameVisibleAt > 0 && Date.now() - becameVisibleAt < RESUME_GRACE_MS;
  }

  function resetTimingAnchors() {
    const now = Date.now();
    becameVisibleAt = now;
    // Drop the measurements rather than trust them: re-measure from scratch.
    ytAdStartedAt = now;
    ytAdProgressAt = now;
    ytAdSeenTime = -1;
    ytStallProgressAt = now;
    ytStallSeenTime = -1;
    ytLastNudgeAt = now;
    ytLastReloadAt = now;
    lastContentSavedAt = 0;
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resetTimingAnchors();
  });
  window.addEventListener('pageshow', () => { if (!document.hidden) resetTimingAnchors(); });

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
      // While hidden the throttled timers cannot tell a frozen ad from a
      // sleeping timer, and right after returning the player is simply
      // rebuffering — reloading there is what caused the Alt-Tab freeze.
      const reloadReady =
        !document.hidden &&
        !settlingAfterResume() &&
        now - ytAdStartedAt > SEEK_PROBE_MS &&
        now - ytLastReloadAt >= backoff;
      if (reloadReady && (frozen || durationBad || dragging || seekRefused)) {
        const id = getWatchVideoId();
        if (id && typeof player.loadVideoById === 'function') {
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

          if (ytBreakResumeStart !== null) {
            start = ytBreakResumeStart;
            src = 'break';
          } else {
            ytBreakResumeStart = start;
          }

          // Nothing to come back to: a reload replays the same pod, so allow a
          // few spaced tries and then stop hammering.
          if (start <= 0) {
            const gap = ytZeroStartCount >= ZERO_START_RELOAD_MAX
              ? ZERO_START_REST_MS : ZERO_START_RELOAD_GAP_MS;
            if (now - ytZeroStartReloadAt < gap) return;
            if (ytZeroStartCount >= ZERO_START_RELOAD_MAX) ytZeroStartCount = 0;
            ytZeroStartCount++;
            ytZeroStartReloadAt = now;
          }

          ytReloadStreak++;
          ytLastReloadAt = now;
          ytReloadTimes.push(now);
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
      if (ytAdGoneAt && now - ytAdGoneAt > CLEAN_CONTENT_MS) {
        ytReloadStreak = 0;
        ytZeroStartCount = 0;
        ytBreakResumeStart = null;
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
      if (video && !video.paused && !document.hidden && !settlingAfterResume() &&
          ytAdEndedAt && now - ytAdEndedAt < POST_AD_WATCH_MS) {
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
      if (gear) activateOnce(gear);
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

    activateOnce(gear);
    const menu = document.querySelector('.ytp-settings-menu');
    if (!menu) return; // menu never opened — nothing was clicked, safe no-op

    const qualityItem = findMenuItemByWords(menu, QUALITY_MENU_WORDS);
    // No blind fallback: unconfirmed label means back out, never guess.
    if (!qualityItem) { closeSettingsMenu(player); return; }
    activateOnce(qualityItem);

    const radios = [...document.querySelectorAll('.ytp-menuitem[role="menuitemradio"]')]
      .filter((r) => isElementClickable(r));
    const looksLikeQuality = radios.length >= 2 &&
      (RESOLUTION_RADIO_RE.test(radios[0].textContent.trim()) ||
       radios.some((r) => /auto/i.test(r.textContent)));
    if (!looksLikeQuality) { closeSettingsMenu(player); return; }
    activateOnce(radios[0]); // resolutions are listed highest-first, Auto last
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

  // Anime-site players (XFPlayer and friends) follow the same shape as YouTube:
  // a gear opens a menu whose quality row shows the current resolution, and
  // clicking that row reveals the list. Every step is verified before the next
  // click so a wrong menu never gets touched.
  const RES_RE = /(\d{3,4})\s*p/i;
  const GEAR_SELECTOR =
    '[class*="setting"],[class*="gear"],[class*="cog"],[aria-label*="астрой"],[aria-label*="etting"],[title*="астрой"],[title*="etting"]';
  // Some players expose quality directly instead of hiding it behind a gear.
  // Kodik (Flowplayer) is one: `.fp-quality` opens the list, while its
  // `.fp-playback-settings` gear is PLAYBACK SPEED — clicking the gear there
  // opens the wrong menu entirely.
  const QUALITY_LABEL_RE = /качеств|quality/i;
  const QUALITY_OPENER_SELECTOR =
    '[class*="qual"],[class*="Qual"],[data-quality],[aria-label*="ачество"],[aria-label*="uality"],[title*="ачество"],[title*="uality"]';
  const SITE_QUALITY_MAX_ATTEMPTS = 4;
  const SITE_QUALITY_COOLDOWN_MS = 2000;
  // Giving up for good after 4 misses was meant to respect a person who
  // lowered the quality by hand. But a miss is not a preference: player
  // controls auto-hide, and a hidden gear is unreachable through no choice of
  // theirs. So a failed run only rests, and an episode is 20+ minutes long.
  const SITE_QUALITY_RETRY_MS = 30000;
  let siteQualityRestAt = 0;
  let siteQualityDone = false;
  let siteQualityAttempts = 0;
  let siteQualityLastAt = 0;

  // Must be a leaf: the list container's text is every option concatenated
  // ("1080p720p480p"), which matches the pattern too and would get clicked
  // instead of the actual option.
  function highestResOption(nodes) {
    let best = null, bestVal = 0;
    for (const n of nodes) {
      if (n.children.length > 0) continue;
      if (!isElementClickable(n)) continue;
      const txt = (n.textContent || '').trim();
      if (txt.length > 12) continue;
      const m = txt.match(/^(\d{3,4})\s*p\b/i);
      if (!m) continue;
      const val = parseInt(m[1], 10);
      if (val > bestVal) { bestVal = val; best = n; }
    }
    return bestVal ? { node: best, value: bestVal } : null;
  }

  function ensureSiteMaxQuality() {
    if (!MAX_QUALITY || siteQualityDone) return;
    // querySelectorAll, not querySelector: a page can hold several video
    // elements (trailer, preview, the real player). Checking only the first
    // one meant that if it was not ready yet, quality was never set at all.
    let video = null;
    for (const d of docs()) {
      let list;
      try { list = d.querySelectorAll('video'); } catch (e) { continue; }
      for (const v of list) {
        if (v && v.duration && isFinite(v.duration) && v.duration > 0) { video = v; break; }
      }
      if (video) break;
    }
    if (!video) return;
    const now = Date.now();
    if (siteQualityAttempts >= SITE_QUALITY_MAX_ATTEMPTS) {
      if (now - siteQualityRestAt < SITE_QUALITY_RETRY_MS) return;
      siteQualityAttempts = 0;
      siteQualityRestAt = now;
    }
    if (now - siteQualityLastAt < SITE_QUALITY_COOLDOWN_MS) return;

    const player = video.closest('[id*="player"],[class*="player"]') || video.ownerDocument.body;

    // A direct quality control wins over a gear: it is unambiguous, and on
    // players that have both, the gear is something else.
    // A label naming quality is proof enough; a short text is only a fallback.
    // The old "text <= 12 chars" rule threw away every real control found so
    // far: jut.su's button says "Выбрать качество" (16), Alloha's row says
    // "Качество 480p" (13). Size still rules out whole menu containers.
    const opener = [...player.querySelectorAll(QUALITY_OPENER_SELECTOR)].find((q) => {
      if (!isElementClickable(q)) return false;
      const r = q.getBoundingClientRect();
      if (r.width > 200 || r.height > 80) return false;
      const label = ((q.getAttribute('aria-label') || '') + ' ' +
                     (q.getAttribute('title') || '')).trim();
      if (QUALITY_LABEL_RE.test(label)) return true;
      const txt = (q.textContent || '').trim();
      return txt.length <= 24;
    });

    const gear = opener ? null : [...player.querySelectorAll(GEAR_SELECTOR)].find((g) => {
      const r = g.getBoundingClientRect();
      return isElementClickable(g) && r.width <= 80 && r.height <= 80;
    });
    // Playerjs (anilibria and friends) renders its whole UI as <PJSDIV> with no
    // class names at all — 306 such elements on one page — so neither selector
    // above can ever match. The only handle left is the text: a control bar
    // shows the current resolution, and an open menu shows several. One visible
    // "720p" means that is the opener; several mean the menu is already open.
    let resBadge = null;
    if (!opener && !gear) {
      const visibleRes = [];
      for (const el of player.querySelectorAll('*')) {
        if (el.children.length) continue;
        const t = (el.textContent || '').trim();
        if (!/^\d{3,4}\s*p$/i.test(t)) continue;
        if (!isElementClickable(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width > 120 || r.height > 60) continue;
        visibleRes.push(el);
      }
      if (visibleRes.length === 1) resBadge = visibleRes[0];
      else if (visibleRes.length > 1) {
        // Menu already open: pick straight from it, nothing to toggle.
        const top = highestResOption(visibleRes);
        const cur = visibleRes.map((e) => parseInt((e.textContent || '').trim(), 10));
        if (top && Math.max(...cur) > 0) {
          siteQualityAttempts++;
          siteQualityLastAt = now;
          if (isSafeToAutoClick(top.node)) { activateOnce(top.node); siteQualityDone = true; }
        }
        return;
      }
    }

    if (!opener && !gear && !resBadge) return;

    siteQualityAttempts++;
    siteQualityLastAt = now;

    // Whatever we opened must be closed again on every bail-out, or the menu
    // stays over the video.
    const toggle = opener || gear || resBadge;
    activateOnce(toggle);

    let currentText = opener ? (opener.textContent || '') : '';

    if (gear) {
      // Gear players hide quality one level deeper: the row already showing a
      // resolution is the quality row.
      const rows = [...player.querySelectorAll('li,div,button,span,a')];
      const row = rows.find((r) => {
        if (!isElementClickable(r)) return false;
        const txt = (r.textContent || '').trim();
        return txt.length <= 40 && RES_RE.test(txt) && r.children.length <= 4;
      });
      if (!row) { activateOnce(toggle); return; }
      activateOnce(row);
      currentText = row.textContent || '';
    }

    const best = highestResOption([...player.querySelectorAll('li,div,button,span,a')]);
    if (!best) { activateOnce(toggle); return; }

    const current = currentText.match(RES_RE);
    if (current && parseInt(current[1], 10) >= best.value) {
      siteQualityDone = true;
      activateOnce(toggle);
      return;
    }
    if (isElementClickable(best.node) && isSafeToAutoClick(best.node)) {
      activateOnce(best.node);
      siteQualityDone = true;
      // Most players close their own menu on selection; the ones that don't
      // would leave it sitting over the video.
      if (isElementClickable(best.node)) activateOnce(toggle);
    } else {
      activateOnce(toggle);
    }
  }

  function closeBannerAds() {
    if (!CLOSE_BANNERS) return;
    const boxes = [];
    for (const d of docs()) {
      try {
        d.querySelectorAll(
          '[class*="ad"],[id*="ad"],[class*="banner"],[id*="banner"],[class*="reklam"],[class*="promo"]'
        ).forEach((el) => boxes.push(el));
      } catch (e) {}
    }
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

  // activate() deliberately fires both a synthetic click and el.click() for
  // stubborn buttons, which lands TWO clicks. On a toggle (a settings gear)
  // that opens and instantly recloses the menu, so menu work uses this single
  // click instead.
  function activateOnce(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: viewOf(el), clientX: x, clientY: y };
    try { el.dispatchEvent(new PointerEvent('pointerover', opts)); } catch (e) {}
    try { el.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch (e) {}
    try { el.dispatchEvent(new PointerEvent('pointerup', opts)); } catch (e) {}
    ['mouseover', 'mousemove', 'mousedown', 'mouseup', 'click'].forEach((type) => {
      try { el.dispatchEvent(new MouseEvent(type, opts)); } catch (e) {}
    });
  }

  function activate(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: viewOf(el), clientX: x, clientY: y };

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
      const doc = anchor.ownerDocument || document;
      if (new URL(anchor.href, doc.location.href).origin !== doc.location.origin) return false;
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
    for (const d of docs()) {
      for (const sel of selectors) {
        try {
          d.querySelectorAll(sel).forEach((el) => found.push(el));
        } catch (e) {}
      }
    }
    return found;
  }

  function findByText(texts) {
    const found = [];
    const candidates = [];
    for (const d of docs()) {
      try {
        d.querySelectorAll(
          'button, [role="button"], a, [class*="skip"], [id*="skip"], [aria-label]'
        ).forEach((el) => candidates.push(el));
      } catch (e) {}
    }
    candidates.forEach((el) => {
      const content = (el.textContent || '').trim().toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').trim().toLowerCase();
      for (const t of texts) {
        // Lowercased both sides: rmp-vast ships "Skip ad", the list said
        // "Skip Ad", and an exact-case compare quietly matched neither.
        const needle = t.toLowerCase();
        if (
          (content && content.length <= 40 && content.includes(needle)) ||
          (ariaLabel && ariaLabel.includes(needle))
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

  const isTopFrame = (function () { try { return window.top === window; } catch (e) { return false; } })();

  function frameTooSmallToMatter() {
    const de = document.documentElement;
    if (!de) return true;
    return de.clientWidth < 200 || de.clientHeight < 150;
  }

  function tryAutoSkip() {
    if (!isTopFrame && frameTooSmallToMatter()) return;

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
    ensureSiteMaxQuality();
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

  // Players sit in cross-origin frames, so "nothing gets clicked" has two very
  // different causes: the script never ran there at all, or it ran and found
  // nothing to click. Without a marker there is no way to tell them apart.
  // Paste __autoSkip.dump() in the console, with the frame selected.
  try {
    window.__autoSkip = {
      version: '1.0.0-beta.37',
      frame: location.href,
      isTop: isTopFrame,
      dump: function () {
        const out = { version: '1.0.0-beta.37', frame: location.href, isTop: isTopFrame,
                      documents: [], videos: [], qualityOpeners: [], gears: [], skipButtons: [], smallLabels: [] };
        for (const d of docs()) {
          try { out.documents.push(d.location.href.slice(0, 90)); } catch (e) { out.documents.push('[blocked]'); }
          try {
            d.querySelectorAll('video').forEach((v) => out.videos.push({
              duration: v.duration, paused: v.paused, w: v.videoWidth, h: v.videoHeight,
              src: (v.currentSrc || v.src || '').slice(0, 60) }));
          } catch (e) {}
          const describe = (el) => ({
            tag: el.tagName, cls: String(el.className || '').slice(0, 50),
            text: (el.textContent || '').trim().slice(0, 25),
            label: (el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, 25),
            w: Math.round(el.getBoundingClientRect().width),
            h: Math.round(el.getBoundingClientRect().height),
            clickable: isElementClickable(el) });
          try { d.querySelectorAll(QUALITY_OPENER_SELECTOR).forEach((e) => out.qualityOpeners.push(describe(e))); } catch (e) {}
          try { d.querySelectorAll(GEAR_SELECTOR).forEach((e) => out.gears.push(describe(e))); } catch (e) {}
          try {
            d.querySelectorAll('button,[role="button"],a,div,span').forEach((e) => {
              if (e.children.length) return;
              const t = (e.textContent || '').trim();
              if (!t || t.length > 30) return;
              if (/пропуст|skip/i.test(t)) out.skipButtons.push(describe(e));
              else if (t.length <= 12 && isElementClickable(e)) out.smallLabels.push(t);
            });
          } catch (e) {}
        }
        out.smallLabels = [...new Set(out.smallLabels)].slice(0, 40);
        out.state = { qualityAttempts: siteQualityAttempts, qualityDone: siteQualityDone,
                      restingSince: siteQualityRestAt };
        // Exactly what the row matcher and the option picker look for, so a
        // dump says which of the two steps fails rather than just "no".
        out.qualityRows = [];
        out.leafResOptions = [];
        for (const d of docs()) {
          try {
            d.querySelectorAll('li,div,button,span,a').forEach((e) => {
              const t = (e.textContent || '').trim();
              if (!t || t.length > 40 || !RES_RE.test(t)) return;
              const r = e.getBoundingClientRect();
              if (e.children.length <= 4) {
                out.qualityRows.push({ tag: e.tagName, cls: String(e.className || '').slice(0, 45),
                  text: t.slice(0, 30), kids: e.children.length,
                  w: Math.round(r.width), h: Math.round(r.height),
                  clickable: isElementClickable(e) });
              }
              if (e.children.length === 0 && t.length <= 12 && /^(\d{3,4})\s*p\b/i.test(t)) {
                out.leafResOptions.push({ tag: e.tagName, text: t,
                  clickable: isElementClickable(e) });
              }
            });
          } catch (e) {}
        }
        out.qualityRows = out.qualityRows.slice(0, 25);
        out.leafResOptions = out.leafResOptions.slice(0, 25);
        return out;
      },
      // The player lives in a cross-origin frame, so a dump typed in the top
      // console cannot see it, and switching frame context by hand is a poor
      // thing to ask for. Each copy answers a ping instead, and the top one
      // collects the replies.
      // Clicking into the console closes the player's own menu, so the
      // interesting DOM is gone by the time a plain dump runs. Delay it and
      // let the menu be opened by hand first.
      dumpAll: function (delaySeconds) {
        const wait = Math.max(0, Number(delaySeconds) || 0) * 1000;
        if (wait) {
          console.log('AutoSkip: open the player menu now — reading in ' + (wait / 1000) + 's');
          setTimeout(() => window.__autoSkip.dumpAll(), wait);
          return 'waiting ' + (wait / 1000) + 's...';
        }
        const replies = [];
        const onReply = (e) => {
          if (e.data && e.data.__autoSkipReply) replies.push(e.data.__autoSkipReply);
        };
        window.addEventListener('message', onReply);
        const walk = (w, depth) => {
          try { w.postMessage({ __autoSkipPing: true }, '*'); } catch (err) {}
          if (depth > 3) return;
          let n = 0;
          try { n = w.frames.length; } catch (err) { return; }
          for (let i = 0; i < n; i++) {
            try { walk(w.frames[i], depth + 1); } catch (err) {}
          }
        };
        walk(window.top || window, 0);
        setTimeout(() => {
          window.removeEventListener('message', onReply);
          console.log('=== AutoSkip: ' + replies.length + ' frame(s) reported ===');
          console.log(JSON.stringify(replies, null, 1));
        }, 800);
        return 'collecting... result appears below in about a second';
      },
    };

    window.addEventListener('message', (e) => {
      if (!e.data || e.data.__autoSkipPing !== true) return;
      let payload;
      try { payload = window.__autoSkip.dump(); } catch (err) { payload = { error: String(err) }; }
      try { e.source.postMessage({ __autoSkipReply: payload }, '*'); } catch (err) {}
    });
  } catch (e) {}

  tryAutoSkip();
  setInterval(tryAutoSkip, 300);
  if (isYoutube) setInterval(() => trackContentPosition(), TRACK_TICK_MS);
})();
