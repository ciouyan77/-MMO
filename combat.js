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
    // 🛡️ 死鬥空間鎖：如果目前正在打王關，則強制暫停全域的吃肉乾與探索判定
    const odysseyPhase = document.getElementById('odyssey-phase-battle');
    if (odysseyPhase && odysseyPhase.style.display !== 'none') {
        return; 
    }
    

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
            // 2. 戰鬥傷害邏輯 (紫裝核心共鳴引擎)
    let currentAtk = gameState.hound.totalAtk;
    let currentDef = gameState.hound.totalDef;
    let currentDodge = gameState.hound.totalDodge;
    let currentCrit = gameState.hound.totalCrit;
        let coreRes = (gameState.equipped && gameState.equipped.core && gameState.equipped.core.resonance) ? gameState.equipped.core.resonance : null;

    
    // 🟢 清道夫 B：目標 HP > 50% 時 2PC 攻擊力翻倍加成 (+30 -> +60)
    if (coreRes === 'scavenger_B' && gameState.currentEnemy.hp > (gameState.currentEnemy.maxHp || gameState.currentEnemy.hp) * 0.5) {
        currentAtk += 30;
    }

    // 🟢 廢土暴徒 D：未暴擊累積暴傷，暴擊重置
    let cMult = gameState.hound.critMult || 2;
    if (coreRes === 'thug_D') {
        cMult = gameState.hound.thugDMult || CORE_CONFIG.thug_D.baseCritMult;
    }
    // 🟢 廢土暴徒 C：HP < 30% 暴傷進化為 4 倍
    if (coreRes === 'thug_C' && gameState.hound.hp < (gameState.hound.maxHp || 100) * 0.3) {
        cMult = Math.max(cMult, CORE_CONFIG.thug_C.boostedCritMult);
    }

    let isGuaranteedCrit = gameState.hound.guaranteedCrit === true;
    let isCrit = isGuaranteedCrit || (Math.random() * 100 < currentCrit);
    
    // 🟢 都市忍者 B：25% 機率暴傷翻倍
    if (isCrit && coreRes === 'ninja_B' && Math.random() < CORE_CONFIG.ninja_B.doubleCritChance) {
        cMult *= 2;
    }

    if (isGuaranteedCrit) gameState.hound.guaranteedCrit = false;

    // 🟢 都市忍者 A：必爆後下一次攻擊提升 25% 攻擊力
    if (gameState.hound.ninjaABuff) {
        currentAtk = Math.floor(currentAtk * (1 + CORE_CONFIG.ninja_A.postCritAtkBonus));
        gameState.hound.ninjaABuff = false;
    }

    let dmgDealt = isCrit ? Math.floor(currentAtk * cMult) : currentAtk;

    // 🟢 都市忍者 C：溢出閃避率轉真傷與破甲
    if (isCrit && coreRes === 'ninja_C') {
        let overflow = Math.max(0, currentDodge - CORE_CONFIG.ninja_C.dodgeOverflowThreshold);
        if (overflow > 0) dmgDealt += Math.floor(overflow * 2);
    }

    // 🟢 殭屍骰 A/C 保底與翻倍秒殺率計算
    let ohkoChance = gameState.hound.ohko || 0;
    if (coreRes === 'zombie_A') {
        ohkoChance += (gameState.hound.zombieAPity || 0);
    } else if (coreRes === 'zombie_C' && gameState.hound.zombieCBoosted) {
        ohkoChance = Math.min(CORE_CONFIG.zombie_C.maxOHKO, ohkoChance * 2);
    }

    let isOHKO = Math.random() * 100 < ohkoChance;
    let isBossEnemy = gameState.currentEnemy.isBoss || gameState.currentEnemy.id.includes('boss');

    if (isOHKO) {
        if (coreRes === 'zombie_A') gameState.hound.zombieAPity = 0; // 重置保底
        if (coreRes === 'zombie_C') gameState.hound.zombieCBoosted = true; // 觸發連鎖

        if (isBossEnemy && coreRes === 'zombie_B') {
            // 🟢 殭屍骰 B：Boss 觸發秒殺改為削減當前 5% HP
            let bossDmg = Math.floor(gameState.currentEnemy.hp * CORE_CONFIG.zombie_B.bossCurrentHpPercent);
            dmgDealt = Math.max(1, bossDmg);
            reportEl.innerHTML = `<span style="color:#c355ff;">>> [死靈壞疽] 觸發 Boss 致死效應，強制削去 ${dmgDealt} HP！</span>`;
        } else if (coreRes === 'zombie_D') {
            // 🟢 殭屍骰 D：屍爆 3 倍傷害 + 永久疊加
            dmgDealt = Math.floor(currentAtk * CORE_CONFIG.zombie_D.explosionAtkMult);
            gameState.hound.zombieDStacks = Math.min(CORE_CONFIG.zombie_D.maxStacks, (gameState.hound.zombieDStacks || 0) + 1);
            reportEl.innerHTML = `<span style="color:#00ff66;">>> [生化屍爆] 觸發屍爆造成 ${dmgDealt} 點傷害！(菌絲層數: ${gameState.hound.zombieDStacks})</span>`;
        } else {
            dmgDealt = 999999;
            reportEl.innerHTML = `<span style="color:#ff2222;">>> [致命一擊] 觸發殭屍骰效果，直接秒殺！</span>`;
        }
    } else {
        if (coreRes === 'zombie_A') gameState.hound.zombieAPity = (gameState.hound.zombieAPity || 0) + CORE_CONFIG.zombie_A.missAddOHKO;
        if (coreRes === 'zombie_C') gameState.hound.zombieCBoosted = false;

        let critTag = isGuaranteedCrit ? " <span style='color:#00ff66;'>[忍術必爆!]</span>" : (isCrit ? " <span style='color:var(--zaco-color);'>(暴擊)</span>" : "");
        reportEl.innerHTML = `>> 獵犬發動攻擊，造成 ${dmgDealt} 點傷害${critTag}。`;
    }

    // 🟢 廢土暴徒 D：暴擊重置倍率 / 未暴擊累積 +1 倍
    if (coreRes === 'thug_D') {
        if (isCrit) gameState.hound.thugDMult = CORE_CONFIG.thug_D.baseCritMult;
        else gameState.hound.thugDMult = Math.min(CORE_CONFIG.thug_D.maxCritMult, (gameState.hound.thugDMult || CORE_CONFIG.thug_D.baseCritMult) + 1);
    }

    // 🟢 清道夫 C：15% 傷害轉護盾
    if (coreRes === 'scavenger_C') {
        let shieldAdd = Math.floor(dmgDealt * CORE_CONFIG.scavenger_C.lifestealShieldPercent);
        gameState.hound.shield = (gameState.hound.shield || 0) + shieldAdd;
    }

    // 🟢 廢土暴徒 A：3 倍暴擊吸血 15%
    if (isCrit && coreRes === 'thug_A') {
        let healHp = Math.floor(dmgDealt * CORE_CONFIG.thug_A.critLifestealPercent);
        gameState.hound.hp = Math.min(gameState.hound.maxHp || 100, gameState.hound.hp + healHp);
        reportEl.innerHTML += ` <span style="color:#55ff55;">(嗜血恢復 ${healHp} HP)</span>`;
    }

    // 🟢 廢土暴徒 B：3 倍暴擊 35% 眩暈跳過敵人攻擊
    if (isCrit && coreRes === 'thug_B' && Math.random() < CORE_CONFIG.thug_B.stunChance) {
        gameState.currentEnemy.stunned = true;
        reportEl.innerHTML += ` <span style="color:#ffcc00;">[腦部震盪：目標眩暈!]</span>`;
    }

    // 🟢 都市忍者 A：必爆觸發殘影追擊 50% 傷害
    if (isCrit && coreRes === 'ninja_A') {
        let echoDmg = Math.floor(dmgDealt * CORE_CONFIG.ninja_A.echoDmgPercent);
        gameState.currentEnemy.hp -= echoDmg;
        gameState.hound.ninjaABuff = true;
        reportEl.innerHTML += `<br><span style="color:#00ff66;">> 👤 [量子殘影] 追加連擊造成 ${echoDmg} 點傷害！</span>`;
    }

    // 🟢 清道夫 A：命中回收殘屑 (10 層聚變)
    if (coreRes === 'scavenger_A' && !gameState.hound.scavengerFusionActive) {
        gameState.hound.scavengerStacks = (gameState.hound.scavengerStacks || 0) + 1;
        if (gameState.hound.scavengerStacks >= CORE_CONFIG.scavenger_A.maxStacks) {
            gameState.hound.scavengerFusionActive = true;
            reportEl.innerHTML += `<br><b style="color:#ffaa00;">>> ⚡ [廢鐵聚變] 殘屑滿載，觸發聚變反應 (ATK +120)！</b>`;
        }
    }

    gameState.currentEnemy.hp -= dmgDealt;


        // 3. 敵方反擊與秒殺檢定
    if (gameState.currentEnemy.hp > 0) {
        if (gameState.currentEnemy.stunned) {
            gameState.currentEnemy.stunned = false;
            reportEl.innerHTML += `<br><span style="color:#aaa;">💫 敵人處於眩暈狀態，無法發動攻擊！</span>`;
        } else if (Math.random() * 100 < currentDodge) { 
            reportEl.innerHTML += `<br>💨 [幻影] 獵犬靈巧地閃避了敵人的攻擊！`; 
            
            // 🟢 都市忍者 B：閃避 100% 轉護盾
            if (coreRes === 'ninja_B') {
                let shieldAdd = Math.floor(currentDodge * CORE_CONFIG.ninja_B.dodgeToShieldRatio);
                gameState.hound.shield = (gameState.hound.shield || 0) + shieldAdd;
                reportEl.innerHTML += ` <span style="color:#00ff66;">[微型電弧：護盾 +${shieldAdd}]</span>`;
            }

            if (gameState.hound.dodgeCrit) {
                gameState.hound.guaranteedCrit = true;
                reportEl.innerHTML += ` <span style="color:#00ff66;">[殘影反擊：下擊必定暴擊！]</span>`;
            }
        } else {
            let enemyAtkVal = gameState.currentEnemy.atk;
            // 🟢 深淵琉璃 D：敵人降攻效果
            if (coreRes === 'abyss_D' && gameState.hound.abyssDDebuff) {
                enemyAtkVal = Math.floor(enemyAtkVal * (1 - gameState.hound.abyssDDebuff));
            }

            let rawDmgTaken = Math.max(1, enemyAtkVal - currentDef);
            
            // 🟢 廢土暴徒 A：受傷 +10% 負面
            if (coreRes === 'thug_A') rawDmgTaken = Math.floor(rawDmgTaken * (1 + CORE_CONFIG.thug_A.selfDmgPenalty));

            // 護盾優先抵扣 EHP
            let dmgTaken = rawDmgTaken;
            if ((gameState.hound.shield || 0) > 0) {
                if (gameState.hound.shield >= dmgTaken) {
                    gameState.hound.shield -= dmgTaken;
                    dmgTaken = 0;
                } else {
                    dmgTaken -= gameState.hound.shield;
                    gameState.hound.shield = 0;
                }
            }

            gameState.hound.hp = Math.max(0, gameState.hound.hp - dmgTaken);
            reportEl.innerHTML += `<br>💥 遭受攻擊，裝甲抵禦後受傷 ${rawDmgTaken} 點 (實扣血 ${dmgTaken})。`;
            
            // 🟢 深淵琉璃 B：迴光返照 300% 晶體風暴
            if (coreRes === 'abyss_B' && !gameState.hound.abyssBUsed && (gameState.hound.hp <= 0 || gameState.hound.hp < (gameState.hound.maxHp || 100) * CORE_CONFIG.abyss_B.cheatDeathHpThreshold)) {
                gameState.hound.hp = 1; // 留 1 血
                gameState.hound.abyssBUsed = true;
                let burstDmg = Math.floor((gameState.hound.totalReflectedDmg || 500) * CORE_CONFIG.abyss_B.reflectAccumulatedBurstMult);
                gameState.currentEnemy.hp -= burstDmg;
                reportEl.innerHTML += `<br><b style="color:#00ffff;">❄️ [零度晶核] 絕境觸發迴光返照！釋放晶體風暴造成 ${burstDmg} 爆發傷害！</b>`;
            }

            // 🚀 反傷算式與深淵琉璃核心
            let reflectRate = gameState.hound.reflect || 0;
            if (reflectRate > 0) {
                let reflectDmg = Math.floor(rawDmgTaken * reflectRate); 
                
                // 🟢 深淵琉璃 A：反傷享暴擊/暴傷
                if (coreRes === 'abyss_A' && Math.random() * 100 < currentCrit) {
                    reflectDmg = Math.floor(reflectDmg * (gameState.hound.critMult || 2));
                    let healHp = Math.floor((gameState.hound.maxHp || 100) * CORE_CONFIG.abyss_A.reflectCritHealHpPercent);
                    gameState.hound.hp = Math.min(gameState.hound.maxHp || 100, gameState.hound.hp + healHp);
                    reportEl.innerHTML += ` <span style="color:#00ff66;">[反傷暴擊! +${healHp} HP]</span>`;
                }

                gameState.currentEnemy.hp -= reflectDmg;
                gameState.hound.totalReflectedDmg = (gameState.hound.totalReflectedDmg || 0) + reflectDmg;
                reportEl.innerHTML += ` <span style="color: #ff3333;">(反彈 ${reflectDmg} 傷害)</span>`;

                // 🟢 深淵琉璃 C：反傷 30% 轉護盾
                if (coreRes === 'abyss_C') {
                    let shieldAdd = Math.floor(reflectDmg * CORE_CONFIG.abyss_C.reflectToShieldPercent);
                    let maxShield = (gameState.hound.maxHp || 100) * CORE_CONFIG.abyss_C.maxShieldHpPercent;
                    gameState.hound.shield = Math.min(maxShield, (gameState.hound.shield || 0) + shieldAdd);
                }

                // 🟢 深淵琉璃 D：反傷降敵攻 5%
                if (coreRes === 'abyss_D') {
                    gameState.hound.abyssDDebuff = Math.min(CORE_CONFIG.abyss_D.maxEnemyAtkDebuff, (gameState.hound.abyssDDebuff || 0) + CORE_CONFIG.abyss_D.enemyAtkDebuffStep);
                    if (gameState.hound.abyssDDebuff >= CORE_CONFIG.abyss_D.maxEnemyAtkDebuff) {
                        gameState.hound.abyssDMaxed = true;
                    }
                }
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
        
        // 誘餌掉落機制 (15% 機率掉落，最大上限 20 個)
        if (Math.random() * 100 < 15) {
            let currentBaits = gameState.resources.baits || 0;
            if (currentBaits < 20) {
                gameState.resources.baits = currentBaits + 1;
                reportEl.innerHTML += `<br><span style="color:#ff5555; font-weight:bold;">>> 發現特殊物資：[Alpha 誘餌] x1！ (容量: ${gameState.resources.baits}/20)</span>`;
            } else {
                reportEl.innerHTML += `<br><span style="color:#888;">>> 發現 [Alpha 誘餌]，但誘餌儲存箱已滿 (20/20)，無法拾取。</span>`;
            }
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
                        // 抽中新文件
                        gameState.unlockedLore.push(newLore.id);
                        reportEl.innerHTML += `<br><b style="color:#d69e2e; font-size:1.05em;">📜 [機密解密] 尋獲副本檔案：《${newLore.title}》！</b>`;
                        if (typeof saveGameData === 'function') saveGameData(); // 建議拿到的瞬間存檔，防止跳出遺失
                    } else {
                        // 該區文件已全數收集完畢，轉化為 ZaCo 獎勵
                        gameState.resources.zaco += 50;
                        reportEl.innerHTML += `<br><span style="color:#aaa;">📜 [檔案已解析] 重複的機密資料已自動轉換為 +50 ZaCo</span>`;
                    }
                }
            } // 🚀 關鍵修復 1：這裡補上被遺漏的 isBoss 閉合大括號！
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
} // 🚀 關鍵修復 2：這裡是 handleExplorationTick 真正的結尾！

// ==========================================
// 📜 文件抽獎池引擎 (Lore Gacha Engine)
// 🚀 關鍵修復 3：將發動機移出上方迴圈，獨立為全域函數！
// ==========================================
function rollForLore(sourceTarget) {
    if (!gameConfig || !gameConfig.lore_database) return null;

    let availablePool = [];

    // 1. 遍歷整個 config.json 尋找未解鎖的檔案
    for (const cat of gameConfig.lore_database.categories) {
        for (const sub of (cat.subcategories || [])) {
            for (const item of (sub.items || [])) {
                
                // 條件 A: 來源類型吻合 (例如 "dungeon" 或 "dispatch")
                // 條件 B: 玩家尚未解鎖這個檔案 (防重複)
                if (item.sourceType === sourceTarget && !gameState.unlockedLore.includes(item.id)) {
                    availablePool.push(item);
                }
            }
        }
    }

    // 2. 如果池子裡還有東西，隨機抽出一張
    if (availablePool.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePool.length);
        return availablePool[randomIndex]; 
    }

    // 3. 如果池子空了 (該區文件已全部收集完畢)
    return null; 
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


