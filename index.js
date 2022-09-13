const fs = require('fs');
const https = require('https');
const express = require("express");
const cors = require('cors');
const path = require('path');
const Sessions = require("./sessions");
const Bd = require("./Bd");
require('dotenv').config();
const venom = require('venom-bot');
const bodyParser = require('body-parser');
const Livechat = require('./livechat');
const Chat = require('./clientChat');



let app = express();

app.use(express.static('static'));
app.use(cors());
/*app.use(express.json());*/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('uploads'));

//const HOST_PORT = process.env.PORT || 3333;

if (process.env.HTTPS === 1) { //with ssl
  https.createServer(
    {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    },
    app).listen(process.env.PORT);
  console.log("Https server running on port " + process.env.PORT);
} else { //http
  app.listen(process.env.PORT, () => {
    console.log("Http server running on port " + process.env.PORT);
  });
}//http

app.get('/', (req, res) => res.sendFile(path.join(__dirname+'/home.html')));

app.get('/logado', (req, res) => res.sendFile(path.join(__dirname+'/redirecionamento.html')));

app.get('/home', (req, res) => res.sendFile(path.join(__dirname+'/start.html')));


app.get("/start", async (req, res, next) => {
  console.log("starting..." + req.query.sessionName);

  var session = await Sessions.start(req.query.sessionName);
  console.log('sessions', session);
  console.log('Status no Start', session.status);

  if (["CONNECTED", "QRCODE", "STARTING"].includes(session.state)) {
    //res.status(200).json({ result: 'success', message: session.state });

    if (session.status === 'notLogged' && session.state != 'CONNECTED'){
      console.log('passei por aqui');
      console.log(session.state);
      res.redirect("/qrcode?sessionName=" + req.query.sessionName + '&image=true') //Com esse redirecionamento vc consegue passar pela rota de qrcode sem precisar digitar no navegador
    }

    if (session.status === 'isLogged' || session.status === 'inChat' || session.status === 'chatsAvailable' || session.status === 'successChat'){
      session.state = 'CONNECTED';
      res.redirect(process.env.URLCHAT) //Com esse redirecionamento vc consegue passar pela rota de qrcode sem precisar digitar no navegador
    }



    //if (["QRCODE", "STARTING"].includes(session.state) ){ session.state = "CONNECTED"; console.log('Status alterado para CONECTADO.') }
  } else {
    console.log('aqui ' + session.state);
    res.status(200).json({ result: 'error', message: session.state });
  }
});//start

app.get("/qrcode", async (req, res, next) => {
  console.log("qrcode..." + req.query.sessionName);
  let session = Sessions.getSession(req.query.sessionName);

  console.log('OLHA AI O STATUS: ' + session.status + ' E OLHA O STATE: ' + session.state);

  if (session !== false) {
    if (session.status === 'notLogged') {
      if (req.query.image) {

        res.sendFile(__dirname + '/start.html', {'key': req.query.sessionName}, function (err, html) {
          console.log(err);
          console.log(html);
        });

      } else {
        res.status(200).json({ result: "success", message: session.state, qrcode: session.qrcode });
      }
    } else if (session.status === 'inChat' || session.status === 'isLogged' || session.status === 'qrReadSuccess' || session.status ===  'successChat') {
      console.log('OLHA JÁ ESTOU LOGADO AGORA VOU REDIRECIONAR PRA HOME.');
      session.state = 'CONNECTED'
      res.redirect('/');
    }
  } else {
    res.status(200).json({ result: "error", message: "NOTFOUND" });
  }
});//qrcode

app.get("/new_qrcode", async function (req, res, next) {
  const session = await Sessions.getSession(req.query.sessionName);
  console.log('Novo QrCode sessão\n', session);

  if (session) {
    console.log('OLHA AI O STATUS: ' + session.status + ' E OLHA O STATE: ' + session.state);
    if (session.status === 'inChat' || session.state === 'CONNECTED' || session.status === 'successChat'){
      console.log('JÁ ESTÁ LOGADO...');
      return res.json({success: 'true', object: false, message: 'Já está logado!!!', is_active: true});

    }else if (session.status === 'notLogged' /*|| session.status === 'qrReadSuccess'*/) {
      console.log('VOU GERAR O QRCODE...');
      res.json({success: 'true', object: session.qrcode, message: 'Novo qrcode gerado com sucesso!!!', is_active: false});
    }else if(session.status == 'qrReadSuccess'){
      console.log('Consegui ler o QrCode e mudei o status para inChat');
       session.state = 'CONNECTED'
      res.redirect(process.env.URLCHAT)
    }else if(session.status == 'chatsAvailable' || session.status == 'isLogged' ){
      console.log('Os chats estão', session.status);
      session.state = 'CONNECTED'
      res.redirect(process.env.URLCHAT)
    }
  } else{
    res.json({success: "false", message: "NOTFOUND" });
  }
});

app.post("/contatoAtivo", async function contatoAtivo(req, res, next) {
  var tipoContato = req.body.tipo || 'Contato Ativo'
  var result = await Chat.createVisitor(
    req.body.name,
    req.body.number + '@c.us',
    tipoContato,
    'ativo',
    req.body.user
  );
  res.sendFile(path.join(__dirname+'/redirecionamento.html')) //res.json(result);
});//sendText

app.post("/postTexto", async function sendText(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendText(
    req.body.sessionName,
    req.body.number + '@c.us',
    req.body.text
  );
  res.json(result);
});//sendText

