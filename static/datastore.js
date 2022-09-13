
let user = false;
let contactList = false;

let messages = false;


function getUsuario() {
	return new Promise ((resolve, reject) => {
		$.get('http://192.168.1.100:3333/usuario?numero=558494090579')
		.then(data => {
			console.log(data)
			resolve(data)
		})
		.catch(error => {
			console.log(error)
			reject(error)
		})
	})
}

function getContatos() {
	return new Promise ((resolve, reject) => {
		$.get('http://192.168.1.100:3333/contatos')
		.then(data => {
			//console.log(data)
			resolve(data)
		})
		.catch(error => {
			console.log(error)
			reject(error)
		})
	})
}

function getMensagens() {
	return new Promise ((resolve, reject) => {
		$.get('http://192.168.1.100:3333/mensagens?idUser=558494090579')
		.then(data => {
			//console.log(data)
			resolve(data)
		})
		.catch(error => {
			console.log(error)
			reject(error)
		})
	})
}

function setStatusMensagens(remetente) {
	return new Promise ((resolve, reject) => {
		$.get(`http://192.168.1.100:3333/status?remetente=${remetente}`)
		.then(data => {
			//console.log(data)
			resolve(data)
		})
		.catch(error => {
			console.log(error)
			reject(error)
		})
	})
}

let groupList = [
	{
		id: 1,
		name: "Programmers",
		members: [1, 2],
		pic: "images/0923102932_aPRkoW.jpg"
	},
	{
		id: 2,
		name: "Web Developers",
		members: [0, 2],
		pic: "images/1921231232_Ag1asE.png"
	},
	{
		id: 3,
		name: "notes",
		members: [0],
		pic: "images/8230192232_asdEWq2.png"
	}
];


// message status - 0:sent, 1:delivered, 2:read

/*let messages = [
	{
		id: 0,
		sender: 2,
		body: "OI Karlos tudo bem",
		time: "February 25, 2021 08:21:03",
		status: 2,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 1,
		sender: 2,
		body: "at home",
		time: "April 25, 2018 13:22:03",
		status: 2,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 2,
		sender: 2,
		body: "how you doin'?",
		time: "April 25, 2018 18:15:23",
		status: 2,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 3,
		sender: 2,
		body: "i'm fine...wat abt u?",
		time: "April 25, 2018 21:05:11",
		status: 2,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 4,
		sender: 2,
		body: "i'm good too",
		time: "April 26, 2018 09:17:03",
		status: 1,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 5,
		sender: 2,
		body: "anyone online?",
		time: "April 27, 2018 18:20:11",
		status: 0,
		recvId: 1,
		recvIsGroup: true
	},
	{
		id: 6,
		sender: 2,
		body: "have you seen infinity war?",
		time: "April 27, 2018 17:23:01",
		status: 1,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 7,
		sender: 2,
		body: "are you going to the party tonight?",
		time: "April 27, 2018 08:11:21",
		status: 2,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 8,
		sender: 2,
		body: "no, i've some work to do..are you?",
		time: "April 27, 2018 08:22:12",
		status: 2,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 9,
		sender: 2,
		body: "yup",
		time: "April 27, 2018 08:31:23",
		status: 1,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 10,
		sender: 2,
		body: "if you go to the movie, then give me a call",
		time: "April 27, 2018 22:41:55",
		status: 2,
		recvId: 1,
		recvIsGroup: false
	},
	{
		id: 11,
		sender: 2,
		body: "yeah, i'm online",
		time: "April 28 2018 17:10:21",
		status: 0,
		recvId: 1,
		recvIsGroup: true
	}
];*/

let MessageUtils = {
	getByGroupId: async (groupId) => {
		if (!messages) messages = await getMensagens()
		//console.log('getByGroupId:', messages);
		return messages.filter(msg => msg.recvIsGroup && msg.recvId === groupId);
	},
	getByContactId: async (contactId) => {
		//console.log('contactId', contactId)
		if (!user) user = await getUsuario()
		if (!messages) messages = await getMensagens()
		//console.log('getByContactId:', messages);

		//console.log('messages', messages)
		return messages.filter(msg => {
			//console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', msg)
			return !msg.recvIsGroup && ((msg.sender === user.id && msg.recvId === contactId) || (msg.sender === contactId && msg.recvId === user.id));
		});

	},
	getMessages: async () => {
		if (!messages) messages = await getMensagens()
		//console.log('getMessages:', messages);
		return messages;
	},
	changeStatusById: async (options) => {
		if (!user) user = await getUsuario()
		if (!messages) messages = await getMensagens()
		//console.log('changeStatusById:', messages);



		messages = messages.map((msg) => {
			if (options.isGroup) {
				if (msg.recvIsGroup && msg.recvId === options.id) msg.status = 2;
			} else {
				if (!msg.recvIsGroup && msg.sender === options.id && msg.recvId === user.id) msg.status = 2;
			}
			return msg;
		});
	
	},
	addMessage: async (msg) => {
		if (!messages) messages = await getMensagens()
		//console.log('addMessage:', messages);
		msg.id = messages.length + 1;
		messages.push(msg);
	}
};