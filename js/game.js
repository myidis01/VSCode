const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const blocker = document.getElementById('blocker');
const loading = document.getElementById('loading');
const healthEl = document.getElementById('health');
const levelEl = document.getElementById('level');
const xpEl = document.getElementById('xp');
const remainingEl = document.getElementById('remaining');
const arrowCountEl = document.getElementById('arrowCount');
const arrowPowerEl = document.getElementById('arrowPower');
const message = document.getElementById('message');

document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let width = canvas.width;
let height = canvas.height;

const map = [
  '################',
  '#..............#',
  '#..a.....M....m#',
  '#....##...##...#',
  '#...###.###....#',
  '#...........P..#',
  '#..##..##..##..#',
  '#....##..##....#',
  '#..M......m....#',
  '#....###.###...#',
  '#...##.....##..#',
  '#..............#',
  '################',
];

const TILE = 64;
const FOV = Math.PI / 3;
const NUM_RAYS = 140;
const MAX_DEPTH = 20;
const MOVE_SPEED = 110;
const ROT_SPEED = 2.5;

const sound = {
  shoot: null,
};

const player = {
  x: 5.5 * TILE,
  y: 6.5 * TILE,
  angle: 0,
  health: 100,
  level: 1,
  xp: 0,
  arrows: [],
  fireTime: 0,
  firing: false,
  fireInterval: 0.28,
};

const keys = { w: false, a: false, s: false, d: false };
const pointer = { locked: false, dx: 0 };

const pickups = [];
let monsters = [];
let monsterTypes = [];
let monsterFiles = [];
let lastFrame = performance.now();
let loaded = false;

const levelConfig = level => ({
  shots: 1 + Math.floor((level - 1) / 3),
  power: 12 + (level - 1) * 3,
  interval: Math.max(0.26 - (level - 1) * 0.015, 0.12),
});

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  width = canvas.width;
  height = canvas.height;
}
window.addEventListener('resize', resize);

function castRay(rayAngle) {
  const sin = Math.sin(rayAngle);
  const cos = Math.cos(rayAngle);
  for (let depth = 0.01; depth < MAX_DEPTH; depth += 0.02) {
    const targetX = player.x + cos * depth * TILE;
    const targetY = player.y + sin * depth * TILE;
    const mapX = Math.floor(targetX / TILE);
    const mapY = Math.floor(targetY / TILE);
    if (!map[mapY]) return { distance: MAX_DEPTH, hit: true };
    const cell = map[mapY][mapX];
    if (cell === '#') {
      return { distance: depth, texture: '#', x: targetX, y: targetY };
    }
  }
  return { distance: MAX_DEPTH, texture: '.', x: player.x + cos * MAX_DEPTH * TILE, y: player.y + sin * MAX_DEPTH * TILE };
}

function renderScene() {
  ctx.fillStyle = '#05111a';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#2d5d81';
  ctx.fillRect(0, height / 2, width, height / 2);

  for (let i = 0; i < NUM_RAYS; i += 1) {
    const rayAngle = player.angle - FOV / 2 + (i / NUM_RAYS) * FOV;
    const ray = castRay(rayAngle);
    const correctedDistance = ray.distance * Math.cos(rayAngle - player.angle);
    const wallHeight = (TILE * height) / (correctedDistance * TILE);
    const shade = Math.max(0, 1 - correctedDistance / 10);
    ctx.fillStyle = `rgba(${26 * shade + 20}, ${112 * shade + 32}, ${166 * shade + 16}, 1)`;
    const x = Math.floor((i / NUM_RAYS) * width);
    const y = (height - wallHeight) / 2;
    ctx.fillRect(x, y, Math.ceil(width / NUM_RAYS), wallHeight);
  }

  renderSprites();
  renderUI();
}

function renderSprites() {
  const visible = [];
  const cx = player.x;
  const cy = player.y;
  const halfFOV = FOV / 2;
  monsters.forEach(monster => {
    if (monster.health <= 0) return;
    const dx = monster.x - cx;
    const dy = monster.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy) / TILE;
    const angleTo = Math.atan2(dy, dx);
    let diff = angleTo - player.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) <= halfFOV + 0.4 && distance > 0.5) {
      visible.push({ monster, distance, diff, angleTo });
    }
  });

  pickups.forEach(item => {
    if (item.used) return;
    const dx = item.x - cx;
    const dy = item.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy) / TILE;
    const angleTo = Math.atan2(dy, dx);
    let diff = angleTo - player.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) <= halfFOV + 0.4 && distance > 0.6) {
      visible.push({ item, distance, diff, angleTo });
    }
  });

  visible.sort((a, b) => b.distance - a.distance);
  visible.forEach(entry => {
    if (entry.monster) drawSprite(entry.monster, entry.distance, entry.diff);
    if (entry.item) drawItem(entry.item, entry.distance, entry.diff);
  });
}

