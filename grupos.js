//https://rocketchat.karlosgaldino.com.br/api/v1/groups.create
const axios = require('axios');



async function criarGrupo(nomeGrupo){
    let url = `${process.env.URLCHAT}/api/v1/groups.create`;
    let membros = process.env.MEMBROS_GRUPO.split(",")
    let json = {
        name: nomeGrupo,
        members: membros
    }

    let config = {
        headers: {
            'X-Auth-Token': process.env.TOKEN_USER,
            'X-User-Id': process.env.ID_USER,
            'Content-type': 'application/json'
        }
    }

    console.log(json);

    return await axios.post(url, json, config)
    .then(resposta => {
        //console.log('sucesso:', resposta.data)
        console.log('idGrupo:', resposta.data.group._id)
        return resposta.data.group._id;
        
    })
    .catch(err=>{

        console.log('deu erro 3')
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
                image_url: urlArquivo
            }

        ]
        break;

        case 'ptt':
        anexo = [
            {
                audio_url: urlArquivo
            }

        ]
        break;

        case 'video':
        anexo = [
            {
                video_url: urlArquivo
            }

        ]
        break;

        default:
        anexo = [
            {
                title_link: urlArquivo
            }

        ]
        break;
    }
    json = ''
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

//enivarMsgGrupo('Karlos Zé', '', 'JDfxGheJWMggkcmzo', 'http://wprocket.ddns.net:5000/60ee7ecc-8261-40e7-8959-f8081008c48f.oga', 'ptt')

module.exports = { criarGrupo, enivarMsgGrupo }