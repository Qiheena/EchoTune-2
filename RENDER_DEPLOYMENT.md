# 🚀 Render Deployment Guide for Discord Music Bot

यह guide आपको **Render.com** पर इस Discord Music Bot को deploy करने में मदद करेगा।

## 📋 Prerequisites (जरूरी चीजें)

1. **Render Account**: [render.com](https://render.com) पर free account बनाएं
2. **Discord Bot Token**: Discord Developer Portal से bot token प्राप्त करें
3. **GitHub Repository**: अपना code GitHub पर push करें
4. **Spotify Integration** (Optional): Spotify features के लिए Replit integration setup करें

---

## 🎯 Step-by-Step Deployment

### Step 1: GitHub Repository Setup

```bash
# अपने local repository को GitHub पर push करें
git init
git add .
git commit -m "Initial commit for Render deployment"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### Step 2: Render पर New Web Service बनाएं

1. **Render Dashboard** पर जाएं: https://dashboard.render.com
2. **"New +"** button पर click करें
3. **"Web Service"** select करें
4. अपनी **GitHub repository** connect करें और select करें

### Step 3: Service Configuration

Render automatically `render.yaml` file detect कर लेगा। अगर नहीं, तो manually ये settings enter करें:

**Basic Settings:**
- **Name**: `discord-music-bot` (या कोई भी unique name)
- **Region**: `Singapore` (या nearest region)
- **Branch**: `main`
- **Environment**: `Docker` (Dockerfile का use करेगा)
- **Dockerfile Path**: `./Dockerfile` (automatic detect हो जाएगा)
- **Plan**: `Free`

**Advanced Settings:**
- **Auto-Deploy**: `Yes` (हर GitHub push पर automatically deploy होगा)
- **Health Check Path**: `/health`
- **Persistent Disk**: `1GB` disk add करें `/data` path पर (database के लिए)

### Step 4: Environment Variables Setup

Render dashboard में **Environment** tab पर जाकर ये environment variables add करें:

| Variable Name | Value | Required |
|--------------|-------|----------|
| `DISCORD_TOKEN` | Your Discord bot token | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `PORT` | `3000` | ✅ Yes |
| `DB_PATH` | `/data/ragabot.db` | ✅ Yes (for persistence) |
| `LOG_LEVEL` | `info` | Optional |

**⚠️ Important:** `DISCORD_TOKEN` को **secret** type के रूप में add करें (hide value option use करें)।

### Step 5: System Dependencies (Automatic via Docker)

यह bot **Docker environment** use करता है, इसलिए Render automatically ये system dependencies install करेगा:
- ✅ FFmpeg (audio processing और filters के लिए)
- ✅ Python3 + yt-dlp (YouTube downloads के लिए)
- ✅ Node.js 20 LTS (production-ready)

**Render yaml file में `env: docker` set है, इसलिए Dockerfile automatically use होगी!**

### Step 6: Persistent Storage (Database)

**Important**: SQLite database को persist करने के लिए disk add करें:
1. Render dashboard में **Disks** section में जाएं
2. New Disk create करें:
   - **Name**: `discord-bot-data`
   - **Mount Path**: `/data`
   - **Size**: `1 GB` (Free plan पर available)
3. Database path `/data/ragabot.db` पर set होगी automatically

**Note**: `render.yaml` में disk पहले से configured है!

### Step 7: Deploy!

1. सभी settings verify करने के बाद **"Create Web Service"** button पर click करें
2. Render build और deployment process start करेगा
3. Build logs में progress देख सकते हैं
4. Deployment complete होने में **5-10 minutes** लग सकते हैं

---

## ✅ Verification (Deployment सही से हुआ या नहीं)

### 1. Health Check
Deployment complete होने के बाद, Render आपको एक URL देगा:
```
https://your-app-name.onrender.com
```

इस URL पर जाकर health check करें:
```
https://your-app-name.onrender.com/health
```

आपको ऐसा response मिलना चाहिए:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2024-10-01T12:00:00.000Z",
  "memory": {...},
  "version": "v20.x.x"
}
```

### 2. Bot Status
- Discord में अपने bot को online देखें
- Bot को अपने server में invite करें
- Test command try करें: `!help` या `!status`

### 3. Logs Check
Render dashboard में **Logs** tab से bot logs check कर सकते हैं:
- `🎵 <Bot Name> music bot is online!` - Bot successfully started
- `📊 Serving X servers` - Bot कितने servers में है
- `✅ Database initialized successfully!` - Database ready

---

## 🔧 Common Issues & Solutions

### Issue 1: Bot Offline/Not Starting
**Problem**: Bot Discord में offline दिख रहा है

**Solutions**:
1. Render logs check करें errors के लिए
2. `DISCORD_TOKEN` environment variable सही है या नहीं verify करें
3. Discord Developer Portal में bot token regenerate करके try करें

### Issue 2: Music Not Playing
**Problem**: Commands work कर रहे हैं लेकिन music play नहीं हो रहा

**Solutions**:
1. Bot को proper voice permissions दें (Connect, Speak)
2. Check करें कि FFmpeg properly install हुआ है (logs में देखें)
3. `!status` command से bot की health check करें

### Issue 3: Build Failed
**Problem**: Render पर build fail हो रहा है

**Solutions**:
1. `package.json` में सभी dependencies properly listed हैं या नहीं check करें
2. Node.js version compatibility check करें (Node 18+ required)
3. Build logs में specific error message देखें

### Issue 4: Database Issues
**Problem**: Settings save नहीं हो रहे या database errors आ रहे हैं

**Solutions**:
1. Render persistent disk attach करें (Render dashboard → Disks)
2. Database path properly configured है या नहीं check करें
3. Write permissions verify करें

---

## 💰 Render Free Tier Limitations

Render के **Free Plan** में ये limitations हैं:

- ✅ **750 hours/month** free runtime
- ⚠️ **15 minutes inactivity** के बाद bot sleep mode में चला जाता है
- ⚠️ First request के बाद bot wake up होने में **30-50 seconds** लग सकते हैं
- ✅ Health check endpoint से bot को awake रखा जा सकता है

### Free Tier में Bot को Active रखने के लिए:

1. **UptimeRobot** या **Cron-Job.org** जैसी service use करें
2. हर **10-14 minutes** में health check endpoint ping करें
3. URL: `https://your-app-name.onrender.com/health`

---

## 🔄 Updating Your Bot

Code में changes करने के बाद:

```bash
git add .
git commit -m "Your update message"
git push
```

**Render automatically detect करके deploy कर देगा** (अगर Auto-Deploy enabled है)!

---

## 📊 Monitoring

### Logs देखने के लिए:
1. Render Dashboard → Your Service
2. **Logs** tab open करें
3. Real-time logs देखें

### Metrics देखने के लिए:
1. Render Dashboard → Your Service
2. **Metrics** tab में CPU, Memory, Request stats देखें

---

## 🎵 Post-Deployment Setup

### 1. Bot Invite Link
अपनी bot को servers में invite करने के लिए:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=3165184&scope=bot%20applications.commands
```

### 2. Required Permissions
Bot को ये permissions दें:
- ✅ Read Messages/View Channels
- ✅ Send Messages
- ✅ Embed Links
- ✅ Connect (Voice)
- ✅ Speak (Voice)
- ✅ Use Voice Activity

### 3. Test Commands
Basic commands test करें:
```
!help       # सभी commands देखें
!status     # Bot status check करें
!play       # Music play करें
```

---

## 🆘 Support & Help

अगर कोई problem है तो:

1. **Logs Check करें**: Render dashboard में detailed logs देखें
2. **Health Check**: `/health` endpoint check करें
3. **Discord Permissions**: Bot के permissions verify करें
4. **Environment Variables**: सभी required env vars set हैं या नहीं check करें

---

## 🎉 Deployment Successful!

अगर सब कुछ सही है तो:
- ✅ Bot Discord में **online** दिखेगा
- ✅ Health check endpoint **200 OK** response देगा
- ✅ Commands properly **work** करेंगे
- ✅ Music **play** होगा

**Happy Deploying! 🚀🎵**
