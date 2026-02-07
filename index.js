const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: { GoalFollow, GoalNear } } = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const autoeat = require('mineflayer-auto-eat').plugin
const autofish = require('mineflayer-autofish') // Thư viện câu cá mới
const express = require('express')
const app = express()

// --- CẤU HÌNH ---
const MASTER_NAME = 'Thai8424019'
const PASSWORD = 'dreiaktiguv'
const SERVER_IP = 'dreiaktiguv-HDPE.aternos.me'
const SERVER_PORT = 26432

const bot = mineflayer.createBot({
  host: SERVER_IP,
  port: SERVER_PORT,
  username: 'VeSi_Thai',
  version: false
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(armorManager)
bot.loadPlugin(autoeat)
bot.loadPlugin(autofish) // Kích hoạt plugin câu cá

let currentMode = 'protect' 
let autoCollect = true 

// --- WEB DASHBOARD ---
app.get('/', (req, res) => {
  res.send(`
    <body style="text-align:center; background:#1a1a1a; color:white; font-family:sans-serif; padding:20px;">
        <h1 style="color:#2ecc71;">🤖 VE SI PRO + FISH</h1>
        <div style="background:#333; padding:10px; border-radius:10px; margin-bottom:20px;">
            <p>Chế độ: <strong>${currentMode.toUpperCase()}</strong></p>
            <p>❤️ Máu: ${Math.round(bot.health || 0)} | 🍖 Đói: ${Math.round(bot.food || 0)}</p>
        </div>
        <button style="padding:15px; background:green; color:white;" onclick="location.href='/set/protect'">🛡️ BẢO VỆ</button>
        <button style="padding:15px; background:blue; color:white;" onclick="location.href='/set/fish'">🎣 CÂU CÁ</button>
        <button style="padding:15px; background:red; color:white;" onclick="location.href='/set/hunt'">⚔️ SĂN NGƯỜI</button>
        <button style="padding:15px; background:orange;" onclick="location.href='/toggle/collect'">📦 NHẶT ĐỒ: ${autoCollect ? 'BẬT' : 'TẮT'}</button>
    </body>
  `)
})
app.get('/set/:mode', (req, res) => { 
    currentMode = req.params.mode;
    if (currentMode === 'fish') {
        bot.autofish.start();
        bot.chat('Em đi câu cá đây đại ca!');
    } else {
        bot.autofish.stop();
    }
    res.redirect('/'); 
})
app.get('/toggle/collect', (req, res) => { autoCollect = !autoCollect; res.redirect('/'); })
app.listen(3000)

// --- VÒNG LẶP HÀNH ĐỘNG ---
setInterval(() => {
  if (!bot.entity || currentMode === 'fish') return // Nếu đang câu cá thì đứng yên

  const master = bot.players[MASTER_NAME]?.entity
  if (bot.autoEat.isEating) return

  // 1. Tấn công bảo vệ
  const target = bot.nearestEntity(e => {
    const dist = master ? e.position.distanceTo(master.position) : 100
    if (currentMode === 'protect') return (e.type === 'hostile' || e.type === 'mob') && dist < 10
    return false
  })

  if (target) {
    bot.pathfinder.setGoal(new GoalNear(target.position.x, target.position.y, target.position.z, 1))
    bot.attack(target)
    return
  }

  // 2. Theo dõi chủ nhân
  if (master && currentMode === 'protect' && bot.entity.position.distanceTo(master.position) > 3) {
    bot.pathfinder.setGoal(new GoalFollow(master, 2), true)
  }
}, 500)

// Tự động đăng nhập & ném đồ (giữ nguyên như cũ)
bot.on('chat', async (username, message) => {
  if (username === MASTER_NAME && message === 'vutdo') {
    for (const item of bot.inventory.items()) await bot.tossStack(item)
  }
})
bot.on('messagestr', (m) => { if (m.includes('/login')) bot.chat(`/login ${PASSWORD}`) })
bot.on('death', () => setTimeout(() => bot.respawn(), 2000))
      
