(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');

  /* ------------------------------------------------------------------
     Header, page progress and menu
  ------------------------------------------------------------------ */
  const header = document.getElementById('siteHeader');
  const progress = document.getElementById('pageProgress');
  const menuToggle = document.getElementById('menuToggle');
  const menuPanel = document.getElementById('menuPanel');
  const menuLinks = menuPanel ? Array.from(menuPanel.querySelectorAll('a')) : [];
  const pageMain = document.getElementById('main');
  const pageFooter = document.querySelector('.site-footer');
  let menuOpen = false;
  let lastFocusedElement = null;

  const setMenu = (open, restoreFocus = true) => {
    if (!menuToggle || !menuPanel) return;
    menuOpen = open;
    body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuPanel.setAttribute('aria-hidden', String(!open));
    menuPanel.inert = !open;
    if (pageMain) pageMain.inert = open;
    if (pageFooter) pageFooter.inert = open;
    menuToggle.setAttribute('aria-label', open ? '關閉卷目' : '開啟卷目');
    const label = menuToggle.querySelector('.sr-only');
    if (label) label.textContent = open ? '關閉卷目' : '開啟卷目';

    if (open) {
      lastFocusedElement = document.activeElement;
      window.setTimeout(() => menuLinks[0]?.focus(), 360);
    } else if (restoreFocus) {
      (lastFocusedElement || menuToggle).focus();
    }
  };

  if (menuToggle) {
    menuPanel.inert = true;
    menuToggle.addEventListener('click', () => setMenu(!menuOpen));
    menuLinks.forEach((link) => link.addEventListener('click', () => setMenu(false, false)));
    document.querySelector('.brand')?.addEventListener('click', () => {
      if (menuOpen) setMenu(false, false);
    });
    window.addEventListener('keydown', (event) => {
      if (!menuOpen) return;
      if (event.key === 'Escape') {
        setMenu(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [menuToggle, ...menuLinks];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  const updateScrollUI = () => {
    const scrollTop = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0;
    header?.classList.toggle('is-scrolled', scrollTop > 28);
    if (progress) progress.style.transform = `scaleX(${ratio})`;
  };

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateScrollUI();
      scrollTicking = false;
    });
  }, { passive: true });
  updateScrollUI();

  /* ------------------------------------------------------------------
     Reveal on scroll
  ------------------------------------------------------------------ */
  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  revealElements.forEach((element) => {
    const delay = Number(element.dataset.delay || 0);
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('in-view'));
  }

  /* ------------------------------------------------------------------
     Active chapter in the header
  ------------------------------------------------------------------ */
  const navLinks = Array.from(document.querySelectorAll('.main-nav a'));
  const chapterSections = ['dao', 'yinyang', 'sixiang', 'bagua', 'guandao']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && chapterSections.length) {
    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-36% 0px -54% 0px', threshold: 0 });

    chapterSections.forEach((section) => chapterObserver.observe(section));
  }

  /* ------------------------------------------------------------------
     Hero entrance and pointer depth
  ------------------------------------------------------------------ */
  const heroVisual = document.getElementById('heroVisual');
  const hero = document.getElementById('top');
  let pointerFrame = 0;

  const setHeroTilt = (x, y) => {
    if (!heroVisual) return;
    heroVisual.style.setProperty('--shift-x', `${x * -10}px`);
    heroVisual.style.setProperty('--shift-y', `${y * -8}px`);
    heroVisual.style.setProperty('--tilt-x', `${y * -3.2}deg`);
    heroVisual.style.setProperty('--tilt-y', `${x * 3.2}deg`);
  };

  if (hero && heroVisual && finePointer.matches && !prefersReducedMotion.matches) {
    hero.addEventListener('pointermove', (event) => {
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        setHeroTilt(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
        pointerFrame = 0;
      });
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      if (pointerFrame) {
        window.cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
      }
      setHeroTilt(0, 0);
    });
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => body.classList.add('is-ready'));
  });

  /* ------------------------------------------------------------------
     Bagua interaction
  ------------------------------------------------------------------ */
  const trigrams = [
    {
      name: '乾', pinyin: 'QIAN', english: 'THE CREATIVE', nature: '天 · 剛健',
      quote: '天行健，君子以自強不息。', lines: [1, 1, 1]
    },
    {
      name: '巽', pinyin: 'XUN', english: 'THE GENTLE', nature: '風 · 順入',
      quote: '隨風巽，君子以申命行事。', lines: [1, 1, 0]
    },
    {
      name: '坎', pinyin: 'KAN', english: 'THE ABYSMAL', nature: '水 · 險陷',
      quote: '水洊至，習坎，君子以常德行，習教事。', lines: [0, 1, 0]
    },
    {
      name: '艮', pinyin: 'GEN', english: 'KEEPING STILL', nature: '山 · 止靜',
      quote: '兼山艮，君子以思不出其位。', lines: [1, 0, 0]
    },
    {
      name: '坤', pinyin: 'KUN', english: 'THE RECEPTIVE', nature: '地 · 柔順',
      quote: '地勢坤，君子以厚德載物。', lines: [0, 0, 0]
    },
    {
      name: '震', pinyin: 'ZHEN', english: 'THE AROUSING', nature: '雷 · 奮動',
      quote: '洊雷震，君子以恐懼修省。', lines: [0, 0, 1]
    },
    {
      name: '離', pinyin: 'LI', english: 'THE CLINGING', nature: '火 · 光明',
      quote: '明兩作離，大人以繼明照于四方。', lines: [1, 0, 1]
    },
    {
      name: '兌', pinyin: 'DUI', english: 'THE JOYOUS', nature: '澤 · 喜悅',
      quote: '麗澤兌，君子以朋友講習。', lines: [0, 1, 1]
    }
  ];

  const baguaNodes = document.getElementById('baguaNodes');
  const baguaDetail = document.getElementById('baguaDetail');
  const baguaIndex = document.getElementById('baguaIndex');
  const baguaName = document.getElementById('baguaName');
  const baguaPinyin = document.getElementById('baguaPinyin');
  const baguaEnglish = document.getElementById('baguaEnglish');
  const baguaNature = document.getElementById('baguaNature');
  const baguaQuote = document.getElementById('baguaQuote');
  const baguaLines = document.getElementById('baguaLines');
  let activeTrigram = 0;
  let detailTimer = 0;
  let nodeButtons = [];

  const makeYao = (value) => {
    const line = document.createElement('span');
    line.className = `yao ${value ? 'yao--solid' : 'yao--broken'}`;
    return line;
  };

  const renderBagua = (index, animate = true) => {
    const item = trigrams[index];
    if (!item) return;
    if (animate && index === activeTrigram) return;
    activeTrigram = index;

    nodeButtons.forEach((button, i) => {
      const active = i === index;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (baguaIndex) baguaIndex.textContent = String(index + 1).padStart(2, '0');
    if (baguaName) baguaName.textContent = item.name;
    if (baguaPinyin) baguaPinyin.textContent = item.pinyin;
    if (baguaEnglish) baguaEnglish.textContent = `${item.pinyin} · ${item.english}`;
    if (baguaNature) baguaNature.textContent = item.nature;
    if (baguaQuote) baguaQuote.textContent = item.quote;
    if (baguaLines) {
      baguaLines.replaceChildren(...item.lines.map(makeYao));
    }

    if (!animate || !baguaDetail) return;
    window.clearTimeout(detailTimer);
    baguaDetail.classList.remove('is-changing');
    void baguaDetail.offsetWidth;
    baguaDetail.classList.add('is-changing');
    detailTimer = window.setTimeout(() => baguaDetail.classList.remove('is-changing'), 420);
  };

  if (baguaNodes) {
    trigrams.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bagua-node';
      button.style.setProperty('--i', String(index));
      button.dataset.index = String(index);
      button.setAttribute('aria-label', `${item.name}卦，${item.nature}。${item.quote}`);
      button.setAttribute('aria-pressed', 'false');

      const digram = document.createElement('span');
      digram.className = 'node-digram';
      digram.setAttribute('aria-hidden', 'true');
      item.lines.forEach((line) => digram.appendChild(makeYao(line)));

      const name = document.createElement('span');
      name.className = 'node-name';
      name.textContent = item.name;

      const nature = document.createElement('span');
      nature.className = 'node-nature';
      nature.textContent = item.nature.split(' · ')[0];

      button.append(digram, name, nature);
      button.addEventListener('pointerenter', () => renderBagua(index));
      button.addEventListener('focus', () => renderBagua(index));
      button.addEventListener('click', () => renderBagua(index));
      baguaNodes.appendChild(button);
      nodeButtons.push(button);
    });

    renderBagua(0, false);
    nodeButtons[0]?.classList.add('is-active');
    nodeButtons[0]?.setAttribute('aria-pressed', 'true');
  }

  /* ------------------------------------------------------------------
     Daily dao oracle
  ------------------------------------------------------------------ */
  const oracleCard = document.querySelector('.oracle-card');
  const oracleDate = document.getElementById('oracleDate');
  const oracleDo = document.getElementById('oracleDo');
  const oracleDont = document.getElementById('oracleDont');
  const oracleQuote = document.getElementById('oracleQuote');
  const oracleNo = document.getElementById('oracleNo');
  const oracleButton = document.getElementById('oracleButton');

  const oracleEntries = [
    { do: '早睡，散步，把電量留給自己。', dont: '反覆回味別人的一句話。', quote: '「致虛極，守靜篤。」' },
    { do: '拒絕一個不想去的局。', dont: '用討好換取安全感。', quote: '「知足者富。」' },
    { do: '一個人吃飯，慢慢吃完。', dont: '邊吃飯邊刷手機。', quote: '「少則得，多則惑。」' },
    { do: '把未讀消息留到明天。', dont: '為別人的情緒負責。', quote: '「上善若水。」' },
    { do: '看雲，發呆，什麼都不做。', dont: '把休息也安排成任務。', quote: '「無為而無不為。」' },
    { do: '順其自然，不強求結果。', dont: '在心裡預演一萬種糟糕結局。', quote: '「知止不殆。」' },
    { do: '喝熱茶，少解釋。', dont: '向不理解你的人證明自己。', quote: '「大直若屈，大巧若拙。」' },
    { do: '接受事情就是這樣。', dont: '硬撐，假裝沒事。', quote: '「飄風不終朝，驟雨不終日。」' },
    { do: '去走一段沒有目的的路。', dont: '和別人比較進度。', quote: '「千里之行，始於足下。」' },
    { do: '對自己說一次「算了」。', dont: '過度自省，把反省變成攻擊。', quote: '「勝人者有力，自勝者強。」' },
    { do: '把力氣留給真正重要的事。', dont: '想太多，做太少。', quote: '「為學日益，為道日損。」' },
    { do: '原諒今天的自己。', dont: '熬夜報復性刷手機。', quote: '「知人者智，自知者明。」' }
  ];

  let oracleIndex = 0;

  const paintOracle = (index) => {
    const entry = oracleEntries[index];
    if (!entry) return;
    oracleIndex = index;
    if (oracleDo) oracleDo.textContent = entry.do;
    if (oracleDont) oracleDont.textContent = entry.dont;
    if (oracleQuote) oracleQuote.textContent = entry.quote;
    if (oracleNo) oracleNo.textContent = String(index + 1).padStart(2, '0');
  };

  if (oracleDate) {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    oracleDate.textContent = `${yyyy}.${mm}.${dd} · ${days[now.getDay()]}`;
    const daySeed = (yyyy * 10000) + ((now.getMonth() + 1) * 100) + now.getDate();
    oracleIndex = daySeed % oracleEntries.length;
  }

  paintOracle(oracleIndex);

  oracleButton?.addEventListener('click', () => {
    if (oracleButton.disabled) return;
    let next = Math.floor(Math.random() * oracleEntries.length);
    if (next === oracleIndex) next = (next + 1) % oracleEntries.length;

    const reveal = () => {
      paintOracle(next);
      oracleCard?.classList.remove('is-drawing');
      oracleCard?.classList.add('is-revealed');
      oracleButton.disabled = false;
      window.setTimeout(() => oracleCard?.classList.remove('is-revealed'), 520);
    };

    oracleButton.disabled = true;
    if (prefersReducedMotion.matches) {
      reveal();
      return;
    }

    oracleCard?.classList.remove('is-revealed');
    oracleCard?.classList.add('is-drawing');
    window.setTimeout(reveal, 380);
  });

  /* ------------------------------------------------------------------
     Breathing guide
  ------------------------------------------------------------------ */
  const breathOrb = document.getElementById('breathOrb');
  const breathArea = document.querySelector('.breath-area');
  const breathPhase = document.getElementById('breathPhase');
  const breathSeconds = document.getElementById('breathSeconds');
  const breathCaption = document.getElementById('breathCaption');

  const breathPhases = [
    { key: 'inhale', label: '吸', seconds: 4, caption: '吸氣 · 天地入懷' },
    { key: 'hold', label: '守', seconds: 7, caption: '守息 · 萬念歸一' },
    { key: 'exhale', label: '呼', seconds: 8, caption: '呼氣 · 復歸於無' }
  ];

  let breathActive = false;
  let breathIndex = 0;
  let breathTimer = 0;
  let countdownTimer = 0;

  const clearBreathTimers = () => {
    window.clearTimeout(breathTimer);
    window.clearInterval(countdownTimer);
  };

  const resetBreathUI = () => {
    clearBreathTimers();
    breathArea?.removeAttribute('data-phase');
    breathArea?.style.setProperty('--breath-duration', '0.9s');
    if (breathPhase) breathPhase.textContent = '息';
    if (breathSeconds) breathSeconds.textContent = '';
    if (breathCaption) breathCaption.textContent = '輕觸圓心 · 與天地同息';
    if (breathOrb) {
      breathOrb.classList.remove('is-active');
      breathOrb.setAttribute('aria-pressed', 'false');
      breathOrb.setAttribute('aria-label', '開始調息');
    }
  };

  const playBreathPhase = (index) => {
    if (!breathActive || !breathOrb) return;
    breathIndex = index;
    const phase = breathPhases[index];
    breathArea?.setAttribute('data-phase', phase.key);
    breathArea?.style.setProperty('--breath-duration', `${phase.seconds}s`);

    if (breathPhase) breathPhase.textContent = phase.label;
    if (breathSeconds) breathSeconds.textContent = String(phase.seconds);
    if (breathCaption) breathCaption.textContent = phase.caption;
    breathOrb.setAttribute('aria-label', `${phase.label}息，${phase.seconds}秒。輕觸停止調息。`);

    let remaining = phase.seconds;
    countdownTimer = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0 && breathSeconds) breathSeconds.textContent = String(remaining);
    }, 1000);

    breathTimer = window.setTimeout(() => {
      window.clearInterval(countdownTimer);
      playBreathPhase((index + 1) % breathPhases.length);
    }, phase.seconds * 1000);
  };

  const stopBreathing = () => {
    breathActive = false;
    resetBreathUI();
  };

  const startBreathing = () => {
    breathActive = true;
    breathIndex = 0;
    breathOrb?.classList.add('is-active');
    breathOrb?.setAttribute('aria-pressed', 'true');
    if (breathCaption) breathCaption.textContent = '跟隨圓的呼吸 · 輕觸即止';
    playBreathPhase(0);
  };

  breathOrb?.addEventListener('click', () => {
    if (breathActive) stopBreathing();
    else startBreathing();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && breathActive) stopBreathing();
  });

  // Let the guide rest when the chapter is no longer being viewed.
  const stillnessSection = document.getElementById('guandao');
  if ('IntersectionObserver' in window && stillnessSection) {
    const stillnessObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && breathActive) stopBreathing();
    }, { threshold: 0.12 });
    stillnessObserver.observe(stillnessSection);
  }

  /* ------------------------------------------------------------------
     Small finishing touches
  ------------------------------------------------------------------ */
  // Smoothly dismiss the intro state and expose the page.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && menuOpen) setMenu(false, false);
  });

  // Keep the viewport anchored when resizing out of the mobile menu.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && menuOpen) setMenu(false, false);
  });

  // Allow touch users to dismiss the hero parallax hint on orientation change.
  prefersReducedMotion.addEventListener?.('change', () => {
    setHeroTilt(0, 0);
  });
})();
