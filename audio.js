/* ================================================= */
/* 🎧 WASTELAND AUDIO ENGINE (廢土音效引擎核心 v2.0)  */
/* ================================================= */

const audioEngine = {
    // ==== 1. 音效資料庫 (Audio Dictionary) ====
    // ⚠️ 倖存者，未來請把這裡的 '...' 替換成你的實際音樂檔案路徑 (例如: 'assets/bgm_camp.mp3')
    tracks: {
        bgm: {
            'odyssey': 'bgm_odyssey.mp3', // 征途
            'status': 'bgm_camp.mp3',     // 營地 (原名 status)
            'gather': 'bgm_scavenge.mp3', // 搜刮
            'battle': 'bgm_explore.mp3',  // 探索
            'inv': 'bgm_equip.mp3',       // 裝備
            'shop': 'bgm_blackmarket.mp3',// 黑市
            'base': 'bgm_base.mp3',       // 基地
            'story_normal': 'bgm_story.mp3',      // 主線: 一般
            'story_suspense': 'bgm_suspense.mp3', // 主線: 懸疑
            'boss': 'bgm_boss_fight.mp3'          // 王關死鬥
        },
        sfx: {
            'btn_normal': 'sfx_click.mp3',   // 一般按鈕音效
            'btn_hype': 'sfx_hype_click.mp3' // 熱血/確認/重要按鈕音效
        }
    },

    // ==== 2. 系統狀態 ====
    settings: {
        muted: false,
        bgmVolume: 0.5, // 0.0 ~ 1.0
        sfxVolume: 0.5
    },
    
    currentBGMPlayer: null,
    currentBGMKey: null,

    // ==== 3. 核心播放邏輯 ====
    playBGM(key) {
        if (this.settings.muted) return;
        
        const src = this.tracks.bgm[key];
        if (!src) {
            console.warn(`[AudioEngine] 找不到 BGM: ${key}`);
            return;
        }

        // 如果要播的跟現在同一首，就不重新播放，保持流暢
        if (this.currentBGMKey === key && this.currentBGMPlayer) return;

        // 停止舊的音樂
        if (this.currentBGMPlayer) {
            this.currentBGMPlayer.pause();
            this.currentBGMPlayer.currentTime = 0;
        }

        // 建立並播放新音樂
        this.currentBGMPlayer = new Audio(src);
        this.currentBGMPlayer.loop = true; // BGM 無限循環
        this.currentBGMPlayer.volume = this.settings.bgmVolume;
        
        // 捕捉瀏覽器自動播放阻擋錯誤
        this.currentBGMPlayer.play().catch(e => {
            console.log("[AudioEngine] 等待使用者首次互動後解鎖音頻...");
        });

        this.currentBGMKey = key;
    },

    playSFX(key) {
        if (this.settings.muted) return;
        
        const src = this.tracks.sfx[key];
        if (!src) return;

        // 每次都 new 一個新物件，實現音效「可疊加」播放
        const sfx = new Audio(src);
        sfx.volume = this.settings.sfxVolume;
        sfx.play().catch(e => {});
    },

    // ==== 4. UI 介面對接控制器 ====
    setBGMVolume(val) {
        this.settings.bgmVolume = val / 100;
        if (this.currentBGMPlayer) {
            this.currentBGMPlayer.volume = this.settings.bgmVolume;
        }
    },

    setSFXVolume(val) {
        this.settings.sfxVolume = val / 100;
    },

    toggleMute() {
        this.settings.muted = !this.settings.muted;
        if (this.settings.muted && this.currentBGMPlayer) {
            this.currentBGMPlayer.pause();
        } else if (!this.settings.muted && this.currentBGMPlayer) {
            this.currentBGMPlayer.play().catch(e=>{});
        }
        return this.settings.muted; // 回傳給 UI 更新用
    }
};

/* ================================================= */
/* 🎛️ 音效控制面板橋接 (給 HTML 拉桿呼叫的函式)      */
/* ================================================= */

function updateVolume(type, val) {
    if (type === 'bgm') {
        audioEngine.setBGMVolume(val);
        const bgmValEl = document.getElementById('bgm-val');
        if (bgmValEl) bgmValEl.innerText = val;
    } else if (type === 'sfx') {
        audioEngine.setSFXVolume(val);
        const sfxValEl = document.getElementById('sfx-val');
        if (sfxValEl) sfxValEl.innerText = val;
    }
}

function toggleMute() {
    const isMuted = audioEngine.toggleMute();
    const icon = document.getElementById('audio-icon');
    const btn = document.getElementById('audio-toggle-btn');
    
    if (isMuted) {
        if (icon) icon.innerText = '🔇';
        if (btn) {
            btn.innerHTML = '<span id="audio-icon">🔇</span> 系統靜音：已開啟';
            btn.style.borderColor = '#ff5555';
            btn.style.color = '#ff5555';
            btn.style.background = 'rgba(255, 85, 85, 0.15)';
        }
    } else {
        if (icon) icon.innerText = '🔊';
        if (btn) {
            btn.innerHTML = '<span id="audio-icon">🔊</span> 系統靜音：未開啟';
            btn.style.borderColor = '#ffaa00';
            btn.style.color = '#ffaa00';
            btn.style.background = 'rgba(45, 30, 10, 0.6)';
        }
    }
}
