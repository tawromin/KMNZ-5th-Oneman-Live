(function () {
    const loader = document.getElementById('loader');
    const progressEl = document.querySelector('.loader-progress');
    const percentEl = document.querySelector('.loader-percent');
    const bg = document.querySelector('.bg-image');
    const fg = document.querySelector('.front-image');
    const body = document.body;

    // プリロードする画像リスト（必要に応じて追加/変更）
    const assets = [
        'images/image1.jpg',
        'images/image2.png',
        'images/logo.png',
        'images/thumb.png'
    ];

    let loaded = 0;
    const total = assets.length;
    let targetPercent = 0;
    let displayPercent = 0;

    assets.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loaded++;
            targetPercent = Math.round((loaded / total) * 100);
        };
        img.src = src;
    });

    function tick() {
        displayPercent += (targetPercent - displayPercent) * 0.18;
        if (loaded < total && displayPercent > 95) displayPercent = 95;

        const p = Math.min(100, Math.round(displayPercent));
        progressEl.style.width = p + '%';
        if (percentEl) {
            percentEl.textContent = p + '%';
            const leftPct = Math.min(98, Math.max(2, p));
            percentEl.style.left = leftPct + '%';
            percentEl.style.transform = 'translate(-50%, -50%)';
        }

        if (loaded === total && p >= 100) {
            finish();
        } else {
            requestAnimationFrame(tick);
        }
    }

    function finish() {
        // ローダーをフェードアウト（クラス付与）
        if (loader) loader.classList.add('hidden');

        // フェードアウトが終わったら DOM から削除（残像防止）
        // CSS の transition 時間と合わせて少し待つ（500ms）
        if (loader) setTimeout(() => {
            try { loader.remove(); } catch (e) { /* ignore */ }
        }, 550);

        // ページ全体を「準備完了」状態に（背景色はCSSで既に同じ）
        body.classList.add('page-ready');

        // 背景・前景表示
        if (bg) bg.classList.add('loaded');
        if (fg) setTimeout(() => fg.classList.add('visible'), 200);

        // スクロールでフェードインする要素を初期化
        initScrollFade();
    }

    // スクロール時のフェード処理（IntersectionObserver）
    function initScrollFade() {
        const items = document.querySelectorAll('.fade-on-scroll');
        if (!items.length) return;

        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    // 一度表示したら監視解除（再表示不要なら）
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -20% 0px', // 下部で余裕をもって発火
            threshold: 0.08
        });

        items.forEach(item => {
            // 既にほぼ見えているものは即時表示して observer を追加しない（安定化）
            const rect = item.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.92) {
                item.classList.add('in-view');
            } else {
                obs.observe(item);
            }
        });
    }


    // 保険: 長時間かかる時は強制完了
    setTimeout(() => {
        targetPercent = 100;
        if (loaded < total) loaded = total;
    }, 8000);

    // main の上端に合わせて --hero-height を更新する関数
    function updateHeroHeight() {
        const bgImg = document.querySelector('.bg-image img');
        const spacer = document.querySelector('.hero-spacer');
        const fallback = Math.round(window.innerHeight * 0.6);

        if (!bgImg) {
            document.documentElement.style.setProperty('--hero-height', fallback + 'px');
            if (spacer) spacer.style.height = fallback + 'px';
            return;
        }

        function applyHeight() {
            // 画像の natural サイズから、画面幅に当てたときの描画高さを算出
            const renderedHeight = Math.round(bgImg.naturalHeight * (window.innerWidth / Math.max(1, bgImg.naturalWidth)));
            const h = Math.max(48, renderedHeight); // 最低高さを確保
            document.documentElement.style.setProperty('--hero-height', h + 'px');
            if (spacer) spacer.style.height = h + 'px';
            // bg-image 要素の高さも合わせる（fixed 用）
            const bg = document.querySelector('.bg-image');
            if (bg) bg.style.height = h + 'px';
        }

        if (bgImg.naturalWidth && bgImg.naturalHeight) {
            applyHeight();
        } else {
            bgImg.addEventListener('load', applyHeight, { once: true });
            // とりあえず fallback をセット
            document.documentElement.style.setProperty('--hero-height', fallback + 'px');
            if (spacer) spacer.style.height = fallback + 'px';
        }
    }

    // リサイズ時・orientationchange で再計算
    window.addEventListener('resize', updateHeroHeight, { passive: true });
    window.addEventListener('orientationchange', updateHeroHeight);

    // 画像のロードが終わったら必ず更新（bg/front 両方を監視しておく）
    const imgs = document.querySelectorAll('.bg-image img, .front-image img');
    imgs.forEach(img => {
        img.addEventListener('load', updateHeroHeight, { once: true });
    });

    // finish をラップして先に高さを確定させる（ローダー消去の前に）
    const _finish = finish;
    finish = function () {
        updateHeroHeight();
        // 少し待ってから既存の finish 実装を実行（loaderのフェードなど）
        setTimeout(() => _finish(), 0);
    };

    // 初期実行
    document.addEventListener('DOMContentLoaded', updateHeroHeight);

    // 既に呼ばれている requestAnimationFrame や finish の流れにより最終的に更新されるはず

    requestAnimationFrame(tick);
})();

// ここからタイマー
(function () {
    // top-countdown 初期化（main の上端フェード領域に重ねて表示）
    const container = document.querySelector('.top-countdown[data-target]');
    if (!container) return;

    const targetAttr = container.getAttribute('data-target');
    const parts = targetAttr.split('-').map(Number);
    const targetDate = new Date(parts[0], Math.max(0, parts[1] - 1), parts[2], 17, 0, 0);

    const els = {
        days: container.querySelector('[data-unit="days"]'),
        hours: container.querySelector('[data-unit="hours"]'),
        minutes: container.querySelector('[data-unit="minutes"]'),
        seconds: container.querySelector('[data-unit="seconds"]')
    };

    let last = {};

    function pad(n){ return String(n).padStart(2,'0'); }

    function update() {
        const now = new Date();
        let diff = Math.max(0, Math.floor((targetDate - now) / 1000)); // 秒
        if (diff <= 0) {
            container.innerHTML = '<div class="cd-done">開催中</div>';
            return clearInterval(timer);
        }
        const days = Math.floor(diff / 86400); diff %= 86400;
        const hours = Math.floor(diff / 3600); diff %= 3600;
        const minutes = Math.floor(diff / 60); const seconds = diff % 60;

        const vals = { days: String(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };

        Object.keys(vals).forEach(k => {
            const el = els[k];
            if (!el) return;
            if (last[k] !== vals[k]) {
                el.textContent = vals[k];
                el.classList.add('update');
                requestAnimationFrame(() => {
                    setTimeout(() => el.classList.remove('update'), 160);
                });
            }
        });
        last = vals;
    }

    update();
    const timer = setInterval(update, 1000);
})();