app.post("/postTextoGrupo", async function sendText(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendText(
    req.body.sessionName,
    req.body.number,
    req.body.text
  );
  res.json(result);
});//sendText

app.post("/postImagemGrupo", async function sendImage(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendImage(
    req.body.sessionName,
    req.body.number,
    req.body.path,
    req.body.imgname,
    req.body.caption
  );
  res.json(result);
});//postImagem

app.post("/postContatoGrupo", async function sendContactVcard(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendContactVcard(
    req.body.sessionName,
    req.body.number,
    req.body.contact,
    req.body.cname,
    req.body.i
  );
  res.json(result);
});//postContato

app.post("/postEnderecoGrupo", async function sendLocation(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendLocation(
    req.body.sessionName,
    req.body.number,
    req.body.long,
    req.body.lat,
    req.body.endereco
  );
  res.json(result);
});//postEndereco



app.get("/grupos", async function(req, res, next) {
  var result = await Sessions.getGroups(
    req.query.sessionName
  );
  res.json(result);
});//relatorio


app.get("/mensagem", async function(req, res, next) {
  var result = await Sessions.sendText(
    req.query.sessionName,
    req.query.number + '@c.us',
    req.query.text
  );
  res.json(result);
});//mensagem

app.get("/link", async function(req, res, next) {
  var result = await Sessions.sendLinkPreview(
    req.query.sessionName,
    req.query.number + '@c.us',
    req.query.link,
    req.query.title
  );
  res.json(result);
});//enviar link

app.post("/postLink", async function sendLink(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendLinkPreview(
    req.body.sessionName,
    req.body.number + '@c.us',
    req.body.link,
    req.body.title
  );
  res.json(result);
});//postLink

app.get("/endereco", async function(req, res, next) {
  var result = await Sessions.sendLocation(
    req.query.sessionName,
    req.query.number + '@c.us',
    req.query.long,
    req.query.lat,
    req.query.endereco
  );
  res.json(result);
});//enviar Localização

app.post("/postEndereco", async function sendLocation(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendLocation(
    req.body.sessionName,
    req.body.number + '@c.us',
    req.body.long,
    req.body.lat,
    req.body.endereco
  );
  res.json(result);
});//postEndereco

app.get("/contato", async function(req, res, next) {
  var result = await Sessions.sendContactVcard(
    req.query.sessionName,
    req.query.number + '@c.us',
    req.query.contact,
    req.query.cname,
    req.query.i
  );
  res.json(result);
});//enviar Contato

app.post("/postContato", async function sendContactVcard(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendContactVcard(
    req.body.sessionName,
    req.body.number + '@c.us',
    req.body.contact,
    req.body.cname,
    req.body.i
  );
  res.json(result);
});//postContato

app.get("/imagem", async function(req, res, next) {
  var result = await Sessions.sendImage(
    req.query.sessionName,
    req.query.number + '@c.us',
    req.query.path,
    req.query.imgname,
    req.query.caption
  );
  res.json(result);
});//enviar Imagem

app.post("/postImagem", async function sendImage(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendImage(
    req.body.sessionName,
    req.body.number + '@c.us',
    req.body.path,
    req.body.imgname,
    req.body.caption
  );
  res.json(result);
});//postImagem

app.get("/doc", async function(req, res, next) {
  var result = await Sessions.sendFile(
    req.query.sessionName,
    req.query.number + '@c.us',
    req.query.path,
    req.query.filename,
    req.query.caption
  );
  res.json(result);
});//enviar Documento

app.post("/postArquivo", async function sendFile(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendFile(
    req.body.sessionName,
    req.body.number,
    req.body.path,
    req.body.filename,
    req.body.caption
  );
  res.json(result);
});//sendArquivo

app.get("/audio", async function(req, res, next) {
  var result = await Sessions.sendVoice(
    req.query.sessionName,
    req.query.number + '@c.us',
    req.query.path
  );
  res.json(result);
});//enviar voz

app.post("/postAudio", async function sendVoice(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendVoice(
    req.body.sessionName,
    req.body.number,
    req.body.path
  );
  res.json(result);
});//sendVoz


app.post("/postArquivos", async function sendFile(req, res, next) {
  console.log(req.body);
  var result = await Sessions.sendFile(
    req.body.sessionName,
    req.body.number + '@c.us',
    req.body.path,
    req.body.filename,
    req.body.caption
  );
  res.json(result);
});//sendArquivo

app.post("/sendButton", async (req, res, next) => {
  var result = await Sessions.sendButton(
    req.body.sessionName,
    req.body.number + '@c.us',
    req.body.title,
    req.body.button,
    req.body.description
  );
  res.json(result);
});//sendFile

app.post("/rocketchat", async function sendText(req, res, next) {

  await Livechat.recebeDados(req.body);
  res.end();


});//API

app.get("/close", async (req, res, next) => {
  var result = await Sessions.closeSession(req.query.sessionName);
  res.json(result);
});//close

process.stdin.resume();//so the program will not close instantly

async function exitHandler(options, exitCode) {
  if (options.cleanup) {
    console.log('cleanup');
    await Sessions.getSessions().forEach(async session => {
      await Sessions.closeSession(session.sessionName);
    });
  }
  if (exitCode || exitCode === 0) {
    console.log(exitCode);
  }

  if (options.exit) {
    process.exit();
  }
} //exitHandler 
//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));