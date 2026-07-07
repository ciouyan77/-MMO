// 全域記憶體快照
let gameConfig = null; // 存放非同步載入的 json
let gameState = {
    resources: { scrap: 0, food: 10, zaco: 0 },
    upgrades: { drones: 0 }, costs: { drone: 10 }, autoRates: { scrap: 0 },
    isExploring: false,
    hound: { hp: 100, maxHp: 100, baseAtk: 12, totalAtk: 12 },
    equipped: { helmet: null, collar: null, harness: null },
    currentEnemy: null
};

// 啟動初始化
window.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. 讀取配置檔 json
        const response = await fetch('./config.json');
        gameConfig = await response.json();

        // 2. 載入資料庫存檔
        await loadGameData();

        // 3. 啟動計時器
        initGameLoops();
    } catch (e) {
        console.error("系統初始化失敗:", e);
    }
});

// 資料庫載入
async function loadGameData() {
    let savedState = await db.player_state.get(1);
    if (!savedState) {
        savedState = { id: 1, resources: { scrap: 0, food: 10, zaco: 0 }, upgrades: { drones: 0 }, costs: { drone: 10 }, autoRates: { scrap: 0 }, hound_hp: 100 };
        await db.player_state.add(savedState);
    }
    gameState.resources = savedState.resources;
    gameState.upgrades = savedState.upgrades;
    gameState.costs = savedState.costs;
    gameState.autoRates = savedState.autoRates;
    gameState.hound.hp = savedState.hound_hp;

    // 撈出穿戴裝備
    const equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
    gameState.equipped = { helmet: null, collar: null, harness: null };
    equippedItems.forEach(item => { gameState.equipped[item.slot] = item; });

    calculateHoundStats();
    updateUI();
    logMessage(">> 模組化資料庫鏈結成功。", "system");
}

// 快速存檔
async function savePlayerState() {
    await db.player_state.put({
        id: 1, resources: gameState.resources, upgrades: gameState.upgrades,
        costs: gameState.costs, autoRates: gameState.autoRates, hound_hp: gameState.hound.hp
    });
}

// 計算能力值
function calculateHoundStats() {
    let bonusAtk = 0; let bonusMaxHp = 0;
    if (gameState.equipped.collar) bonusAtk += (gameState.equipped.collar.atk || 0);
    if (gameState.equipped.harness) bonusMaxHp += (gameState.equipped.harness.maxHp || 0);
    gameState.hound.totalAtk = gameState.hound.baseAtk + bonusAtk;
    gameState.hound.maxHp = 100 + bonusMaxHp;
    if (gameState.hound.hp > gameState.hound.maxHp) gameState.hound.hp = gameState.hound.maxHp;
}

// 核心 Tick 循環
function initGameLoops() {
    setInterval(() => {
        if (gameState.autoRates.scrap > 0) {
            gameState.resources.scrap += gameState.autoRates.scrap;
            updateUI();
        }
        if (gameState.isExploring) handleExplorationTick();
    }, 1000);
    setInterval(() => { savePlayerState(); }, 10000);
}

// 基礎功能 (按鈕觸發)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    if(tabId === 'inv') renderInventory();
    if(tabId === 'shop') renderShop();
}

function gatherResource(type) {
    gameState.resources[type]++; updateUI(); savePlayerState();
    logMessage(`回收 1 ${type.toUpperCase()}`);
}

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
        gameState.resources.food--;
        gameState.hound.hp = Math.min(gameState.hound.hp + 25, gameState.hound.maxHp);
        updateUI(); savePlayerState();
        logMessage(`餵食肉乾，恢復 25 HP。[${gameState.hound.hp}/${gameState.hound.maxHp}]`);
    }
}

