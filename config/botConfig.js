module.exports = {
    // Bot Configuration
    BOT: {
        TOKEN: process.env.DISCORD_TOKEN,
        PREFIX: '!',
        MAX_QUEUE_SIZE: 500,
        DEFAULT_VOLUME: 50,
        OWNER_IDS: ['YOUR_USER_ID'], // Add your Discord user ID here
    },

    // Command Aliases
    ALIASES: {
        // Play commands
        'p': 'play',
        'pl': 'play',
        'music': 'play',
        
        // Skip commands
        's': 'skip',
        'sk': 'skip',
        'next': 'skip',
        
        // Queue commands
        'q': 'queue',
        'qu': 'queue',
        'list': 'queue',
        
        // Volume commands
        'v': 'volume',
        'vol': 'volume',
        
        // Loop commands
        'l': 'loop',
        'repeat': 'loop',
        
        // Stop commands
        'st': 'stop',
        'stp': 'stop',
        'halt': 'stop',
        'disconnect': 'stop',
        'dc': 'stop',
        
        // Status commands
        'stat': 'status',
        'ping': 'status',
        
        // New audio commands
        'ly': 'lyrics',
        'eq': 'equalizer',
        
        // Pause commands
        'pause': 'pause',
        'resume': 'resume',
        
        // Help commands
        'h': 'help',
        'commands': 'help',
        'cmd': 'help',
        
        // Prefix commands
        'prefix': 'setprefix',
        'changeprefix': 'setprefix',
        
        // Search commands
        'search': 'search',
        'find': 'search',
        
        // Shuffle commands
        'shuffle': 'shuffle',
        'mix': 'shuffle',
        
        // Clear commands
        'clear': 'clear',
        'empty': 'clear',
        
        // Now playing commands
        'np': 'nowplaying',
        'current': 'nowplaying',
        'playing': 'nowplaying'
    },

    // Colors for embeds
    COLORS: {
        SUCCESS: '#00ff00',
        ERROR: '#ff0000',
        WARNING: '#ffff00',
        INFO: '#00ffff',
        MUSIC: '#9932cc',
        QUEUE: '#ff69b4'
    },

    // Emojis
    EMOJIS: {
        PLAY: '▶️',
        PAUSE: '⏸️',
        STOP: '⏹️',
        SKIP: '⏭️',
        PREVIOUS: '⏮️',
        VOLUME: '🔊',
        QUEUE: '📋',
        LOOP: '🔂',
        SHUFFLE: '🔀',
        MUSIC: '🎵',
        SUCCESS: '✅',
        ERROR: '❌',
        WARNING: '⚠️',
        LOADING: '⏳',
        AUTO: '🤖'
    },

    // Language translations
    MESSAGES: {
        hi: {
            NO_VOICE_CHANNEL: '❌ पहले किसी voice channel में join करें!',
            BOT_NO_PERMISSION: '❌ मुझे इस voice channel में join करने की permission नहीं है!',
            NO_SONG_PLAYING: '❌ कोई गाना play नहीं हो रहा है!',
            QUEUE_EMPTY: '❌ Queue empty है!',
            SONG_ADDED: '✅ गाना queue में add हो गया:',
            NOW_PLAYING: '🎵 अब play हो रहा है:',
            SONG_SKIPPED: '⏭️ गाना skip कर दिया:',
            MUSIC_STOPPED: '⏹️ Music stop कर दिया!',
            MUSIC_PAUSED: '⏸️ Music pause कर दिया!',
            MUSIC_RESUMED: '▶️ Music resume कर दिया!',
            VOLUME_SET: '🔊 Volume set कर दिया:',
            PREFIX_CHANGED: '✅ Server prefix change हो गया:',
            AUTOPLAY_ON: '🤖 Autoplay on कर दिया!',
            AUTOPLAY_OFF: '🤖 Autoplay off कर दिया!',
            LOOP_ON: '🔂 Loop mode on कर दिया!',
            LOOP_OFF: '➡️ Loop mode off कर दिया!',
            QUEUE_CLEARED: '🗑️ Queue clear कर दी!',
            QUEUE_SHUFFLED: '🔀 Queue shuffle कर दी!',
            NO_RESULTS: '❌ कोई result नहीं मिला!',
            ERROR_OCCURRED: '❌ कोई error आई है, कृपया बाद में try करें!',
            LOADING: '⏳ Loading...'
        },
        en: {
            NO_VOICE_CHANNEL: '❌ You need to join a voice channel first!',
            BOT_NO_PERMISSION: '❌ I don\'t have permission to join this voice channel!',
            NO_SONG_PLAYING: '❌ No song is currently playing!',
            QUEUE_EMPTY: '❌ Queue is empty!',
            SONG_ADDED: '✅ Song added to queue:',
            NOW_PLAYING: '🎵 Now playing:',
            SONG_SKIPPED: '⏭️ Skipped song:',
            MUSIC_STOPPED: '⏹️ Music stopped!',
            MUSIC_PAUSED: '⏸️ Music paused!',
            MUSIC_RESUMED: '▶️ Music resumed!',
            VOLUME_SET: '🔊 Volume set to:',
            PREFIX_CHANGED: '✅ Server prefix changed to:',
            AUTOPLAY_ON: '🤖 Autoplay enabled!',
            AUTOPLAY_OFF: '🤖 Autoplay disabled!',
            LOOP_ON: '🔂 Loop mode enabled!',
            LOOP_OFF: '➡️ Loop mode disabled!',
            QUEUE_CLEARED: '🗑️ Queue cleared!',
            QUEUE_SHUFFLED: '🔀 Queue shuffled!',
            NO_RESULTS: '❌ No results found!',
            ERROR_OCCURRED: '❌ An error occurred, please try again later!',
            LOADING: '⏳ Loading...'
        }
    },

    // Music sources priority
    SOURCES: {
        YOUTUBE: 'ytsearch',
        SPOTIFY: 'spsearch',
        SOUNDCLOUD: 'scsearch',
        DEFAULT: 'ytsearch'
    },

    // Advanced Features
    FEATURES: {
        ENABLE_FILTERS: true,
        ENABLE_DJ_MODE: true,
        ENABLE_24_7_MODE: true,
        ENABLE_LYRICS: true,
        ENABLE_FAVORITES: true,
        ENABLE_PLAYLISTS: true,
        ENABLE_SPOTIFY: true,
        ENABLE_SOUNDCLOUD: true,
        ENABLE_VOTING: false,
        MAX_PLAYLIST_SIZE: 100,
        MAX_SEARCH_RESULTS: 10,
        ENABLE_AUTO_PAUSE: false,
        ENABLE_AUTO_DISCONNECT: false
    },

    // Cache Configuration
    CACHE: {
        SEARCH_RESULTS_TTL: 3600000,
        GUILD_SETTINGS_TTL: 1800000,
        MAX_SEARCH_CACHE_SIZE: 500,
        MAX_GUILD_CACHE_SIZE: 1000,
        CLEANUP_INTERVAL: 600000,
        ENABLE_CACHE: true
    },

    // Audio Filters Configuration
    FILTERS: {
        bassboost: {
            name: 'Bass Boost',
            ffmpeg: '-af "bass=g=20,dynaudnorm=f=200"'
        },
        nightcore: {
            name: 'Nightcore',
            ffmpeg: '-af "asetrate=48000*1.25,aresample=48000,atempo=1.06"'
        },
        slowed: {
            name: 'Slowed + Reverb',
            ffmpeg: '-af "asetrate=48000*0.8,aresample=48000,atempo=0.9,aecho=0.8:0.9:1000:0.3"'
        },
        '8d': {
            name: '8D Audio',
            ffmpeg: '-af "apulsator=hz=0.08"'
        },
        vaporwave: {
            name: 'Vaporwave',
            ffmpeg: '-af "asetrate=48000*0.9,aresample=48000,atempo=0.85"'
        },
        soft: {
            name: 'Soft',
            ffmpeg: '-af "equalizer=f=1000:width_type=h:width=200:g=-5"'
        },
        loud: {
            name: 'Loud',
            ffmpeg: '-af "volume=1.5,dynaudnorm=f=150"'
        },
        normal: {
            name: 'Normal',
            ffmpeg: ''
        }
    },

    // Deployment Configuration
    DEPLOYMENT: {
        PORT: process.env.PORT || 3000,
        HEALTH_CHECK_INTERVAL: 300000,
        ENABLE_HEALTH_CHECK: true,
        RESTART_ON_CRASH: true,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        ENVIRONMENT: process.env.NODE_ENV || 'production'
    },

    // Error Handling
    ERROR_HANDLING: {
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000,
        TIMEOUT: 30000,
        ENABLE_ERROR_REPORTING: true,
        FALLBACK_ON_ERROR: true
    },

    // Performance Settings
    PERFORMANCE: {
        MAX_CONCURRENT_STREAMS: 10,
        STREAM_BUFFER_SIZE: 1024 * 1024,
        ENABLE_COMPRESSION: true,
        MAX_MEMORY_USAGE: 512,
        GARBAGE_COLLECTION_INTERVAL: 900000
    },

    // Rate Limiting
    RATE_LIMIT: {
        COMMANDS_PER_USER: 5,
        COMMANDS_WINDOW: 10000,
        ENABLE_RATE_LIMIT: true
    },

    // 24/7 Mode Configuration
    TWENTYFOUR_SEVEN: {
        ENABLE_AUTO_REJOIN: true,
        CHECK_INTERVAL: 300000,
        IDLE_TIMEOUT: 3600000,
        ENABLE_KEEP_ALIVE: true
    }
};