/*
ICS3U / ICS3C Course Culminating Task

Game: HOUR ZERO
Author: Shahriar Kabir Rafi

Description:
A top-down survival shooter where the player fights endless enemies,
collects items, unlocks abilities, and survives as long as possible.

Controls:
WASD - Move
Arrow Keys - Shoot
ESC - Pause
1 / 2 / 3 - Item Choice 

Features:
- Dynamic enemy spawning that scales with time survived
- Item collection and inventory system
- Health and shield mechanics
- Pause functionality
- Challenge & unlock system with local Storage persistence
- Visual feedback for damage and game events
- Responsive UI elements
- Music and Control in settings organized in separate tabs
- 45 day torture in the making of this game
*/

//====================
//     GAME SETUP
//====================
const gameArea = document.getElementById("gameArea");
const nukeFace = document.getElementById("nukeFace");
const titleScreen = document.getElementById("titleScreen");
const settingsScreen = document.getElementById("settingsScreen");
const timeScore = document.getElementById("timeScore");

let bullets = [], tBullets = [], enemies = [], inventoryItems = [], turrets = [], keysPressed = {};
let lastShotTime = 0, turretShotTimer = 0;
let lastTime = 0;
let gameOver = false, gameRunning = false, gameLoopId = null;
let paused = false, choosingItem = false, collectionOpen = false;
let playerRegen = 0, playerSRegen = 0, playerMShield = 0;
let pausedStart = 0, pausedTime = 0;
let startTime; let spawnItemInterval;
let totalPlayerLife;    

//====================
//  CHARACTER STATS  
//====================
let player;
let shotCoolDown = 300;

const playerStats = {
    speed: 2, //Movement value
    width: 30, height: 30,  //Dimensions of the player model    
    health: 100, //Health of the player
    shield: 0, //Shield
    extraShield: 0,//Massacre Shield Value 
    damage: 2.5,
    bulletRange: 300,
    bulletSize: 10,//Fat Bullets
    knockBack: 5,
};

const playerStatCaps = {
    speed: 25, //Need to make sure its still fun
    bulletSize: 100 //Max bullet size
}  

const enemyStat = {
    health: 10, //Will get tankier in the late game
    width: 30, height: 30,  //Dimensions of the enemy model
    damage: 2,
    speed: 1.8 
    //A little slower to make sure the player doesn't get bagged
}

//====================
//  ITEM SYSTEM  
//====================
const itemTypes = {
    speed: "speed", knockBack: "knockBack",
    damage: "damage", size: "size",
    range: "range", regen: "regen",
    sRegen: "sRegen", nuke: "nuke",
    homingShot: "homingShot", turret: "turret",
    piercingShots: "piercingShots", shotSpeed: "shotSpeed",
    massacreShield: "massacreShield"
}

const itemTypesDescription = {
    speed: `Increases player speed.
                <br>Gotta go fast!`,
    
    knockBack:  `Increase bullet knockback.
            <br>Hit them like they owe you money!`,
    
    damage: `Increase damage dealt to enemies.
            <br>The best defense is a strong offense!`,
    
    size: `Increase the size of the bullets.
    <br>If bullets don't work just throw a nuke at them!`,
    
    range: `Increase the bullet travel distance.
        <br>Snipe them like every presidential assaination!`,
    
    regen: `Regenerate health every kill.
                    <br>Blood is fuel!`,
    
    sRegen: `Generate shield every kill.
        <br>Tank attacks the way you tank cholestrol!`,
    
    nuke: `Destroy everything in sight.
<br>Turn this place into the Boston Massachusetts suburbs`,
    
    homingShot: `Bullets home in on enemies.
                    <br>The end is inevitable!
                    <br>Range is heavily reduced.
                    <br>Shot speed is reduced.`,
    
    turret: `Spawn a turret.
    <br>This isn't Tower Defense but sure!`,
    
    piercingShots: `Bullets pierce through enemies.
                            <br>Clean Shots!
                        <br>Knockback left the chat
                        <br>Damage reduce`,
    shotSpeed: `Increase shot speed
    <br>Its a pistol to you but a machine gun to me!`,

    massacreShield: `Gain sheild on nuke.
                <br> The enemy is my shield!`,
};

let inventory = {
    speed: 0, knockBack: 0,
    damage: 0, size: 0,
    range: 0, regen: 0,
    sRegen: 0, turret: 0,
    shotSpeed: 0, massacreShield: 0,
    nuke: false,
    homingShot: false,
    piercingShots: false
};

let achievements = {
    "Survivor": false
}

let challenges = {
    "First_Kill": false,
    "Psychic": false,
    "Use_Nuke": false
};



//====================
//  INVENTORY UI  
//====================
function ensureInventoryUI(){
    if (!document.getElementById("InventoryUI")){
        const inv = document.createElement("div");
        inv.id = "InventoryUI";
        inv.style.position = "absolute";
        inv.style.top = inv.style.right = "10px";
        inv.style.fontSize = "20px";
        inv.style.color = "white";
        inv.style.backgroundColor = "rgba(0,0,0,0.5)";
        inv.style.padding = inv.style.borderRadius = "10px";
        inv.style.width = "30vw";
        inv.style.textAlign = "center"
        inv.textContent = 
        `Speed: ${playerStats.speed} | ` +
        `Knockback: ${playerStats.knockBack} | ` +
        `B-Size: ${Math.round(playerStats.bulletSize)} | ` +
        `Range: ${playerStats.bulletRange} | `+
        `Damage: ${playerStats.damage} | `+
        `Regen: ${playerRegen} | `+
        `S-Regen: ${playerSRegen} |` +
        `M-Shield: ${playerMShield} |` +
        `Shoot Speed: ${Math.round(1000 / shotCoolDown)}`;
        
        document.body.appendChild(inv)
    }
}

function updateInventoryUI(){
    const inv = document.getElementById("InventoryUI");
    // Show What Item you have and not what amount of each you have like the Binding of Isaac
    if (inv){
        inv.textContent = 
        `Speed: ${playerStats.speed} | ` +
        `Knockback: ${playerStats.knockBack} | ` +
        `B-Size: ${Math.round(playerStats.bulletSize)} | ` +
        `Range: ${playerStats.bulletRange} | `+
        `Damage: ${playerStats.damage} | `+
        `Regen: ${playerRegen} | `+
        `S-Regen: ${playerSRegen} |` +
        `M-Shield: ${playerMShield} |` +
        `Shoot Speed: ${Math.round(1000 / shotCoolDown)}`;
        
        //Caret invisible
        inv.style.userSelect = "none";
        inv.style.outline = "none";
        inv.setAttribute("tabindex", "-1");
    }
}

//====================
//    HEALTH BAR  
//====================
function createHealthBar(){
    if (!document.getElementById("healthBarContainer")){
        const healthBar = document.createElement("div");
        healthBar.id = "healthBarContainer";
        healthBar.style.position = "absolute";
        healthBar.style.bottom = "10px"; healthBar.style.left = "30vw";
        healthBar.style.width = "40vw"; healthBar.style.height = "35px";
        healthBar.style.backgroundColor = "grey";
        healthBar.style.border = "2px solid white";
        healthBar.style.borderRadius = "5px";
        
        const sBar = document.createElement("div"); const bar = document.createElement("div");
        sBar.id = "shieldBar";                      bar.id = "healthBar";
        sBar.style.position = bar.style.position = "absolute";
        bar.style.width = "25%"; bar.style.height = "100%"; bar.style.top = "0px"; bar.style.borderRadius = "3px"; bar.style.background = "red";
        sBar.style.width = "25%"; sBar.style.height = "100%"; sBar.style.top = "0px"; sBar.style.borderRadius = "3px"; sBar.style.background = "blue";

        //Massace shield bar
        //Will show next to shield bar
        
        const mBar = document.createElement("div");
        mBar.id = "massacreShieldBar";
        mBar.style.position = "absolute";
        mBar.style.width = "25%"; mBar.style.height = "100%"; mBar.style.top = "0px"; mBar.style.borderRadius = "3px"; mBar.style.background = "yellow";
        
        healthBar.appendChild(bar);
        healthBar.appendChild(sBar);
        healthBar.appendChild(mBar);
        document.body.appendChild(healthBar);
    }
}