function drawSprite(monster, distance, diff) {
  const spriteHeight = Math.min(400, (TILE * height) / (distance * TILE));
  const spriteWidth = spriteHeight * 0.75;
  const centerX = width / 2 + Math.tan(diff) * width;
  const px = centerX - spriteWidth / 2;
  const py = height / 2 - spriteHeight / 2;
  const alpha = Math.max(0.08, 1 - distance / 10);

  ctx.fillStyle = `rgba(${monster.color.r},${monster.color.g},${monster.color.b},${alpha})`;
  ctx.fillRect(px, py, spriteWidth, spriteHeight);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(monster.name, width / 2 + Math.tan(diff) * width, py - 12);
  ctx.fillStyle = '#ee4444';
  ctx.fillRect(px, py + spriteHeight + 8, spriteWidth * (monster.health / monster.maxHealth), 8);
}

function drawItem(item, distance, diff) {
  const size = Math.min(80, (TILE * height) / (distance * TILE) * 0.8);
  const x = width / 2 + Math.tan(diff) * width - size / 2;
  const y = height / 2 - size / 2;
  ctx.fillStyle = 'rgba(64, 200, 128, 0.92)';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('+HP', x + size / 2, y + size / 2 + 6);
}

function renderUI() {
  healthEl.textContent = Math.max(0, Math.ceil(player.health));
  levelEl.textContent = player.level;
  xpEl.textContent = player.xp;
  remainingEl.textContent = monsters.filter(m => m.health > 0).length;
  const config = levelConfig(player.level);
  arrowCountEl.textContent = config.shots;
  arrowPowerEl.textContent = config.power;
}

function update(delta) {
  const speed = MOVE_SPEED * delta;
  if (keys.w) movePlayer(speed);
  if (keys.s) movePlayer(-speed);
  if (keys.a) strafePlayer(-speed);
  if (keys.d) strafePlayer(speed);
  if (pointer.locked) player.angle += pointer.dx * 0.002;
  pointer.dx = 0;
  if (player.firing) {
    player.fireTime += delta;
    if (player.fireTime >= player.fireInterval) shootArrow();
  }
  updateArrows(delta);
  updateMonsters(delta);
  updatePickups(delta);
}

function movePlayer(distance) {
  const nextX = player.x + Math.cos(player.angle) * distance;
  const nextY = player.y + Math.sin(player.angle) * distance;
  if (!collides(nextX, player.y)) player.x = nextX;
  if (!collides(player.x, nextY)) player.y = nextY;
}

function strafePlayer(distance) {
  const nextX = player.x + Math.cos(player.angle + Math.PI / 2) * distance;
  const nextY = player.y + Math.sin(player.angle + Math.PI / 2) * distance;
  if (!collides(nextX, player.y)) player.x = nextX;
  if (!collides(player.x, nextY)) player.y = nextY;
}

function collides(x, y) {
  const mapX = Math.floor(x / TILE);
  const mapY = Math.floor(y / TILE);
  return map[mapY] && map[mapY][mapX] === '#';
}

function shootArrow() {
  const config = levelConfig(player.level);
  const spread = 0.08;
  const shots = config.shots;
  for (let i = 0; i < shots; i += 1) {
    const offset = (i - (shots - 1) / 2) * spread;
    player.arrows.push({
      x: player.x,
      y: player.y,
      angle: player.angle + offset,
      speed: 520,
      power: config.power,
    });
  }
  player.fireTime = 0;
  player.fireInterval = config.interval;
}

function updateArrows(delta) {
  const move = delta * 520;
  for (let i = player.arrows.length - 1; i >= 0; i -= 1) {
    const arrow = player.arrows[i];
    arrow.x += Math.cos(arrow.angle) * move;
    arrow.y += Math.sin(arrow.angle) * move;
    if (collides(arrow.x, arrow.y)) {
      player.arrows.splice(i, 1);
      continue;
    }
    let hit = false;
    monsters.forEach(monster => {
      if (monster.health <= 0) return;
      const dx = monster.x - arrow.x;
      const dy = monster.y - arrow.y;
      if (Math.hypot(dx, dy) < TILE * 0.35) {
        monster.health -= arrow.power;
        hit = true;
        if (monster.health <= 0) {
          player.xp += monster.baseXp;
          message.textContent = `몬스터 ${monster.name} 처치! +${monster.baseXp} XP`;
        }
      }
    });
    if (hit) player.arrows.splice(i, 1);
  }
}

