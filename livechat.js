const Sessions = require("./sessions");
const Bd = require("./Bd");
const Chat = require("./clientChat");
const fs = require('fs');

async function aguardar(contato, data, filename, caption){
  await Sessions.sendFile(process.env.SESSION_NAME, contato, data, filename, caption);
}


async function recebeDados(ddsChat){
	let tipo = ddsChat.type; 
  // Message, LivechatSession (encerrando), 
  //LivechatSessionTaken (aguardando), LivechatSessionQueued (na fila), 
  //LivechatSessionForwarded (transferido), LivechatSessionStart(iniciado)

	let cliente = ddsChat.visitor;
	let agente = ddsChat.agent || '';
  let jaEnviou = '';

	let idChat = ddsChat._id;
  let ultMsg = ddsChat.lastMessageAt;
	let visitante = cliente.name;
  let usrCliente = cliente.username;
	let contato = cliente.email[0].address;
	let tokenVisitante = cliente.token;
	let departamento = ddsChat.department;


	let nomeAgente = agente.name ? agente.name : 'Atendente Virtual';
	let idAgent = agente._id;

  if ( contato.includes('@c.us') || contato.includes('@g.us')){
    switch(tipo){

      case 'Message':
        let mensagem = ddsChat.messages[0];

        let remetente = mensagem.username !== usrCliente ? contato : 'agente';
    
        if(mensagem.msg !== ''){
        
          if(mensagem.closingMessage){
            await Sessions.sendText(process.env.SESSION_NAME, contato, process.env.FRASE_ENCERRAMENTO);
            Bd.alteraAtendente(contato, 'bot', visitante);
          }else{
            await Sessions.sendText(process.env.SESSION_NAME, contato, `*${nomeAgente}:*\n${mensagem.msg}`);//*${nomeAgente}*:\n
          }
          
    
        }else{
    
          let img = '';
          let imgname = '';
          let caption = '';
          let doc = '';
          let filename = '';
    
          //console.log('Tipo arquivo:', mensagem.file.type)

          switch(mensagem.file.type){
    
            case 'image/jpeg':
              console.log('Entrei como imagem')
              img = mensagem.fileUpload.publicFilePath;
              imgname = mensagem.file.name;
              console.log(console, img, imgname, caption)
              await Sessions.sendImage(process.env.SESSION_NAME, contato, img, imgname, caption);
              break;
            case 'image/png':
              console.log('Entrei como imagem')
              img = mensagem.fileUpload.publicFilePath;
              imgname = mensagem.file.name;
              console.log(console, img, imgname, caption)
              await Sessions.sendImage(process.env.SESSION_NAME, contato, img, imgname, caption);
              break;
            case 'application/pdf':
              doc = mensagem.fileUpload.publicFilePath;
              filename = mensagem.file.name;
              caption = mensagem.file.name;
              await Sessions.sendFile(process.env.SESSION_NAME, contato, doc, filename, caption);
              break;
            case 'audio/mpeg':
              let url = mensagem.fileUpload.publicFilePath;
              console.log('Mp3', doc)
              filename = mensagem.file.name;
              caption = mensagem.file.name;
              doc = await Chat.baixarArquivo(url).then(data=>{
                console.log('Entrou no doc')
                console.log(url, data)
                async function enviar(){
                  await Sessions.sendVoice(process.env.SESSION_NAME, contato, data);
                  fs.unlink(data, (err) => {
                      if (err) throw err;
                      console.log(`Arquivo "${data}" apagado.`)
                  });
                }

                enviar()
              });

              
              break;
            default:
              doc = mensagem.fileUpload.publicFilePath;
              filename = mensagem.file.name;
              caption = mensagem.file.name;
              await Sessions.sendFile(process.env.SESSION_NAME, contato, doc, filename, caption);
              break;
    
    
          }
    
        }
    
        break;
      
      case 'LivechatSessionForwarded':
        await Sessions.sendText(process.env.SESSION_NAME, contato, process.env.FRASE_REDIRECIONAMENTO);
        break;
      case 'LivechatSessionTaken':
        if (nomeAgente !== "Atendente Virtual") {
          await Sessions.sendText(process.env.SESSION_NAME, contato, `Olá, meu nome é ${nomeAgente}.`);
        }
        break;
      // case 'LivechatSessionQueued':
      //   await Sessions.sendText(process.env.SESSION_NAME, contato, '```Iniciando conversa com atendente...``` 👨🏻‍💻');
      //   break;
      // case 'LivechatSessionStart':
      //   await Sessions.sendText(process.env.SESSION_NAME, contato, `Aguarde um momento enquanto conectamos à um agente.`);
      //   break;
      default:
        break;
    }//Fim do Swith tipo

  }
    
  }
module.exports = { recebeDados }