function updateHealthBar(){
    const bar = document.getElementById("healthBar");
    const sBar = document.getElementById("shieldBar");
    const mBar = document.getElementById("massacreShieldBar");
    if (!bar || !sBar || !mBar) return; // exit if bars don’t exist yet
    
    //Hard check to make sure hp and shield dont go overboard 
    if (playerStats.health > 100) playerStats.health = 100;
    if (playerStats.shield > 25) playerStats.shield = 25;
    if (playerStats.extraShield > 25) playerStats.extraShield = 25;
    
    const healthPercent = Math.max(0, Math.min(playerStats.health, 100));
    bar.style.width = `${healthPercent}%`;
    
    const shieldPercent = Math.max(0, Math.min(playerStats.shield, 100));
    sBar.style.width = `${shieldPercent}%`;

    const mShieldPercent = Math.max(0, Math.min(playerStats.extraShield, 100));
    mBar.style.width = `${mShieldPercent}%`;
}

//====================
//   PAUSE BUTTON  
//====================
function createPauseButton(){
    if (!document.getElementById("pauseBtn")){
        const btn = document.createElement("button");
        btn.style.position = "absolute";
        btn.id = "pauseBtn";
        btn.style.fontSize = "16px";
        btn.style.border = "none";
        btn.style.top = btn.style.left = "10px";
        btn.style.width = btn.style.height = "45px";
        btn.style.backgroundImage = "url(texturePack/pauseImg.png";
        btn.style.backgroundRepeat = "no repeat";
        btn.style.backgroundSize = "cover";
        
        btn.onclick = togglePause;
        document.body.appendChild(btn);
    }
}

//Pauses the game 
function togglePause(){
    if(choosingItem || gameOver || !gameRunning) return;
    paused = !paused;
    
    const pauseText = document.getElementById("pauseText");
    const pauseReturnBtn = document.getElementById("pauseReturnBtn")
    
    if(paused){
        pausedStart = Date.now();
        
        const p = document.createElement("div");
        p.id = "pauseText";
        p.style.position = "absolute";
        p.textContent = "PAUSED";
        p.style.fontSize = "50px";
        p.style.color = "white";
        p.style.top = p.style.left = "50%";
        p.style.transform = `translate(-50%,-50%)`;
        
        const pBtn = document.createElement("button");
        pBtn.onclick = returnFromGame;
        pBtn.id = "pauseReturnBtn";
        pBtn.style.position = "absolute";
        pBtn.style.fontSize = "24px";
        pBtn.textContent = "Return";
        pBtn.width = "150px"; pBtn.height = "50px";
        pBtn.style.top = "55%"; pBtn.style.left = "50%";
        pBtn.style.transform = "translateX(-50%)";
        
        gameArea.appendChild(pBtn)
        gameArea.appendChild(p);    
    }else{
        pausedTime += Date.now() - pausedStart;
        if(pauseText && pauseReturnBtn) { //Safety Check
            gameArea.removeChild(pauseText);
            gameArea.removeChild(pauseReturnBtn);
        }
    }
}

//====================
//      INPUT 
//====================
document.addEventListener("keydown", e => {
    keysPressed[e.key.toLowerCase()] = true;
    if (e.key === "Escape" && gameRunning) togglePause();
});
document.addEventListener("keyup", e => {
    keysPressed[e.key.toLowerCase()] = false;
});

//====================
//      PLAYER   
//====================
function createPlayer(){
    player = document.createElement("div");
    player.style.position = "absolute";
    player.style.width = playerStats.width + "px"; 
    player.style.height = playerStats.height + "px";
    player.style.backgroundRepeat = "no-repeat";
    player.style.backgroundSize = "cover";
    
    player.x = (gameArea.clientWidth - playerStats.width) / 2;
    player.y = (gameArea.clientHeight - playerStats.height) / 2;
    player.style.transform = `translate(${player.x}px, ${player.y}px)`;
    
    // starting player texture
    player.style.backgroundImage = `url(texturePack/Down_Player.png)`;
    
    gameArea.appendChild(player)
}

//====================
//     SHOOTING   
//====================
function shootBullet(direction){
    if (paused) return;
    
    const bullet = document.createElement("div");
    bullet.style.position = "absolute";
    bullet.style.backgroundColor = "yellow  ";
    bullet.style.borderRadius = "100%";
    bullet.style.width = playerStats.bulletSize + "px"; 
    bullet.style.height = playerStats.bulletSize + "px";
    
    //Position the bullet to the center of the player
    bullet.x = player.x + playerStats.width / 2 - playerStats.bulletSize / 2;
    bullet.y = player.y + playerStats.height / 2 - playerStats.bulletSize / 2;
    //the bullet position goes to the x coord of the player, get added to half of the playerStat and subtract half of the bullet size
    
    bullet.direction = direction;
    bullet.speed = 5;
    bullet.startX = bullet.x;
    bullet.startY = bullet.y
    bullet.range = playerStats.bulletRange;
    bullet.damage = playerStats.damage; // This is the damage of the bullet
    
    bullet.style.transform = `translate(${bullet.x}px, ${bullet.y}px)`;
    gameArea.appendChild(bullet);
    bullets.push(bullet);
}

function turretBullets(){
    if (paused || turrets.length === 0 || enemies.length === 0) return;
    
    turrets.forEach(turret => {
        // find nearest enemy
        let nearest = null;
        let minDist = Infinity;
        
        enemies.forEach(enemy => {
            const dx = enemy.x - turret.x;
            const dy = enemy.y - turret.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });
        if (nearest) {
            const dx = nearest.x - turret.x;
            const dy = nearest.y - turret.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const bullet = document.createElement("div");
            bullet.style.position = "absolute";
            bullet.style.backgroundColor = "purple";
            bullet.style.borderRadius = "100%";
            bullet.style.width = playerStats.bulletSize + "px";
            bullet.style.height = playerStats.bulletSize + "px";
            bullet.x = turret.x + playerStats.width / 2 - playerStats.bulletSize / 2;
            bullet.y = turret.y + playerStats.height / 2 - playerStats.bulletSize / 2;
            bullet.dx = (dx / dist) * 5;
            bullet.dy = (dy / dist) * 5;
            bullet.startX = bullet.x;
            bullet.startY = bullet.y;
            bullet.range = playerStats.bulletRange + 100; //Turrets have a larger range to compensate for their static state
            bullet.damage = playerStats.damage;
            bullet.style.transform = `translate(${bullet.x}px, ${bullet.y}px)`;
            gameArea.appendChild(bullet);
            tBullets.push(bullet);
        }
    });
}

