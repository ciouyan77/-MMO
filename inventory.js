// 計算能力值 (包含 +1~+9 強化倍率與套裝遞減效應)
function calculateHoundStats() {
    let bAtk = 0, bHp = 0, bDef = 0, bDodge = 0, bCrit = 0, ohko = 0;
    let setCounts = {};

    Object.values(gameState.equipped).forEach(item => {
        if (!item) return;
        // 🚀 微創手術：實裝 +1~+9 強化屬性成長 (每階提升 10%)
        let lvlMult = 1 + (item.level || 0) * 0.1;
        
        if (item.atk) bAtk += Math.floor(item.atk * lvlMult);
        if (item.maxHp) bHp += Math.floor(item.maxHp * lvlMult);
        if (item.def) bDef += Math.floor(item.def * lvlMult);
        if (item.dodge) bDodge += Math.floor(item.dodge * lvlMult);
        if (item.crit) bCrit += Math.floor(item.crit * lvlMult);
        if (item.setId) setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
    });

    let activeText = []; 
    gameState.hound.activeSets = []; 
    let atkMultiplier = 1; 

    for (const [setId, count] of Object.entries(setCounts)) {
        let setName = gameConfig.loot_pool.sets[setId] ? gameConfig.loot_pool.sets[setId].name : setId;

        if (count >= 2) {
            gameState.hound.activeSets.push(`${setId}_2pc`);
            if (setId === 'scavenger') { bAtk += 30; activeText.push(`[${setName}] 2件套: 攻擊力 +30`); }
            if (setId === 'ninja') { bDodge += 30; activeText.push(`[${setName}] 2件套: 閃避率 +30% | 閃避後必爆`); }
            if (setId === 'thug') { bCrit += 30; activeText.push(`[${setName}] 2件套: 暴擊率 +30% | 暴傷 3 倍`); }
            if (setId === 'zombie') { ohko += 12; activeText.push(`[${setName}] 2件套: 秒殺機率 +12%`); }
            if (setId === 'abyss') { bDef += 30; activeText.push(`[${setName}] 2件套: 防禦力 +30 | 反彈 50% 傷害`); }
        }
        
        if (count >= 3) {
            gameState.hound.activeSets.push(`${setId}_3pc`);
            if (setId === 'scavenger') { bAtk += 15; activeText.push(`[${setName}] 3件套: 攻擊力再 +15 (總和+45)`); }
            if (setId === 'ninja') { bDodge += 10; activeText.push(`[${setName}] 3件套: 閃避率再 +10% (總和+40%)`); }
            if (setId === 'thug') { bCrit += 15; activeText.push(`[${setName}] 3件套: 暴擊率再 +15% (總和+45%)`); }
            if (setId === 'zombie') { ohko += 5; activeText.push(`[${setName}] 3件套: 秒殺機率再 +5% (總和+17%)`); }
            if (setId === 'abyss') { bDef += 15; activeText.push(`[${setName}] 3件套: 防禦力再 +15 (總和+45)`); }
        }
    }

    gameState.hound.totalAtk = Math.floor((gameState.hound.baseAtk + bAtk) * atkMultiplier);
    gameState.hound.maxHp = 100 + bHp; 
    gameState.hound.totalDef = gameState.hound.baseDef + bDef;
    gameState.hound.totalDodge = gameState.hound.baseDodge + bDodge; 
    gameState.hound.totalCrit = gameState.hound.baseCrit + bCrit;
    gameState.hound.ohko = ohko;
    
    if (gameState.hound.hp > gameState.hound.maxHp) gameState.hound.hp = gameState.hound.maxHp;
    
    const setText = document.getElementById('set-bonus-text');
    if (setText) setText.innerHTML = activeText.length > 0 ? activeText.join("<br>") : "<span style='color:#777;'>[未啟動任何套裝效果]</span>";
}

