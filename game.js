// 全域記憶體快照
let gameConfig = null;
let gameState = {
    resources: { scrap: 0, food: 10, zaco: 0 },
    upgrades: { drones: 0 }, costs: { drone: 10 }, autoRates: { scrap: 0 },
    isExploring: false,currentArea: "wasteland",
    hound: { 
        hp: 100, maxHp: 100, baseAtk: 12, totalAtk: 12, 
        baseDef: 0, totalDef: 0, 
        baseDodge: 5, totalDodge: 5, 
        baseCrit: 10, totalCrit: 10, 
        ohko: 0, activeSets: [] 
    },
    equipped: { helmet: null, collar: null, harness: null },
    currentEnemy: null,
    autoSell: { common: false, rare: false }
};

// 啟動初始化
window.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('./config.json');
        gameConfig = await response.json();
        await loadGameData();
        initGameLoops();
		renderDungeonList();
    } catch (e) { console.error("系統初始化失敗:", e); }
});

// 資料庫載入
async function loadGameData() {
    let savedState = await db.player_state.get(1);
    if (!savedState) {
        savedState = { id: 1, resources: { scrap: 0, food: 10, zaco: 0 }, upgrades: { drones: 0 }, costs: { drone: 10 }, autoRates: { scrap: 0 }, hound_hp: 100, autoSell: { common: false, rare: false } };
        await db.player_state.add(savedState);
    }
    gameState.resources = savedState.resources;
    gameState.upgrades = savedState.upgrades;
    gameState.costs = savedState.costs;
    gameState.autoRates = savedState.autoRates;
    gameState.hound.hp = savedState.hound_hp;
    gameState.autoSell = savedState.autoSell || { common: false, rare: false };

    if(document.getElementById('auto-common')) document.getElementById('auto-common').checked = gameState.autoSell.common;
    if(document.getElementById('auto-rare')) document.getElementById('auto-rare').checked = gameState.autoSell.rare;

    const equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
    gameState.equipped = { helmet: null, collar: null, harness: null };
    equippedItems.forEach(item => { gameState.equipped[item.slot] = item; });

    calculateHoundStats(); updateUI();
    logMessage(">> 模組化資料庫鏈結成功。", "system");
}

async function savePlayerState() {
    await db.player_state.put({
        id: 1, resources: gameState.resources, upgrades: gameState.upgrades,
        costs: gameState.costs, autoRates: gameState.autoRates, hound_hp: gameState.hound.hp, autoSell: gameState.autoSell
    });
}

// 計算能力值
function calculateHoundStats() {
    let bAtk = 0, bHp = 0, bDef = 0, bDodge = 0, bCrit = 0, ohko = 0;
    let setCounts = {};

    Object.values(gameState.equipped).forEach(item => {
        if (!item) return;
        if (item.atk) bAtk += item.atk;
        if (item.maxHp) bHp += item.maxHp;
        if (item.def) bDef += item.def;
        if (item.dodge) bDodge += item.dodge;
        if (item.crit) bCrit += item.crit;
        if (item.setId) setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
    });

    let activeText = []; gameState.hound.activeSets = []; let atkMultiplier = 1;
    for (const [setId, count] of Object.entries(setCounts)) {
        if (count >= 2) {
            gameState.hound.activeSets.push(`${setId}_2pc`);
            if (setId === 'scavenger') bAtk += 15; if (setId === 'ninja') bDodge += 10;
            if (setId === 'thug') bCrit += 15; if (setId === 'zombie') ohko += 5; if (setId === 'abyss') bDef += 10;
            activeText.push(`[${gameConfig.loot_pool.sets[setId].name}] 2件套啟動`);
        }
        if (count >= 3) {
            gameState.hound.activeSets.push(`${setId}_3pc`);
            if (setId === 'scavenger') atkMultiplier = 1.3; if (setId === 'zombie') ohko = 15;
            activeText.push(`[${gameConfig.loot_pool.sets[setId].name}] 3件套完美共鳴！`);
        }
    }

    gameState.hound.totalAtk = Math.floor((gameState.hound.baseAtk + bAtk) * atkMultiplier);
    gameState.hound.maxHp = 100 + bHp; gameState.hound.totalDef = gameState.hound.baseDef + bDef;
    gameState.hound.totalDodge = gameState.hound.baseDodge + bDodge; gameState.hound.totalCrit = gameState.hound.baseCrit + bCrit;
    gameState.hound.ohko = ohko;
    if (gameState.hound.hp > gameState.hound.maxHp) gameState.hound.hp = gameState.hound.maxHp;
    
    const setText = document.getElementById('set-bonus-text');
    if (setText) setText.innerHTML = activeText.length > 0 ? activeText.join("<br>") : "<span style='color:#777;'>[未啟動任何套裝效果]</span>";
}