function updateBullets(deltaTime){
    if (paused || !player) return;
    
    for (let i = bullets.length - 1; i >= 0; i--){
        const blt = bullets[i];
        
        //Bullet homing code
        if (inventory.homingShot === true && enemies.length > 0) {
            homingMissile(blt, deltaTime);
        }else{
            //Regular bullet movement (scale by deltaTime)
            if (blt.direction === "up")blt.y -= blt.speed * deltaTime * 60;
            if (blt.direction === "down")blt.y += blt.speed * deltaTime * 60;
            if (blt.direction === "left")blt.x -= blt.speed * deltaTime * 60;
            if (blt.direction === "right")blt.x += blt.speed * deltaTime * 60;
        }
        
        blt.style.transform = `translate(${blt.x}px,${blt.y}px)`;
        
        //Check if bullet is on the screen
        const dx = blt.x - blt.startX;
        const dy = blt.y - blt.startY;
        const distTravelled = Math.sqrt(dx * dx + dy * dy);
        const areaLimitX = blt.x < 0 || blt.x > gameArea.clientWidth;
        const areaLimitY = blt.y < 0 || blt.y > gameArea.clientHeight;
        
        
        if (distTravelled > blt.range || areaLimitX || areaLimitY){
                if (blt.parentNode === gameArea) gameArea.removeChild(blt);
                bullets.splice(i , 1);
        }    
    }
}

function turretUpdateBullets(deltaTime){
    if (paused) return;
    
    for (let i = tBullets.length - 1; i >= 0; i--){
        const blt = tBullets[i];
        
        blt.x += blt.dx * deltaTime * 60;
        blt.y += blt.dy * deltaTime * 60;
        
        blt.style.transform = `translate(${blt.x}px,${blt.y}px)`;
        
        const dx = blt.x - blt.startX;   const dy = blt.y - blt.startY;
        const distTravelled = Math.sqrt(dx * dx + dy * dy);
        const areaLimitX = blt.x < 0 || blt.x > gameArea.clientWidth;
        const areaLimitY = blt.y < 0 || blt.y > gameArea.clientHeight;
        
        
        if (distTravelled > blt.range || areaLimitX || areaLimitY){
                if (blt.parentNode === gameArea) gameArea.removeChild(blt);
                tBullets.splice(i , 1);
        }    
    }
}

//====================
//      ENEMIES   
//====================
function spawnEnemy(){
    if (gameOver || paused) return;
    
    const enemy = document.createElement("div");
    enemy.style.position = "absolute";
    enemy.style.width = enemyStat.width + "px";  enemy.style.height = enemyStat.height + "px";
    enemy.style.backgroundImage = `url(texturePack/enemy.png)`;
    enemy.style.backgroundSize = "cover";
    enemy.style.backgroundRepeat = "no-repeat";
    
    enemy.health = enemyStat.health; enemy.damage = enemyStat.damage;
    
    let dist;
    
    do{ 
        enemy.x = Math.random() * (gameArea.clientWidth - enemyStat.width);
        enemy.y = Math.random() * (gameArea.clientHeight - enemyStat.height)
        
        const dx = (player.x + playerStats.width / 2) - (enemy.x + enemyStat.width / 2);
        const dy = (player.y + playerStats.height / 2) - (enemy.y + enemyStat.height / 2);
        dist = Math.sqrt(dx * dx + dy * dy);

    }while(dist <= 500);//check the distance between enemy position to player position

    const elapsedTime = Math.floor((Date.now() - startTime) / 60000); //60000 = 1 minute
    
    //Cap the enemy speed because I am not a bad person
    const maxEnemySpeed = 9;
    enemy.health = Math.max(enemyStat.health, enemyStat.health * elapsedTime * 0.5);
    enemy.speed = Math.min(enemyStat.speed + elapsedTime * 0.5, maxEnemySpeed);
    enemy.damage = Math.max(enemyStat.damage, enemyStat.damage + elapsedTime * 0.5)
    
    enemy.style.transform = `translate(${enemy.x}px,${enemy.y}px)`;
    gameArea.appendChild(enemy);
    enemies.push(enemy);
}

