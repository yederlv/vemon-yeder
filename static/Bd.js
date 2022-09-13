const mysql = require("mysql2/promise");

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

async function altResponsavel(responsavel, protocolo, from){
	const consulta = await connect();

	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "altResponsavel"');

	const query = `UPDATE wapp_protocolos SET atendente = ? WHERE protocolo = ? AND contato = ?;`;
	const valores = [responsavel, protocolo, from];
	let resultado = await consulta.query(query, valores);
	consulta.end();
	console.log(resultado[0])
	console.log('Novo responsavel:', responsavel);
}

async function responsavel(protocolo, contato){
	const consulta = await connect();

	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "responsavel"');

	const query = `SELECT * FROM wapp_protocolos WHERE protocolo = ? AND contato = ?;`;
	const valores = [protocolo, contato];
	let resultado = await consulta.query(query, valores);
	consulta.end();
	let responsavel = resultado[0][0];

	if (responsavel) {
		console.log('responsavel:', responsavel.atendente);
		responsavel = responsavel.atendente;
		return responsavel;
	}else{
		responsavel = 'atendente virtual';
		return responsavel;
	}
}

async function gravaMsg(protocolo, contato, nome, msg, sessao){
	const consulta = await connect();

	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "gravaMsg"');

	data = dataAtual();
	hora = horaAtual();
	const sql = `INSERT INTO wapp_mensagens (protocolo, contato, nome, mensagem, sessao, data, hora) VALUES (?,?,?,?,?,?,?);`;
	const valores = [protocolo, contato, nome, msg, sessao, data, hora];
	const result = await consulta.query(sql, valores);
	consulta.end();
	console.log('gravaMsg', result);
}

async function checaProtocolo(contato, atendente, situacao, sessao){
	const consulta = await connect();

	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "checaProtocolo"');

	const query = `SELECT * FROM wapp_protocolos WHERE contato = ? AND data = ?;`;
	data = dataAtual();
	const valores = [contato, data];
	let resultado = await consulta.query(query, valores);
	consulta.end();
	resultado = resultado[0][0];
	console.log(resultado);

	let protocolo = '';

	if (resultado) {
		console.log('Já existe protocolo:', resultado.protocolo);
		protocolo = resultado.protocolo;
		return protocolo;
	}else {
		protocolo = new Date().getTime();
		await gravaProtocolo(protocolo, data, contato, atendente, situacao, sessao);
		console.log('Dados gravados no banco');
		console.log('Novo protocolo:', protocolo);
		return protocolo;
	}

}

async function gravaProtocolo(protocolo, data, contato, atendente, situacao, sessao){
	data = dataAtual();
	hora = horaAtual();
	const consulta = await connect();

	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "gravaProtocolo"');

	const sql = `INSERT INTO wapp_protocolos (protocolo, contato, atendente, situacao, sessao, data, hora) VALUES (?,?,?,?,?,?,?);`;
	const valores = [protocolo, contato, atendente, situacao, sessao, data, hora];
	const result = await consulta.query(sql, valores);
	consulta.end();
	console.log('gravaProtocolo', result)
}


async function checaAtendente(contato){
	const consulta = await connect();

	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "checaAtendente"');

	let query = `SELECT * FROM wapp_atendimento WHERE telefone = ?;`;
	let valores = [contato];
	let resultado = await consulta.query(query, valores);
	resultado = resultado[0][0];
	console.log(resultado);

	let protocolo = '';

	if (resultado) {
		console.log('Este número é de um Agente:', resultado.atendente);
		console.log('A mensagem será direcionada para:', resultado.numCliente);
		return resultado;
		
	}else {
		query = `SELECT * FROM wapp_atendimento WHERE numCliente = ?;`;
		resultado = await consulta.query(query, valores);
		resultado = resultado[0][0];
		console.log(resultado);

		return resultado;
	}

	consulta.end();

}


async function setCliente(atendente, cliente){
	const consulta = await connect();

	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "setCliente"');

	let query = `UPDATE wapp_atendimento SET numCliente = ? WHERE telefone = ?;`;
	let valores = [cliente, atendente];
	let resultado = await consulta.query(query, valores);
	console.log('Atualizado cliente em atendimento');

	consulta.end();

}

async function usuario(contato='558499495226'){
	const consulta = await connect();


	if (!consulta) throw new Error('Não conectado ao banco de dados! Função "usuario"');

	const query = `SELECT * FROM usuario WHERE numero = ?;`;
	const valores = [contato];
	let resultado = await consulta.query(query, valores);
	consulta.end();
	let usuario = resultado[0][0];

	if (usuario) {
		console.log('usuario...:', usuario.nome);
		console.log(usuario);
		console.log(__dirname);

		let dados = 
		`{
			"id": "${usuario.idUser}",
			"name": "${usuario.nome}",
			"number": "+${usuario.numero}",
			"pic": "${usuario.foto}"
		}`;

		var json = JSON.parse(dados);
		return json;
		console.log(JSON.stringify(dados));
	}else{
		
		console.log('Usuário não encontrado');
	}
}

usuario();

module.exports = { gravaMsg, checaProtocolo, gravaProtocolo, responsavel, altResponsavel, checaAtendente, setCliente, usuario}