async function generateLoot(isBossDrop = false) {
    const r = Math.floor(Math.random() * 1000000);
    let rarity = "common", rarityText = "普通", rarityClass = "loot-common", statMult = 1; let isSet = false;
    
    if (isBossDrop) {
        // 霸主保底機制：95% 傳奇(金)，5% 滅世(紅)
        if (Math.random() * 100 < 5) { rarity = "apocalyptic"; rarityText = "滅世"; rarityClass = "loot-apocalyptic"; statMult = 5; }
        else { rarity = "legendary"; rarityText = "傳奇"; rarityClass = "loot-legendary"; statMult = 3; }
    } else {
        // 長線掉落率 (假設 1 小時約 720 次擊殺): 
        // 紅裝~4小時 (機率約 340/1M)
        if (gameState.currentArea !== "wasteland" && r > 999660) { 
            rarity = "apocalyptic"; rarityText = "滅世"; rarityClass = "loot-apocalyptic"; statMult = 5;
        } 
        // 金裝~0.5小時 (機率約 2700/1M)
        else if (r > 997300) { rarity = "legendary"; rarityText = "傳奇"; rarityClass = "loot-legendary"; statMult = 3; } 
        // 🚀 強化 1：綠裝(套裝)倍率由 2 提升至 2.4，完美界於稀有(1.8)與傳奇(3)正中間！
        else if (r > 988500) { rarity = "set"; rarityText = "套裝"; rarityClass = "loot-set"; statMult = 2.4; isSet = true; } 
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
        if (slot === 'collar') item.atk = Math.floor((Math.random() * 4 + 3) * statMult); else if (slot === 'harness') item.maxHp = Math.floor((Math.random() * 15 + 20) * statMult); else if (slot === 'helmet') item.def = Math.floor((Math.random() * 3 + 2) * statMult);
        if (affix.type === 'atk') item.atk += Math.floor(3 * statMult); if (affix.type === 'hp') item.maxHp += Math.floor(15 * statMult); if (affix.type === 'def') item.def += Math.floor(3 * statMult); if (affix.type === 'crit') item.crit += Math.floor(3 * statMult); if (affix.type === 'dodge') item.dodge += Math.floor(3 * statMult);
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
    gameState.equipped = { helmet: null, collar: null, harness: null };
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

        // 🚀 微創手術：新增數值分離顯示 DIV 輔助函數
        const getStatDiv = (label, baseVal, isPct = false) => {
            if (!baseVal) return '';
            let total = Math.floor(baseVal * lvlMult);
            let bonus = total - baseVal;
            let pct = isPct ? "%" : "";
            let bonusStr = bonus > 0 ? ` <span style="color:#00ffcc; font-weight:bold;">(+${bonus}${pct})</span>` : "";
            return `<div>${label}: ${baseVal}${pct}${bonusStr}</div>`;
        };

        let setHtml = "";
        if (eqItem.setId && gameConfig.loot_pool.sets[eqItem.setId]) {
            const s = gameConfig.loot_pool.sets[eqItem.setId];
            setHtml = `<div style="margin-top:6px; padding-top:4px; border-top:1px dotted #444; font-size:0.75rem; color:#00ff66;">
                <div>[2PC] ${s['2pc']}</div>
                <div>[3PC] ${s['3pc']}</div>
            </div>`;
        }

        return `<div style="border:1px dashed ${eqItem.is_equipped ? 'var(--text-color)' : 'var(--primary-color)'}; padding:8px;">
            <div style="color:#888; margin-bottom:5px;">[${title}]</div>
            <div class="${eqItem.class}" style="margin-bottom:5px; font-weight:bold;">${eqItem.name}${lvlStr}</div>
            ${getStatDiv('ATK', eqItem.atk)} 
            ${getStatDiv('HP', eqItem.maxHp)}
            ${getStatDiv('DEF', eqItem.def)} 
            ${getStatDiv('CRIT', eqItem.crit, true)}
            ${getStatDiv('DODGE', eqItem.dodge, true)}
            ${setHtml}
        </div>`;
    };
document.getElementById('compare-content').innerHTML = buildStatsHTML(currentEquip, "當前著裝") + buildStatsHTML(item, "準備換上");
    pendingEquipId = id; document.getElementById('compare-backdrop').style.display = 'block'; document.getElementById('compare-modal').style.display = 'block';
}