function updateEnemies(deltaTime){
    if (paused || !player) return;
    
    for (let i = enemies.length - 1; i >= 0; i--){
        const emy = enemies[i];
        if (!emy || !emy.parentNode){
            enemies.splice(i,1);
            continue;
        }
        const dx = (player.x + playerStats.width / 2) - (emy.x + enemyStat.width / 2);
        const dy = (player.y + playerStats.height / 2) - (emy.y + enemyStat.height / 2);  
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let emyDeath = false;
        
        //Collision with player
        if (
            player.x < emy.x + enemyStat.width &&
            player.x + playerStats.width > emy.x &&
            player.y < emy.y + enemyStat.height &&
            player.y + playerStats.height > emy.y 
        ){
            let damage = emy.damage;
            
            //Shield mechanics
            if (playerStats.shield > 0) {
                const shieldFactor = 2; // 1 shield absorbs 2 damage
                const shieldAbsorb = playerStats.shield * shieldFactor;
                
                if (damage <= shieldAbsorb) {
                    // Shield absorbs all damage
                    playerStats.shield -= damage / shieldFactor;
                    damage = 0;
                } else {
                    // Shield is fully depleted, remaining damage hits health
                    damage -= shieldAbsorb;
                    damage = Math.max(0, damage); // prevent negative damage
                    playerStats.shield = 0;
                }
            }
            
            //Extra Shield mechanics (Massacre Shield)
            if (damage > 0 && playerStats.extraShield > 0) {
                const shieldFactor = 2; // 1 shield absorbs 2 damage
                const shieldAbsorb = playerStats.extraShield * shieldFactor;
                
                if (damage <= shieldAbsorb) {
                    // Extra Shield absorbs all remaining damage
                    playerStats.extraShield -= damage / shieldFactor;
                    damage = 0;
                } else {
                    // Extra Shield is fully depleted, remaining damage hits health
                    damage -= shieldAbsorb;
                    damage = Math.max(0, damage); // prevent negative damage
                    playerStats.extraShield = 0;
                }
            }
            
            if (damage > 0) playerStats.health -= damage;
            
            updateHealthBar();
            enemies.splice(i , 1);
            if (emy.parentNode === gameArea) gameArea.removeChild(emy);
            if (playerStats.health <= 0) endGame(); 
            continue;
        }
        
        
        for (let j = bullets.length - 1; j >= 0; j--){
            const blt = bullets[j];
            const hit = 
                blt.x + playerStats.bulletSize > emy.x &&
                blt.x < emy.x + enemyStat.width &&
                blt.y + playerStats.bulletSize > emy.y &&
                blt.y < emy.y + enemyStat.height;
            
            // Bullet hit enemy
            //Add piercing shot logic
            if (hit){
                emy.classList.add("hit");
                showDamage(emy.x + 10, emy.y, blt.damage);
                
                const dx = emy.x - blt.x;
                const dy = emy.y - blt.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const distTravelled = Math.sqrt(
                    (blt.x - blt.startX) * (blt.x - blt.startX) +
                    (blt.y - blt.startY) * (blt.y - blt.startY)
                );
                
                if (dist !== 0 && inventory.piercingShots === false){
                    emy.x += (dx / dist) * playerStats.knockBack * deltaTime * 60;
                    emy.y += (dy / dist) * playerStats.knockBack * deltaTime * 60;
                }
                
                let areaLimitX = blt.x < 0 || blt.x > gameArea.clientWidth;
                let areaLimitY = blt.y < 0 || blt.y > gameArea.clientHeight;
                
                if (distTravelled > blt.range || areaLimitX || areaLimitY){
                        if (blt.parentNode === gameArea) gameArea.removeChild(blt);
                        bullets.splice(j, 1);
                }
                
                emy.health -= blt.damage;
                
                
                if (inventory.piercingShots === false){
                    if (blt.parentNode === gameArea) gameArea.removeChild(blt);
                    bullets.splice(j , 1);    
                }
                if (emy.health <= 0){
                    
                    //Unlock first kill
                    unlockChallenge("First_Kill");
                    
                    //Regeneration func
                    if (inventory.regen && playerStats.health < 100){
                        playerStats.health += playerRegen * (inventory.regen * 0.1); //Not to make it too overpowered
                        updateHealthBar();
                    }
                    
                    //Shield regeneration func
                    if (inventory.sRegen && playerStats.shield < 25){
                        playerStats.shield += (playerSRegen * (inventory.sRegen * 1.1));
                        updateHealthBar();
                    }
                
                    if (emy.parentNode === gameArea) gameArea.removeChild(emy);
                    enemies.splice(i , 1);
                    emyDeath = true;
                    break;
                }
                setTimeout(() => {
                    emy.classList.remove('hit');
                }, 100)
            }
        }
        
        if (emyDeath) continue;
        
        // Turret bullets collision
        // 1 in 4 chance to make a circle radius 20 that kills any enemy inside it
        for (let j = tBullets.length - 1; j >= 0; j--){
            const blt = tBullets[j];
            const hit = 
                blt.x + playerStats.bulletSize > emy.x &&
                blt.x < emy.x + enemyStat.width &&
                blt.y + playerStats.bulletSize > emy.y &&
                blt.y < emy.y + enemyStat.height;
            
            if (hit){
                emy.classList.add("hit");
                showDamage(emy.x + 10, emy.y, blt.damage)

                emy.health -= blt.damage;
                
                if (blt.parentNode === gameArea) gameArea.removeChild(blt);
                
                tBullets.splice(j , 1);
                
                //Void circle
                if (Math.random() < 0.25){ // 25% chance
                    const voidCircle = document.createElement("div");
                    voidCircle.style.position = "absolute";
                    voidCircle.style.width = voidCircle.style.height = "100px";
                    voidCircle.style.borderRadius = "100%";
                    voidCircle.style.backgroundImage = "url(texturePack/VOID.png)";
                    voidCircle.style.backgroundPosition = "absolute";
                    voidCircle.style.backgroundRepeat = "no-repeat";
                    voidCircle.style.backgroundSize = "contain";
                    voidCircle.style.zIndex = "1000";
                    voidCircle.style.pointerEvents = "none";
                    voidCircle.style.left = `${blt.x}px`;
                    voidCircle.style.top = `${blt.y}px`;
                    gameArea.appendChild(voidCircle);
                    
                    const voidX = blt.x + playerStats.bulletSize / 2;
                    const voidY = blt.y + playerStats.bulletSize / 2;
                    
                    const voidInterval = setInterval(() => {
                        enemies.forEach(otherEmy => {
                            const odx = (otherEmy.x + enemyStat.width / 2) - voidX;  
                            const ody = (otherEmy.y + enemyStat.height / 2) - voidY;
                            const odist = Math.sqrt(odx * odx + ody * ody);
                            if (odist <= 50){ // radius of 50
                                //Void deletes enemies instantly
                                if (otherEmy.parentNode === gameArea) gameArea.removeChild(otherEmy);
                                enemies.splice(enemies.indexOf(otherEmy), 1);
                                showDamage(otherEmy.x + 10, otherEmy.y, "VOID");
                                
                                //Regen player health only for void kills
                                if (playerStats.health < 100){
                                    playerStats.health += 2.5 * (20 * 0.1);
                                    updateHealthBar();
                                }
                            }
                        });
                    }, 50); // Check every 50ms for enemies in the void
                    
                    setTimeout(() => {
                        clearInterval(voidInterval);
                        if (voidCircle.parentNode === gameArea) gameArea.removeChild(voidCircle);
                    }, 500);
                }


                if (emy.health <= 0){
                    if (emy.parentNode === gameArea) gameArea.removeChild(emy);
                    enemies.splice(i , 1);
                    emyDeath = true;
                    break;
                }
                setTimeout(() => {
                    emy.classList.remove("hit");
                }, 100)
            }
        }
        if (emyDeath) continue;
        
        //Moves enemy after checking all possible instances of death
        
        if (dist !== 0){
                emy.x += (dx/ dist) * emy.speed * deltaTime * 60;
                emy.y += (dy/ dist) * emy.speed * deltaTime * 60;
            }
            
            emy.style.transform = `translate(${emy.x}px,${emy.y}px)`;
    }
}

//====================
//      TURRET   
//====================
function createTurret(){
    if (gameOver) return;
    
    const turret = document.createElement("div");
    turret.style.position = "absolute";
    turret.style.width = playerStats.width + "px";  turret.style.height = playerStats.height + "px";
    turret.style.backgroundImage = "url(texturePack/turret.png)";
    turret.style.border = "2px solid black";
    turret.style.backgroundSize = "contain";
    turret.style.backgroundRepeat = "no-repeat";
    turret.style.backgroundPosition = "center";
    
    const size = playerStats.width;
    const maxX = Math.max(0, gameArea.clientWidth - size * 2);
    const maxY = Math.max(80, gameArea.clientHeight - size - 50); // health bar and score size spared
    
    turret.x = Math.random() * maxX; 
    turret.y = Math.random() * maxY;
    turret.style.transform = `translate(${turret.x}px,${turret.y}px)`;
    
    gameArea.appendChild(turret);
    turrets.push(turret);
}

//====================
//    SHOW DAMAGE
//====================

function showDamage(x, y, amount){
    const dmg = document.createElement("div");
    dmg.className = "damage-number";
    if (amount === "VOID"){
        dmg.textContent = "VOID";
        dmg.style.color = "purple";
        dmg.style.fontSize = "20px";
    }else if (amount === "NUKE"){
        dmg.textContent = "NUKE";
        dmg.style.color = "red";
        dmg.style.fontSize = "30px";
    }else{ 
        dmg.textContent = `-${amount}`;
    }
    dmg.style.left = `${x + Math.random() * 10 - 5}px` //Randomize the postion 
    dmg.style.top = `${y}px`;

    if (amount >= 50){
        dmg.style.color = "orange";
        dmg.style.fontSize = "24px";
    }

    gameArea.appendChild(dmg);
    if (amount === "VOID" || amount === "NUKE") {
        setTimeout(() => dmg.remove(), 1000); 
        return
    };
    setTimeout(() => dmg.remove(), 600);
}


//====================
//     GAME OVER   
//====================
function endGame(){
    gameOver = true;
    gameRunning = false;
    stopAllMusic();
    player.style.backgroundColor = "red";
    player.style.backgroundImage = "none";
    clearInterval(nextSpawnTimeout);
    bullets.forEach(b => gameArea.removeChild(b));
    tBullets.forEach(b => gameArea.removeChild(b));
    enemies.forEach(e => gameArea.removeChild(e));
    turrets.forEach(t => gameArea.removeChild(t));
    
    bullets = []; tBullets = []; enemies = []; turrets = [];
    
    const mainMenu = document.createElement("button");
    mainMenu.innerText = "Main Menu";
    mainMenu.style.position = "absolute";
    mainMenu.style.width = "250px"; mainMenu.style.height = "50px";
    mainMenu.style.top = "50%";  mainMenu.style.left = "20%";
    mainMenu.style.transform = `translateY(-50%)`;
    mainMenu.style.fontSize = "24px";
    mainMenu.onclick = () => location.reload();
    
    const restartBtn = document.createElement("button");
    restartBtn.innerText = "Restart";
    restartBtn.style.position = "absolute";
    restartBtn.style.width = "250px"; restartBtn.style.height = "50px"
    restartBtn.style.top = "50%"; restartBtn.style.left = "65%";
    restartBtn.style.transform = `translateY(-50%)`;
    restartBtn.style.fontSize = "24px";
    restartBtn.onclick = () => resetGame();
    
    gameArea.appendChild(mainMenu);
    gameArea.appendChild(restartBtn);
}

