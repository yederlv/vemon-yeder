const mysql = require("mysql2/promise");
const { async } = require("rxjs");


require('dotenv').config();
const user = process.env.DBUSER;
const password = process.env.KEY;

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
		return false
	}

	

}




module.exports = { gravaGrp, checaGrp }