function initGameLoops() {
    setInterval(() => {
        if (gameState.autoRates.scrap > 0) { gameState.resources.scrap += gameState.autoRates.scrap; updateUI(); }
        if (gameState.isExploring) handleExplorationTick();
    }, 1000);
    setInterval(() => { savePlayerState(); }, 10000);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    if(tabId === 'inv') renderInventory(); if(tabId === 'shop') renderShop();
}

function gatherResource(type) { gameState.resources[type]++; updateUI(); savePlayerState(); logMessage(`回收 1 ${type.toUpperCase()}`); }
function buyDrone() {
    if (gameState.resources.scrap >= gameState.costs.drone) {
        gameState.resources.scrap -= gameState.costs.drone; gameState.upgrades.drones++;
        gameState.autoRates.scrap = gameState.upgrades.drones * 1;
        gameState.costs.drone = Math.floor(10 * Math.pow(1.5, gameState.upgrades.drones));
        updateUI(); savePlayerState();
    } else { logMessage(`[SCRAP] 資源不足。`, 'system'); }
}

function healHound() {
    if (gameState.hound.hp >= gameState.hound.maxHp) return;
    if (gameState.resources.food >= 1) {
        gameState.resources.food--; gameState.hound.hp = Math.min(gameState.hound.hp + 25, gameState.hound.maxHp);
        updateUI(); savePlayerState(); logMessage(`餵食肉乾，恢復 25 HP。[${gameState.hound.hp}/${gameState.hound.maxHp}]`);
    }
}

function toggleExplore() {
    if (gameState.hound.hp <= 0 && !gameState.isExploring) { logMessage("獵犬處於重傷休克狀態，請餵食肉乾。", "system"); return; }
    gameState.isExploring = !gameState.isExploring;
    const btn = document.getElementById('btn-explore'); const stateEl = document.getElementById('hound-state'); const reportEl = document.getElementById('combat-report');
    if (gameState.isExploring) {
        btn.innerText = "HALT_EXPLORATION [停止探索]"; btn.style.borderColor = "#ff3333"; btn.style.color = "#ff3333";
        stateEl.innerText = "[探索中]"; stateEl.style.color = "var(--primary-color)"; reportEl.innerHTML = "波段掃描中...搜尋目標中...";
    } else {
        btn.innerText = "EXECUTE_AUTO_EXPLORE [啟動自動探索]"; btn.style.borderColor = "var(--primary-color)"; btn.style.color = "var(--primary-color)";
        stateEl.innerText = "[待命中]"; stateEl.style.color = "var(--text-color)"; reportEl.innerHTML = "探索中斷，返回營地。";
        gameState.currentEnemy = null;
    }
}