function closeCompare() { pendingEquipId = null; document.getElementById('compare-backdrop').style.display = 'none'; document.getElementById('compare-modal').style.display = 'none'; }
async function confirmEquip() { if(pendingEquipId) await equipItem(pendingEquipId); closeCompare(); }

// 🚀 新增：背包當前分頁狀態與模組化切換函式
let currentInvTab = 'all';

function switchInvTab(tabId, btnEl) {
    currentInvTab = tabId;
    // 1. 移除所有按鈕的高亮發光狀態
    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.style.borderColor = '#555';
        btn.style.color = '#888';
        btn.classList.remove('active-subtab');
    });
    // 2. 點亮玩家當前點選的按鈕 (繼承 Cyberpunk 主題色)
    btnEl.style.borderColor = 'var(--text-color, #ffffff)';
    btnEl.style.color = 'var(--text-color, #ffffff)';
    btnEl.classList.add('active-subtab');
    
    // 3. 重新渲染列表
    renderInventory();
}


async function renderInventory() {
    const list = document.getElementById('inventory-list');
    let items = await db.inventory_items.where("is_equipped").equals(0).toArray();
    
    // 🚀 微創植入：模組化擴充過濾模組 (Extensible Filter Map)
    // 為了做到絕對防錯，我們同時比對英文 slot 與中文 slotText，確保零幻覺命中！
    // 未來擴充新功能時，只需在這裡多加一行，例如： 'doc': i => i.type === 'lore'
    const tabFilters = {
        'all': () => true,
        'head': i => i.slot === 'head' || i.slotText === '頭盔',
        'neck': i => i.slot === 'neck' || i.slot === 'collar' || i.slotText === '項圈',
        'body': i => i.slot === 'body' || i.slot === 'harness' || i.slot === 'chest' || i.slotText === '胸背帶'
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
        const rWeights = { common: 1, rare: 2, set: 3, legendary: 4, apocalyptic: 5 };
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
        let price = 1; if(item.rarity==='rare') price=5; if(item.rarity==='set') price=80; if(item.rarity==='legendary') price=25; if(item.rarity==='apocalyptic') price=150;
        
        let lvlMult = 1 + (item.level || 0) * 0.1;
        let lvlStr = item.level ? ` <span style="color:#00ffcc; font-weight:bold;">+${item.level}</span>` : "";
        
        let descArr = []; 
        // 🚀 微創手術：新增數值分離顯示輔助函數
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
        
        const lockIcon = item.is_locked ? "🔒" : "🔓"; const lockColor = item.is_locked ? "var(--primary-color)" : "#555";
        el.innerHTML = `
            <div class="inv-info" onclick="showCompare(${item.id})">
                <span class="${item.class}">${item.name}${lvlStr}</span><br>
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

    // 計算機率 (加上鍍膜 15%，最高 100%)
    let finalRate = data.rate + (useCoating ? 15 : 0);
    if (finalRate > 100) finalRate = 100;

    let roll = Math.random() * 100;
    if (roll <= finalRate) {
        // 強化成功
        await db.inventory_items.update(id, { level: nextLvl });
        logMessage(`>> ⚡ [強化成功！] <span class="${item.class}">${item.name}</span> 升級至 <strong style="color:#00ffcc;">+${nextLvl}</strong>！基礎屬性提升 ${nextLvl*10}%！`, "system");
    } else {
        // 強化失敗 (不損毀、不降級)
        logMessage(`>> 💥 [強化失敗] <span class="${item.class}">${item.name}</span> 強化 +${nextLvl} 失敗！裝備維持原階級，素材已消耗。`, "zaco");
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