function cleanStats(){
    // Stop game
    gameOver = false;
    paused = false;
    choosingItem = false;
    
    // Clear timers
    clearInterval(nextSpawnTimeout);
    clearInterval(spawnItemInterval);
    spawnItemInterval = null;
    
    // Reset arrays
    bullets.forEach(b => b.remove());
    tBullets.forEach(b => b.remove());
    enemies.forEach(e => e.remove());
    inventoryItems.forEach(i => i.remove());
    turrets.forEach(t => t.remove());
    
    bullets = []; tBullets = []; enemies = []; inventoryItems = []; turrets = [];
    
    // Reset stats
    playerStats.health = 100;
    playerStats.shield = 0;
    playerStats.speed = 2;
    playerStats.damage = 2.5;
    playerStats.bulletSize = 10;
    playerStats.bulletRange = 300;
    playerStats.knockBack = 5;
    
    // Reset inventory
    inventory = {
        speed: 0, knockBack: 0,
        damage: 0, size: 0,
        range: 0, regen: 0,
        sRegen: 0, turret: 0,
        nuke: false, homingShot: false,
        piercingShots: false
    };
    
    playerRegen = 0; playerSRegen = 0;
    pausedTime = 0;
    
    // Clear UI
    gameArea.innerHTML = "";
    document.getElementById("InventoryUI")?.remove();
    document.getElementById("healthBarContainer")?.remove();
    document.getElementById("pauseBtn")?.remove();

    //Stop Animation Frames
    if (gameLoopId !== null){
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }    
    
}

function resetGame() {
    //Clean Variables
    cleanStats();

    // Restart
    startGame();
}

//====================
//    ITEM SYSTEM   
//====================
function spawnItem(){
    if (gameOver || paused) return;
    
    const hSize = 20; const wSize = 30
    const item = document.createElement("div");
    item.style.width = wSize + "px";
    item.style.height = hSize + "px";
    item.style.position = "absolute";
    item.style.backgroundImage = 'url(texturePack/Chest.png)';
    item.style.backgroundRepeat = "no-repeat";
    item.style.backgroundPosition = "center";
    item.style.backgroundSize = "cover";
    
    //Limit spawning within the screen
    const maxX = gameArea.clientWidth - hSize * 2;
    const maxY = gameArea.clientHeight - wSize - 50; // health bar and score size spared
    
    item.x = Math.min(Math.random() * maxX, maxX);
    item.y = Math.min(Math.random() * maxY, maxY);
    
    if (item.y < 80) item.y = 80;
    
    item.style.transform = `translate(${item.x}px,${item.y}px)`;
    
    inventoryItems.push(item);
    gameArea.appendChild(item);
}

function checkItemPickUp(){
    if (paused) return;
    
    for (let i = inventoryItems.length - 1; i >= 0; i--){
        const item = inventoryItems[i];
        const overlap = 
            player.x < item.x + 20 &&
            player.x + playerStats.width > item.x &&
            player.y < item.y + 20 &&
            player.y + playerStats.height > item.y;
        
        if (overlap){
            gameArea.removeChild(item);
            inventoryItems.splice(i, 1);
            showItemChoice();
        }
    }
}

function showItemChoice(){
    paused = true, choosingItem = true;
    pausedStart = Date.now();
    
    // Choose 3 random item types
    const types = Object.values(itemTypes).filter(type => {
        if (["homingShot","piercingShots"].includes(type)) return !inventory[type];
        return true;
    });
    
    const choices = [];
    while (choices.length < 3) {
        const t = types[Math.floor(Math.random() * types.length)];
        if (!choices.includes(t)) choices.push(t);
    }
    
        //remove UI after taking item
    function selectItem(type, selectedBtn){
        if (!selectedBtn) return;

        document.removeEventListener("keydown", itemKeyHandler);

        //Highlight
        buttons.forEach(btn =>{
            btn.classList.add("disabled");
        })

        selectedBtn.classList.remove("disabled");
        selectedBtn.classList.add("selected");

        applyItemEffect(type);
        collectItem(type);
        updateInventoryUI();
        
        // Remove UI
        //Wait a bit before removal
        setTimeout(() => {
            document.getElementById("itemChoiceContainer")?.remove();    
        }, 100);
        
        // Wait 1 second, then resume
        setTimeout(() => {
            pausedTime += Date.now() - pausedStart;
            paused = false;
            choosingItem = false;
        }, 2000);
    } 
    
    // Create container UI
    const choiceContainer = document.createElement("div");
    choiceContainer.id = "itemChoiceContainer";
    choiceContainer.style.display = "flex";
    choiceContainer.style.position = "absolute";
    choiceContainer.style.top = choiceContainer.style.left = "50%";
    choiceContainer.style.transform = `translate(-50%,-50%)`;
    choiceContainer.style.backgroundColor = "rgba(0,0,0,0.8)";
    choiceContainer.style.padding = "20px";
    choiceContainer.style.gap = "20px";
    
    // Keyboard support
    function itemKeyHandler(e){
        if (!choosingItem) return;
        if (e.key === "1" && choices[0]) selectItem(choices[0], buttons[0]);
        if (e.key === "2" && choices[1]) selectItem(choices[1], buttons[1]);
        if (e.key === "3" && choices[2]) selectItem(choices[2], buttons[2]);
    }
    document.addEventListener("keydown", itemKeyHandler);
    
    // Buttons
    const buttons = [];

    choices.forEach((type, index) => {
        const btn = document.createElement("button");
        btn.classList.add("itemChoiceButton")
        btn.innerHTML = `<b>${index + 1}</b><br>${itemTypesDescription[type]}`;
        btn.style.fontSize = "35px";
        btn.style.width = "400px";
        btn.style.height = "500px";
        btn.onclick = () => selectItem(type, btn);
        
        buttons.push(btn);
        
        choiceContainer.appendChild(btn);
    });
    
    gameArea.appendChild(choiceContainer);
}

function applyItemEffect(type){
    switch (type){
        case itemTypes.speed:
            inventory.speed++;
            playerStats.speed = Math.min(playerStats.speed * 1.2, playerStatCaps.speed);
            break;
        case itemTypes.size:
            inventory.size++;
            playerStats.bulletSize = Math.min(playerStats.bulletSize * 1.5, playerStatCaps.bulletSize);
            break;
        case itemTypes.damage:
            inventory.damage++;
            playerStats.damage = Math.round(playerStats.damage * 1.2 * 100) / 100
            break;
        case itemTypes.knockBack:
            inventory.knockBack++;
            playerStats.knockBack *= 1.2;
            break;
        case itemTypes.range:
            inventory.range++;
            if (inventory.homingShot){
                playerStats.bulletRange += 2.5;
            }else{
                playerStats.bulletRange += 30; //Slight increase to not make homing shots too overpowered
            }
            break;
        case itemTypes.regen:
            inventory.regen += 1;
            playerRegen += 1;
            break;
        case itemTypes.sRegen:
            inventory.sRegen += 0.5;
            playerSRegen += 1;
            break;
        case itemTypes.turret:
            inventory.turret++;
            createTurret();
            break;
        case itemTypes.nuke:
            inventory.nuke = true;
            triggerNuke();
            break;
        case itemTypes.homingShot:
            inventory.homingShot = true;
            playerStats.bulletRange = Math.round(playerStats.bulletRange * 0.25 * 100) / 100; //Decrease range for balance
            shotCoolDown += 200; //So that homing and piercing shots aren't guarenteed wins
            break;
        case itemTypes.piercingShots:
            inventory.piercingShots = true;
            playerStats.knockBack = 0 //Remove knockback for balancing 
            playerStats.damage = Math.round(playerStats.damage * 0.2 * 100) / 100; //Decrease damage by 5 for balancing
            break;
        case itemTypes.shotSpeed:
            inventory.shotSpeed++;
            shotCoolDown = Math.max(10, shotCoolDown - 20);
            break;
        case itemTypes.massacreShield:
            inventory.massacreShield += 0.5;
            playerMShield += 1;
            break;
    }
}