function toggleExplore() {
    if (gameState.hound.hp <= 0 && !gameState.isExploring) { logMessage("獵犬處於重傷休克狀態，請餵食肉乾。", "system"); return; }
    gameState.isExploring = !gameState.isExploring;
    const btn = document.getElementById('btn-explore');
    const stateEl = document.getElementById('hound-state');
    const reportEl = document.getElementById('combat-report');
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
    const reportEl = document.getElementById('combat-report');
    if (gameState.hound.hp <= 0) { if (gameState.isExploring) toggleExplore(); reportEl.innerHTML = "<span style='color:#ff3333;'>獵犬重傷！自動防衛撤回。</span>"; return; }
    if (!gameState.isExploring) return;
    
    if (!gameState.currentEnemy) {
        const dbEnemies = gameConfig.enemy_database;
        gameState.currentEnemy = { ...dbEnemies[Math.floor(Math.random() * dbEnemies.length)] };
        reportEl.innerHTML = `>> 遇敵：<span class='warning-text'>${gameState.currentEnemy.name}</span> (HP: ${gameState.currentEnemy.hp})`;
        return;
    }

    let dmg = gameState.hound.totalAtk;
    gameState.currentEnemy.hp -= dmg;
    reportEl.innerHTML = `🐾 獵犬撕咬造成 <b style="color:#55ff55">${dmg}</b> 傷害。<br>`;

    if (gameState.currentEnemy.hp <= 0) {
        reportEl.innerHTML += `<span style='color:var(--text-color);'>✓ 目標清除！</span><br>`;
        if (Math.random() < 0.40) {
            reportEl.innerHTML += `<span style='color:var(--text-color);'>搜刮戰利品中...</span>`;
            generateLoot();
        } else { reportEl.innerHTML += `<span style='color:#777;'>殘骸中空無一物。</span>`; }
        gameState.currentEnemy = null; savePlayerState(); return;
    }

    gameState.hound.hp = Math.max(0, gameState.hound.hp - gameState.currentEnemy.atk);
    gameState.hound.hp = Math.max(0, gameState.hound.hp - gameState.currentEnemy.atk);
    reportEl.innerHTML += `💥 遭受反擊，受傷 ${gameState.currentEnemy.atk} 點。`;
    // ✨ 【新增：戰時自動醫療注射邏輯】
    // 當血量低於 75%，且身上還有肉乾時，自動消耗並補血
    const hpPercent = (gameState.hound.hp / gameState.hound.maxHp) * 100;
    if (hpPercent <= 75 && gameState.resources.food > 0 && gameState.hound.hp > 0) {
        gameState.resources.food--;
        const oldHp = gameState.hound.hp;
        gameState.hound.hp = Math.min(gameState.hound.hp + 25, gameState.hound.maxHp);
        const healedAmount = gameState.hound.hp - oldHp;
        
        // 戰情面板即時回報
        reportEl.innerHTML += `<br><span style="color:#55aaff;">⚡ [自動戰術補給] 獵犬吞下肉乾，恢復 ${healedAmount} HP！(剩餘肉乾: ${gameState.resources.food})</span>`;
        logMessage(`自動補給：獵犬戰傷觸發醫療，消耗 1 肉乾，恢復 ${healedAmount} HP。`);
    }

    document.getElementById('hound-hp').innerText = gameState.hound.hp;


    reportEl.innerHTML += `💥 遭受反擊，受傷 ${gameState.currentEnemy.atk} 點。`;
    document.getElementById('hound-hp').innerText = gameState.hound.hp;
}

async function generateLoot() {
    const r = Math.random() * 100;
    let rarity = "common", rarityText = "普通", rarityClass = "loot-common", statMultiplier = 1;
    if (r > 99) { rarity = "apocalyptic"; rarityText = "滅世"; rarityClass = "loot-apocalyptic"; statMultiplier = 5; }
    else if (r > 90) { rarity = "legendary"; rarityText = "傳奇"; rarityClass = "loot-legendary"; statMultiplier = 3; }
    else if (r > 60) { rarity = "rare"; rarityText = "稀有"; rarityClass = "loot-rare"; statMultiplier = 1.8; }

    const pool = gameConfig.loot_pool;
    const slotKeys = ["helmet", "collar", "harness"];
    const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];
    const slotData = pool.slots[slot];
    const baseName = slotData.names[Math.floor(Math.random() * slotData.names.length)];
    const prefix = pool.prefix[Math.floor(Math.random() * pool.prefix.length)];

    let item = {
        name: `[${rarityText}] ${prefix}${baseName}`, slot: slot, slotText: slotData.typeName,
        rarity: rarity, class: rarityClass, atk: 0, maxHp: 0, effect: null, is_equipped: 0
    };

    if (slot === 'collar') item.atk = Math.floor((Math.random() * 4 + 3) * statMultiplier);
    else if (slot === 'harness') item.maxHp = Math.floor((Math.random() * 15 + 20) * statMultiplier);
    else if (slot === 'helmet') item.effect = pool.helmetEffects[Math.floor(Math.random() * pool.helmetEffects.length)];

    await db.inventory_items.add(item);
    if (document.getElementById('tab-inv').classList.contains('active')) renderInventory();
    let logDesc = item.effect ? `[特效: ${item.effect.name}]` : (item.atk > 0 ? `ATK +${item.atk}` : `MaxHP +${item.maxHp}`);
    logMessage(`獲得戰利品: <span class="${rarityClass}">${item.name} (${logDesc})</span>`);
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

async function unequip() {
    await db.inventory_items.where("is_equipped").equals(1).modify({ is_equipped: 0 });
    gameState.equipped = { helmet: null, collar: null, harness: null };
    calculateHoundStats(); updateUI();
    if(document.getElementById('tab-inv').classList.contains('active')) renderInventory();
    logMessage(">> 已解除所有武裝面板。");
}

