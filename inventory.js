// ==========================================
// ⚙️ 紫色核心數值控制中心 (可隨時調整數值)
// ==========================================
const CORE_CONFIG = {
    // --- 1. 清道夫 (Scavenger) ---
    scavenger_A: { maxStacks: 10, stackAtkPercent: 0.10, fusionAtkAdd: 120 },
    scavenger_B: { hpThreshold: 0.50, boostedAtk: 60, bleedChance: 0.25, bleedAtkPercent: 0.50 },
    scavenger_C: { lifestealShieldPercent: 0.15, extraLootChance: 0.25, doubleLootChance: 0.10 },
    scavenger_D: { scrapStep: 1000, zacoStep: 100, stepBonusPercent: 0.03, maxBonusPercent: 1.20, stealChance: 0.10, stealPercent: 0.05 },

    // --- 2. 都市忍者 (Ninja) ---
    ninja_A: { postCritAtkBonus: 0.25, echoDmgPercent: 0.50 },
    ninja_B: { dodgeToShieldRatio: 1.0, doubleCritChance: 0.25 },
    ninja_C: { dodgeOverflowThreshold: 50, defShredPercent: 0.05, maxDefShredPercent: 0.20 },
    ninja_D: { stunChance: 0.20, doubleDodgeCritIgnoreDef: 1.0 },

    // --- 3. 廢土暴徒 (Thug) ---
    thug_A: { critLifestealPercent: 0.15, selfDmgPenalty: 0.10 },
    thug_B: { stunChance: 0.35, splashAtkPercent: 0.30 },
    thug_C: { lowHpThreshold: 0.30, critRatePerLossHp: 0.005, boostedCritMult: 4.0 },
    thug_D: { nonCritAddMult: 1.0, maxCritMult: 8.0, baseCritMult: 3.0 },

    // --- 4. 殭屍骰 (Zombie) ---
    zombie_A: { missAddOHKO: 4, baseOHKO: 12 },
    zombie_B: { bossCurrentHpPercent: 0.05 },
    zombie_C: { maxOHKO: 48, baseOHKO: 12 },
    zombie_D: { explosionAtkMult: 3.0, permStackAddAtk: 1, permStackAddOHKO: 1, maxStacks: 15 },

    // --- 5. 深淵琉璃 (Abyss) ---
    abyss_A: { reflectCritHealHpPercent: 0.05 },
    abyss_B: { cheatDeathHpThreshold: 0.20, reflectAccumulatedBurstMult: 3.0 },
    abyss_C: { reflectToShieldPercent: 0.30, maxShieldHpPercent: 1.0, shieldedDefAdd: 35 },
    abyss_D: { enemyAtkDebuffStep: 0.05, maxEnemyAtkDebuff: 0.30, reflectDmgTakenAdd: 0.10, maxDebuffDefBonus: 100 }
};

