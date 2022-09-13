// person.js
'use strict';

const os = require('os');
const fs = require('fs');
const mime = require('mime-types');
const path = require('path');
const venom = require('venom-bot');
const dialogflow = require('@google-cloud/dialogflow').v2beta1;
const { v4: uuidv4 } = require('uuid');
const { json } = require('express');
const { Session } = require('inspector');
const puppeteer = require('puppeteer');
const Attendance = require("./attendance");
const Bd = require("./Bd");
const Chat = require("./clientChat")
const axios = require('axios');

const grpVendas = process.env.GRP_VENDAS;
const grpAssistencia = process.env.GRP_ASSISTENCIA;



module.exports = class Sessions {

    
    static async start(sessionName) {
        Sessions.sessions = Sessions.sessions || []; //start array
        console.log('Entrou no Start\n', Sessions.sessions);

        var session = Sessions.getSession(sessionName);
        console.log('Declarado session = ', session);

        if (session == false) { //create new session
            console.log("session == false");
            session = await Sessions.addSesssion(sessionName);
        } else if (["CLOSED"].includes(session.state)) { //restart session
            console.log("session.state == CLOSED");
            //session.state = "STARTING";
            //session.status = 'notLogged';
            session.client = Sessions.initSession(sessionName);
            Sessions.setup(sessionName);
        } else if (["CONFLICT", "UNPAIRED", "UNLAUNCHED"].includes(session.state) || ["isLogged"].includes(session.status)) {
            console.log("Estado da Sessão: " + session.state + '. Status: ' + session.status);
            session.client.then(client => {
                client.useHere();
                console.log('Chamado função useHere()');
            });
        } else {
            console.log("session.state: " + session.state);
        }
        return session;
    }//start


    static async addSesssion(sessionName) {
        var newSession = {
            name: sessionName,
            qrcode: false,
            client: false,
            status: 'notLogged',
            state: 'STARTING'
        }
        Sessions.sessions.push(newSession);
        console.log("Adicionando sessão. " + newSession.status);

        //setup session
        newSession.client = Sessions.initSession(sessionName);
        Sessions.setup(sessionName);

        return newSession;
    }//addSession useChrome: true,

    static async initSession(sessionName) {
        var session = Sessions.getSession(sessionName);
        const client = await venom.create(
            sessionName,
            (base64Qr, asciiQR, attempts, urlCode) => {
            	console.log('Iniciar Sessão');
                console.log('Número de tentativas de ler o qrcode:: ', attempts);
                console.log('Qrcode no Terminal: ', asciiQR);
                //console.log('base64 image string qrcode: ', base64Qr);
                console.log('urlCode (data-ref): ', urlCode);
                //session.state = "QRCODE";
                session.qrcode = base64Qr;
                //console.log("Novo QrCode gerado. Session.state: " + session.state);                
            },
            (statusFind, sessionk) => {
                session.status = statusFind;
                console.log("Alterado o Status da Sessão: " + session.status);
                console.log('Status da Sessão: ', statusFind);
                console.log('Nome da Sessão: ', sessionk);

            },
            {
                folderNameToken: 'tokens',
                mkdirFolderToken: '',
                headless: true,
                devtools: false,
                debug: false,
                logQR: false,
                browserArgs: [
                    '--log-level=3',
                    '--no-default-browser-check',
                    '--disable-site-isolation-trials',
                    '--no-experiments',
                    '--ignore-gpu-blacklist',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--enable-features=NetworkService',
                    '--disable-setuid-sandbox',
                    '--no-sandbox',
                    // Extras
                    '--disable-webgl',
                    '--disable-threaded-animation',
                    '--disable-threaded-scrolling',
                    '--disable-in-process-stack-traces',
                    '--disable-histogram-customizer',
                    '--disable-gl-extensions',
                    '--disable-composited-antialiasing',
                    '--disable-canvas-aa',
                    '--disable-3d-apis',
                    '--disable-accelerated-2d-canvas',
                    '--disable-accelerated-jpeg-decoding',
                    '--disable-accelerated-mjpeg-decode',
                    '--disable-app-list-dismiss-on-blur',
                    '--disable-accelerated-video-decode',
                ],
                refreshQR: 15000,
                autoClose: 60 * 60 * 24 * 365, //never
                disableSpins: true
            }

        );
        return client;
    }//initSession

    static async setConnection(sessionName){
        var session = Sessions.getSession(sessionName);

        if (session) {
            if (session.state == "QRCODE" || session.state == "STARTING" || session.status === 'chatsAvailable') {
                session.state = "CONNECTED";
                return { result: "Alterado para CONNECTED" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Após ler o QRCode, forçar a mudança do estado para conectado.

    static async downloadArquivos(message, client){

        if(message.type == 'ptt' || message.type == 'document' || message.isMedia == true || message.isMMS){
            const nameUuid = uuidv4();
            const buffer = await client.decryptFile(message);
            const fileName = `${nameUuid}.${mime.extension(message.mimetype)}`;
            fs.writeFileSync(`./uploads/${fileName}`, buffer)

            return fileName

        }
        

    }

    //Auto resposta
    static async setup(sessionName) {

        var session = Sessions.getSession(sessionName);
        await session.client.then(client => {
            client.onStateChange(state => {
                session.state = state;
                console.log("Estado Alterado: " + state);
            });//.then((client) => Sessions.startProcess(client));

            
            client.onMessage(async (message) => {
                //console.log(message);
                let name = message.sender.name || message.sender.verifiedName || message.sender.formattedName || message.chat.contact.name || message.chat.contact.verifiedName || message.chat.contact.formattedName;
                let contato = message.from;
                let arquivo = '';
                let sess = process.env.MEMBROS_GRUPO
                let dadosPost;

                //Checa se atendente é bot ou humano
                if(message.isGroupMsg == false && message.from !== 'status@broadcast'){
                    let telefone = contato.replace(/@c.us/g, '')
                    let atendente = await Bd.gravaCliente(contato, name);

                    switch(atendente){
                        case 'bot':
                            if(message.isMedia == false && message.type == 'chat' || message.type == 'buttons_response' || message.type == 'location' && message.from !== 'status@broadcast'){
                                if(message.type == 'location'){
                                    message.body = `Localização enviada:\n\nhttps://www.google.com/maps/place/${message.lat},%20${message.lng}`
                                }
                                Chat.createVisitor(name, message.from, message.body, client);
                            }else{
                                if (message.from !== 'status@broadcast') {

                                    await Chat.createVisitor(name, message.from, 'Oi', client);
                                    arquivo = await Sessions.downloadArquivos(message, client);
                                    await Chat.enviarArquivo(arquivo, contato);
                                }
                            }                               
 
                            break;

                        // Caso esteja sendo atendido por humano, gerencia a conversa
                        case 'humano':
                            
                            //Se não for midia e for um chat, ele usa o método de envio de texto
                            if(message.isMedia == false && message.type == 'chat' || message.type == 'buttons_response' || message.type == 'location'){
                                if(message.type == 'location'){
                                    message.body = `Localização enviada:\n\nhttps://www.google.com/maps/place/${message.lat},%20${message.lng}`
                                }
                                Chat.conversar(contato, message.body);
                            }else{
                                //Se não, é uma mídia; Então abre o método de envio de mídias.
                                arquivo = await Sessions.downloadArquivos(message, client);
                                console.log('Entrou no else de arquivos', arquivo)  
                                console.log('Contato', contato)                           
                                setTimeout(Chat.enviarArquivo(arquivo, contato), 5000);
                            }
                            break;

                        default:
                            break;

                    }

                }

            });

            //Em caso de chamdas de voz...
            client.onIncomingCall(async (call) => {
              console.log('CALL:', call);

              //Envia mensagem para quem ligou informando que não pode atender.
              client.sendText(call.peerJid, process.env.FRASE_LIGACAO);

              //Comunica a alguém que houve uma chamada perdida.
              let chamador = call.peerJid;
              chamador = chamador.replace(/@c.us/g,'');
              client.sendText(process.env.CONTATO_RESP, '```Chamada perdida: ```' + chamador);
            });

        });
    }//setup

    static async closeSession(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client)
                    await session.client.then(async client => {
                        try {
                            await client.close();
                        } catch (error) {
                            console.log("client.close(): " + error.message);
                        }
                        session.state = "CLOSED";
                        session.client = false;
                        console.log("client.close - session.state: " + session.state);
                    });
                return { result: "success", message: "CLOSED" };
            } else {//close
                return { result: "success", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//close

    static getSession(sessionName) {
    	console.log('Entrou no getSession')
        var foundSession = false;
        if (Sessions.sessions)
        	console.log('Entrou no IF do getSession\n', Sessions.sessions);
            Sessions.sessions.forEach(session => {
            	console.log('Sessão:', sessionName, session.name)
                if (sessionName == session.name) {
                    foundSession = session;
                }
            });
        console.log('foundSession = ', foundSession)
        return foundSession;
    }//getSession

    static getSessions() {
        if (Sessions.sessions) {
            return Sessions.sessions;
        } else {
            return [];
        }
    }//getSessions

    static async getQrcode(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            //if (["UNPAIRED", "UNPAIRED_IDLE"].includes(session.state)) {
            if (["UNPAIRED_IDLE"].includes(session.state)) {
                //restart session
                await Sessions.closeSession(sessionName);
                Sessions.start(sessionName);
                return { result: "error", message: session.state };
            } else if (["CLOSED"].includes(session.state)) {
                Sessions.start(sessionName);
                return { result: "error", message: session.state };
            } else { //CONNECTED
                if (session.status != 'isLogged') {
                    return { result: "success", message: session.state, qrcode: session.qrcode };
                } else {
                    return { result: "success", message: session.state };
                }
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    } //getQrcode

    static async sendText(sessionName, number, text) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            let checar = Sessions.setConnection(sessionName);//Obriga a mudar para CONNECTED
            if (session.state == "CONNECTED" || session.state == "CONFLICT") { // Corrigir conflito
                var resultSendText = await session.client.then(async client => {
                    if (session.state == "CONFLICT") { client.useHere(); } // Forçar uso.
                    const user = await client.getNumberProfile(number);
                    console.log(user);
                   
                    return await client.sendText(number, text);
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Envia texto

    static async sendLinkPreview(sessionName, number, link, title) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            let checar = Sessions.setConnection(sessionName);//Obriga a mudar para CONNECTED
            if (session.state == "CONNECTED" || session.state == "CONFLICT") {
                var resultSendLinkPreview = await session.client.then(async client => {
                    if (session.state == "CONFLICT") { client.useHere(); } // Forçar uso.
                    return await client.sendLinkPreview(number /*+ '@c.us'*/, link, title);
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Envia link

    static async sendLocation(sessionName, number, long, lat, endereco) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            let checar = Sessions.setConnection(sessionName);//Obriga a mudar para CONNECTED
            if (session.state == "CONNECTED" || session.state == "CONFLICT") {
                var resultSendLocation = await session.client.then(async client => {
                    if (session.state == "CONFLICT") { 
                        client.useHere();
                        setTimeout(async function(){
                            console.log('Forçado a conexão.');
                            console.log('Localiza enviada para: ' + number);
                            return await client.sendLocation(number /*+ '@c.us'*/, long, lat, endereco);
                        }, 5000);
                    } else {
                        console.log('Contato enviado para: ' + number);
                        return await client.sendLocation(number /*+ '@c.us'*/, long, lat, endereco);
                    }
                    
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Envia Localização

    static async sendContactVcard(sessionName, number, contact, cname, i) {
        var session = Sessions.getSession(sessionName);
        if (i == 0) {
        	number = number + '@c.us';
        }

        if (session) {
            let checar = Sessions.setConnection(sessionName);//Obriga a mudar para CONNECTED
            if (session.state == "CONNECTED" || session.state == "CONFLICT") {
                var resultSendContactVcard = await session.client.then(async client => {
                    if (session.state == "CONFLICT") {
                        client.useHere();
                        setTimeout(async function(){
                            console.log('Forçado a conexão.');
                            console.log('Contato enviado para: '+ number);
                            return await client.sendContactVcard(number /*+ '@c.us'*/, contact + '@c.us', cname);},
                            5000);
                    } else { console.log('Contato enviado para: '+ number); return await client.sendContactVcard(number /*+ '@c.us'*/, contact + '@c.us', cname);} // Forçar uso.
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Envia Contato

    static async sendImage(sessionName, number, path, imgname, caption) {
        var session = Sessions.getSession(sessionName);

        console.log('O numero é:', number);
        if (session) {
            let checar = Sessions.setConnection(sessionName);//Obriga a mudar para CONNECTED
            if (session.state == "CONNECTED" || session.state == "CONFLICT") {
                var resultImage = await session.client.then(async client => {
                    if (session.state == "CONFLICT") { client.useHere(); } // Forçar uso.
                    return await client.sendImage(number, path,  imgname, caption);
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Envia Imagem

    static async sendFile(sessionName, number, path, filename, caption) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            let checar = Sessions.setConnection(sessionName);//Obriga a mudar para CONNECTED
            if (session.state == "CONNECTED" || session.state == "CONFLICT") {
                var resultSendFile = await session.client.then(async client => {

                    if (session.state == "CONFLICT") {
                        setTimeout(client.useHere(), 5000);
                        return await client.sendFile(number, path,  filename, caption);
                        console.log('Arquivo', path, 'enviado para', number);
                    } else {
                        return await client.sendFile(number, path,  filename, caption);
                        console.log('Arquivo', path, 'enviado para', number);
                    } // Forçar uso.
                    
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Envia Documentos

    static async sendVoice(sessionName, number, path) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            let checar = Sessions.setConnection(sessionName);//Obriga a mudar para CONNECTED
            if (session.state == "CONNECTED" || session.state == "CONFLICT") {
                var resultSendFile = await session.client.then(async client => {

                    if (session.state == "CONFLICT") {
                        setTimeout(client.useHere(), 5000);
                        await client.sendVoice(number, path).then((result) => {
                            console.log('result:', result);
                            return  result
                        }).catch((erro) =>{
                            console.log(erro);
                        });
                    } else {
                        await client.sendVoice(number, path).then((result) => {
                            console.log('result:', result);
                            return result
                        }).catch((erro) =>{
                            console.log(erro);
                        });
                    } // Forçar uso.
                    
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Envia audio


    static async sendButton(sessionName, number, title, button, description) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            let checar = Sessions.setConnection(sessionName);//Obriga a mudar para CONNECTED
            if (session.state == "CONNECTED" || session.state == "CONFLICT") {
                var resultSendFile = await session.client.then(async client => {

                    if (session.state == "CONFLICT") {
                        setTimeout(client.useHere(), 5000);
                        await client.sendButtons(number, title, button, description).then((result) => {
                            console.log('result:', result);
                            return  result
                        }).catch((erro) =>{
                            console.log(erro);
                        });
                    } else {
                        await client.sendButtons(number, title, button, description).then((result) => {
                            console.log('result:', result);
                            return result
                        }).catch((erro) =>{
                            console.log(erro);
                        });
                    } // Forçar uso.
                    
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Envia botões

    static async getGroups(sessionName) {
        var session = Sessions.getSession(sessionName);
        let json = [], json1, json2
        
        if (session) {
            if (session.state == "CONNECTED" || session.state == "CONFLICT" || session.state == "STARTING") { // Corrigir conflito
                var resultSendText = await session.client.then(async client => {
                    if (session.state == "CONFLICT") { client.useHere(); } // Forçar uso.
                
                    let chats = await client.getAllChats()
                    chats.map(grupos=>{
                        if (grupos.id.server == 'g.us') {
                            json.push({
                                grupo: grupos.contact.name,
                                idGrupo: grupos.id._serialized 
                            })
                            console.log(grupos)
                        }
                    })

                    json1 = JSON.stringify(json)
                    json2 = JSON.parse(json1)

                    console.log(json2)
                    //return json2            
                    //return await client.sendText(number, text);
                });
                return json2
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Gerar Grupos


}