function updateMonsters(delta) {
  monsters.forEach(monster => {
    if (monster.health <= 0) return;
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    if (dist > TILE * 0.75) {
      const speed = (monster.speed / 80) * delta * TILE;
      const targetX = monster.x + Math.cos(angle) * speed;
      const targetY = monster.y + Math.sin(angle) * speed;
      if (!collides(targetX, monster.y)) monster.x = targetX;
      if (!collides(monster.x, targetY)) monster.y = targetY;
    }
    if (dist < TILE * 0.85) {
      player.health -= monster.damage * delta * 0.45;
    }
    if (player.health <= 0) {
      player.health = 0;
      message.textContent = '죽었습니다. 페이지를 새로 고침하여 재시작하세요.';
    }
  });
  const needed = 20 + player.level * 15;
  if (player.xp >= needed) {
    player.xp -= needed;
    player.level += 1;
    message.textContent = `레벨 업! ${player.level}레벨 달성`;
  }
}

function updatePickups(delta) {
  pickups.forEach(item => {
    if (item.used) return;
    const dx = player.x - item.x;
    const dy = player.y - item.y;
    if (Math.hypot(dx, dy) < TILE * 0.7) {
      item.used = true;
      player.health = Math.min(100, player.health + item.heal);
      message.textContent = `체력 회복 +${item.heal}`;
    }
  });
}

function gameLoop(timestamp) {
  if (!loaded) return;
  const delta = Math.min(0.05, (timestamp - lastFrame) / 1000);
  lastFrame = timestamp;
  update(delta);
  renderScene();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  blocker.style.display = 'none';
  if (!loaded) return;
  lastFrame = performance.now();
  requestAnimationFrame(gameLoop);
}

function initPickups() {
  pickups.push({ x: 8.5 * TILE, y: 4.2 * TILE, heal: 24, used: false });
  pickups.push({ x: 10.0 * TILE, y: 9.0 * TILE, heal: 18, used: false });
  pickups.push({ x: 3.5 * TILE, y: 8.5 * TILE, heal: 20, used: false });
}

function initMonsters(data) {
  const spawnPoints = [
    [6.3, 2.7], [9.5, 2.5], [12.2, 3.8], [4.3, 5.8], [11.5, 6.8], [7.8, 8.5], [2.9, 9.1], [10.8, 10.1],
    [13.1, 8.7], [5.0, 10.5], [12.0, 5.5], [8.5, 3.8], [3.2, 2.8], [9.2, 9.4], [4.8, 7.2], [13.5, 10.2]
  ];
  monsters = spawnPoints.map((point, index) => {
    const type = data[index % data.length];
    return {
      ...type,
      x: point[0] * TILE,
      y: point[1] * TILE,
      health: type.health,
      maxHealth: type.health,
      baseXp: Math.ceil(type.health / 10) + 6,
    };
  });
}

function loadMonsters() {
  fetch('Monsters/manifest.json')
    .then(res => res.json())
    .then(manifest => {
      monsterFiles = manifest.files;
      return Promise.all(monifest.files.map(file => fetch(`Monsters/${file}`).then(r => r.json())));
    })
    .then(types => {
      monsterTypes = types.map(type => ({
        ...type,
        color: type.color || { r: 176, g: 68, b: 56 },
      }));
      initMonsters(monsterTypes);
      initPickups();
      loading.style.display = 'none';
      loaded = true;
      startGame();
    })
    .catch(err => {
      loading.textContent = '몬스터 데이터를 불러올 수 없습니다.';
      console.error(err);
    });
}

canvas.addEventListener('mousedown', event => {
  if (event.button === 0) {
    player.firing = true;
    player.fireTime = player.fireInterval;
  }
});
canvas.addEventListener('mouseup', event => {
  if (event.button === 0) player.firing = false;
});

window.addEventListener('keydown', event => {
  if (event.key === 'w' || event.key === 'W') keys.w = true;
  if (event.key === 's' || event.key === 'S') keys.s = true;
  if (event.key === 'a' || event.key === 'A') keys.a = true;
  if (event.key === 'd' || event.key === 'D') keys.d = true;
});
window.addEventListener('keyup', event => {
  if (event.key === 'w' || event.key === 'W') keys.w = false;
  if (event.key === 's' || event.key === 'S') keys.s = false;
  if (event.key === 'a' || event.key === 'A') keys.a = false;
  if (event.key === 'd' || event.key === 'D') keys.d = false;
});

canvas.addEventListener('mousemove', event => {
  if (!pointer.locked) return;
  pointer.dx += event.movementX;
});

canvas.addEventListener('click', () => {
  if (!pointer.locked) canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  pointer.locked = document.pointerLockElement === canvas;
  if (!pointer.locked) {
    message.textContent = '다시 클릭하여 마우스를 잠금하고 게임을 계속하세요.';
  } else {
    message.textContent = '마우스가 잠겼습니다. WASD로 이동하고 좌클릭으로 연사하세요.';
  }
});

window.onload = () => {
  loadMonsters();
};