// ==========================================
// 🟣 終局獨立紫色核心 O(1) 全域字典 (完全解綁套裝)
// ==========================================
const EXOTIC_CORE_DATABASE = {
    // 1. 清道夫系列戰術核心
    "core_scavenger_A": { id: "core_scavenger_A", name: "廢鐵聚變・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "scavenger_A", desc: "命中有機率回收殘屑，疊滿 10 層觸發『聚變反應』(ATK +120)。" },
    "core_scavenger_B": { id: "core_scavenger_B", name: "重壓引擎・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "scavenger_B", desc: "目標 HP>50% 時攻擊加成翻倍；25% 機率撕裂護甲造成 50% 流血傷害。" },
    "core_scavenger_C": { id: "core_scavenger_C", name: "磁流掠奪・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "scavenger_C", desc: "15% 傷害轉護盾；擊殺敵額外掉落率 +25%，10% 觸發雙倍掉落。" },
    "core_scavenger_D": { id: "core_scavenger_D", name: "煉金術師・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "scavenger_D", desc: "每持 1,000 廢料或 100 ZaCo 動態 +3% 攻擊(上限+120%)；攻擊 10% 掠奪廢料。" },

    // 2. 都市忍者系列戰術核心
    "core_ninja_A":     { id: "core_ninja_A", name: "量子怨靈・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "ninja_A", desc: "打出暴擊時，下次攻擊 +25% 攻擊力並召喚殘影追加 50% 傷害連擊。" },
    "core_ninja_B":     { id: "core_ninja_B", name: "微型電弧・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "ninja_B", desc: "成功閃避將閃避率 100% 轉為護盾；打出暴擊時 25% 機率暴傷翻倍。" },
    "core_ninja_C":     { id: "core_ninja_C", name: "致命演算・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "ninja_C", desc: "暴擊時溢出閃避率轉真傷，且永久扣除目標 5% 防禦力(最多20%)。" },
    "core_ninja_D":     { id: "core_ninja_D", name: "都市因果・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "ninja_D", desc: "暴擊時 20% 跳過敵攻擊；連續 2 次閃避必爆，下擊必定穿透 100% 防禦。" },

    // 3. 廢土暴徒系列戰術核心
    "core_thug_A":      { id: "core_thug_A", name: "嗜血狂爆・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "thug_A", desc: "打出暴擊時吸血 15% HP；代價為受到的所有傷害額外 +10%。" },
    "core_thug_B":      { id: "core_thug_B", name: "腦部震盪・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "thug_B", desc: "打出暴擊時 35% 機率使敵人眩暈跳過回合，並造成 30% 濺射傷害。" },
    "core_thug_C":      { id: "core_thug_C", name: "血海深仇・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "thug_C", desc: "血量<30%才自動吃肉乾；血量每低 1% 暴擊+0.5%；<30% 時暴傷進化為 4 倍。" },
    "core_thug_D":      { id: "core_thug_D", name: "無惡不作・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "thug_D", desc: "未暴擊時累積動能使暴傷 +1 倍(最高 8 倍)；打出暴擊後重置。" },

    // 4. 殭屍骰系列戰術核心
    "core_zombie_A":    { id: "core_zombie_A", name: "崩壞天平・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "zombie_A", desc: "未秒殺時下一擊秒殺率 +4%(可無限無上限疊加)；觸發秒殺後重置。" },
    "core_zombie_B":    { id: "core_zombie_B", name: "死靈壞疽・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "zombie_B", desc: "對 Boss 觸發秒殺時，改為注入壞疽，強制削減 Boss 當前 5% HP。" },
    "core_zombie_C":    { id: "core_zombie_C", name: "盲目下注・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "zombie_C", desc: "秒殺成功後下次秒殺率翻倍(24%->48%)；未秒殺則降回原本數值。" },
    "core_zombie_D":    { id: "core_zombie_D", name: "生化菌絲・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "zombie_D", desc: "秒殺改為 3 倍屍爆傷害；每觸發一次永久 +1% 攻擊與 +1% 秒殺率(最多15層)。" },

    // 5. 深淵琉璃系列戰術核心
    "core_abyss_A":     { id: "core_abyss_A", name: "猖狂反噬・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "abyss_A", desc: "反傷享有暴擊判定；若反傷觸發暴擊，額外回復 5% 最大生命。" },
    "core_abyss_B":     { id: "core_abyss_B", name: "零度晶核・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "abyss_B", desc: "HP<20% 時觸發迴光返照，並將累積反傷的 300% 化為晶體風暴轟向敵人。" },
    "core_abyss_C":     { id: "core_abyss_C", name: "絕對防禦・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "abyss_C", desc: "反傷時將 30% 轉為護盾(上限100% HP)；護盾存在時防禦力額外 +35。" },
    "core_abyss_D":     { id: "core_abyss_D", name: "重力坍縮・核心", slot: "core", slotText: "核心", rarity: "epic", class: "loot-epic", setId: null, resonance: "abyss_D", desc: "反傷永久降低敵人 5% 攻擊(上限30%)；敵降攻達極限時防禦+100。" }
};


// ==========================================
// ⚡ 紫光開獎感官特效 (Cyber Neon Flash & Vibration)
// ==========================================
function triggerPurpleJackpotEffect() {
    // 1. 手機實體震動 (Android / 支持震動之 iOS WebView)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([100, 50, 200, 50, 300]); } catch(e) {}
    }
    // 2. 全螢幕霓虹紫光閃爍 (Cyber Flash)
    const flash = document.createElement('div');
    flash.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(195,85,255,0.35);box-shadow:inset 0 0 50px #c355ff;z-index:9999;pointer-events:none;transition:opacity 0.6s ease-out;";
    document.body.appendChild(flash);
    setTimeout(() => { 
        flash.style.opacity = '0'; 
        setTimeout(() => flash.remove(), 600); 
    }, 100);
}



// ==========================================
// 🧬 全域套裝字典 (Data-Driven Set Bonuses)
// ==========================================
const SET_BONUS_DB = {
    'scavenger': { name: "清道夫", 2: { atk: 30, desc: "攻擊力 +30" }, 3: { atk: 15, desc: "攻擊力再 +15 (總和+45)" } },
    'ninja':     { name: "都市忍者", 2: { dodge: 30, dodgeCrit: true, desc: "閃避率 +30% | 閃避後必爆" }, 3: { dodge: 10, desc: "閃避率再 +10% (總和+40%)" } },
    'thug':      { name: "廢土暴徒", 2: { crit: 30, critMult: 3, desc: "暴擊率 +30% | 暴傷 3 倍" }, 3: { crit: 15, desc: "暴擊率再 +15% (總和+45%)" } },
    'zombie':    { name: "殭屍骰", 2: { ohko: 12, desc: "秒殺機率 +12%" }, 3: { ohko: 5, desc: "秒殺機率再 +5% (總和+17%)" } },
    'abyss':     { name: "深淵琉璃", 2: { def: 30, reflect: 0.5, desc: "防禦力 +30 | 反彈 50% 傷害" }, 3: { def: 15, desc: "防禦力再 +15 (總和+45)" } }
};



// ==========================================
// 專屬武裝庫：主線/王關掉落特殊裝備
// ==========================================

const STORY_GEAR_DATABASE = {
    "set_3_body_purple": {
        name: "鐵衛的液態合金胸甲",
        slot: "body",
        slotText: "胸背帶",
        rarity: "epic",        // 全新稀有度：史詩 (紫裝)
        class: "loot-epic",    // 對應 CSS
        atk: 0,
        def: 55,
        maxHp: 350,
        crit: 0,
        dodge: 0,
        desc: "從液態鐵衛身上剝離的裝甲，雖然殘破但防禦力驚人。"
    }
};

// 呼叫此函數，自動將主線專屬裝備／紫色核心寫入玩家背包
async function generateStoryGear(gearId) {
    // 🚀 微創手術：雙路徑 O(1) 檢索，同時支援主線紫裝與 20 枚紫色核心字典
    const gearTemplate = STORY_GEAR_DATABASE[gearId] || (typeof EXOTIC_CORE_DATABASE !== 'undefined' ? EXOTIC_CORE_DATABASE[gearId] : null);
    
    if (!gearTemplate) {
        console.error(`>> 找不到指定的專屬裝備 ID: ${gearId}`);
        return null;
    }

    // 實體化裝備數據
    let newItem = {
        slot: gearTemplate.slot,
        slotText: gearTemplate.slotText,
        rarity: gearTemplate.rarity,
        class: gearTemplate.class,
        name: `[史詩] ${gearTemplate.name}`,
        atk: gearTemplate.atk || 0,
        def: gearTemplate.def || 0,
        maxHp: gearTemplate.maxHp || 0,
        crit: gearTemplate.crit || 0,
        dodge: gearTemplate.dodge || 0,
        setId: gearTemplate.setId || null,
        resonance: gearTemplate.resonance || null, // 🚀 將流派大招共鳴標籤寫入實體裝備
        is_equipped: 0,
        is_locked: 1 // 💎 專屬裝備預設自動鎖定，防止玩家手滑賣掉！
    };

    if (typeof db !== 'undefined' && db.inventory_items) {
        await db.inventory_items.add(newItem);
        
        const invTab = document.getElementById('tab-inv');
        if (invTab && invTab.classList.contains('active') && typeof renderInventory === 'function') {
            renderInventory();
        }
        
        return newItem; // 回傳給戰鬥系統印出日誌
    }
    return null;
}




// 計算能力值 (包含 +1~+9 強化倍率與動態套裝引擎)
function calculateHoundStats() {
    let bAtk = 0, bHp = 0, bDef = 0, bDodge = 0, bCrit = 0, ohko = 0;
    let setCounts = {};

    Object.values(gameState.equipped).forEach(item => {
        if (!item) return;
        
        // 🚀 廢土重構：指數型強化倍率 (1.12 的 level 次方)
        // 這樣 +6 會有 1.97 倍的爆發增幅，+9 會達到 2.77 倍，完美契合檢定！
        let lvlMult = Math.pow(1.12, item.level || 0);
        
        if (item.atk) bAtk += Math.floor(item.atk * lvlMult);
        if (item.maxHp) bHp += Math.floor(item.maxHp * lvlMult);
        if (item.def) bDef += Math.floor(item.def * lvlMult);
        if (item.dodge) bDodge += Math.floor(item.dodge * lvlMult);
        if (item.crit) bCrit += Math.floor(item.crit * lvlMult);
        if (item.setId) setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
    });

    // ... 下方的套裝與隱藏參數邏輯保持不變 ...

    let activeText = []; 
    gameState.hound.activeSets = []; 
        let atkMultiplier = 1; 
    
    // 🚀 初始化戰鬥隱藏參數 (預設值)
    let critMult = 2; // 預設暴擊傷害為 2 倍
    let reflectRate = 0; // 預設反傷率為 0
    let dodgeCrit = false; // 預設閃避無必爆

    // 動態套裝引擎 (Data-Driven Loop)
    for (const [setId, count] of Object.entries(setCounts)) {
        let setDef = SET_BONUS_DB[setId];
        if (!setDef) continue; 
        
        let setName = (typeof gameConfig !== 'undefined' && gameConfig?.loot_pool?.sets?.[setId]?.name) 
                        ? gameConfig.loot_pool.sets[setId].name : setDef.name;

        [2, 3].forEach(reqCount => {
            if (count >= reqCount && setDef[reqCount]) {
                gameState.hound.activeSets.push(`${setId}_${reqCount}pc`);
                let bonus = setDef[reqCount];
                
                if (bonus.atk) bAtk += bonus.atk;
                if (bonus.def) bDef += bonus.def;
                if (bonus.hp) bHp += bonus.hp;
                if (bonus.dodge) bDodge += bonus.dodge;
                if (bonus.crit) bCrit += bonus.crit;
                if (bonus.ohko) ohko += bonus.ohko;
                
                // 🚀 抓取戰鬥隱藏參數
                if (bonus.critMult) critMult = bonus.critMult;
                if (bonus.reflect) reflectRate += bonus.reflect;
                if (bonus.dodgeCrit) dodgeCrit = true;
                
                activeText.push(`[${setName}] ${reqCount}件套: ${bonus.desc}`);
            }
        });
    }

        // 🟣 紫色核心共鳴檢定與動態被動算式
    const coreItem = gameState.equipped.core;
    const coreRes = coreItem?.resonance || null;
    gameState.hound.coreResonance = coreRes;

    if (coreRes && typeof CORE_CONFIG !== 'undefined') {
        // 1. 清道夫 A (疊滿 10 層聚變加成)
        if (coreRes === 'scavenger_A' && gameState.hound.scavengerFusionActive) {
            bAtk += CORE_CONFIG.scavenger_A.fusionAtkAdd;
        }
        // 2. 清道夫 D (財富動態加成)
        if (coreRes === 'scavenger_D') {
            const cfgD = CORE_CONFIG.scavenger_D;
            const scrapBonus = Math.floor(gameState.resources.scrap / cfgD.scrapStep) * cfgD.stepBonusPercent;
            const zacoBonus = Math.floor(gameState.resources.zaco / cfgD.zacoStep) * cfgD.stepBonusPercent;
            const totalBonus = Math.min(cfgD.maxBonusPercent, scrapBonus + zacoBonus);
            atkMultiplier += totalBonus;
        }
        // 3. 廢土暴徒 C (血量越低暴擊越高)
        if (coreRes === 'thug_C') {
            const currentHp = gameState.hound.hp || 100;
            const maxHpVal = 100 + bHp;
            const lostHpPercent = Math.max(0, (maxHpVal - currentHp) / maxHpVal) * 100;
            bCrit += Math.floor(lostHpPercent * (CORE_CONFIG.thug_C.critRatePerLossHp * 100));
        }
        // 4. 殭屍骰 D (菌絲永久層數加成)
        if (coreRes === 'zombie_D') {
            const zStacks = gameState.hound.zombieDStacks || 0;
            bAtk += Math.floor((gameState.hound.baseAtk + bAtk) * (zStacks * 0.01));
            ohko += zStacks;
        }
        // 5. 深淵琉璃 C (護盾存在追加防禦)
        if (coreRes === 'abyss_C' && (gameState.hound.shield || 0) > 0) {
            bDef += CORE_CONFIG.abyss_C.shieldedDefAdd;
        }
        // 6. 深淵琉璃 D (重力極限追加防禦)
        if (coreRes === 'abyss_D' && gameState.hound.abyssDMaxed) {
            bDef += CORE_CONFIG.abyss_D.maxDebuffDefBonus;
        }
    }

    gameState.hound.totalAtk = Math.floor((gameState.hound.baseAtk + bAtk) * atkMultiplier);
    gameState.hound.maxHp = 100 + bHp; 
    gameState.hound.totalDef = gameState.hound.baseDef + bDef;
    gameState.hound.totalDodge = gameState.hound.baseDodge + bDodge; 
    gameState.hound.totalCrit = gameState.hound.baseCrit + bCrit;
    gameState.hound.ohko = ohko;
    
    // 🚀 將戰鬥隱藏參數寫入獵犬狀態，供戰鬥引擎直接讀取
    gameState.hound.critMult = critMult;
    gameState.hound.reflect = reflectRate;
    gameState.hound.dodgeCrit = dodgeCrit;


    
    const setText = document.getElementById('set-bonus-text');
    if (setText) setText.innerHTML = activeText.length > 0 ? activeText.join("<br>") : "<span style='color:#777;'>[未啟動任何套裝效果]</span>";
}


async function generateLoot(isBossDrop = false) {
    const r = Math.floor(Math.random() * 1000000);
    let rarity = "common", rarityText = "普通", rarityClass = "loot-common", statMult = 1; let isSet = false;
    
        // ... 前面的掉落機率不變 ...
    if (isBossDrop) {
        if (Math.random() * 100 < 5) { rarity = "apocalyptic"; rarityText = "滅世"; rarityClass = "loot-apocalyptic"; statMult = 5.5; } // 🚀 紅裝微幅上調，確保 1件紅 就能撐起半邊天
        else { rarity = "legendary"; rarityText = "傳奇"; rarityClass = "loot-legendary"; statMult = 3; }
    } else {
        if (gameState.currentArea !== "wasteland" && r > 999660) { 
            rarity = "apocalyptic"; rarityText = "滅世"; rarityClass = "loot-apocalyptic"; statMult = 5.5; 
        } 
        else if (r > 997300) { rarity = "legendary"; rarityText = "傳奇"; rarityClass = "loot-legendary"; statMult = 3; } 
        // 🚀 綠裝基礎給予 2.8 倍率，搭配下方的 1.5 倍補正，單件主屬性高達 4.2 倍！
        // 這樣玩家穿 2 件綠裝，不僅能拿到套裝效果，血量/防禦的底盤也會超級穩。
        else if (r > 988500) { rarity = "set"; rarityText = "套裝"; rarityClass = "loot-set"; statMult = 2.8; isSet = true; } 
        else if (r > 838500) { rarity = "rare"; rarityText = "稀有"; rarityClass = "loot-rare"; statMult = 1.8; }
    }


    // 裝備品質浮動機制 (同階級中的素質高低，模擬 2~6 小時的極品獲取)
    let qualityRoll = Math.random();
    let qualityMult = 1.0;
    if (qualityRoll > 0.95) qualityMult = 1.5; // 5% 極品素質 (大約掛幾小時才會出現一次頂值)
    else if (qualityRoll > 0.80) qualityMult = 1.25; // 15% 優良素質

    // 讀取副本專屬的屬性加成倍率 (loot_multiplier)
    let areaMultiplier = 1;
    if (gameState.currentArea !== "wasteland") {
        const dungeon = gameConfig.dungeon_database.find(d => d.id === gameState.currentArea);
        if (dungeon && dungeon.loot_multiplier) areaMultiplier = dungeon.loot_multiplier;
    }
    
    // 將基礎稀有度倍率 * 副本環境倍率 * 品質浮動倍率
    statMult = statMult * areaMultiplier * qualityMult;

    const pool = gameConfig.loot_pool;
    const slotKeys = ["helmet", "collar", "harness"];
    const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];
    const slotData = pool.slots[slot];
    const baseName = slotData.names[Math.floor(Math.random() * slotData.names.length)];

    let item = { slot: slot, slotText: slotData.typeName, rarity: rarity, class: rarityClass, atk: 0, maxHp: 0, def: 0, dodge: 0, crit: 0, setId: null, is_equipped: 0, is_locked: 0 };

    if (isSet) {
        const setKeys = Object.keys(pool.sets); const setId = setKeys[Math.floor(Math.random() * setKeys.length)];
        item.name = `[套裝] ${pool.sets[setId].name}・${baseName}`; item.setId = setId;
        // 🚀 強化 2：綠裝基礎數值大幅調高，並強制附加 1.5 倍補正，彌補無隨機詞條的劣勢！
        if (slot === 'collar') item.atk = Math.floor(6 * statMult * 1.5); 
        else if (slot === 'harness') item.maxHp = Math.floor(30 * statMult * 1.5); 
        else if (slot === 'helmet') item.def = Math.floor(5 * statMult * 1.5);
    } else {

        const affix = pool.affixes[Math.floor(Math.random() * pool.affixes.length)];
        item.name = `[${rarityText}] ${affix.name}${baseName}`;
        
        // 🛡️ 主屬性：維持無限膨脹，吃滿副本難度的 statMult
        if (slot === 'collar') item.atk = Math.floor((Math.random() * 4 + 3) * statMult); 
        else if (slot === 'harness') item.maxHp = Math.floor((Math.random() * 15 + 20) * statMult); 
        else if (slot === 'helmet') item.def = Math.floor((Math.random() * 3 + 2) * statMult);
        
        if (affix.type === 'atk') item.atk += Math.floor(3 * statMult); 
        if (affix.type === 'hp') item.maxHp += Math.floor(15 * statMult); 
        if (affix.type === 'def') item.def += Math.floor(3 * statMult); 
        
        // 🚀 副屬性獨立演算法：只依賴「稀有度」與「品質浮動」，徹底拔除副本無限倍率！
        // 保證產出結果永遠介於 1% ~ 15% 之間
        let secMult = (rarity === 'apocalyptic' ? 2.5 : rarity === 'legendary' ? 1.8 : rarity === 'rare' ? 1.2 : 1) * qualityMult;
        let secRoll = Math.min(15, Math.max(1, Math.floor((Math.random() * 4 + 2) * secMult)));
        
        if (affix.type === 'crit') item.crit += secRoll; 
        if (affix.type === 'dodge') item.dodge += secRoll;
    }


    if (gameState.autoSell && gameState.autoSell[rarity]) {
        let val = rarity === 'rare' ? 5 : 1;
        gameState.resources.zaco += val;
        logMessage(`>> [自動拆解] 將 <span class="${item.class}">${item.name}</span> 轉換為 +${val} ZaCo`);
        return; 
    }

    await db.inventory_items.add(item);
    if (document.getElementById('tab-inv').classList.contains('active')) renderInventory();
    logMessage(`獲得戰利品: <span class="${item.class}">${item.name}</span>`);
}

// --- 升級版：自動拆解切換 (防呆防空指針當機) ---
function toggleAutoSell(type) { 
    const checkbox = document.getElementById(`auto-${type}`);
    // 防呆檢查：確保畫面上真的有這個勾選框，且 autoSell 物件已初始化
    if (!checkbox) return;
    if (!gameState.autoSell) gameState.autoSell = { common: false, rare: false };
    
    gameState.autoSell[type] = checkbox.checked; 
    savePlayerState(); 
    logMessage(`>> [自動拆解] 已${checkbox.checked ? '啟用' : '關閉'} ${type === 'common' ? '普通' : '稀有'}品質自動拆解。`, 'system');
}


async function equipItem(id) {
    const item = await db.inventory_items.get(id); if (!item) return;
    await db.inventory_items.where("slot").equals(item.slot).modify({ is_equipped: 0 });
    await db.inventory_items.update(id, { is_equipped: 1 });
    const equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
    
    // 🟢 補上 core 欄位防呆，避免讀取 undefined
    gameState.equipped = { helmet: null, collar: null, harness: null, core: null };
    equippedItems.forEach(i => { gameState.equipped[i.slot] = i; });
    
    calculateHoundStats(); updateUI(); renderInventory();
    logMessage(`裝備成功：獵犬已配備 <span class="${item.class}">${item.name}</span>`);
}


async function unequipSlot(slot) {
    const item = gameState.equipped[slot]; if(!item) return;
    await db.inventory_items.update(item.id, { is_equipped: 0 });
    gameState.equipped[slot] = null;
    calculateHoundStats(); updateUI();
    if(document.getElementById('tab-inv').classList.contains('active')) renderInventory();
    logMessage(`>> 已卸下裝備：${item.name}`);
}

async function sellItem(event, id) {
    event.stopPropagation(); const item = await db.inventory_items.get(id); if (!item || item.is_locked) return;
    let val = 1; if(item.rarity==='rare') val=5; if(item.rarity==='set') val=80; if(item.rarity==='legendary') val=25; if(item.rarity==='apocalyptic') val=150;
    gameState.resources.zaco += val; 
    
    // ✨ 新增：黑水鍍膜抽取邏輯 (出售滅世紅裝時額外獲得 1 個)
    let extraMsg = "";
    if (item.rarity === 'apocalyptic') {
        gameState.resources.coating = (gameState.resources.coating || 0) + 1;
        extraMsg = ` 與 <span style="color:#00ffcc; font-weight:bold;">1 瓶黑水鍍膜</span>`;
    }
    
    await db.inventory_items.delete(id);
    logMessage(`出售 ${item.name}，獲得 <span style="color:var(--zaco-color)">+${val} ZaCo</span>${extraMsg}`, 'zaco');
    updateUI(); renderInventory();
}

async function toggleLock(event, id) {
    event.stopPropagation(); const item = await db.inventory_items.get(id); if (!item) return;
    await db.inventory_items.update(id, { is_locked: item.is_locked ? 0 : 1 }); renderInventory();
}

let pendingEquipId = null;

async function showCompare(id) {
    const item = await db.inventory_items.get(id); if (!item) return;
    const currentEquip = gameState.equipped[item.slot];
    
    const buildStatsHTML = (eqItem, title) => {
        if(!eqItem) return `<div style="border:1px dashed #555; padding:8px;"><div style="color:#888; margin-bottom:5px;">[${title}]</div><span style="color:#555;">(無裝備)</span></div>`;
        
        let lvlMult = 1 + (eqItem.level || 0) * 0.1;
        let lvlStr = eqItem.level ? ` <span style="color:#00ffcc; font-weight:bold;">+${eqItem.level}</span>` : "";

        const getStatDiv = (label, baseVal, isPct = false) => {
            if (!baseVal) return '';
            let total = Math.floor(baseVal * lvlMult);
            let bonus = total - baseVal;
            let pct = isPct ? "%" : "";
            let bonusStr = bonus > 0 ? ` <span style="color:#00ffcc; font-weight:bold;">(+${bonus}${pct})</span>` : "";
            return `<div>${label}: ${baseVal}${pct}${bonusStr}</div>`;
        };

        let setHtml = "";
        
        if (eqItem.slot !== 'core' && eqItem.setId && gameConfig.loot_pool.sets[eqItem.setId]) {
            const s = gameConfig.loot_pool.sets[eqItem.setId];
            setHtml += `<div style="margin-top:6px; padding-top:4px; border-top:1px dotted #444; font-size:0.75rem; color:#00ff66;">
                <div>[2PC] ${s['2pc']}</div>
                <div>[3PC] ${s['3pc']}</div>
            </div>`;
        }

                let descText = eqItem.desc || eqItem.effect;
        if (!descText && (eqItem.slot === 'core' || eqItem.rarity === 'epic')) {
            const dictKey = Object.keys(EXOTIC_CORE_DATABASE).find(k => EXOTIC_CORE_DATABASE[k].name === eqItem.name || EXOTIC_CORE_DATABASE[k].resonance === eqItem.resonance);
            if (dictKey && EXOTIC_CORE_DATABASE[dictKey]) descText = EXOTIC_CORE_DATABASE[dictKey].desc;
        }
        if (descText) {

            let isCore = eqItem.slot === 'core' || eqItem.rarity === 'epic';
            let borderColor = isCore ? '#c355ff' : '#00ffcc';
            let textColor = isCore ? '#e09eff' : '#ddd';
            let descTitle = isCore ? '⚡ 核心共鳴' : '💡 裝備說明';
            setHtml += `<div style="margin-top:6px; padding:6px; background:rgba(0,0,0,0.3); border-left:3px solid ${borderColor}; font-size:0.8rem; color:${textColor}; line-height: 1.3; text-shadow:${isCore ? '0 0 5px rgba(195,85,255,0.4)' : 'none'};">
                <b style="color:${borderColor};">${descTitle}：</b><br>${descText}
            </div>`;
        }

                let extraNameStyle = (eqItem.slot === 'core' || eqItem.rarity === 'epic') ? 'color:#c355ff !important; text-shadow: 0 0 6px rgba(195,85,255,0.6); font-weight:bold;' : '';


        return `<div style="border:1px dashed ${eqItem.is_equipped ? 'var(--text-color)' : 'var(--primary-color)'}; padding:8px;">
            <div style="color:#888; margin-bottom:5px;">[${title}]</div>
            <div class="${eqItem.class}" style="margin-bottom:5px; font-weight:bold; ${extraNameStyle}">${eqItem.name}${lvlStr}</div>
            ${getStatDiv('ATK', eqItem.atk)} 
            ${getStatDiv('HP', eqItem.maxHp)}
            ${getStatDiv('DEF', eqItem.def)} 
            ${getStatDiv('CRIT', eqItem.crit, true)}
            ${getStatDiv('DODGE', eqItem.dodge, true)}
            ${setHtml}
        </div>`;
    };

    document.getElementById('compare-content').innerHTML = buildStatsHTML(currentEquip, "當前著裝") + buildStatsHTML(item, "準備換上");
    pendingEquipId = id; 
    document.getElementById('compare-backdrop').style.display = 'block'; 
    document.getElementById('compare-modal').style.display = 'block';
}
window.showCompare = showCompare;



function closeCompare() { pendingEquipId = null; document.getElementById('compare-backdrop').style.display = 'none'; document.getElementById('compare-modal').style.display = 'none'; }
async function confirmEquip() { if(pendingEquipId) await equipItem(pendingEquipId); closeCompare(); }

// 🚀 新增：背包當前分頁狀態與模組化切換函式
let currentInvTab = 'all';

function switchInvSubTab(tabId, btnEl) {
    if (typeof currentInvTab !== 'undefined') currentInvTab = tabId;
    window.currentInvTab = tabId;
    window.currentInvSubTab = tabId;

    if (!btnEl && window.event) {
        btnEl = window.event.currentTarget || window.event.target;
    }

    document.querySelectorAll('#inv-subtabs .btn-inv-filter').forEach(btn => {
        btn.classList.remove('active', 'active-subtab');
        btn.style.color = '';
    });

    if (btnEl) {
        btnEl.classList.add('active', 'active-subtab');
    }

    if (typeof renderInventory === 'function') {
        renderInventory();
    }
}
window.switchInvSubTab = switchInvSubTab;
window.switchInvTab = switchInvSubTab;




async function renderInventory() {
    const list = document.getElementById('inventory-list');
    let items = await db.inventory_items.where("is_equipped").equals(0).toArray();
    
    // 🚀 微創植入：擴充 'core' 過濾模組
    const tabFilters = {
        'all': () => true,
        'head': i => i.slot === 'head' || i.slot === 'helmet' || i.slotText === '頭盔',
        'neck': i => i.slot === 'neck' || i.slot === 'collar' || i.slotText === '項圈',
        'body': i => i.slot === 'body' || i.slot === 'harness' || i.slot === 'chest' || i.slotText === '胸背帶',
        'core': i => i.slot === 'core' || i.slotText === '核心' // 🟢 讓核心裝備能正確顯示
    };
    
    if (tabFilters[currentInvTab]) {
        items = items.filter(tabFilters[currentInvTab]);
    }

    const searchEl = document.getElementById('inv-search');
    if(searchEl && searchEl.value) {
        const searchQ = searchEl.value.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(searchQ));
    }
    
    const sortEl = document.getElementById('inv-sort');
    if(sortEl) {
        const sortQ = sortEl.value;
        // 🟢 修復：補上 epic (史詩紫裝) 的排序權重，防止排序引擎當機
        const rWeights = { common: 1, rare: 2, set: 3, epic: 4, legendary: 5, apocalyptic: 6 };
        items.sort((a, b) => {
            if(sortQ === 'rarity-desc') return rWeights[b.rarity] - rWeights[a.rarity];
            if(sortQ === 'rarity-asc') return rWeights[a.rarity] - rWeights[b.rarity];
            if(sortQ === 'atk-desc') return (b.atk||0) - (a.atk||0);
            if(sortQ === 'hp-desc') return (b.maxHp||0) - (a.maxHp||0);
            return 0;
        });
    }

    if (items.length === 0) { list.innerHTML = "<span style='color:#777;'>[數據空載 / 無符合條件的裝備]</span>"; return; }
    list.innerHTML = "";
    
    items.forEach((item) => {
        const el = document.createElement('div'); el.className = 'inv-item';
        // 🟢 補上 epic 級別裝備的出售價格
        let price = 1; if(item.rarity==='rare') price=5; if(item.rarity==='set') price=80; if(item.rarity==='epic') price=250; if(item.rarity==='legendary') price=25; if(item.rarity==='apocalyptic') price=150;
        
        let lvlMult = 1 + (item.level || 0) * 0.1;
        let lvlStr = item.level ? ` <span style="color:#00ffcc; font-weight:bold;">+${item.level}</span>` : "";
        
        let descArr = []; 
        const pushStat = (label, baseVal, isPct = false) => {
            let total = Math.floor(baseVal * lvlMult);
            let bonus = total - baseVal;
            let pct = isPct ? "%" : "";
            let bonusStr = bonus > 0 ? `<span style="color:#00ffcc;">(+${bonus}${pct})</span>` : "";
            descArr.push(`${label} +${baseVal}${pct}${bonusStr}`);
        };

        if (item.atk) pushStat('ATK', item.atk); 
        if (item.maxHp) pushStat('HP', item.maxHp); 
        if (item.def) pushStat('DEF', item.def); 
        if (item.crit) pushStat('暴擊', item.crit, true); 
        if (item.dodge) pushStat('閃避', item.dodge, true); 
        
        if (item.setId && gameConfig.loot_pool.sets[item.setId]) {
             descArr.push(`套裝: ${gameConfig.loot_pool.sets[item.setId].name}`);
        }
        // 🟢 顯示這顆核心是否自帶流派共鳴
        if (item.resonance) {
             descArr.push(`<span style="color:#c355ff;">[流派共鳴: 啟動]</span>`);
        }
        
                const isEpic = item.slot === 'core' || item.rarity === 'epic';
        const nameStyle = isEpic ? 'color: #c355ff !important; text-shadow: 0 0 6px rgba(195,85,255,0.6); font-weight: bold;' : '';
        const lockIcon = item.is_locked ? "🔒" : "🔓"; const lockColor = item.is_locked ? "var(--primary-color)" : "#555";
        el.innerHTML = `
            <div class="inv-info" onclick="showCompare(${item.id})">
                <span class="${item.class}" style="${nameStyle}">${item.name}${lvlStr}</span><br>

                <span style="color:#888; font-size:0.75rem;">[${item.slotText}] ${descArr.length > 0 ? descArr.join(" | ") : "無附加"}</span>
            </div>
            <div style="display:flex; gap:5px; align-items: flex-start;">
                <button class="btn" style="width: auto; padding: 5px; margin: 0; border-color: ${lockColor}; color: ${lockColor};" onclick="toggleLock(event, ${item.id})">${lockIcon}</button>
                <button class="btn" style="width: auto; padding: 5px 10px; margin: 0; border-color: var(--zaco-color); color: var(--zaco-color);" onclick="sellItem(event, ${item.id})" ${item.is_locked ? 'disabled' : ''}>出售 ($${price})</button>
            </div>`;
        list.appendChild(el);
    });
}


async function buyShopItem(index) {
    const item = gameConfig.shop_database[index];
    if (gameState.resources.zaco >= item.price) {
        gameState.resources.zaco -= item.price;
        
        if (item.slot === 'usable' && item.id === 'shop_jerky_bulk') {
            let maxFoodCap = getMaxFood();
            // 防呆：受限於中央控制室當前動態上限
            if (gameState.resources.food >= maxFoodCap) {
                logMessage(`[交易失敗] 肉乾儲存槽已滿，黑市商人拒絕將補給包塞進你的背包。`, 'system');
                gameState.resources.zaco += item.price; // 退回剛剛扣除的 ZaCo
                updateUI();
                return;
            }
            
            // 加上 200 份，但受限於當前動態上限
            gameState.resources.food = Math.min(gameState.resources.food + 200, maxFoodCap);
            logMessage(`地下交易完成: 拆開 <span class="${item.class}">${item.name}</span>，物資入庫。(當前: ${gameState.resources.food}/${maxFoodCap})`, 'zaco');
        } else {
            // 🚀 關鍵修復：處理「裝備類」商品的物流配送邏輯
            try {
                // 將裝備正式寫入 IndexedDB 背包資料庫
                await db.inventory_items.add({
                    slot: item.slot,
                    slotText: item.slotText || (item.slot === 'helmet' ? '頭盔' : (item.slot === 'collar' ? '項圈' : '胸背帶')), // 防呆轉換
                    rarity: item.rarity || 'common',
                    class: item.class || 'loot-common',
                    atk: item.atk || 0,
                    maxHp: item.maxHp || 0,
                    def: item.def || 0,
                    dodge: item.dodge || 0,
                    crit: item.crit || 0,
                    setId: item.setId || null,
                    is_equipped: 0, // 剛買來的裝備預設放在背包
                    is_locked: 0,   // 預設未鎖定
                    name: item.name,
                    level: 0
                });
                logMessage(`地下交易完成: <span class="${item.class}">${item.name}</span> 已由無人機空投至您的背包。`, 'zaco');
            } catch (err) {
                // 防呆機制：萬一資料庫卡死寫入失敗，立即啟動退款程序，避免吃錢
                logMessage(`[物流中斷] 裝備配送失敗，已啟動 ZaCo 幣退款程序。`, 'warning');
                gameState.resources.zaco += item.price; 
            }
        }

        updateUI(); 
        savePlayerState();
    } else { 
        logMessage(`[ZACO_ERROR] 帳戶餘額不足以支付黑市交易。`, 'system'); 
    }
}

function renderShop() {
    const list = document.getElementById('shop-list'); list.innerHTML = "";
    gameConfig.shop_database.forEach((item, index) => {
        const el = document.createElement('div'); el.className = 'inv-item';
        let desc = item.desc ? item.desc : (item.atk > 0 ? `加成: ATK +${item.atk}` : `加成: HP +${item.maxHp}`);
        el.innerHTML = `<div class="inv-info"><span class="${item.class}">${item.name}</span><br><span style="color:#888; font-size:0.75rem;">${desc}</span></div><button class="btn" style="width: auto; padding: 6px 12px; margin: 0; border-color: var(--zaco-color); color: var(--zaco-color); font-weight:bold;" onclick="buyShopItem(${index})">購入 ($${item.price})</button>`;
        list.appendChild(el);
    });
}

// ====== 一鍵批量拆解 ======
async function bulkSellItems() {
    const rarity = document.getElementById('bulk-sell-rarity').value;
    // 撈出背包裡所有的裝備
    const allItems = await db.inventory_items.toArray();
    
    // 核心過濾器：只挑選「品質相符」且「未裝備」且「未鎖定」的裝備
    const itemsToSell = allItems.filter(item => 
        item.rarity === rarity && 
        !item.is_equipped && 
        !item.is_locked
    );

    if (itemsToSell.length === 0) {
        logMessage(`>> [系統提示] 找不到可拆解的未鎖定 ${rarity} 級裝備！`, "system");
        return;
    }

    const idsToDelete = [];
    let totalZaco = 0; // 改為計算 ZaCo
    
    itemsToSell.forEach(item => {
        idsToDelete.push(item.id);
        // 依照品質給予不同數量的 ZaCo (對齊單件出售價格)
        if (item.rarity === 'common') totalZaco += 1;
        else if (item.rarity === 'rare') totalZaco += 5;
        else if (item.rarity === 'set') totalZaco += 80;
        else if (item.rarity === 'legendary') totalZaco += 25;
        else if (item.rarity === 'apocalyptic') totalZaco += 150;
        else totalZaco += 1;
    });

    // 透過 Dexie.js 的 bulkDelete 一次性刪除，效能最高
    await db.inventory_items.bulkDelete(idsToDelete);
    
    // 發放 ZaCo 並更新介面
    gameState.resources.zaco += totalZaco;
    savePlayerState();
    updateUI();
    renderInventory();
    
    logMessage(`>> [批量拆解] 成功銷毀 ${itemsToSell.length} 件武裝，黑市帳戶進帳 ${totalZaco} 枚 ZaCo。`, "zaco");
}


// ==========================================
// 🔨 黑市與鐵匠鋪子分頁切換邏輯
// ==========================================
function switchShopSubTab(subView, btnEl) {
    // 1. 隱藏兩個子面板
    const tradeView = document.getElementById('shop-trade-view');
    const forgeView = document.getElementById('shop-forge-view');
    if (tradeView) tradeView.style.display = 'none';
    if (forgeView) forgeView.style.display = 'none';
    
    // 2. 移除按鈕亮燈
    document.querySelectorAll('.shop-subtab').forEach(btn => {
        btn.classList.remove('active-subtab');
        btn.style.backgroundColor = 'transparent';
    });
    
    // 3. 顯示目標面板與亮燈
    if (subView === 'trade' && tradeView) tradeView.style.display = 'block';
    if (subView === 'forge' && forgeView) {
        forgeView.style.display = 'block';
        if (typeof renderForge === "function") renderForge(); // 預留：往後切換時自動渲染鐵匠鋪
    }
    
    if (btnEl) {
        btnEl.classList.add('active-subtab');
        btnEl.style.backgroundColor = 'rgba(255, 153, 0, 0.15)'; // 繼承 CyberCode 橘色微光
    }
}

// ==========================================
// 🔨 黑市鐵匠鋪與 +1～+9 強化核心引擎
// ==========================================

// 強化機率與材料平衡表
const FORGE_DATA = {
    1: { rate: 100, metal: 1,  zaco: 50 },
    2: { rate: 85,  metal: 2,  zaco: 100 },
    3: { rate: 70,  metal: 3,  zaco: 200 },
    4: { rate: 50,  metal: 5,  zaco: 400 },
    5: { rate: 35,  metal: 8,  zaco: 800 },
    6: { rate: 20,  metal: 12, zaco: 1500 },
    7: { rate: 10,  metal: 18, zaco: 3000 },
    8: { rate: 5,   metal: 25, zaco: 5000 },
    9: { rate: 1,   metal: 40, zaco: 10000 }
};

// 1. 提煉生物金屬 (500廢料 = 1生物金屬)
function refineBioMetal(times = 1) {
    let cost = times * 500;
    if (gameState.resources.scrap < cost) {
        logMessage(">> [警告] 廢料不足！提煉 1 個生物金屬需要 500 廢料。", "zaco");
        return;
    }
    gameState.resources.scrap -= cost;
    gameState.resources.biometal = (gameState.resources.biometal || 0) + times;
    savePlayerState(); updateUI(); renderForge();
    logMessage(`>> [煉金成功] 消耗 ${cost} 廢料，提煉出 <span style="color:#00ffcc; font-weight:bold;">${times} 個生物金屬</span>！`, "system");
}

// ==========================================
// 🔨 鐵匠鋪子欄位狀態與切換控制
// ==========================================
let currentForgeTab = 'equipped'; // 預設顯示「身上裝備」

function switchForgeTab(tab) {
    currentForgeTab = tab;
    if (typeof renderForge === "function") renderForge();
}

// 2. 渲染鐵匠鋪介面 (已優化：新增 4 大部位子欄位過濾)
async function renderForge() {
    const container = document.getElementById('forge-container');
    if (!container) return;

    let bmCount = gameState.resources.biometal || 0;
    let ctCount = gameState.resources.coating || 0;

    // 建立子分頁按鈕的樣式生成器 (繼承 CyberCode 螢光綠/暗色微光風格)
    const getBtnStyle = (tabName) => {
        const isActive = currentForgeTab === tabName;
        return `flex:1; min-width: 45%; padding: 6px 4px; margin: 0; font-size: 0.8rem; border-color: ${isActive ? '#00ffcc' : '#444'}; color: ${isActive ? '#00ffcc' : '#888'}; background: ${isActive ? 'rgba(0, 255, 204, 0.15)' : 'transparent'};`;
    };

    // 頂部煉金爐、素材狀態 與 ✨部位過濾切換按鈕
    let html = `
    <div style="background:#111; border:1px solid var(--zaco-color); padding:10px; margin-bottom:15px; border-radius:4px; text-align:left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
            <span>🧬 生物金屬：<strong style="color:#00ffcc;">${bmCount}</strong></span>
            <span>🧪 黑水鍍膜：<strong style="color:#00ffcc;">${ctCount}</strong></span>
        </div>
        <div style="display:flex; gap:8px;">
            <button class="btn" style="flex:1; border-color:#00ffcc; color:#00ffcc; padding:6px; margin:0; font-size:0.8rem;" onclick="refineBioMetal(1)">提煉 x1 (-500廢料)</button>
            <button class="btn" style="flex:1; border-color:#00ffcc; color:#00ffcc; padding:6px; margin:0; font-size:0.8rem;" onclick="refineBioMetal(10)">提煉 x10 (-5000廢料)</button>
        </div>
    </div>
    
    <h4 style="color:var(--text-color); text-align:left; margin-bottom:8px; border-bottom:1px dashed #444; padding-bottom:5px;">// 裝備強化控制台 (選擇裝備部位)</h4>
    
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
        <button class="btn" style="${getBtnStyle('equipped')}" onclick="switchForgeTab('equipped')">🛡️ 身上裝備</button>
        <button class="btn" style="${getBtnStyle('helmet')}" onclick="switchForgeTab('helmet')">⛑️ 頭盔</button>
        <button class="btn" style="${getBtnStyle('collar')}" onclick="switchForgeTab('collar')">🔗 項圈</button>
        <button class="btn" style="${getBtnStyle('harness')}" onclick="switchForgeTab('harness')">🦺 胸背帶</button>
    </div>

    <div class="inv-list" style="text-align:left;">`;

    // 讀取所有裝備並依據 currentForgeTab 進行精準過濾
    let allItems = await db.inventory_items.toArray();
    let filteredItems = allItems.filter(item => {
        if (currentForgeTab === 'equipped') return item.is_equipped === 1;
        // 點選其他部位時：只列出背包中未穿戴 (is_equipped === 0) 且符合該部位的武裝，畫面最乾淨！
        return item.is_equipped === 0 && item.slot === currentForgeTab;
    });

    // 若當前分類無任何裝備的提示語
    if (filteredItems.length === 0) {
        let emptyMsg = currentForgeTab === 'equipped' ? "獵犬身上目前無穿戴任何裝備" : "背包中目前無此部位的備用武裝";
        container.innerHTML = html + `<p style="color:#777; text-align:center; padding:20px 0;">[ ${emptyMsg} ]</p></div>`;
        return;
    }

    filteredItems.forEach(item => {
        let curLvl = item.level || 0;
        let nextLvl = curLvl + 1;
        let isMax = curLvl >= 9;
        let data = FORGE_DATA[nextLvl];
        let lvlStr = curLvl > 0 ? ` <strong style="color:#00ffcc;">+${curLvl}</strong>` : "";
        let eqTag = item.is_equipped ? ` <span style="color:var(--zaco-color); font-size:0.75rem;">[穿戴中]</span>` : "";

        html += `
        <div style="border:1px solid #333; background:rgba(0,0,0,0.6); padding:10px; margin-bottom:8px; border-radius:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="${item.class}" style="font-weight:bold; font-size:0.95rem;">[${item.slotText}] ${item.name}${lvlStr}${eqTag}</span>
                <span style="font-size:0.8rem; color:${isMax ? '#00ffcc' : '#aaa'};">${isMax ? 'MAX TOP' : `下一階: +${nextLvl} (+${nextLvl*10}%)`}</span>
            </div>`;

        if (!isMax) {
            let canUpgrade = (bmCount >= data.metal) && (gameState.resources.zaco >= data.zaco);
            let hasCoating = ctCount > 0;
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; background:#0a0a0a; padding:6px; border-radius:3px; margin-bottom:8px;">
                <span>消耗: <strong style="color:#00ffcc;">${data.metal} 金屬</strong> + <strong style="color:var(--zaco-color);">${data.zaco} ZaCo</strong></span>
                <span>成功率: <strong style="color:${data.rate <= 20 ? '#ff3333' : '#fff'};">${data.rate}%</strong></span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <label style="font-size:0.8rem; color:#aaa; display:flex; align-items:center; cursor:pointer;">
                    <input type="checkbox" id="coat_${item.id}" ${hasCoating ? '' : 'disabled'} style="margin-right:5px;">
                    使用黑水鍍膜 (+15%機率)
                </label>
                <button class="btn" style="width:auto; padding:5px 15px; margin:0; font-size:0.8rem; border-color:${canUpgrade ? '#00ffcc' : '#555'}; color:${canUpgrade ? '#00ffcc' : '#555'};" onclick="enhanceItem(${item.id})">確認強化</button>
            </div>`;
        } else {
            html += `<div style="text-align:center; color:#00ffcc; font-size:0.8rem; padding:4px;">[ 頂級武裝！已達極限強化階級 ]</div>`;
        }
        html += `</div>`;
    });

    container.innerHTML = html + `</div>`;
}

// 3. 執行裝備強化 (+1 ~ +9)
async function enhanceItem(id) {
    const item = await db.inventory_items.get(id);
    if (!item) return;

    let curLvl = item.level || 0;
    if (curLvl >= 9) return;
    let nextLvl = curLvl + 1;
    let data = FORGE_DATA[nextLvl];

    let useCoating = false;
    let coatCheckbox = document.getElementById(`coat_${id}`);
    if (coatCheckbox && coatCheckbox.checked) useCoating = true;

    // 檢查素材
    if ((gameState.resources.biometal || 0) < data.metal || gameState.resources.zaco < data.zaco) {
        logMessage(">> [強化失敗] 生物金屬或 ZaCo 資金不足！", "zaco");
        return;
    }
    if (useCoating && (gameState.resources.coating || 0) < 1) {
        logMessage(">> [強化失敗] 黑水鍍膜數量不足！", "zaco");
        return;
    }

    // 扣除消耗
    gameState.resources.biometal -= data.metal;
    gameState.resources.zaco -= data.zaco;
    if (useCoating) gameState.resources.coating -= 1;

        // 🚀 微創修復：強制轉型純數字防 Bug，並將最終機率印出，打破測試員的幻象！
    let baseRate = Number(data.rate) || 0;
    let finalRate = baseRate + (useCoating ? 15 : 0);
    if (finalRate > 100) finalRate = 100;

    let roll = Math.random() * 100;
    let rateLog = `[骰子機率: ${finalRate}%]`; // 將加成後的真實機率寫入戰報

    if (roll <= finalRate) {
        // 強化成功
        await db.inventory_items.update(id, { level: nextLvl });
        logMessage(`>> ⚡ 強化成功 ${rateLog} <span class="${item.class}">${item.name}</span> 升級至 <strong style="color:#00ffcc;">+${nextLvl}</strong>！基礎屬性提升 ${nextLvl*10}%！`, "system");
    } else {
        // 強化失敗 (不損毀、不降級)
        logMessage(`>> 💥 強化失敗 ${rateLog} <span class="${item.class}">${item.name}</span> 維持原階級，素材已消耗。`, "zaco");
    }


    // 若強化的是身上穿戴的裝備，立即刷新獵犬戰力
    if (item.is_equipped) {
        const equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
        gameState.equipped = { helmet: null, collar: null, harness: null };
        equippedItems.forEach(i => { gameState.equipped[i.slot] = i; });
        calculateHoundStats();
    }

    savePlayerState();
    updateUI();
    renderForge();
    if (typeof renderInventory === "function" && document.getElementById('tab-inv').classList.contains('active')) {
        renderInventory();
    }
}
