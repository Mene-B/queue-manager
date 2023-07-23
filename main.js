const Discord = require("discord.js");
const config= require("./config.json");
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMessageReactions
    ]
});

const prefix = config.prefix;
const {clientPG} = require("./database.js");
const adminId = config.adminRoleId;

const reactions = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];
client.login(config.token);

client.on("ready",()=>{
    console.log("Bot ready to work !");
});

client.on("messageCreate", async(message)=>{
    console.log(message);
    if(message.author.bot){
        return;
    }
    if(!message.content.startsWith(prefix)){
        return;
    }
    if((message.content === prefix+"tf") || (message.content === prefix+"tv") || (message.content === prefix+"ta")){
        const category = message.content.split("")[2];
        const verif = (await clientPG.query('select * from tickets where user_id = $1 and category = $2',[message.author.id, category]))?.rows[0];

        if (verif !== undefined){
            message.react("❌");
            return;
        }
        await clientPG.query('insert into tickets values ($1,$2)',[message.author.id, category]);
        message.react("⌛");
        return;
    }
    if((message.content === prefix+"f") || (message.content === prefix+"v") || (message.content === prefix+"a")){
        const category = message.content.split("")[1];
        const datas = (await clientPG.query('select * from tickets where category = $1',[category]))?.rows;
        if(datas.length === 0){
            message.reply("Il n'y a actuellement personne dans cette queue");
            return;
        }
        const embedText = datas.slice(0,9).map((element, index)=>{
            return `${(index+1).toString()} - <@${element.user_id}>`
        }).join("\n");

        const embed = new Discord.EmbedBuilder()
        .setTitle("Queue " + category)
        .setDescription(embedText)
        .setColor("Yellow")

        const reply = await message.reply({embeds:[embed]});
        for(let i = 0; i<datas.slice(0,9).length; i++){
            await reply.react(reactions[i]);
        }
    }
    if((message.content === prefix+"rf") || (message.content === prefix+"rv") || (message.content === prefix+"ra")){
        const category = message.content.split("")[2];
        if(!message.member.roles.cache.has(adminId)){
            message.react("❌");
            return;
        }
        await clientPG.query('delete from tickets where category = $1',[category]);
        message.react("✅");
    }
})

client.on("messageReactionAdd", async(reaction, user)=>{
    if(user.id === client.user.id){
        return;
    }
    if((reaction.message.author !== client.user) && (reaction.message.embeds.length === 0)){
        return;
    }
    await reaction.message.guild.members.fetch();
    const member = reaction.message.guild.members.cache.get(user.id);
    if(!member.roles.cache.has(adminId)){
        reaction.users.remove(user);
        return;
    }
    await reaction.message.reactions.removeAll();
    const category = reaction.message.embeds[0].title.split(" ")[1];
    const index = reactions.indexOf(reaction.emoji.name);
    const user_id = reaction.message.embeds[0].description.split("\n")[index].slice(6, -1);
    await clientPG.query("delete from tickets where user_id = $1 and category = $2",[user_id, category]);
    const datas = (await clientPG.query('select * from tickets where category = $1',[category]))?.rows;

    if(datas.length === 0){
        reaction.message.edit({embeds:[], content:"Il n'y a plus personne dans cette queue"});
        reaction.users.remove(user);
        return;
    }

    const embedText = datas.slice(0,9).map((element, index)=>{
        return `${(index+1).toString()} - <@${element.user_id}>`
    }).join("\n");

    const embed = new Discord.EmbedBuilder()
    .setTitle("Queue " + category)
    .setDescription(embedText)
    .setColor("Yellow")

    const reply = await reaction.message.edit({embeds:[embed]});
    for(let i = 0; i<datas.slice(0,9).length; i++){
        await reply.react(reactions[i]);
    }
})