async function sellItem(event, id) {
    event.stopPropagation(); const item = await db.inventory_items.get(id); if (!item) return;
    let val = 1; if(item.rarity==='rare') val=5; if(item.rarity==='legendary') val=25; if(item.rarity==='apocalyptic') val=150;
    gameState.resources.zaco += val; await db.inventory_items.delete(id);
    logMessage(`出售 ${item.name}，獲得 <span style="color:var(--zaco-color)">+${val} ZaCo</span>`, 'zaco');
    updateUI(); renderInventory();
}

async function renderInventory() {
    const list = document.getElementById('inventory-list');
    const items = await db.inventory_items.where("is_equipped").equals(0).toArray();
    if (items.length === 0) { list.innerHTML = "<span style='color:#777;'>[數據空載 / 背包空無一物]</span>"; return; }
    list.innerHTML = "";
    items.forEach((item) => {
        const el = document.createElement('div'); el.className = 'inv-item';
        let price = 1; if(item.rarity==='rare') price=5; if(item.rarity==='legendary') price=25; if(item.rarity==='apocalyptic') price=150;
        let desc = item.effect ? `特效: ${item.effect.name}` : (item.atk > 0 ? `ATK +${item.atk}` : `HP +${item.maxHp}`);
        el.innerHTML = `<div class="inv-info" onclick="equipItem(${item.id})"><span class="${item.class}">${item.name}</span><br><span style="color:#888; font-size:0.75rem;">[${item.slotText}] ${desc}</span></div><button class="btn" style="width: auto; padding: 5px 10px; margin: 0; border-color: var(--zaco-color); color: var(--zaco-color);" onclick="sellItem(event, ${item.id})">出售 ($${price})</button>`;
        list.appendChild(el);
    });
}

async function buyShopItem(index) {
    const item = gameConfig.shop_database[index];
    if (gameState.resources.zaco >= item.price) {
        gameState.resources.zaco -= item.price;
        
        // ✨ 新增判斷：如果是批發肉乾
        if (item.slot === 'usable' && item.id === 'shop_jerky_bulk') {
            gameState.resources.food += 200;
            logMessage(`地下交易完成: 拆開 <span class="${item.class}">${item.name}</span>，獲得 200 份肉乾！`, 'zaco');
        } else {
            // 原本的裝備寫入資料庫邏輯
            const dbItem = { name: item.name, slot: item.slot, slotText: item.slot === 'collar' ? '項圈' : '胸背帶', rarity: item.rarity, class: item.class, atk: item.atk, maxHp: item.maxHp, effect: null, is_equipped: 0 };
            await db.inventory_items.add(dbItem);
            logMessage(`地下交易完成: 獲得 <span class="${item.class}">${item.name}</span>`, 'zaco');
        }
        updateUI();
        savePlayerState();
    } else { logMessage(`[ZACO_ERROR] 帳戶餘額不足以支付黑市交易。`, 'system'); }
}

function renderShop() {
    const list = document.getElementById('shop-list'); list.innerHTML = "";
    gameConfig.shop_database.forEach((item, index) => {
        const el = document.createElement('div'); el.className = 'inv-item';
        // 優化描述顯示
        let desc = item.desc ? item.desc : (item.atk > 0 ? `固定加成: ATK +${item.atk}` : `固定加成: HP +${item.maxHp}`);
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
    
    const equipDiv = document.getElementById('camp-equipped'); const atkDiv = document.getElementById('hound-total-atk');
    let eqText = [];
    if (gameState.equipped.helmet) eqText.push(`<span class="${gameState.equipped.helmet.class}">[頭盔:${gameState.equipped.helmet.name}]</span>`);
    if (gameState.equipped.collar) eqText.push(`<span class="${gameState.equipped.collar.class}">[項圈:${gameState.equipped.collar.name}]</span>`);
    if (gameState.equipped.harness) eqText.push(`<span class="${gameState.equipped.harness.class}">[胸背:${gameState.equipped.harness.name}]</span>`);
    equipDiv.innerHTML = eqText.length > 0 ? eqText.join(" <br> ") : `<span style="color:#777;">[無裝備]</span>`;
    atkDiv.innerText = `${gameState.hound.totalAtk} (HP上限: ${gameState.hound.maxHp})`;
}

function saveGame() { savePlayerState(); logMessage(">> 資料庫快照備份完成。", "system"); }
function resetGame() { if (confirm("確定格式化系統？這會永久抹除所有資料庫紀錄！")) { db.delete().then(() => { location.reload(); }); } }