function handleExplorationTick() {
    if (!gameState.isExploring) return;
    const reportEl = document.getElementById('combat-report');
    if (!reportEl) return;

    // 1. 遇敵與區域過濾邏輯
    if (!gameState.currentEnemy) {
        let possibleEnemies = gameConfig.enemy_database;
        
        if (gameState.currentArea === "wasteland") {
            possibleEnemies = possibleEnemies.filter(e => e.atk <= 10);
        } else {
            const dungeon = gameConfig.dungeon_database.find(d => d.id === gameState.currentArea);
            if (dungeon) possibleEnemies = possibleEnemies.filter(e => dungeon.enemies.includes(e.name));
        }
        
        if (possibleEnemies.length === 0) possibleEnemies = [{ name: "系統錯誤代碼: 404_ENEMY", hp: 10, atk: 1 }];
        
        gameState.currentEnemy = { ...possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)] };
        reportEl.innerHTML = `>> 遇敵：<span class='warning-text'>${gameState.currentEnemy.name}</span> (HP: ${gameState.currentEnemy.hp})`;
        return;
    }

    // 2. 戰鬥傷害邏輯
    let currentAtk = gameState.hound.totalAtk;
    let currentDef = gameState.hound.totalDef;
    let currentDodge = gameState.hound.totalDodge;
    let currentCrit = gameState.hound.totalCrit;
    
    let isCrit = Math.random() * 100 < currentCrit;
    let dmgDealt = isCrit ? currentAtk * 2 : currentAtk;

    if (isCrit && gameState.hound.activeSets.includes('thug_3pc')) dmgDealt = currentAtk * 3;

    let ohkoChance = gameState.hound.ohko || 0;
    if (Math.random() * 100 < ohkoChance) {
        dmgDealt = 999999;
        reportEl.innerHTML = `<span style="color:#ff2222;">>> [致命一擊] 觸發殭屍骰效果，直接秒殺！</span>`;
    } else {
        reportEl.innerHTML = `>> 獵犬發動攻擊，造成 ${dmgDealt} 點傷害${isCrit ? " <span style='color:var(--zaco-color);'>(暴擊)</span>" : ""}。`;
    }
    
    gameState.currentEnemy.hp -= dmgDealt;

    // 3. 敵方反擊與秒殺檢定
    if (gameState.currentEnemy.hp > 0) {
        if (Math.random() * 100 < currentDodge) { 
            reportEl.innerHTML += `<br>💨 [幻影] 獵犬靈巧地閃避了敵人的攻擊！`; 
        } else {
            let dmgTaken = Math.max(1, gameState.currentEnemy.atk - currentDef);
            gameState.hound.hp = Math.max(0, gameState.hound.hp - dmgTaken);
            reportEl.innerHTML += `<br>💥 遭受攻擊，裝甲抵禦後受傷 ${dmgTaken} 點。`;
            if (gameState.hound.activeSets.includes('abyss_3pc')) {
                let reflectDmg = Math.floor(dmgTaken * 0.5); 
                gameState.currentEnemy.hp -= reflectDmg;
                reportEl.innerHTML += ` <span style="color: #ff3333;">(反彈 ${reflectDmg} 傷害)</span>`;
            }
        }

        // 裝備檢定：秒殺警告
        if (gameState.hound.hp <= 0) {
            reportEl.innerHTML += `<br><b style="color:#ff3333; font-size:1.1rem;">💀 [SYSTEM_WARNING] 承受傷害超過極限，獵犬遭到秒殺！</b><br><span style="color:#ffaa00;">>> 系統提示：請提升【胸背帶】生命值與【頭盔】防禦力，或農出【滅世】級別武裝再進行挑戰。</span>`;
            if (gameState.isExploring) toggleExplore(); 
            return;
        }
    }

    // 4. 擊殺結算
    if (gameState.currentEnemy.hp <= 0) {
        reportEl.innerHTML += `<br>>> <span class='warning-text'>${gameState.currentEnemy.name}</span> 已被擊敗！`;
        
        let isBoss = gameState.currentEnemy.isBoss; // 紀錄剛才死掉的是不是霸主
        gameState.currentEnemy = null;
        
        let scrapGain = Math.floor(Math.random() * 5) + 1;
        gameState.resources.scrap += scrapGain;
        reportEl.innerHTML += `<br>獲得 ${scrapGain} 廢料。`;
        
        // 誘餌掉落機制 (15% 機率掉落)
        if (Math.random() * 100 < 15) {
            gameState.resources.baits = (gameState.resources.baits || 0) + 1;
            reportEl.innerHTML += `<br><span style="color:#ff5555; font-weight:bold;">>> 發現特殊物資：[Alpha 誘餌] x1！</span>`;
        }
        
        // 戰利品生成 (若是霸主，連續抽 3 次裝備！)
        generateLoot();
        if (isBoss) {
            reportEl.innerHTML += `<br><span style="color:#ffcc00;">>> 霸主倒下，噴出了大量的戰利品！</span>`;
            generateLoot(); 
            generateLoot(); 
        }
    }

    // 5. 補血機制
    if (gameState.hound.hp < gameState.hound.maxHp * 0.3) {
        if (gameState.resources.food > 0) {
            gameState.resources.food--;
            let heal = Math.floor(gameState.hound.maxHp * 0.5);
            gameState.hound.hp = Math.min(gameState.hound.maxHp, gameState.hound.hp + heal);
            reportEl.innerHTML += `<br><span style="color:#55ff55;">>> 注射凝膠，恢復 ${heal} HP。</span>`;
        } else {
            reportEl.innerHTML += `<br><span style="color:#ff3333;">>> 警告：物資耗盡，獵犬必須撤退！</span>`;
            if (gameState.isExploring) toggleExplore();
        }
    }
    
    updateUI();
    savePlayerState();
}