function homingMissile(blt, deltaTime){
    let closestEnemy, closestDist = Infinity;

    if (inventory.piercingShots === true) {
        unlockChallenge("Psychic");
    }
    
    enemies.forEach(emy => {
        const dx = (emy.x + enemyStat.width / 2) - (blt.x + playerStats.bulletSize / 2);
        const dy = (emy.y + enemyStat.height / 2) - (blt.y + playerStats.bulletSize / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = emy;
            }
        });
    if (closestEnemy){
        const dx = (closestEnemy.x + enemyStat.width / 2) - (blt.x + playerStats.bulletSize / 2);
        const dy = (closestEnemy.y + enemyStat.height / 2) - (blt.y + playerStats.bulletSize / 2);
        const angle = Math.atan2(dy, dx);
        
        blt.x += Math.cos(angle) * blt.speed * deltaTime * 60;
        blt.y += Math.sin(angle) * blt.speed * deltaTime * 60;
        //Homing bullet going to the direction of the closest enemy and continuing that direction
        
        if (closestEnemy.health <= 0 && inventory.piercingShots === true){
            //If the closest enemy is dead and piercing shots are active, continue regular bullet movement
            if (blt.direction === "up") blt.y -= blt.speed * deltaTime * 60;
            if (blt.direction === "down") blt.y += blt.speed * deltaTime * 60;
            if (blt.direction === "left") blt.x -= blt.speed * deltaTime * 60;
            if (blt.direction === "right") blt.x += blt.speed * deltaTime * 60;
        }
    }
}

function triggerNuke(){
    if (!inventory.nuke) return;
    inventory.nuke = false;
    gameArea.classList.add("shake");
    unlockChallenge("Use_Nuke");

    // STEP 1 — WHITE FLASH
    nukeFace.style.transition = "none";
    nukeFace.style.backgroundImage = "none";
    nukeFace.style.opacity = "1";

    // Force repaint
    nukeFace.offsetHeight;

    // STEP 2 — SHOW NUKE BABY AFTER FLASH
    setTimeout(() => {
        nukeFace.style.backgroundImage = "url(texturePack/nukeBaby.jpg)";
        nukeFace.style.transition = "opacity 2.5s ease-out";
        nukeFace.style.opacity = "0";
    }, 150); // flash duration (ms)

    setTimeout(() => {
        gameArea.classList.remove("shake");
    }, 200); // shake after flash (ms)



    

    // Kill all enemies
    enemies.forEach(e => {
        e.remove();
        playerStats.extraShield = (playerMShield * (inventory.massacreShield * 1.1)); // Reset extra shield to only account for 1 enemy if any
        updateHealthBar();
        showDamage(e.x + 10, e.y, "NUKE");
    });
    enemies = [];

    clearTimeout(nextSpawnTimeout);
    setTimeout(() => {
        if (!gameOver) dynamicSpawn();
    }, 3000);
}


//====================
// COLLECTION SYSTEM
//====================
const collectionScreen = document.getElementById("collectionScreen");
const challengeDetailContainer = document.getElementById("challengeDetailContainer");

let collectedItems = {
    speed: false,
    knockBack: false,
    damage: false,
    size: false,
    range: false,
    regen: false,
    sRegen: false,
    turret: false,
    nuke: false,
    homingShot: false,
    piercingShots: false,
    shotSpeed: false,
    massacreShield: false
};

// Info objects
let challengesInfo = {
    "First_Kill": {
        condition: "Kill your first enemy",
        description: "Defeat an enemy to complete this challenge."
    },
    "Psychic": {
        condition: "Obtain homing and piercing",
        description: "Aiming is overrated."
    },
    "Use_Nuke": {
        condition: "Detonate the nuke",
        description: "Destroy all enemies at once using the nuke item."
    }
};

let itemsInfo = {
    speed: { condition: "Increase speed", description: "Make your player faster." },
    knockBack: { condition: "Increase knock back", description: "Bullets push enemies back further." },
    damage: { condition: "Increase damage", description: "Deal more damage with your attacks." },
    size: { condition: "Increase bullet size", description: "Bigger bullets hit harder!" },
    range: { condition: "Increase bullet range", description: "Shoot farther." },
    regen: { condition: "Health regen", description: "Gain health per kill." },
    sRegen: { condition: "Shield regen", description: "Gain shield per kill." },
    turret: { condition: "Spawn a turret", description: "Turrets help you fight automatically." },
    nuke: { condition: "Use a nuke", description: "Destroy all enemies on screen." },
    homingShot: { condition: "Homing bullets", description: "Bullets will follow enemies." },
    piercingShots: { condition: "Piercing bullets", description: "Bullets pierce through enemies." },
    shotSpeed: { condition: "Increases shot speed", description: "Shoot bullets faster." },
    massacreShield: { condition: "Massacre Shield", description: "Gain extra shield when using nuke." }
};

let achievementsInfo = {
    Survivor: { condition: "Survive 1000 seconds", description: "Man I wish I could figure out what to achievement." }
};

function collectItem(itemName) {
    if (collectedItems.hasOwnProperty(itemName)) {
        collectedItems[itemName] = true;
        localStorage.setItem('collectedItems', JSON.stringify(collectedItems)); // Save to localStorage
    }
    notifyCollectionChange(); // <-- make sure UI updates ASAP
}

function unlockChallenge(challengeName) {
    challenges[challengeName] = true;
    localStorage.setItem('challenges', JSON.stringify(challenges)); // Save to localStorage
    notifyCollectionChange(); // <-- update UI
}

function achievementFeature(achievementName) {
    achievements[achievementName] = true;
    localStorage.setItem('achievements', JSON.stringify(achievements)); // Save to localStorage
    notifyCollectionChange(); // <-- update UI
}

//Format item names
function formatKey(key) {
    switch (key) {
        case "sRegen":
            return "Shield Regeneration";
        case "nuke":
            return "Nuke";
        case "piercingShots":
            return "Piercing Shots";
        case "homingShot":
            return "Homing Shots";
        case "shotSpeed":
            return "Shot Speed";
        case "knockBack":
            return "Knock Back";
        case "First_Kill":
            return "First Kill";
        case "Use_Nuke":
            return "Use Nuke";
        case "massacreShield":
            return "Massacre Shield";
        default:
            return key.charAt(0).toUpperCase() + key.slice(1);
    }
}


