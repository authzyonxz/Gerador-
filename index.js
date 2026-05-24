// Bot de Discord - Sistema de Saldo e Keys
// Desenvolvido por ruanzada7

require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ]
});

// ===== BANCO DE DADOS EM MEMÓRIA =====
// Para produção, substitua por SQLite ou MongoDB
const db = {
  saldos: {},      // { userId: number }
  estoque: {       // { '1dia': [...], '7dias': [...], '30dias': [...] }
    '1dia': [],
    '7dias': [],
    '30dias': [],
  },
  precos: {
    '1dia': 15,
    '7dias': 50,
    '30dias': 100,
  }
};

// ===== ID DO DONO =====
const OWNER_ID = process.env.OWNER_ID; // Coloque seu ID no .env

// ===== FUNÇÕES AUXILIARES =====
function getSaldo(userId) {
  return db.saldos[userId] || 0;
}

function addSaldo(userId, valor) {
  db.saldos[userId] = (db.saldos[userId] || 0) + valor;
}

function debitSaldo(userId, valor) {
  db.saldos[userId] = (db.saldos[userId] || 0) - valor;
}

function isOwner(userId) {
  return userId === OWNER_ID;
}

// ===== REGISTRO DOS SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName('addsaldo')
    .setDescription('👑 [DONO] Adiciona saldo a um membro')
    .addUserOption(opt =>
      opt.setName('membro').setDescription('Membro que receberá o saldo').setRequired(true))
    .addNumberOption(opt =>
      opt.setName('valor').setDescription('Valor em R$ a adicionar').setRequired(true)),

  new SlashCommandBuilder()
    .setName('saldo')
    .setDescription('💰 Verifica seu saldo atual'),

  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('🛒 Abre o painel de compra de Keys Proxy Android'),

  new SlashCommandBuilder()
    .setName('adicionar')
    .setDescription('👑 [DONO] Adiciona keys ao estoque')
    .addStringOption(opt =>
      opt.setName('plano')
        .setDescription('Plano das keys')
        .setRequired(true)
        .addChoices(
          { name: 'Key 1 Dia - R$15', value: '1dia' },
          { name: 'Key 7 Dias - R$50', value: '7dias' },
          { name: 'Key 30 Dias - R$100', value: '30dias' },
        ))
    .addStringOption(opt =>
      opt.setName('keys').setDescription('Keys (uma por linha)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('estoque')
    .setDescription('👑 [DONO] Visualiza o estoque completo'),
].map(cmd => cmd.toJSON());

// ===== EVENTOS =====
client.once('ready', async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  console.log(`📌 ID do Bot: ${client.user.id}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log('🔄 Registrando slash commands...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash commands registrados!');
  } catch (err) {
    console.error('❌ Erro ao registrar commands:', err);
  }

  client.user.setActivity('🔑 Proxy Android Keys | /panel', { type: 3 });
});

// ===== SLASH COMMANDS =====
client.on('interactionCreate', async interaction => {

  // ─── /addsaldo ───
  if (interaction.isChatInputCommand() && interaction.commandName === 'addsaldo') {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Apenas o **dono do bot** pode usar este comando!', ephemeral: true });
    }
    const membro = interaction.options.getUser('membro');
    const valor = interaction.options.getNumber('valor');

    if (valor <= 0) return interaction.reply({ content: '❌ O valor deve ser maior que R$0!', ephemeral: true });

    addSaldo(membro.id, valor);

    const embed = new EmbedBuilder()
      .setTitle('💸 Saldo Adicionado!')
      .setColor(0x00FF88)
      .addFields(
        { name: '👤 Membro', value: `<@${membro.id}>`, inline: true },
        { name: '💰 Valor Adicionado', value: `R$ ${valor.toFixed(2)}`, inline: true },
        { name: '💳 Novo Saldo', value: `R$ ${getSaldo(membro.id).toFixed(2)}`, inline: true },
      )
      .setFooter({ text: 'Sistema desenvolvido por ruanzada7' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Notifica o membro via DM
    try {
      await membro.send({
        embeds: [new EmbedBuilder()
          .setTitle('💰 Você recebeu saldo!')
          .setColor(0x00FF88)
          .setDescription(`Você recebeu **R$ ${valor.toFixed(2)}** de saldo!\nSaldo atual: **R$ ${getSaldo(membro.id).toFixed(2)}**`)
          .setFooter({ text: 'Sistema desenvolvido por ruanzada7' })]
      });
    } catch (_) {}
  }

  // ─── /saldo ───
  if (interaction.isChatInputCommand() && interaction.commandName === 'saldo') {
    const saldo = getSaldo(interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle('💳 Seu Saldo')
      .setColor(0x5865F2)
      .setDescription(`Olá, <@${interaction.user.id}>!`)
      .addFields({ name: '💰 Saldo Disponível', value: `R$ ${saldo.toFixed(2)}` })
      .setFooter({ text: 'Sistema desenvolvido por ruanzada7' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ─── /panel ───
  if (interaction.isChatInputCommand() && interaction.commandName === 'panel') {
    const embed = new EmbedBuilder()
      .setTitle('🔑 GERADOR DE KEYS — PROXY ANDROID')
      .setColor(0xFF6B00)
      .setDescription('Selecione o plano desejado e confirme a compra com seu saldo.')
      .addFields(
        {
          name: '📅 KEY DE 1 DIA',
          value: `💰 **R$ ${db.precos['1dia'].toFixed(2)}**\n📦 Estoque: **${db.estoque['1dia'].length} key(s)**`,
          inline: true
        },
        {
          name: '📅 KEY DE 7 DIAS',
          value: `💰 **R$ ${db.precos['7dias'].toFixed(2)}**\n📦 Estoque: **${db.estoque['7dias'].length} key(s)**`,
          inline: true
        },
        {
          name: '📅 KEY DE 30 DIAS',
          value: `💰 **R$ ${db.precos['30dias'].toFixed(2)}**\n📦 Estoque: **${db.estoque['30dias'].length} key(s)**`,
          inline: true
        },
        {
          name: '💳 Seu Saldo',
          value: `R$ ${getSaldo(interaction.user.id).toFixed(2)}`,
          inline: false
        }
      )
      .setFooter({ text: 'Sistema desenvolvido por ruanzada7' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('comprar_1dia').setLabel('🔑 1 Dia — R$15').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('comprar_7dias').setLabel('🔑 7 Dias — R$50').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('comprar_30dias').setLabel('🔑 30 Dias — R$100').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
  }

  // ─── /adicionar (estoque) ───
  if (interaction.isChatInputCommand() && interaction.commandName === 'adicionar') {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Apenas o **dono do bot** pode usar este comando!', ephemeral: true });
    }
    const plano = interaction.options.getString('plano');
    const keysRaw = interaction.options.getString('keys');
    const keys = keysRaw.split('\n').map(k => k.trim()).filter(k => k.length > 0);

    db.estoque[plano].push(...keys);

    const embed = new EmbedBuilder()
      .setTitle('📦 Estoque Atualizado!')
      .setColor(0x00BFFF)
      .addFields(
        { name: '📅 Plano', value: plano === '1dia' ? '1 Dia' : plano === '7dias' ? '7 Dias' : '30 Dias', inline: true },
        { name: '➕ Keys Adicionadas', value: `${keys.length}`, inline: true },
        { name: '📦 Total em Estoque', value: `${db.estoque[plano].length}`, inline: true },
      )
      .setFooter({ text: 'Sistema desenvolvido por ruanzada7' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ─── /estoque ───
  if (interaction.isChatInputCommand() && interaction.commandName === 'estoque') {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Apenas o **dono do bot** pode usar este comando!', ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setTitle('📦 Estoque Completo')
      .setColor(0xFFD700)
      .addFields(
        { name: '📅 1 Dia (R$15)', value: `${db.estoque['1dia'].length} key(s)`, inline: true },
        { name: '📅 7 Dias (R$50)', value: `${db.estoque['7dias'].length} key(s)`, inline: true },
        { name: '📅 30 Dias (R$100)', value: `${db.estoque['30dias'].length} key(s)`, inline: true },
      )
      .setFooter({ text: 'Sistema desenvolvido por ruanzada7' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ─── BOTÕES DO PANEL (comprar) ───
  if (interaction.isButton()) {
    const planoMap = {
      'comprar_1dia': '1dia',
      'comprar_7dias': '7dias',
      'comprar_30dias': '30dias',
    };
    const planoNomeMap = { '1dia': '1 Dia', '7dias': '7 Dias', '30dias': '30 Dias' };

    const plano = planoMap[interaction.customId];
    if (!plano) return;

    const preco = db.precos[plano];
    const saldo = getSaldo(interaction.user.id);

    if (saldo < preco) {
      return interaction.reply({
        content: `❌ Saldo insuficiente!\n💳 Seu saldo: **R$ ${saldo.toFixed(2)}**\n💰 Necessário: **R$ ${preco.toFixed(2)}**`,
        ephemeral: true
      });
    }

    if (db.estoque[plano].length === 0) {
      return interaction.reply({
        content: `❌ **Estoque vazio** para o plano de ${planoNomeMap[plano]}!\nAguarde reposição.`,
        ephemeral: true
      });
    }

    // Debita saldo e entrega key
    const key = db.estoque[plano].shift();
    debitSaldo(interaction.user.id, preco);

    const embed = new EmbedBuilder()
      .setTitle('✅ Compra Realizada!')
      .setColor(0x00FF88)
      .setDescription(`Sua key de **${planoNomeMap[plano]}** foi gerada com sucesso!`)
      .addFields(
        { name: '🔑 Sua Key', value: `\`\`\`${key}\`\`\`` },
        { name: '💳 Saldo Restante', value: `R$ ${getSaldo(interaction.user.id).toFixed(2)}`, inline: true },
        { name: '⏳ Validade', value: planoNomeMap[plano], inline: true },
      )
      .setFooter({ text: 'Sistema desenvolvido por ruanzada7 • Clique na key para copiar' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// ===== INICIAR BOT =====
client.login(process.env.TOKEN);
