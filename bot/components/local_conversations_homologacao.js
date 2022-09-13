// this module is used to create local conversations with your bot..
const axios = require('axios');
const Bd = require("./../Bd");

module.exports = function localConversations(controller) {

    let token = ''
    let room = '';
    let qtdMsg = 0;
    let qtdTentativas = 0;

    let menuInicial = 'Por favor nos informe abaixo como podemos te atender.\n\n*1* - Informações sobre produto\n*2* - Promoções\n*3* - Orçamento\n*4* - SAC'


    //Aciona saudação e menu principal
    //direct_message,live_chat,channel,private_channel
    controller.hears(['Bom dia', 'bom dia', 'Boa tarde', 'Boa tarde', 'boa noite', 'Olá', 'Ola', 'ola', 'olá', 'oi', 'Oi'], 'live_chat', function (bot, message) {
        qtdMsg = qtdMsg + 1;
        bot.startConversation(message, function (err, convo) {
            console.log('mensagame:', message)
            const regex = /[0-9]/;
            let nome = message.alias;
            const teste = regex.test(nome);
            if (!teste) {
                convo.say(`Olá ${nome}, tudo bem?! Sou o Pedro, assistente virtual da *São Pedro Casa & Construção*. Estou aqui para ajudar.`);

            }else{
                convo.say(`Olá, tudo bem?! Sou o Pedro, assistente virtual da *São Pedro Casa & Construção*. Estou aqui para ajudar.`);
            }
            //convo.say(`Por favor nos informe abaixo como podemos te atender.`);
            menu_principal(convo,message);
            convo.next();
        });
    });

    controller.hears(['Tenho interesse'], 'live_chat', async function (bot, message) {
        let contato = message.token
        let telefone = contato.replace(/@c.us/g, '')

        let json = {
            sessionName: process.env.SESSION_NAME,
            number: telefone,
            title: "Excelente! O que deseja fazer?",
            button: [{"buttonText": {"displayText": "Fazer orçamento"}},{"buttonText": {"displayText": "Solicitar uma cotação"}}],
            description: "Escolha uma das opções abaixo:"
        }

        console.log(json);

        const res = await axios.post(`${process.env.ROCKETCHAT_VENOM}/sendButton`, json).then(teste=>{
            console.log('Deu certo')
            console.log('AQUI', teste)
        }).catch(erro=>{
            console.log('Deu erro 2')
        });
    });

    controller.hears(['Fazer orçamento'], 'live_chat', function (bot, message) {
        qtdMsg = qtdMsg + 1;
        token = message.token;
        room =  message.rid;

        bot.startConversation(message, function (err, convo) {
            convo.say(`Excelente! Momento por favor. Vou te direcionar.`);
            transferencia(room, token, 'NM2MAHJ2Zo9dqQYJS', convo, message).then(validado=>{

            }).catch(erro=>{
                console.log('Erro:', erro);
                convo.say('Desculpa, estamos sem agentes disponíveis. Tente mais tarde.')
                algomais(convo, message)
                convo.next();
            })
            convo.next();
        });
    });

    controller.hears(['Solicitar uma cotação'], 'live_chat', function (bot, message) {
        qtdMsg = qtdMsg + 1;
        token = message.token;
        room =  message.rid;
        
        bot.startConversation(message, function (err, convo) {
            convo.say(`Excelente! Momento por favor. Vou te direcionar.`);
            transferencia(room, token, 'KeuhAueTF9QXN6zt6', convo, message).then(validado=>{

            }).catch(erro=>{
                console.log('Erro:', erro);
                convo.say('Desculpa, estamos sem agentes disponíveis. Tente mais tarde.')
                algomais(convo, message)
                convo.next();
            })
            convo.next();
        });
    });

    controller.hears(['Agora não'], 'live_chat', function (bot, message) {
        qtdMsg = qtdMsg + 1;
        token = message.token;
        room =  message.rid;

        bot.startConversation(message, function (err, convo) {
            convo.say(`Agradecemos pelo seu retorno, tenha um excelente dia 😊`);
            encerrar(room, token, convo, message)
            convo.next();
        });
    });

    controller.hears(['Não quero mais receber promoções'], 'live_chat', function (bot, message) {
        qtdMsg = qtdMsg + 1;
        token = message.token;
        room =  message.rid;

        bot.startConversation(message, function (err, convo) {
            convo.say(`Tudo bem, você não receberá mais nossas promoções. Lhe desejamos uma excelente semana!`);
            encerrar(room, token, convo, message)
            convo.next();
        });
    });

    controller.hears(['1', '2', '3', '4'], 'live_chat', function (bot, message) {
        qtdMsg = 0;
        token = message.token;
        room =  message.rid;
        console.log('mensagame:', message)
        bot.startConversation(message, function (err, convo) {
            escolha(message.msg, convo, message, room, token)
        });
    });

    controller.hears(['Contato ativo'], 'live_chat', function (bot, message) {
        qtdMsg = qtdMsg + 1;
        token = message.token;
        room =  message.rid;

        transferencia(room, token, 'iAcXpHsByhY5yxE2L');
    });

    function menu_principal(convo, message) {
        qtdMsg = 0
        convo.ask(menuInicial, function (response, convo) {
            token = message.token;
            room =  message.rid;

            if (response.text > 0 && response.text <=4) {
                escolha(response.text, convo, message, room, token)

            } else {
                convo.say('A opção (' + response.text + '). é inválida! Escolha um das opções abaixo:');
                menu_principal(convo, message)
                convo.next();
                
            }

            aguardarResposta(convo, token, room, 5)

        });
    }


    function aguardarResposta(convo, token, room, minutos) {
        convo.setTimeout(60000 * minutos);
        convo.onTimeout(function(convo){
            convo.say('Oi, tudo bem? Você ainda está aqui? 😕\nVem cá, percebi que não pode falar agora 😟 Mas não tem problema. Quando tiver disponibilidade entre em contato novamente, assim podemos continuar o nosso atendimento.');
            convo.next();
            encerrar(room, token, convo);
        });
    }

    function escolha(opc, convo, message, room, token){

        switch(opc){

            case '1':
                convo.say('Entendi, você deseja informações sobre produtos. Um momento, vou transferir para o atendimento.'); // Roberta
                convo.next();
                transferencia(room, token, 'Cdji8S8RrRn7Kdh9a', convo, message).then(validado=>{

                }).catch(erro=>{
                    console.log('Erro:', erro);
                    convo.say('Desculpa, estamos sem agentes disponíveis. Tente mais tarde.')
                    algomais(convo, message)
                    convo.next();
                })

                break;

            case '2':
                convo.say('Entendi, você deseja informações sobre Promoções. Um momento, vou transferir o atendimento.'); // Roberta
                convo.next();
                transferencia(room, token, 'p9CkSDASkSKjy8vSu', convo, message).then(validado=>{

                }).catch(erro=>{
                    console.log('Erro:', erro);
                    convo.say('Desculpa, estamos sem agentes disponíveis. Tente mais tarde.')
                    algomais(convo, message)
                    convo.next();
                })

                break;


            case '3':
                convo.say('Entendi, você deseja um Orçamento. Um momento, vou transferir o atendimento.'); // Roberta
                convo.next();
                transferencia(room, token, 'NM2MAHJ2Zo9dqQYJS', convo, message).then(validado=>{

                }).catch(erro=>{
                    console.log('Erro:', erro);
                    convo.say('Desculpa, estamos sem agentes disponíveis. Tente mais tarde.')
                    algomais(convo, message)
                    convo.next();
                })

                break;

            case '4':
                convo.say('Entendi, você deseja atendimento como nosso time de SAC. Um momento, vou transferir o atendimento.'); // Comercial
                convo.next();
                transferencia(room, token, 'XCfvYowTj8fG9th99', convo, message).then(validado=>{

                }).catch(erro=>{
                    console.log('Erro:', erro);
                    convo.say('Desculpa, estamos sem agentes disponíveis. Tente mais tarde.')
                    algomais(convo, message)
                    convo.next();
                })

                break;


        }

     }


    function transferencia(sala, chave, departamento, convo, message){
        let json = {
            rid: sala,
            token: chave,
            department: departamento
        }

        console.log(json);
        setTimeout(async function x(){
            const res = await axios.post(`${process.env.ROCKETCHAT_URL}/api/v1/livechat/room.transfer`, json).then(teste=>{
                console.log('Deu certo')

                console.log('AQUI', teste)
                convo.next();
            }).catch(erro=>{
                console.log('Deu erro 2')
                convo.say('Desculpa! Nenhum dos meus colegas estão disponíveis no momento. 😅')
                convo.say('Por favor tente mais tarde.')
                convo.next();
            });
        }, 3000);
        
    }

    async function encaminhar(sala, chave, usuario, convo, message){
        let url = `${process.env.ROCKETCHAT_URL}/api/v1/livechat/room.forward`;

        let json = {
            roomId: sala,
            userId: usuario
        }

        let config = {
            headers: {
                'X-Auth-Token': process.env.USER_TOKEN,
                'X-User-Id': process.env.USER_ID,
                'Content-type': 'application/json'
            }
        }

        console.log(json);

        const res = await axios.post(url, json, config)
        .then((resposta) => {
            console.log('sucesso:', resposta)
            
        })
        .catch(err=>{

            console.log('deu erro 3')
            console.log(err)
        });
    }

    async function enviarMsg(mensagem, contato, nome, bot, message, requerente){

        let url = `${process.env.ROCKETCHAT_VENOM}/postTexto`;

        let json = {
            number: contato,
            text: mensagem,
            sessionName: process.env.SESSION_NAME

        }


        let config = {
        headers: {
                'Content-Type': `application/json`
            }
        }

        const res = await axios.post(url, json, config).then(teste=>{
            console.log('POST REALIZADO')
            console.log('Resultado:', teste)
            if (teste.data.result == 'success') {
                bot.reply(message,`✉️: ${mensagem}\n📲: ${contato}\n✅: Mensagem enviada`);
                if (nome !== 'sem nome') {

                    contatoAtivo(mensagem, contato, nome, bot, message, requerente)

                }
            }else{
                bot.reply(message,`✉️: ${mensagem}\n📲: ${contato}\n⚠: Mensagem não enviada`);
            }

            return teste.data.result;
        }).catch(erro=>{
            console.log('Deu erro 4')
            bot.reply(message,`✉️: ${mensagem}\n📲: ${contato}\n⚠: Falha ao enviar msg.`);
        });

        


    }

    async function contatoAtivo(mensagem, contato, nome, bot, message, requerente){

        let url = `${process.env.ROCKETCHAT_VENOM}/contatoAtivo`;

        let json = {
            number: contato,
            name: nome,
            user: requerente

        }


        let config = {
        headers: {
                'Content-Type': `application/json`
            }
        }

        const res = await axios.post(url, json, config).then(teste=>{
            bot.reply(message,`Contato ativo solicitado`);

        }).catch(erro=>{
            console.log('Deu erro 5')
            bot.reply(message,`Erro ao iniciar contato ativo.`);
        });

        


    }

    function encerrar(sala, chave, convo, message){
        let json = {
            rid: sala,
            token: chave
        }

        console.log(json);
        setTimeout(async function x(){
            const res = await axios.post(`${process.env.ROCKETCHAT_URL}/api/v1/livechat/room.close`, json).then(teste=>{
                console.log('Deu certo. Encerrei!')
                convo.next();
            }).catch(erro=>{
                console.log('Deu erro 1')
                convo.say('Desculpa! Não consegui encerrar esta conversa. 😅')
                convo.say('Por favor tente mais tarde.')
                convo.next();
            });
        }, 3000);
        
    }


    


    function algomais(convo, message) {
        
        convo.ask('Ajudo com algo mais?\n\n1 - Sim;\n2 - Não;', function (response, convo) {
            token = message.token;
            room =  message.rid;

            switch(response.text){

                case '1':
                    convo.say('Por favor escolha uma das opções:')
                    menu_principal(convo,message);
                    convo.next();
                    break;
                case '2':
                    convo.say('Obrigado pelo contato. Até a próxima.')
                    encerrar(room, token, convo, message)
                    convo.next();
                    break;
                default:
                    convo.say('Por favor escolha uma das opções:')
                    menu_principal(convo,message);
                    convo.next();
                    break;

            }

        });

    }


    //Fallback: Caso fuja do roteiro
    controller.on('live_chat', function(bot, message) {
        if (qtdMsg == 0 && message.t !== 'command') {
            if(message.msg !== '' && message.msg !== 'Contato Ativo' && message.msg !== 'promptTranscript'){
                bot.reply(message,'Desculpa! Não compreendi. Envie um "oi" para iniciar o atendimento.');
                //bot.reply(message, '');
            }

            if (message.msg == 'Contato Ativo') {

                
            }
            

        }
      
    });

    controller.on('direct_message', function(bot, message) {

        let instrucao = message.msg;
        let envio = instrucao.split('@');
        let requerente = message.u._id;

        console.log('Mensagem direta')
        console.log(message)

        if(envio[2]){

            enviarMsg(envio[0], envio[1], envio[2], bot, message, requerente)

        }else{

            enviarMsg(envio[0], envio[1], 'sem nome', bot, message, requerente);

        }
        

      
    });

    
}
