const mysql = require("mysql2/promise");
const { async } = require("rxjs");
const Grupo = require("./grupos")

require('dotenv').config();
const user = process.env.DBUSER;
const password = process.env.KEY;

let data = dataAtual();
let hora = horaAtual();

async function connect(){
	try {
		const connection = await mysql.createConnection({
			host: 'localhost',
			user,
			password,
			database: 'wapp_atende'
		});

		console.log('Conectou ao mysql2');
		return connection;
	} catch (error) {
		console.error(error)
		return false;
	}
}

function dataAtual(){
	let data = new Date();
	data = data.getFullYear() + '-' + (data.getMonth() + 1) + '-' + data.getDate();
	return data;
}

function horaAtual(){
	let hora = new Date();
	hora = hora.getHours() + ':' + hora.getMinutes() + ':' + hora.getSeconds();
	return hora;
}


async function gravaCliente(contato, nome){
	const consulta = await connect();


	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "gravaClientes"');

	let query = `SELECT * FROM clientes WHERE contato = ?;`;
	let valores = [contato];
	let resultado = await consulta.query(query, valores);
	
	let cliente = resultado[0][0];
	let agora = `${data} ${hora}`

	if (cliente) {
		console.log(`O clinete ${cliente.nome} existe e está sendo atendido por ${cliente.atendente}.`)

		query = `UPDATE clientes SET ultimaMsg = ? WHERE contato = ?;`;
		valores = [agora, contato];
		resultado = await consulta.query(query, valores);
		consulta.end();
		switch(cliente.atendente){

			case 'bot':
				return 'bot';
				break;

			case 'humano':
				return 'humano';
				break;

			default:
				break;

		}	
		
	}else{
	
		console.log('Cliente ainda não cadastrado')
		query = `INSERT INTO clientes(contato, nome, ultimaMsg) VALUES (?, ?, ?);`;
		valores = [contato, nome, agora];
		resultado = await consulta.query(query, valores);
		consulta.end();
		return 'bot';
	}

	

}

async function gravaGrp(nomeGrpW, idGrpw){
	const consulta = await connect();


	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "gravaClientes"');

	let query = `SELECT * FROM grp_rocketchat WHERE idGrpWhats = ?;`;
	let valores = [idGrpw];
	let resultado = await consulta.query(query, valores);
	let canal = ''
	
	let grupo = resultado[0][0];

	if (grupo) {
		console.log(`O grupo ${grupo.nomeWhats} existe. Sala: ${grupo.canal}.`)

		consulta.end();
		console.log('IdSala:', grupo.canal)
		return grupo.canal;
	}else{
		//let nomeGrpR = nomeGrpW.replace(/ /g,'-');
		canal = await Grupo.criarGrupo(nomeGrpW);
		console.log("Canal criado:", canal)
		console.log('Grupo ainda não cadastrado')
		query = `INSERT INTO grp_rocketchat(nomeWhats, nomeRocket, canal, idGrpWhats) VALUES (?, ?, ?, ?);`;
		valores = [nomeGrpW, nomeGrpW, canal, idGrpw];
		resultado = await consulta.query(query, valores);
		consulta.end();
		return canal;
	}

	

}

async function checaGrp(idGrp){
	const consulta = await connect();


	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "checaGrp"');

	let query = `SELECT * FROM grp_rocketchat WHERE canal = ?;`;
	let valores = [idGrp];
	let resultado = await consulta.query(query, valores);
	let canal = ''
	
	let grupo = resultado[0][0];

	if (grupo) {
		console.log(`O grupo ${grupo.nomeWhats} existe. Sala: ${grupo.canal}.`)

		consulta.end();
		console.log('idGrpWhats:', grupo.idGrpWhats)
		return grupo.idGrpWhats;
	}else{
		consulta.end();
		return false
	}

	

}

async function criarSala(nomeSala){
    let url = `${process.env.URLCHAT}/api/v1/channels.create`;

    let json = {
        name: nomeSala,
        members: process.env.MEMBROS_GRUPO
    }

    let config = {
        headers: {
            'X-Auth-Token': process.env.TOKEN_USER,
            'X-User-Id': process.env.ID_USER,
            'Content-type': 'application/json'
        }
    }


    const res = await axios.post(url, json, config)
    .then((resposta) => {
        console.log('sucesso:', resposta)
        return resposta.data.channel._id
    })
    .catch(err=>{

        console.log('deu erro 3')
        console.log(err)
    });
}


async function alteraAtendente(contato, atendente, nome){
	const consulta = await connect();


	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "alteraAtendente"');

	let query = `SELECT * FROM clientes WHERE contato = ?;`;
	let valores = [contato];
	let resultado = await consulta.query(query, valores);
	
	let cliente = resultado[0][0];
	let agora = `${data} ${hora}`

	if (cliente) {
		console.log(`O clinete ${cliente.nome} existe e está sendo atendido por ${cliente.atendente}.
		Será alterado para ${atendente}.`)

		query = `UPDATE clientes SET ultimaMsg = ?, atendente = ? WHERE contato = ?;`;
		valores = [agora, atendente, contato];
		resultado = await consulta.query(query, valores);
		consulta.end();
		switch(cliente.atendente){

			case 'bot':
				return 'humano';
				break;

			case 'humano':
				return 'bot';
				break;

			default:
				break;

		}	
		
	}else{
	
		console.log('Cliente ainda não cadastrado')
		query = `INSERT INTO clientes(contato, nome, ultimaMsg, atendente) VALUES (?, ?, ?, ?);`;
		valores = [contato, nome, agora, atendente];
		resultado = await consulta.query(query, valores);
		consulta.end();
		return atendente;
	}

}

async function setSala(contato, sala){
	const consulta = await connect();


	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "setSala"');

	let query = `SELECT * FROM clientes WHERE contato = ?;`;
	let valores = [contato];
	let resultado = await consulta.query(query, valores);
	
	let cliente = resultado[0][0];

	if (cliente) {
		console.log(`Criando sala para o clinete ${cliente.nome}.`)

		query = `UPDATE clientes SET sala = ? WHERE contato = ?;`;
		valores = [sala, contato];
		resultado = await consulta.query(query, valores);
		
	}

	consulta.end();
}

async function getSala(contato){

	const consulta = await connect();


	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "getSala"');

	let query = `SELECT * FROM clientes WHERE contato = ?;`;
	let valores = [contato];
	let resultado = await consulta.query(query, valores);
	
	let cliente = resultado[0][0];

	if (cliente) {
		consulta.end();
		return cliente.sala;
		
	}else{
		consulta.end();
	}


}


module.exports = { gravaCliente, alteraAtendente, setSala, getSala, gravaGrp, checaGrp }
