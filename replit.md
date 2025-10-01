# Overview

This is an advanced Discord music bot built with Node.js that supports multiple music sources including YouTube, Spotify, and SoundCloud. The bot provides comprehensive music functionality with both slash commands and prefix commands (!), interactive button controls, autoplay, queue management, and volume control. It features a modern command-based architecture with fallback systems for reliable music streaming.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (October 01, 2025)

**🚀 LATEST UPDATE - FIXED YOUTUBE BLOCKS & OPTIMIZED:**
- ✅ **YouTube Block Bypass** - yt-dlp extracts direct audio URLs to bypass 403 errors
- ✅ **Fast & Reliable** - Triple fallback: yt-dlp → play-dl → ytdl-core
- ✅ **Spotify/SoundCloud Support** - Auto-converts non-YouTube URLs to YouTube equivalents
- ✅ **Smart Streaming** - Direct URL extraction with axios for stable playback
- ✅ **No More Decipher Errors** - Completely bypasses YouTube's broken decipher function

**🎵 PREVIOUS UPDATES:**
- ✅ **New Command: /lyrics** - Get lyrics for current or specified songs using lyrics.ovh API
- ✅ **New Command: /replay** - Restart current song from beginning
- ✅ **New Command: /favorite** - Save, list, play, and manage favorite songs with SQLite persistence
- ✅ **Enhanced Logging** - Comprehensive logging throughout playback flow for easier debugging
- ✅ **Fixed Voice Connection Issues** - Added proper Ready state waiting (20s timeout)

**🔧 PREVIOUS FIXES:**
- ✅ **Fixed Voice Connection Issues** - Added proper Ready state waiting (20s timeout)
- ✅ **Fixed Bot Leaving Bug** - Proper reconnection logic on disconnect
- ✅ **Fixed Health Server Conflict** - Added error handling for port conflicts
- ✅ **Removed All Lavalink Code** - Cleaned up unused packages and config
- ✅ **Optimized Streaming Speed** - Using yt-dlp fast method with `-g` flag

**⚙️ CONFIGURATION REQUIRED:**
To start the bot, you need to add your Discord Bot Token:
1. Go to the Secrets tab (🔒 icon in left sidebar)
2. Add a new secret with key: `DISCORD_TOKEN`
3. Paste your Discord bot token as the value
4. The bot will automatically start once the token is added

**🌐 RENDER DEPLOYMENT:**
- Configuration file `render.yaml` is ready
- Just connect your GitHub repo to Render
- Set DISCORD_TOKEN environment variable
- Deploy as a Web Service (it has health check endpoint)

**📋 WORKING COMMANDS (All Tested):**
- **Music Control**: /play, /skip, /pause, /resume, /stop, /volume, /join, /leave
- **Queue Management**: /queue, /search, /playlist, /nowplaying, /status
- **New Commands**: /lyrics, /replay, /favorite (add/list/play/remove)
- **Special Features**: All slash commands registered and working with proper error handling

**🎛️ BUTTON CONTROLS (All Working):**
- ⏸️/▶️ Pause/Resume button
- ⏭️ Skip button
- ⏹️ Stop button  
- 🔀 Shuffle button
- 🔁 Loop toggle button
- 🎵 Autoplay toggle button
- 📋 Queue display button

# System Architecture

## Bot Architecture
The application follows a dual command architecture supporting both Discord.js slash commands and traditional prefix commands (!). The main entry point (`index.js`) initializes the Discord client with necessary intents for guild, voice state, and message interactions. 

**📁 Project Structure:**
- `src/` - Core application modules (database.js, spotify.js)  
- `utils/` - Utility modules (health.js)
- `scripts/youtube/` - YouTube player scripts with proper naming
- `commands/` - Slash command modules
- `config/` - Bot configuration files
- Root directory - Main entry point and configuration files only

Commands are implemented both as modular files in the `commands/` directory and as inline prefix command handlers with complete error handling and security fixes.

## Music System Design
The core music functionality is built around an enhanced guild-specific queue system using JavaScript Maps for data storage. Each guild has its own `MusicQueue` instance that manages songs, playback state, volume, loop settings, autoplay, shuffle mode, and playback history. The system supports multiple audio sources with intelligent fallback mechanisms.

## Multi-Source Audio Processing
Audio streaming supports three main sources:
- **YouTube**: Direct URLs and search queries using ytdl-core and play-dl with fallback
- **Spotify**: Track and playlist URLs converted to YouTube equivalents via Spotify API
- **SoundCloud**: Direct streaming using soundcloud-downloader

## Command Structure
**Slash Commands**: Individual modules in `commands/` directory following Discord's slash command pattern
**Prefix Commands**: Centralized handler with shortcuts mapping (!p → play, !s → skip, etc.)
**Interactive Controls**: Button-based controls for pause, skip, volume, queue management

## Enhanced Queue Management
- Maximum 100 songs per queue with overflow protection
- Shuffle functionality with randomization algorithm
- Loop mode for repeating current track
- Autoplay system using YouTube's related video suggestions
- Playback history tracking (last 10 songs)
- Position tracking and queue navigation

## State Management
The bot maintains enhanced persistent state through in-memory storage using JavaScript Maps. Includes music queues, audio players, voice connections, user preferences, and playback statistics. All state is guild-specific and includes advanced features like autoplay settings and shuffle state.

# External Dependencies

## Core Discord Libraries
- **discord.js v14**: Primary Discord API interaction, slash commands, and interactive components
- **@discordjs/voice**: Voice channel connection, audio player management, and voice state handling
- **tweetnacl**: Cryptographic library required for Discord voice connections

## Audio Processing Libraries
- **@distube/ytdl-core**: YouTube video information extraction and audio streaming
- **play-dl**: Alternative YouTube streaming with better reliability
- **soundcloud-downloader**: SoundCloud track streaming and metadata extraction
- **youtube-sr**: YouTube search functionality and video information retrieval

## Music Service Integration
- **@spotify/web-api-ts-sdk**: Spotify Web API integration for track and playlist data
- **spotify.js**: Custom Spotify integration module using Replit's connector system

## System Dependencies  
- **Node.js File System (fs)**: Dynamic command loading and directory management
- **Node.js Path**: File path resolution for command discovery and loading

# Available Commands

## Prefix Commands (! shortcuts)
- `!p` / `!play` - Play music from YouTube, Spotify, or SoundCloud
- `!s` / `!skip` - Skip current track
- `!st` / `!stop` - Stop playback and clear queue
- `!ps` / `!pause` - Pause current track
- `!r` / `!resume` - Resume paused track
- `!v` / `!volume` - Set volume (1-100)
- `!q` / `!queue` - Display current queue
- `!np` / `!nowplaying` - Show current track information
- `!l` / `!loop` - Toggle loop mode
- `!sh` / `!shuffle` - Shuffle queue
- `!ap` / `!autoplay` - Toggle autoplay
- `!h` / `!help` - Show comprehensive help
- `!j` / `!join` - Join voice channel
- `!lv` / `!leave` - Leave voice channel

## Interactive Controls
- ⏸️ Pause/Resume button
- ⏭️ Skip track button  
- ⏹️ Stop and clear queue button
- 🔀 Shuffle queue button
- 🔁 Toggle loop button
- 🎵 Toggle autoplay button
- 🔊/🔉 Volume up/down buttons
- 📋 Quick queue display button

The bot requires Discord Bot Token configuration and appropriate Discord application permissions including voice channel access, message sending, slash command registration, and message content intent for prefix commands.