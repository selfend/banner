const { Client, Partials, GatewayIntentBits } = require('discord.js')
const config = require('./config')
const Canvas = require('canvas')
const fs = require("fs")
const ms = require('ms')
const DB =  require('db.simple')
const db = new DB.Database()

Canvas.registerFont("./Assets/Gilroy-Bold.ttf", {
    family: "Gilroy"
})

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {Guild} guild 
 */
async function initBannerSystem(guild) {
    while (true) {
        const date = new Date()
        const timeHHMM = date.getHours() + `:` + (`0` + date.getMinutes()).slice(-2)

        const banner = await getBannerImage(guild, timeHHMM)

        await guild.setBanner(banner)
        console.log(`Баннер изменен`)

        setInterval(() => {
            const voices = guild.members.cache.filter(m => (m.voice.channel && !(m.voice.selfDeaf || m.voice.selfMute)))
    
            voices.forEach(async (member) => {

            })
        }, 1_000)

        await sleep(120_000)
    }
}

const Bot = new Client({
    partials: [
        Partials.Message, Partials.Channel, Partials.User, Partials.GuildMember,
        Partials.ThreadMember, Partials.GuildScheduledEvent, Partials.Reaction
    ],
    allowedMentions: {
        parse: [`users`, `roles`],
        repliedUser: true
    }, intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildScheduledEvents
    ]
})
Bot.on(`ready`, async () => {
    const guild = Bot.guilds.cache.get(config.guild_id)

    initBannerSystem(guild)
    console.log(`Баннер активирован ${Bot.user.tag}`)

    setInterval(async () => {
        if (!db.get('time')) db.set('time', Date.now() + ms('2h'))

        if (db.get('time') < Date.now()) {
            db.resetDatabase()
            console.log('база данных удалена')
        }
    }, 60_000)
    setInterval(async () => {
        guild.members.cache.forEach(member => {
            if (member.voice.channel) {
            db.add('online_' + member.id, 1)
            }
        })
    }, 1_000)
})

Bot.login(config.token)

/**
 * @param {Guild} guild 
 */
async function getBannerImage(guild, time) {
    return await createBannerImage(guild, time)
}

/**
 * @param {Guild} guild 
 */
async function createBannerImage(guild, time) {
    const canvas = Canvas.createCanvas(960, 540)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = `#FFFFFF`
    ctx.lineWidth = 3
    ctx.textAlign = 'center'
    ctx.font = `90px Gilroy`

    const members = guild.memberCount

    const image = await Canvas.loadImage(`./Assets/banner.jpg`)
    ctx.drawImage(image, 0, 0, 960, 540)

    ctx.fillText(members, 668, 315)

    return canvas.toBuffer()
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection');
    console.log(reason, p)
})

process.on("uncaughtException", (err, origin) => {
    console.log('Uncaught Exception');
    console.log(err, origin)
})

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('Uncaught Monitor Exception');
    console.log(err, origin)
})