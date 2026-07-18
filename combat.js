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
        let possibleEnemies = [];
        
        if (gameState.currentArea === "wasteland") {
            // 荒野外圍：維持舊邏輯，抓取低等怪物 (ATK <= 10)
            possibleEnemies = gameConfig.enemy_database.filter(e => e.atk <= 10);
        } else {
            // 🚀 高速字典檢索：O(1) 瞬間抓取副本資料 (再也不用寫迴圈慢慢找！)
            const dungeon = WastelandDB.dungeons[gameState.currentArea];
            
            if (dungeon && dungeon.enemies) {
                // 根據副本設定的 ID 陣列 (如 "mob_101")，直接從字典實體化怪物數值
                possibleEnemies = dungeon.enemies
                    .map(mobId => WastelandDB.enemies[mobId])
                    .filter(e => e !== undefined); // 防呆：過濾掉在 config 裡不小心打錯的 ID
            }
        }
        
        // 終極防呆機制
        if (possibleEnemies.length === 0) {
            possibleEnemies = [{ id: "error", name: "系統錯誤代碼: 404_ENEMY", hp: 10, atk: 1 }];
        }
        
        // 隨機抽選一隻怪物，並使用 { ... } 深度拷貝，避免扣血時扣到資料庫本體！
        gameState.currentEnemy = { ...possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)] };
        
        reportEl.innerHTML = `>> 遇敵：<span class='warning-text'>${gameState.currentEnemy.name}</span> (HP: ${gameState.currentEnemy.hp})`;
        return;
    }
        // 2. 戰鬥傷害邏輯
    let currentAtk = gameState.hound.totalAtk;
    let currentDef = gameState.hound.totalDef;
    let currentDodge = gameState.hound.totalDodge;
    let currentCrit = gameState.hound.totalCrit;
    
    // 🚀 微創實裝：判定上一回合是否觸發「忍術殘影必爆」，或是常規暴擊
    let isGuaranteedCrit = gameState.hound.guaranteedCrit === true;
    let isCrit = isGuaranteedCrit || (Math.random() * 100 < currentCrit);

    // 觸發後立刻消耗掉必爆旗標
    if (isGuaranteedCrit) {
        gameState.hound.guaranteedCrit = false;
    }

    let dmgDealt = isCrit ? currentAtk * 2 : currentAtk;

    // 🚀 微創對齊：暴擊傷害 3 倍移至 thug_2pc 觸發
    if (isCrit && gameState.hound.activeSets.includes('thug_2pc')) dmgDealt = currentAtk * 3;

    let ohkoChance = gameState.hound.ohko || 0;
    if (Math.random() * 100 < ohkoChance) {
        dmgDealt = 999999;
        reportEl.innerHTML = `<span style="color:#ff2222;">>> [致命一擊] 觸發殭屍骰效果，直接秒殺！</span>`;
    } else {
        let critTag = isGuaranteedCrit ? " <span style='color:#00ff66;'>[忍術必爆!]</span>" : (isCrit ? " <span style='color:var(--zaco-color);'>(暴擊)</span>" : "");
        reportEl.innerHTML = `>> 獵犬發動攻擊，造成 ${dmgDealt} 點傷害${critTag}。`;
    }
    
    gameState.currentEnemy.hp -= dmgDealt;

    // 3. 敵方反擊與秒殺檢定
    if (gameState.currentEnemy.hp > 0) {
        if (Math.random() * 100 < currentDodge) { 
            reportEl.innerHTML += `<br>💨 [幻影] 獵犬靈巧地閃避了敵人的攻擊！`; 
            // 🚀 微創實裝：著裝都市忍者 2件套且閃避成功時，賦予下回合必爆旗標
            if (gameState.hound.activeSets.includes('ninja_2pc')) {
                gameState.hound.guaranteedCrit = true;
                reportEl.innerHTML += ` <span style="color:#00ff66;">[忍術殘影：下擊必定暴擊！]</span>`;
            }
        } else {
            let dmgTaken = Math.max(1, gameState.currentEnemy.atk - currentDef);
            gameState.hound.hp = Math.max(0, gameState.hound.hp - dmgTaken);
            reportEl.innerHTML += `<br>💥 遭受攻擊，裝甲抵禦後受傷 ${dmgTaken} 點。`;
            
            // 🚀 微創對齊：深淵琉璃反傷移至 abyss_2pc 觸發
            if (gameState.hound.activeSets.includes('abyss_2pc')) {
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
        let maxCap = getMaxScrap();
        let oldScrap = gameState.resources.scrap;
        
        // 加上戰鬥產出，但不超過上限
        gameState.resources.scrap = Math.min(gameState.resources.scrap + scrapGain, maxCap);
        
        let actualGain = gameState.resources.scrap - oldScrap;
        if (actualGain > 0) {
            reportEl.innerHTML += `<br>獲得 ${actualGain} 廢料。`;
        } else {
            reportEl.innerHTML += `<br><span style="color:#ff3333;">(廢料儲存已滿，無法回收更多)</span>`;
        }
        
        // 誘餌掉落機制 (15% 機率掉落)
        if (Math.random() * 100 < 15) {
            gameState.resources.baits = (gameState.resources.baits || 0) + 1;
            reportEl.innerHTML += `<br><span style="color:#ff5555; font-weight:bold;">>> 發現特殊物資：[Alpha 誘餌] x1！</span>`;
        }
        
        // ⚠️ 修正：使用非同步閉包依序 await，避免手機 IndexedDB 交易死鎖與 UI 凍結！
        (async () => {
            await generateLoot(false);
            if (isBoss) {
                reportEl.innerHTML += `<br><span style="color:#ffcc00;">>> 霸主倒下，噴出了大量的戰利品！</span>`;
                await generateLoot(true);
                await generateLoot(true); 
            // ⚠️ 新增：擊殺霸主時，有 35% 高機率解密尋獲【副本機密文件】！
                if (Math.random() < 0.35) {
                    const newLore = rollForLore("dungeon"); // 觸發副本文件抽獎
                    if (newLore) {
                        gameState.unlockedLore.push(newLore.id);
                        reportEl.innerHTML += `<br><b style="color:#d69e2e; font-size:1.05em;">📜 [機密解密] 尋獲副本檔案：《${newLore.title}》！</b>`;
                    }
                }
            } else if (Math.random() < 0.05) {
                // ⚠️ 新增：普通怪物也有 5% 微小機率掉落文件
                const newLore = rollForLore("dungeon");
                if (newLore) {
                    gameState.unlockedLore.push(newLore.id);
                    reportEl.innerHTML += `<br><span style="color:#d69e2e;">📜 尋獲殘破文件：《${newLore.title}》！</span>`;
                }
            }
        })();
    } // 閉合 if (gameState.currentEnemy.hp <= 0)

    // 5. 補血機制 (血量低於 75% 觸發)
    if (gameState.hound.hp < gameState.hound.maxHp * 0.75) {
        if (gameState.resources.food > 0) {
            gameState.resources.food--;
            let heal = Math.floor(gameState.hound.maxHp * 0.5);
            gameState.hound.hp = Math.min(gameState.hound.maxHp, gameState.hound.hp + heal);
            reportEl.innerHTML += `<br><span style="color:#55ff55;">>> 自動餵食肉乾，恢復 ${heal} HP。</span>`;
        } else {
            reportEl.innerHTML += `<br><span style="color:#ff3333;">>> 警告：物資耗盡，獵犬必須撤退！</span>`;
            if (gameState.isExploring) toggleExplore();
        }
    }
    
    updateUI();
    savePlayerState();
}

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
    
    // 🚀 關鍵修復：切換區域時，強制清空當前敵人，避免下一場戰鬥打到上一區的怪！
    gameState.currentEnemy = null;
    
    // 切換影像觀測區圖片與戰術簡報
    const imgEl = document.getElementById('area-image');
    const textEl = document.getElementById('area-image-text');
    const descEl = document.getElementById('area-desc'); // 取得簡報 DOM
    
    if (gameState.currentArea !== 'wasteland') {
        // 🚀 效能優化：改用我們剛剛建好的高速字典，取代原本的 find 迴圈
        const dungeon = WastelandDB.dungeons[gameState.currentArea];
        
        if (dungeon) {
            // 更新圖片
            if (dungeon.img_url) {
                imgEl.src = dungeon.img_url; imgEl.style.display = 'block'; textEl.style.display = 'none';
            } else {
                imgEl.style.display = 'none'; textEl.style.display = 'block'; textEl.innerText = "[NO_SIGNAL_IMAGE_NOT_FOUND]";
            }
            // 更新簡報內容
            if (descEl) {
                descEl.innerHTML = `>> [戰術簡報]: ${dungeon.desc || "無可用區域情報。"}`;
                descEl.style.color = "#00ff66"; // 副本顯示螢光綠
            }
            logMessage(`>> 目標區域重新定位：${dungeon.name}`, "system");
        }
    } else {
        imgEl.style.display = 'none'; textEl.style.display = 'block'; textEl.innerText = "[NO_SIGNAL_IMAGE_NOT_FOUND]";
        // 恢復荒野預設簡報
        if (descEl) {
            descEl.innerHTML = `>> [戰術簡報]: 城市邊緣的死寂廢土，遊蕩著初階變異生物，適合收集基礎組件。`;
            descEl.style.color = "#ffaa00"; // 荒野顯示橘黃色
        }
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
    
    // 【聰明定位邏輯】：升級為 ID 字典架構！
    let bossTemplate = null;
    
    if (gameState.currentArea !== "wasteland") {
        // 🚀 副本中：從高速字典抓取該副本名單的「最後一隻」怪物 ID
        const dungeon = WastelandDB.dungeons[gameState.currentArea];
        if (dungeon && dungeon.enemies && dungeon.enemies.length > 0) {
            const bossId = dungeon.enemies[dungeon.enemies.length - 1]; // 拿到如 "mob_104"
            bossTemplate = WastelandDB.enemies[bossId]; // 瞬間實體化
        }
    } else {
        // 荒野外圍：維持你的原版設計，用名字找「狂暴野熊」
        bossTemplate = gameConfig.enemy_database.find(e => e.name === "狂暴野熊");
        
        // 防呆保護：如果你的 config.json 裡面沒有「狂暴野熊」，自動抓荒野最強怪(例如暴力倖存者)
        if (!bossTemplate) {
            let wastelandMobs = gameConfig.enemy_database.filter(e => e.atk <= 10);
            bossTemplate = wastelandMobs[wastelandMobs.length - 1];
        }
    }
    
    if (!bossTemplate) {
        logMessage(">> [系統錯誤] 無法在資料庫定位當前區域的霸主特徵代碼！", "system");
        return;
    }

    // 扣除誘餌並設定當前敵人 (維持你的：血量兩倍、攻擊力 1.5 倍)
    gameState.resources.baits -= 5;
    gameState.currentEnemy = { 
        id: bossTemplate.id,            // 🚀 補上 ID，這對後續的掉寶系統非常重要
        name: `[霸主] ${bossTemplate.name}`, 
        hp: bossTemplate.hp * 2, 
        maxHp: bossTemplate.hp * 2,     // 🚀 補上 maxHp 防止戰鬥血條 UI 顯示 NaN 或破圖
        atk: Math.floor(bossTemplate.atk * 1.5),
        isBoss: true  // 標記為霸主，死掉時才會爆寶
    };
    
    updateUI();
    logMessage(`>> ⚠️ 警告：探測到巨大生化反應！【${gameState.currentEnemy.name}】已被誘出！`, "system");
    
    // 自動開啟戰鬥
    toggleExplore();
    
    // 確保霸主出現時的日誌不被探索初始化刷掉
    const reportEl = document.getElementById('combat-report');
    if (reportEl) reportEl.innerHTML = `>> ⚠️ 探測到巨大生化反應！<br><span class='warning-text'>${gameState.currentEnemy.name}</span> (HP: ${gameState.currentEnemy.hp}) 已被誘出！`;
}

// 覆寫 updateUI 加入誘餌數量更新 (使用攔截器方式確保安全)
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    const baitsEl = document.getElementById('res-baits');
    if (baitsEl) baitsEl.innerText = gameState.resources.baits || 0;
};