// Generic to show details
function showDetail(key, type) {
    if (!challengeDetailContainer) return;

    challengeDetailContainer.innerHTML = "";

    let info;
    if (type === "challenge") info = challengesInfo[key];
    if (type === "item") info = itemsInfo[key];
    if (type === "achievement") info = achievementsInfo[key];

    const left = document.createElement("div");
    left.className = "leftSide";

    const title = document.createElement("h2");
    title.textContent = formatKey(key);

    const subtitle = document.createElement("h4");
    subtitle.textContent = info?.condition || "Condition";

    const description = document.createElement("p");
    description.textContent = info?.description || "";

    left.appendChild(title);
    left.appendChild(subtitle);
    left.appendChild(description);

    const right = document.createElement("div");
    right.className = "rightSide";

    const circleBtn = document.createElement("button");
    circleBtn.className = "circleButton";
    circleBtn.style.width = circleBtn.style.height = "250px";

    if (collectedItems[key] || challenges[key] || achievements[key]) {
        circleBtn.style.backgroundImage = "url(texturePack/itemSprite/" + key + ".png)";
    } else {
        console.log(key);
        circleBtn.style.backgroundImage = "url(texturePack/itemSprite/" + key + "-Locked.png)";
    }


    
    circleBtn.style.backgroundSize = "contain";
    circleBtn.style.backgroundRepeat = "no-repeat";
    circleBtn.style.backgroundPosition = "center";
    circleBtn.disabled = true;

    right.appendChild(circleBtn);
    challengeDetailContainer.appendChild(left);
    challengeDetailContainer.appendChild(right);
}

// Switch tabs
function switchCollectionTab(tabName) {
    const tabs = document.querySelectorAll(".collectionTab");
    const contents = document.querySelectorAll(".collectionTabContent");

    tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tab === tabName));
    contents.forEach(content => content.id === tabName ? content.style.display = "flex" : content.style.display = "none");

    // Clear detail panel
    if (challengeDetailContainer) challengeDetailContainer.innerHTML = "";
}

// Update Collection UI
function updateCollectionUI() {
    if (!collectionScreen) return;

    const itemsTab = document.getElementById("itemsTab");
    const challengesTab = document.getElementById("challengesTab");
    const achievementsTab = document.getElementById("achievementsTab");

    // --- ITEMS ---
    if (itemsTab) {
        itemsTab.innerHTML = "";
        Object.keys(itemsInfo).forEach(key => {
            const unlocked = collectedItems[key] === true;
            const btn = document.createElement("button");
            btn.textContent = formatKey(key);
            btn.className = unlocked ? "unlocked" : "locked";
            btn.style.width = "150px";
            btn.style.height = "50px";
            btn.style.fontSize = "18px";
            btn.onclick = () => showDetail(key, "item");
            itemsTab.appendChild(btn);
        });
    }

    // --- CHALLENGES ---
    if (challengesTab) {
        challengesTab.innerHTML = "";
        Object.keys(challenges).forEach(key => {
            const unlocked = challenges[key];
            const btn = document.createElement("button");
            btn.textContent = formatKey(key);
            btn.className = unlocked ? "unlocked" : "locked";
            btn.style.width = "150px";
            btn.style.height = "50px";
            btn.style.fontSize = "18px";
            btn.onclick = () => showDetail(key, "challenge");
            challengesTab.appendChild(btn);
        });
    }

    // --- ACHIEVEMENTS ---
    if (achievementsTab) {
        achievementsTab.innerHTML = "";
        Object.keys(achievements).forEach(key => {
            const unlocked = achievements[key];
            const btn = document.createElement("button");
            btn.textContent = key;
            btn.className = unlocked ? "unlocked" : "locked";
            btn.style.width = "150px";
            btn.style.height = "50px";
            btn.style.fontSize = "18px";
            btn.onclick = () => showDetail(key, "achievement");
            achievementsTab.appendChild(btn);
        });
    }
}

// Open / Close collection
function openCollection() {
    collectionOpen = true;

    titleScreen.style.display = "none";
    collectionScreen.style.display = "block";

    updateCollectionUI(); // ✅ always refresh
    switchCollectionTab("itemsTab"); // optional default
}

function closeCollection() {
    collectionOpen = false;

    collectionScreen.style.display = "none";
    titleScreen.style.display = "flex";
}

function notifyCollectionChange() {
    updateCollectionUI();   
}


// Auto-refresh collection
function refreshCollection() {
    if (collectionScreen.style.display === "block") {
        updateCollectionUI();
    }
}


//====================
//       AUDIO
//====================
const menuMusic = new Audio("Music/SeeingDouble_Loopable.wav");
const gameMusic = new Audio("Music/CriticalTheme_Loopable.wav");

menuMusic.loop = true;
gameMusic.loop = true;

let masterVolume = 1; // 0.0 - 1.0

menuMusic.volume = masterVolume;
gameMusic.volume = masterVolume;

function playMenuMusic() {
    gameMusic.pause();
    gameMusic.currentTime = 0;

    menuMusic.volume = masterVolume;
    if (menuMusic.paused) {
        menuMusic.play().catch(() => {});
    }
}

function playGameMusic() {
    menuMusic.pause();
    menuMusic.currentTime = 0;

    gameMusic.volume = masterVolume;
    if (gameMusic.paused) {
        gameMusic.play().catch(() => {});
    }
}

function stopAllMusic() {
    menuMusic.pause();
    gameMusic.pause();
}

//====================
//   MAIN GAME LOOP  
//====================
function gameLoop(currentTime = performance.now()){
    if (gameOver || !gameRunning) return;
    
    // Calculate delta time (time since last frame, in seconds)
    const deltaTime = lastTime === 0 ? 1/60 : (currentTime - lastTime) / 1000;  // Convert ms to seconds
    lastTime = currentTime;
    
    // Cap deltaTime to prevent large jumps (example; if tab is inactive)
    const cappedDeltaTime = Math.min(deltaTime, 1 / 30);  // Max 30 FPS
    
    let score = Math.floor((Date.now() - startTime - pausedTime) / 1000);
    
    if (!paused){
        // Player movement (now pixels per second, scaled by deltaTime)
        if (keysPressed["w"]) {
            player.y -= playerStats.speed * cappedDeltaTime * 60;  // Assuming 60 FPS base
            if (!keysPressed["arrowup"] && !keysPressed["arrowdown"] && !keysPressed["arrowleft"] && !keysPressed["arrowright"]){
                player.style.backgroundImage = `url(texturePack/Up_Player.png)`;
            }
        }
        if (keysPressed["s"]) {
            player.y += playerStats.speed * cappedDeltaTime * 60;
            if (!keysPressed["arrowup"] && !keysPressed["arrowdown"] && !keysPressed["arrowleft"] && !keysPressed["arrowright"]){
                player.style.backgroundImage = `url(texturePack/Down_Player.png)`;
            }
        }
        if (keysPressed["a"]) {
            player.x -= playerStats.speed * cappedDeltaTime * 60;
            if (!keysPressed["arrowup"] && !keysPressed["arrowdown"] && !keysPressed["arrowleft"] && !keysPressed["arrowright"]){
                player.style.backgroundImage = `url(texturePack/Left_Player.png)`;
            }
        }
        if (keysPressed["d"]) {
            player.x += playerStats.speed * cappedDeltaTime * 60;
            if (!keysPressed["arrowup"] && !keysPressed["arrowdown"] && !keysPressed["arrowleft"] && !keysPressed["arrowright"]){
                player.style.backgroundImage = `url(texturePack/Right_Player.png)`;
            }
        }
        
        // Check if player is inside the area
        player.x = Math.max(0, Math.min(player.x, gameArea.clientWidth - playerStats.width));
        player.y = Math.max(80, Math.min(player.y, gameArea.clientHeight - playerStats.height - 50));  // 60 is the borrowed space from the Score that is messing with collision limits and 50 is for the health bar
        player.style.transform = `translate(${player.x}px,${player.y}px)`;
        
        //Update Image for shooting
        const now = Date.now();
        
        if (keysPressed["arrowup"]){
            player.style.backgroundImage = `url(texturePack/Up_Player.png)`; 
            if (now - lastShotTime > shotCoolDown){
                shootBullet("up"); 
                lastShotTime = now;
            }   
        }else if (keysPressed["arrowdown"]){
            player.style.backgroundImage = `url(texturePack/Down_Player.png)`; 
            if (now - lastShotTime > shotCoolDown){
                shootBullet("down"); 
                lastShotTime = now; 
            }
        }else if (keysPressed["arrowleft"]){
            player.style.backgroundImage = `url(texturePack/Left_Player.png)`; 
            if (now - lastShotTime > shotCoolDown){
                shootBullet("left"); 
                lastShotTime = now;
            } 
        }else if (keysPressed["arrowright"]){
            player.style.backgroundImage = `url(texturePack/Right_Player.png)`; 
            if (now - lastShotTime > shotCoolDown){
                shootBullet("right"); 
                lastShotTime = now;}
        }
        
        turretShotTimer++;
        if (turretShotTimer > 60) {
            turretBullets();
            turretShotTimer = 0;
        }
        
        updateBullets(cappedDeltaTime);
        turretUpdateBullets(cappedDeltaTime);
        updateEnemies(cappedDeltaTime);
        checkItemPickUp();
        updateHealthBar();

        if (score >= 1000 && !achievements.Survivor) {
            achievementFeature("Survivor");
        }
        
        timeScore.textContent = score;
    }
    
    gameLoopId = requestAnimationFrame(gameLoop); //To make it look nice
}


