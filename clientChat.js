const express = require('express')
const fs = require('fs');
const fileUpload = require('express-fileupload')
const FormData = require('form-data');
const cors = require('cors')
const axios = require('axios');
const Bd = require("./Bd");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { rejects } = require('assert');




async function createVisitor(nome, telefone, mensagem, client, solicitante = 'padrao'){
    console.log('Criação do Visitante')
    let json = {visitor: {
        name: nome,
        token: telefone,
        email: telefone
    }}

    if (client == 'ativo') {
        await Bd.alteraAtendente(telefone, 'humano', nome);
    }

    const res = await axios.post(`${process.env.URLCHAT}/api/v1/livechat/visitor`, json);

    //console.log('Res.data',res.data)

    solicitante = await getUser(solicitante)

    let respGet = await getRoom(telefone, mensagem, client, nome, solicitante)

    console.log('Função que Pega Sala e Troca Atendente:', respGet);

}

async function getRoom(roomToken, mensagem, client, nome, solicitante){
    console.log('Pegando a Sala')
    const res = await axios.get(`${process.env.URLCHAT}/api/v1/livechat/room?token=${roomToken}`).then(resposta=>{
        console.log('DEU CERTO')
        console.log('Sala:', resposta.data.room._id);
        Bd.setSala(roomToken, resposta.data.room._id);
        alterar = Bd.alteraAtendente(roomToken, 'humano', nome);
        console.log(alterar)
        sendMsg(resposta.data.room._id, roomToken, mensagem);
        if (solicitante !== 'padrao') {
            encaminhar(resposta.data.room._id, roomToken, solicitante);
        }
        return resposta.data.room._id;

    }).catch(err=>{
        console.log('Deu ruim:');
        client.sendText(roomToken, `Desculpa, estamos sem agentes disponíveis. Tente mais tarde.`);
        return 'Deu ruim';
    });

    return res  
    
}

async function getUser(login){
    let url = `${process.env.URLCHAT}/api/v1/users.list`;

    let config = {
        headers: {
            'X-Auth-Token': process.env.TOKEN_USER,
            'X-User-Id': process.env.ID_USER,
            'Content-type': 'application/json'
        }
    }


    return await axios.get(url, config)
    .then(resposta => {
        let idUser
        //console.log('sucesso:', resposta.data)
        resposta.data.users.map(user=>{
            if (user.username === login) {
                idUser = user._id
                console.log('resposta:', user._id)
            }
        })

        //console.log(idUser)
        return idUser
        
    })
    .catch(err=>{

        console.log('deu erro 3')
        console.log(err)
    });
    
}

async function sendMsg(roomId, token, mensagem){
    console.log('Enviando Msg')
    let json = {
        token: token,
        rid: roomId,
        msg: mensagem

    }

    const res = await axios.post(`${process.env.URLCHAT}/api/v1/livechat/message`, json).catch(async erro=>{
        await Bd.alteraAtendente(token, 'bot', 'Ajustado')
    });

    //console.log(res.data)
}

async function conversar(telefone, mensagem){

    let sala = await Bd.getSala(telefone);
    console.log(sala);
    sendMsg(sala, telefone, mensagem)

}

async function encaminhar(sala, chave, usuario){
    let url = `${process.env.URLCHAT}/api/v1/livechat/room.forward`;

    let json = {
        roomId: sala,
        userId: usuario
    }

    let config = {
        headers: {
            'X-Auth-Token': process.env.TOKEN_USER,
            'X-User-Id': process.env.ID_USER,
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

async function baixarArquivo(url){
    const nameUuid = uuidv4();
    
    const arquivo = path.resolve(`./uploads/${nameUuid}.mp3`);
    const writer = fs.createWriteStream(arquivo);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', function(){
            writer.close()
            console.log('Lacrado')
            resolve(arquivo)
        })
        writer.on('error', reject)
    })

}


async function enviarArquivo(arq, telefone){
    const app = express();
    app.use(express.json());
    app.use(cors());
    app.use(fileUpload());

    //console.log('Enviando Arquivo', arquivo)
    let sala = await Bd.getSala(telefone);//'dajpdpE72SHX8TmW4'
    let arquivo = path.resolve(`./uploads/${arq}`);
    console.log('Arquivo', arquivo);
    const url = `${process.env.URLCHAT}/api/v1/livechat/upload/${sala}`;
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(arquivo));

    let config = {
        headers: {
            'x-visitor-token': telefone,
            'Content-Type': `multipart/form-data;boundary=${formData.getBoundary()}`
        }
    }

    const res = await axios.post(url, formData, config)
    .then((resposta) => {
        console.log('sucesso:', resposta.data.success)
        if (resposta.data.success == true){
            fs.unlink(arquivo, (err) => {
                if (err) throw err;
                console.log(`Arquivo "${arquivo}" apagado.`)
            });
        }
    })
    .catch(err=>{

        console.log('deu erro')
        console.log(err)
    });

}

async function enivarMsgGrupo(remetente, mensagem, sala, urlArquivo = '', tipoArquivo = ''){
    let url = `${process.env.URLCHAT}/api/v1/chat.postMessage`;

    let anexo = '';
    //console.log(remetente, mensagem, sala,urlArquivo, tipoArquivo)

    switch(tipoArquivo){
        case 'image':
        anexo = [
            {
                title: urlArquivo,
                title_link: urlArquivo,
                title_link_download: true,
                image_url: urlArquivo,
                image_type: 'image/png',
                type: 'file'
            }

        ]
        break;

        case 'ptt':
        anexo = [
            {
                title: urlArquivo,
                title_link: urlArquivo,
                title_link_download: true,
                audio_url: urlArquivo,
                //audio_type: 'audio/ogg',
                type: 'file'
            }

        ]
        break;

        case 'video':
        anexo = [
            {
                title: urlArquivo,
                title_link: urlArquivo,
                title_link_download: true,
                video_url: urlArquivo,
                type: 'file'
            }

        ]
        break;

        default:
        anexo = [
            {
                title: urlArquivo,
                title_link: urlArquivo,
                title_link_download: true,
                title_link: urlArquivo,
                type: 'file'
            }

        ]
        break;
    }

    let json = ''
    if (urlArquivo == '') {
        json = {
            roomId: sala,
            text: mensagem,
            alias: remetente
            
        }

    }else{
        json = {
            roomId: sala,
            text: mensagem,
            alias: remetente,
            attachments: anexo 
        }
    }

    

    let config = {
        headers: {
            'X-Auth-Token': process.env.TOKEN_USER,
            'X-User-Id': process.env.ID_USER,
            'Content-type': 'application/json'
        }
    }

    console.log(json);

    const res = await axios.post(url, json, config)
    .then((resposta) => {
        //console.log('sucesso:', resposta)
        console.log('idGrupo:', resposta.data._id)
        
    })
    .catch(err=>{

        console.log('deu erro 3')
        console.log(err)
    });
    
}

module.exports = { createVisitor, conversar, enviarArquivo, baixarArquivo, enivarMsgGrupo }