# ✅ Render Deployment Checklist

इस checklist को follow करके deploy करें। हर step को complete करने के बाद ✅ mark करें।

## 📋 Pre-Deployment Checklist

### 1. Discord Bot Setup
- [ ] Discord Developer Portal से bot बनाया है
- [ ] Bot token copy कर लिया है
- [ ] Bot को proper permissions दिए हैं:
  - [ ] Read Messages/View Channels
  - [ ] Send Messages
  - [ ] Embed Links
  - [ ] Connect (Voice)
  - [ ] Speak (Voice)
  - [ ] Use Voice Activity

### 2. GitHub Repository Setup
- [ ] Code को GitHub पर push किया है
- [ ] Repository public या private है (दोनों काम करेंगे)
- [ ] सभी files properly committed हैं
- [ ] .env file को commit नहीं किया है (security के लिए)

### 3. Code Review
- [ ] `package.json` में सभी dependencies हैं
- [ ] `Dockerfile` present है
- [ ] `render.yaml` properly configured है
- [ ] `.gitignore` में sensitive files listed हैं

---

## 🚀 Render Deployment Steps

### Step 1: Render Account
- [ ] Render.com पर account बनाया/login किया
- [ ] Dashboard access कर सकते हैं

### Step 2: New Web Service
- [ ] "New +" → "Web Service" select किया
- [ ] GitHub repository connect किया
- [ ] अपनी repository select की

### Step 3: Basic Configuration
- [ ] **Name**: Unique service name दिया (e.g., `my-discord-music-bot`)
- [ ] **Region**: नजदीकी region select किया (Singapore recommended)
- [ ] **Branch**: `main` या `master` select किया
- [ ] **Environment**: Docker selected (Dockerfile use होगी)
- [ ] **Dockerfile Path**: `./Dockerfile` (automatic detect)
- [ ] **Plan**: Free selected

### Step 4: Environment Variables
सभी environment variables add किए:
- [ ] `DISCORD_TOKEN` = (आपका bot token)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`
- [ ] `DB_PATH` = `/data/ragabot.db` (database persistence के लिए)
- [ ] `LOG_LEVEL` = `info` (optional)

**⚠️ Important**: DISCORD_TOKEN को secret/hidden field के रूप में add करें!

### Step 5: Advanced Settings
- [ ] **Auto-Deploy**: Enabled (automatic deployments के लिए)
- [ ] **Health Check Path**: `/health` set किया
- [ ] **Persistent Disk**: 1GB disk add किया `/data` mount path पर (database के लिए)

### Step 6: Deploy
- [ ] "Create Web Service" button click किया
- [ ] Build process start हुआ
- [ ] Build logs में errors नहीं हैं

---

## ✅ Post-Deployment Verification

### 1. Health Check
- [ ] Render dashboard में service "Live" दिख रहा है
- [ ] Health check URL open होता है: `https://your-app.onrender.com/health`
- [ ] Response में bot status दिख रहा है

### 2. Bot Status
- [ ] Discord में bot **Online** दिख रहा है
- [ ] Bot का status "Ready" है
- [ ] Bot को server में invite कर सकते हैं

### 3. Functionality Test
Basic commands test करें:
- [ ] `!help` - Help message आता है
- [ ] `!status` - Bot status दिखता है
- [ ] `!join` - Bot voice channel में join करता है
- [ ] `!play Tum Hi Ho` - Music play होता है
- [ ] `!skip` - Song skip होता है
- [ ] `!stop` - Music stop होता है

### 4. Logs Check
- [ ] Render logs में कोई errors नहीं हैं
- [ ] Bot initialization messages दिख रहे हैं:
  - `🎵 Bot music bot is online!`
  - `📊 Serving X servers`
  - `✅ Database initialized successfully!`

---

## 🔧 Troubleshooting

### अगर Bot Offline है:
1. [ ] Render logs check करें
2. [ ] DISCORD_TOKEN verify करें
3. [ ] Service restart करें
4. [ ] Build logs में errors check करें

### अगर Music Play नहीं हो रहा:
1. [ ] Bot को voice permissions दें
2. [ ] FFmpeg properly install हुआ है या नहीं (Dockerfile में है)
3. [ ] Voice channel में manually bot को move करके try करें

### अगर Database Issues हैं:
1. [ ] Render dashboard में persistent disk add करें
2. [ ] DB_PATH environment variable check करें
3. [ ] Write permissions verify करें

---

## 📊 Monitoring Setup (Optional)

### Keep Bot Awake on Free Plan
Free plan पर bot 15 minutes inactivity के बाद sleep mode में जाता है। इसे prevent करने के लिए:

1. [ ] **UptimeRobot** account बनाएं (free)
2. [ ] New Monitor add करें:
   - Type: HTTP(s)
   - URL: `https://your-app.onrender.com/health`
   - Monitoring Interval: 5 minutes
3. [ ] Monitor start करें

या

1. [ ] **Cron-Job.org** account बनाएं (free)
2. [ ] New Cron Job add करें:
   - URL: `https://your-app.onrender.com/health`
   - Interval: Every 10 minutes
3. [ ] Job enable करें

---

## 🎉 Final Checklist

### Deployment Complete होने के बाद:
- [ ] Bot Discord में online है
- [ ] सभी basic commands काम कर रहे हैं
- [ ] Music play/pause/skip work कर रहा है
- [ ] Health check endpoint respond कर रहा है
- [ ] Logs में कोई critical errors नहीं हैं
- [ ] Bot को production servers में invite किया

### Documentation:
- [ ] Bot की invite link save की
- [ ] Admin/owner को access दिया
- [ ] Command list users को share किया

---

## 📝 Important URLs

Save these URLs:
```
Render Dashboard: https://dashboard.render.com
Your Service URL: https://your-app-name.onrender.com
Health Check: https://your-app-name.onrender.com/health
Discord Bot: https://discord.com/developers/applications
```

---

## 🆘 Need Help?

अगर कोई step में problem है:

1. **Logs Check करें**: Render dashboard → Logs tab
2. **Environment Variables**: सभी required vars set हैं या नहीं
3. **GitHub Code**: latest code push हुआ है या नहीं
4. **Discord Permissions**: bot के permissions verify करें

**Detailed Guide**: पूरी guide के लिए `RENDER_DEPLOYMENT.md` file देखें।

---

**Happy Deploying! 🚀🎵**