//====================
//     SPAWN RATE
//====================
let timeMult = 1.1;
let spawnTime = 1000; // starting spawn rate

function difficultySpawner() {
    const elapsedMinutes = (Date.now() - startTime) / 120000;
    
    spawnTime = Math.max(
        1000 / (1 + elapsedMinutes * 0.5), // 1000ms at start, faster over time
        500 //Minimun spawn time 
    )
    
    return spawnTime;
}

let nextSpawnTimeout;

function dynamicSpawn(){
    if (gameOver) return;
    spawnEnemy();
    nextSpawnTimeout = setTimeout(dynamicSpawn, difficultySpawner());
}

//====================
//     START GAME
//====================
function startGame(){
    //Clean the game area
    cleanupGameArea();
    
    //Game is running
    gameRunning = true;

    //Reset flags
    gameOver = false, paused = false;
    choosingItem = false, choosingItem = false;
    pausedTime = 0;
    
    titleScreen.style.display = "none";
    gameArea.style.display = "block";
    
    playGameMusic();
    
    startTime = Date.now();
    
    //Spawn UI 
    ensureInventoryUI()
    createPauseButton(); 
    createHealthBar();
    //Spawn Player
    createPlayer();
    //Begin Game
    if (gameLoopId === null) gameLoop();
    //Begin Spawning
    dynamicSpawn();
    
    spawnItemInterval = setInterval(spawnItem, 10000);

    notifyCollectionChange();    
}


//====================
//  OTHER FUNCTIONS
//====================
function settingsMenu(){
    titleScreen.style.display = "none";
    settingsScreen.style.display = "block";
}

function returnToTitle(){
    settingsScreen.style.display = "none";
    titleScreen.style.display = "block";
}

function returnFromGame() {
    // Stop game loop
    gameOver = true;
    paused = false;
    choosingItem = false;
    gameRunning = false;
    
    //Clean old game stats
    cleanStats();

    //Change Music
    stopAllMusic();
    playMenuMusic();
    
    // Stop enemy/item spawns
    clearTimeout(nextSpawnTimeout);
    clearInterval(spawnItemInterval);
    
    // Remove all game objects
    bullets.forEach(b => b.remove());
    tBullets.forEach(b => b.remove());
    enemies.forEach(e => e.remove());
    turrets.forEach(t => t.remove());
    inventoryItems.forEach(i => i.remove());
    
    bullets = [];
    tBullets = [];
    enemies = [];
    turrets = [];
    inventoryItems = [];

    // Remove player
    if (player && player.parentNode) {
        player.parentNode.removeChild(player);
        player = null;
    }

    // Remove UI
    document.getElementById("InventoryUI")?.remove();
    document.getElementById("healthBarContainer")?.remove();
    document.getElementById("pauseBtn")?.remove();
    document.getElementById("pauseText")?.remove();
    document.getElementById("itemChoiceContainer")?.remove();
    document.getElementById("pauseReturnBtn")?.remove();
    
    // Hide game area
    gameArea.style.display = "none";
    
    // Show main menu
    titleScreen.style.display = "flex";
}

function cleanupGameArea(){
    bullets.forEach(b => b.remove());
    tBullets.forEach(b => b.remove());
    enemies.forEach(e => e.remove());
    turrets.forEach(t => t.remove());
    inventoryItems.forEach(i => i.remove());
    
    bullets = []; tBullets = []; enemies = []; turrets = []; inventoryItems = [];
    
    document.getElementById("InventoryUI")?.remove();
    document.getElementById("healthBarContainer")?.remove();
    document.getElementById("pauseBtn")?.remove();
    document.getElementById("pauseText")?.remove();
    document.getElementById("itemChoiceContainer")?.remove();
}


document.querySelectorAll(".collectionTab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".collectionTab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll(".collectionTabContent").forEach(c => c.style.display = "none");
        const target = document.getElementById(tab.dataset.tab);
        if (target) target.style.display = "flex";

        // Clear the description panel when changing tabs
        if (challengeDetailContainer) challengeDetailContainer.innerHTML = "";
    });
});


document.querySelectorAll(".settingsTab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".settingsTab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        document.querySelectorAll(".settingsTabContent").forEach(c => c.style.display = "none");
        const target = document.getElementById(tab.dataset.tab);
        if (target) target.style.display = "block";
    });
});

window.addEventListener("load", () => {
    // Load saved collection data
    const savedCollectedItems = localStorage.getItem('collectedItems');
    if (savedCollectedItems) {
        const saved = JSON.parse(savedCollectedItems);
        for (const key in saved) {
            if (collectedItems.hasOwnProperty(key)) {
                collectedItems[key] = saved[key];
            }
        }
    }
    
    const savedChallenges = localStorage.getItem('challenges');
    if (savedChallenges) {
        const saved = JSON.parse(savedChallenges);
        for (const key in saved) {
            if (challenges.hasOwnProperty(key)) {
                challenges[key] = saved[key];
            }
        }
    }
    
    const savedAchievements = localStorage.getItem('achievements');
    if (savedAchievements) {
        const saved = JSON.parse(savedAchievements);
        for (const key in saved) {
            if (achievements.hasOwnProperty(key)) {
                achievements[key] = saved[key];
            }
        }
    }
    
    playMenuMusic();
});

const volumeSlider = document.getElementById("volumeSlider");

if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
        masterVolume = volumeSlider.value / 100;

        menuMusic.volume = masterVolume;
        gameMusic.volume = masterVolume;
    });
}

window.addEventListener("resize", () => {
        if (!player) return;
        player.x = Math.min(player.x, gameArea.clientWidth - playerStats.width);
        player.y = Math.min(player.y, gameArea.clientHeight - playerStats.height);
        player.style.transform = `translate(${player.x}px,${player.y}px)`;
    })

//====================
//      The End
//====================

function relocate(){
    window.open("EasterEgg/index.html", "Shhh");
}