async function generateLoot() {
    // 使用百萬分比實現超低長線掉落率
    const r = Math.floor(Math.random() * 1000000);
    let rarity = "common", rarityText = "普通", rarityClass = "loot-common", statMult = 1; let isSet = false;
    
    // 設定機率閾值 (荒野無法掉落紅裝)
    if (gameState.currentArea !== "wasteland" && r > 999995) { 
        rarity = "apocalyptic"; rarityText = "滅世"; rarityClass = "loot-apocalyptic"; statMult = 5; // 0.0005%
    }
    else if (r > 998500) { rarity = "legendary"; rarityText = "傳奇"; rarityClass = "loot-legendary"; statMult = 3; } // ~0.15%
    else if (r > 988500) { rarity = "set"; rarityText = "套裝"; rarityClass = "loot-set"; statMult = 2; isSet = true; } // ~1%
    else if (r > 838500) { rarity = "rare"; rarityText = "稀有"; rarityClass = "loot-rare"; statMult = 1.8; } // ~15%

    // 讀取副本專屬的屬性加成倍率 (loot_multiplier)
    let areaMultiplier = 1;
    if (gameState.currentArea !== "wasteland") {
        const dungeon = gameConfig.dungeon_database.find(d => d.id === gameState.currentArea);
        if (dungeon && dungeon.loot_multiplier) areaMultiplier = dungeon.loot_multiplier;
    }
    // 將基礎稀有度倍率 乘上 副本環境倍率
    statMult *= areaMultiplier;

    const pool = gameConfig.loot_pool;
    const slotKeys = ["helmet", "collar", "harness"];
    const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];
    const slotData = pool.slots[slot];
    const baseName = slotData.names[Math.floor(Math.random() * slotData.names.length)];

    let item = { slot: slot, slotText: slotData.typeName, rarity: rarity, class: rarityClass, atk: 0, maxHp: 0, def: 0, dodge: 0, crit: 0, setId: null, is_equipped: 0, is_locked: 0 };

    if (isSet) {
        const setKeys = Object.keys(pool.sets); const setId = setKeys[Math.floor(Math.random() * setKeys.length)];
        item.name = `[套裝] ${pool.sets[setId].name}・${baseName}`; item.setId = setId;
        if (slot === 'collar') item.atk = Math.floor(4 * statMult); else if (slot === 'harness') item.maxHp = Math.floor(20 * statMult); else if (slot === 'helmet') item.def = Math.floor(3 * statMult);
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

function toggleAutoSell(type) { gameState.autoSell[type] = document.getElementById(`auto-${type}`).checked; savePlayerState(); }

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
    gameState.resources.zaco += val; await db.inventory_items.delete(id);
    logMessage(`出售 ${item.name}，獲得 <span style="color:var(--zaco-color)">+${val} ZaCo</span>`, 'zaco');
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
        return `<div style="border:1px dashed ${eqItem.is_equipped ? 'var(--text-color)' : 'var(--primary-color)'}; padding:8px;">
            <div style="color:#888; margin-bottom:5px;">[${title}]</div>
            <div class="${eqItem.class}" style="margin-bottom:5px; font-weight:bold;">${eqItem.name}</div>
            ${eqItem.atk ? `<div>ATK: ${eqItem.atk}</div>` : ''} ${eqItem.maxHp ? `<div>HP: ${eqItem.maxHp}</div>` : ''}
            ${eqItem.def ? `<div>DEF: ${eqItem.def}</div>` : ''} ${eqItem.crit ? `<div>CRIT: ${eqItem.crit}%</div>` : ''}
            ${eqItem.dodge ? `<div>DODGE: ${eqItem.dodge}%</div>` : ''}
        </div>`;
    };
    document.getElementById('compare-content').innerHTML = buildStatsHTML(currentEquip, "當前著裝") + buildStatsHTML(item, "準備換上");
    pendingEquipId = id; document.getElementById('compare-backdrop').style.display = 'block'; document.getElementById('compare-modal').style.display = 'block';
}

