const Chat = require("./clientChat");
const Bd = require("./Bd");


async function menu(message, client){
	let long = '-5.8228247';
	let lat = '-35.2181361';
	let address = 'Rua José Ribeiro Dantas, 1982 - Lagoa Nova - Natal/RN.';
	let group = '558499495226-1607029242@g.us';
	let name = message.sender.shortName || message.sender.name || message.sender.verifiedName || message.sender.formattedName || message.chat.contact.name || message.chat.contact.verifiedName || message.chat.contact.formattedName;
	let phone = message.from;
	phone = phone.replace('@c.us', '');
	let menu = '```1) Saber nosso endereço\n2) Setor Financeiro\n3) Setor Comercial\n4) Falar com atendente```';
	let alert = `${name} enviou uma nova mensagem de mídia no WhatsApp.\nContato: ${phone}.`;

	//aqui exibe o objeto msg para que vc possa ver o que pode ser manipulado
	//console.log(message);

	//se for uma mídia ? checa o tipo e fala que não pode tratar enquanto for atendido por um bot.
	if (message.type === 'ptt' && message.isGroupMsg === false){

		client.sendText(message.from, '```Esse menu não lida com *áudios*, apenas textos. Mas os nossos técnicos podem receber audios.\nFavor digite *4* para falar com um atendente.```');
		//client.sendText(group, alert);

	}

	if (message.type === 'document' && message.isGroupMsg === false){

		client.sendText(message.from, '```Esse menu não lida com *arquivos*, apenas textos. Mas os nossos técnicos podem receber arquivos.\nFavor digite *4* para falar com um atendente.```');
		client.sendText(group, alert);

	}

	if (message.isMedia === true && message.from !== 'status@broadcast' && message.isGroupMsg === false){
		//console.log('MIDIA\n',message);
	    switch(message.type){

	    	case 'image':
	    		client.sendText(message.from, '```Esse menu não lida com *imagens*. Mas nossos técnicos conseguem receber.\nDigite *4* para falar com um atendente.```');
	    		//client.sendText(group, alert);
	    	break;

	    	case 'video':
	    		client.sendText(message.from, '```Esse menu não lida com *vídeos*. Mas nossos técnicos conseguem receber.\nDigite *4* para falar com um atendente.```');
	    		//client.sendText(group, alert);
	    	break;



	    }

	}

	//aqui vc pode programar o bot caso alguem diga algo....
	 if (message.isMedia === false && message.isGroupMsg === false && message.type === 'chat'){
	    console.log('TEXTO\n',message);
	    switch (message.body){

	        case '1':
	            client.sendText(message.from, '```Segue nosso endereço...```');
	            
	            setTimeout(async function a(){

	                await client.sendLocation(message.from, long, lat, address);

	            }, 1500);

	            setTimeout(function b(){

	                client.sendText(message.from, '```Digite 0 para ver o menu principal.```');

	            }, 3000);

	        break;

	        case '2':
	            optSendContact('Financeiro', message, client, '558498433223@c.us', 'Estanis Financeiro Engemática');                            

	        break;

	        case '3':
	            optSendContact('Comercial', message, client, '558494014686@c.us', 'Derossi');

	        break;

	        case '4':
	            // optSendContact('Recepção', message, client, '558498433231@c.us', 'Recepção Engemática');
				//Bd.alteraAtendente(message.from, 'humano');
				Chat.createVisitor(name, message.from, '```Nova chamada do Whatsapp.```', client);
	        break;
			

			case '0':
				client.sendText(message.from, menu);
	        break;

			case '#parceiros':
				Engeadmin.envioAlertas(client);
			break;

	        default:
	        	//Se não for nada do menu que vc criou, então vc pode criar uma resposta informando que não entendeu ou...

	        	//Chamar o DialogFlow (caso tenha) para interpretar a intenção ou...
	        	//Dialog.queryDialog(client, message);

	        	//Usar este recurso que checa dados no WordPress caso tenha blog com conteudo util
	            //Wordpress.queryWp(message.body, client, message.from);
	        break;
	    }

	 	
	           
	 }

}

async function optSendContact(sector, message, client, contact, name){

    setTimeout(function a(){

        client.sendText(message.from, `Segue o Contato do(a) ${sector}...`);

    }, 1500);

    setTimeout(async function b(){

        await client.sendContactVcard(message.from, contact, name);

    }, 3000);

    setTimeout(function c(){

        client.sendText(message.from, '```Pressione 0 para ver o menu principal.```')

    }, 4000);

}

module.exports = { menu, optSendContact }