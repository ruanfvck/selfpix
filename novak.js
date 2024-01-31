const Discord = require('discord.js-selfbot-v13')
const client = new Discord.Client({
    checkUpdate: false,
})
const Prefix = '!'
const fs = require('fs');
const mercadopago = require('mercadopago')
const accessToken = "" // Token do Mercado Pago
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

client.on('ready', () => {
    console.log(`Logged in ${client.user.username}`)
})

const randomnumber = Math.floor(Math.random() * 999) 

client.on('messageCreate', async msg => {

    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(Prefix)})\s*`);
    if (!prefixRegex.test(msg.content)) return;
    const [, matchedPrefix] = msg.content.match(prefixRegex);
    const args = msg.content.slice(matchedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    mercadopago.configure({
        access_token: accessToken
    });
    
    if(msg.author.id !== client.user.id){
        return
    }

if (command === "pix") {
    msg.delete()
	
  if(!args[0]){
        return msg.channel.send('❗ Por favor insira um valor para gerar um pagamento!')
    }
	
    let amount = '';
	amount = Number(args.join(" ").replace(',', '.').replace(/[^\d\.]+/g, ''))

    const email = ''; // qualquer email

	const payment_data = {
            transaction_amount: amount,
            description: 'Pagamentos Via DMS',
            payment_method_id: 'pix',
            payer: {
               email,
                first_name: `${client.user.username}`,
            }
        };

    const data = await mercadopago.payment.create(payment_data);
    const base64_img = data.body.point_of_interaction.transaction_data.qr_code_base64
    const buf = Buffer.from(base64_img, 'base64');
    const dateStr = data.body.date_of_expiration;
    const date = new Date(dateStr);
    const unixTimestamp = Math.floor(date.getTime() / 1000);

    fs.writeFileSync(`./qr_code_${randomnumber}.png`, buf);

  msg.channel.send({content: `**✅ Pagamento PIX gerado com sucesso!**\n\n> **💳 Total:** R$${payment_data.transaction_amount}\n> **📆 Pague até:** <t:${unixTimestamp}:f>`, files: [`./qr_code_${randomnumber}.png`] })
   
   .then((result)=>{
    msg.channel.send(`${data.body.point_of_interaction.transaction_data.qr_code}`)
    fs.unlinkSync(`./qr_code_${randomnumber}.png`)  
    
    let tentativas = 0;
    const interval = setInterval(async () => {
        // Verificando se foi pago automaticamente
        console.log('tentativa: ', tentativas+1);
        tentativas++;

        const res = await mercadopago.payment.get(data.body.id);
        const pagamentoStatus = res.body.status;


        if (tentativas >= 10 || pagamentoStatus === 'approved') {

            clearInterval(interval);

            if (pagamentoStatus === 'approved') {
          msg.channel.send('**✅ Pagamento aprovado com sucesso!**')
          console.clear()
          console.log('Pagamento: '+data.body.id+ ' foi aprovado com sucesso!')

            } 

            else if (pagamentoStatus !== 'approved') {
            console.clear()    
            msg.channel.send('❗ Desculpe você demorou mais de **10 Minuto** para realizar o pagamento')
            }    
         }
        }, 60_000);  
                    })
}

})


client.login('') // Token da sua conta