function closeCompare() { pendingEquipId = null; document.getElementById('compare-backdrop').style.display = 'none'; document.getElementById('compare-modal').style.display = 'none'; }
async function confirmEquip() { if(pendingEquipId) await equipItem(pendingEquipId); closeCompare(); }

async function renderInventory() {
    const list = document.getElementById('inventory-list');
    let items = await db.inventory_items.where("is_equipped").equals(0).toArray();
    
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
        let descArr = []; if (item.atk) descArr.push(`ATK +${item.atk}`); if (item.maxHp) descArr.push(`HP +${item.maxHp}`); if (item.def) descArr.push(`DEF +${item.def}`); if (item.crit) descArr.push(`暴擊 +${item.crit}%`); if (item.dodge) descArr.push(`閃避 +${item.dodge}%`); if (item.setId) descArr.push(`套裝: ${gameConfig.loot_pool.sets[item.setId].name}`);
        
        const lockIcon = item.is_locked ? "🔒" : "🔓"; const lockColor = item.is_locked ? "var(--primary-color)" : "#555";
        el.innerHTML = `
            <div class="inv-info" onclick="showCompare(${item.id})">
                <span class="${item.class}">${item.name}</span><br>
                <span style="color:#888; font-size:0.75rem;">[${item.slotText}] ${descArr.length > 0 ? descArr.join(" | ") : "無附加"}</span>
            </div>
            <div style="display:flex; gap:5px;">
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
            gameState.resources.food += 200;
            logMessage(`地下交易完成: 拆開 <span class="${item.class}">${item.name}</span>，獲得 200 份肉乾！`, 'zaco');
        } else {
            const dbItem = { name: item.name, slot: item.slot, slotText: item.slot === 'collar' ? '項圈' : (item.slot === 'helmet' ? '頭盔' : '胸背帶'), rarity: item.rarity, class: item.class, atk: item.atk, maxHp: item.maxHp, def: item.def||0, is_equipped: 0, is_locked: 0, setId: item.setId||null };
            await db.inventory_items.add(dbItem);
            logMessage(`地下交易完成: 獲得 <span class="${item.class}">${item.name}</span>`, 'zaco');
        }
        updateUI(); savePlayerState();
    } else { logMessage(`[ZACO_ERROR] 帳戶餘額不足以支付黑市交易。`, 'system'); }
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

function logMessage(text, type = 'normal') {
    const container = document.getElementById('log-container'); const entry = document.createElement('div');
    entry.className = `log-entry ${type}`; entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${text}`;
    container.appendChild(entry); if (container.children.length > 4) container.removeChild(container.firstChild);
}

function updateUI() {
    document.getElementById('res-scrap').innerText = gameState.resources.scrap;
    document.getElementById('res-food').innerText = gameState.resources.food;
    document.getElementById('res-zaco').innerText = gameState.resources.zaco;
    document.getElementById('rate-scrap').innerText = gameState.autoRates.scrap;
    document.getElementById('camp-drones').innerText = gameState.upgrades.drones;
    document.getElementById('hound-hp').innerText = gameState.hound.hp;
    document.getElementById('btn-upgrade-drone').innerText = `DEPLOY_SCRAP_DRONE [成本: ${gameState.costs.drone} 廢料]`;
    
    document.getElementById('hound-total-atk').innerText = `${gameState.hound.totalAtk} (HP上限: ${gameState.hound.maxHp})`;
    document.getElementById('hound-def').innerText = gameState.hound.totalDef;
    document.getElementById('hound-crit').innerText = `${gameState.hound.totalCrit}%`;
    document.getElementById('hound-dodge').innerText = `${gameState.hound.totalDodge}%`;
    document.getElementById('hound-ohko').innerText = `${gameState.hound.ohko}%`;

    const equipDiv = document.getElementById('camp-equipped'); 
    let eqText = [];
    const buildEqLine = (slot, item) => {
        if(!item) return "";
        return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; border-bottom:1px dashed #333; padding-bottom:5px;">
            <span class="${item.class}">[${item.slotText}] ${item.name}</span>
            <button class="btn" style="width:auto; padding:3px 8px; margin:0; font-size:0.75rem; border-color:#ff3333; color:#ff3333;" onclick="unequipSlot('${slot}')">卸下</button>
        </div>`;
    };
    if (gameState.equipped.helmet) eqText.push(buildEqLine('helmet', gameState.equipped.helmet));
    if (gameState.equipped.collar) eqText.push(buildEqLine('collar', gameState.equipped.collar));
    if (gameState.equipped.harness) eqText.push(buildEqLine('harness', gameState.equipped.harness));
    equipDiv.innerHTML = eqText.length > 0 ? eqText.join("") : `<span style="color:#777;">[無裝備]</span>`;
}

function saveGame() { savePlayerState(); logMessage(">> 資料庫快照備份完成。", "system"); }
function resetGame() { if (confirm("確定格式化系統？這會永久抹除所有資料庫紀錄！")) { db.delete().then(() => { location.reload(); }); } }

function renderDungeonList() {
    const selectEl = document.getElementById('area-select');
    if (!selectEl) return;
    
    gameConfig.dungeon_database.forEach(dungeon => {
        const option = document.createElement('option');
        option.value = dungeon.id;
        option.innerText = `>> ${dungeon.name} [推薦 ATK: ${dungeon.req_atk}]`;
        selectEl.appendChild(option);
    });
    selectEl.value = gameState.currentArea;
}

function changeArea() {
    if (gameState.isExploring) {
        logMessage(">> 探索進行中，無法切換區域！請先停止探索。", "system");
        document.getElementById('area-select').value = gameState.currentArea;
        return;
    }
    gameState.currentArea = document.getElementById('area-select').value;
    
    // 切換影像觀測區圖片
    const imgEl = document.getElementById('area-image');
    const textEl = document.getElementById('area-image-text');
    if (gameState.currentArea !== 'wasteland') {
        const dungeon = gameConfig.dungeon_database.find(d => d.id === gameState.currentArea);
        if (dungeon && dungeon.img_url) {
            imgEl.src = dungeon.img_url; imgEl.style.display = 'block'; textEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none'; textEl.style.display = 'block'; textEl.innerText = "[NO_SIGNAL_IMAGE_NOT_FOUND]";
        }
        logMessage(`>> 目標區域重新定位：${dungeon.name}`, "system");
    } else {
        imgEl.style.display = 'none'; textEl.style.display = 'block'; textEl.innerText = "[NO_SIGNAL_IMAGE_NOT_FOUND]";
        logMessage(`>> 目標區域重新定位：荒野外圍`, "system");
    }
}

// ====== 霸主召喚系統 ======
function summonBoss() {
    if (gameState.isExploring) {
        logMessage(">> 必須先停止自動探索，才能佈置誘餌！", "system");
        return;
    }
    if ((gameState.resources.baits || 0) < 5) {
        logMessage(">> [Alpha 誘餌] 數量不足！(需要 5 個)", "system");
        return;
    }
    
    // 依照當前區域決定霸主種類 (強度從資料庫借用高階怪物)
    let bossName = "狂暴野熊"; // 荒野預設霸主
    if (gameState.currentArea === "dungeon_1") bossName = "廢料聚合怪"; 
    else if (gameState.currentArea === "dungeon_2") bossName = "毒液噴射巨蛾";
    else if (gameState.currentArea === "dungeon_3") bossName = "舊時代軍用突擊犬";
    
    const bossTemplate = gameConfig.enemy_database.find(e => e.name === bossName);
    if (!bossTemplate) return;

    // 扣除誘餌並設定當前敵人 (血量兩倍、攻擊力 1.5 倍)
    gameState.resources.baits -= 5;
    gameState.currentEnemy = { 
        name: `[霸主] ${bossTemplate.name}`, 
        hp: bossTemplate.hp * 2, 
        atk: Math.floor(bossTemplate.atk * 1.5),
        isBoss: true  // 標記為霸主，死掉時才會爆寶
    };
    
    updateUI();
    logMessage(`>> ⚠️ 警告：探測到巨大生化反應！【${gameState.currentEnemy.name}】已被誘出！`, "system");
    
    // 自動開啟戰鬥
    toggleExplore();
}

// 覆寫 updateUI 加入誘餌數量更新 (使用攔截器方式確保安全)
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    const baitsEl = document.getElementById('res-baits');
    if (baitsEl) baitsEl.innerText = gameState.resources.baits || 0;
};

// ====== 一鍵批量拆解 ======
async function bulkSellItems() {
    const rarity = document.getElementById('bulk-sell-rarity').value;
    // 撈出背包裡所有的裝備
    const allItems = await db.inventory_items.toArray();
    
    // 核心過濾器：只挑選「品質相符」且「未裝備」且「未鎖定」的裝備
    // (防呆機制：以防 item.is_locked 為 undefined，使用 !item.is_locked 判斷)
    const itemsToSell = allItems.filter(item => 
        item.rarity === rarity && 
        !item.is_equipped && 
        !item.is_locked
    );

    if (itemsToSell.length === 0) {
        logMessage(`>> [系統提示] 找不到可拆解的未鎖定 ${rarity} 級裝備！`, "system");
        return;
    }

    // 計算總回收廢料與收集要刪除的 ID
    const idsToDelete = [];
    let totalScrap = 0;
    
    itemsToSell.forEach(item => {
        idsToDelete.push(item.id);
        // 依照品質給予不同廢料
        if (item.rarity === 'common') totalScrap += 5;
        else if (item.rarity === 'rare') totalScrap += 15;
        else if (item.rarity === 'set') totalScrap += 30;
        else if (item.rarity === 'legendary') totalScrap += 50;
        else totalScrap += 5;
    });

    // 透過 Dexie.js 的 bulkDelete 一次性刪除，效能最高
    await db.inventory_items.bulkDelete(idsToDelete);
    
    // 發放廢料並更新介面
    gameState.resources.scrap += totalScrap;
    savePlayerState();
    updateUI();
    renderInventory();
    
    logMessage(`>> [批量拆解] 成功銷毀 ${itemsToSell.length} 件武裝，回收 ${totalScrap} 單位廢料。`, "system");
}