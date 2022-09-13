
let getById = (id, parent) => parent ? parent.getElementById(id) : getById(id, document);
let getByClass = (className, parent) => parent ? parent.getElementsByClassName(className) : getByClass(className, document);

const DOM =  {
	chatListArea: getById("chat-list-area"),
	messageArea: getById("message-area"),
	inputArea: getById("input-area"),
	chatList: getById("chat-list"),
	messages: getById("messages"),
	chatListItem: getByClass("chat-list-item"),
	messageAreaName: getById("name", this.messageArea),
	messageAreaPic: getById("pic", this.messageArea),
	messageAreaNavbar: getById("navbar", this.messageArea),
	messageAreaDetails: getById("details", this.messageAreaNavbar),
	messageAreaOverlay: getByClass("overlay", this.messageArea)[0],
	messageInput: getById("input"),
	profileSettings: getById("profile-settings"),
	profilePic: getById("profile-pic"),
	profilePicInput: getById("profile-pic-input"),
	inputName: getById("input-name"),
	username: getById("username"),
	displayPic: getById("display-pic"),
};

let mClassList = (element) => {
	return {
		add: (className) => {
			element.classList.add(className);
			return mClassList(element);
		},
		remove: (className) => {
			element.classList.remove(className);
			return mClassList(element);
		},
		contains: (className, callback) => {
			if (element.classList.contains(className))
				callback(mClassList(element));
		}
	};
};

// 'areaSwapped' is used to keep track of the swapping
// of the main area between chatListArea and messageArea
// in mobile-view
let areaSwapped = false;

// 'chat' is used to store the current chat
// which is being opened in the message area
let chat = null;

// this will contain all the chats that is to be viewed
// in the chatListArea
let chatList = [];

// this will be used to store the date of the last message
// in the message area
let lastDate = "";

// 'populateChatList' will generate the chat list
// based on the 'messages' in the datastore
let populateChatList = async () => {
	if (!contactList) contactList = await getContatos();
	chatList = [];

	// 'present' will keep track of the chats
	// that are already included in chatList
	// in short, 'present' is a Map DS
	let present = {};

	MessageUtils.getMessages().then(data=>{
		console.log('DATA:', data)
		data
		.sort((a, b) => mDate(a.time).subtract(b.time))
		.forEach((msg) => {
			let chat = {}; // Objeto vazio
			//console.log('MSG:', msg);
			
			chat.isGroup = msg.recvIsGroup; // define se é em grupo
			chat.msg = msg;

			if (msg.recvIsGroup) { // se for recebido em grupo
				chat.group = groupList.find((group) => (group.id === msg.recvId)); // Procura os grupos que tem o id destino
				chat.name = chat.group.name; // seta o nome do grupo
			} else {
				chat.contact = contactList.find((contact) => (msg.sender !== user.id) ? (contact.id === msg.sender) : (contact.id === msg.recvId)); // se o emissor é diferente do usuario, id do contato = ao emitente, id contato = destino msg
				//console.log('1:', chat, '2:', chat.contact.name)
				chat.name = chat.contact.name;
			}

			chat.unread = (msg.sender !== user.id && msg.status < 2) ? 1: 0;

			if (present[chat.name] !== undefined) {
				chatList[present[chat.name]].msg = msg;
				chatList[present[chat.name]].unread += chat.unread;
			} else {
				present[chat.name] = chatList.length;
				chatList.push(chat);
			}

			//console.log('Chat...', chat)
		});
	});
	
};

function checkStatus(imageUrl) 
{
   var http = jQuery.ajax(
   {
      type:"HEAD",
      url: imageUrl,
      async: false
    })
  return http.status;
}

let viewChatList = async () => {
	if (!contactList) contactList = await getContatos();
	DOM.chatList.innerHTML = "";
	console.log('=====>', chatList)

	let checaFoto = '';

	function aguardar() {
		chatList
		.sort((a, b) => mDate(b.msg.time).subtract(a.msg.time))
		.forEach((elem, index) => {
			let statusClass = elem.msg.status < 2 ? "far" : "fas";
			let unreadClass = elem.unread ? "unread" : "";
			checaFoto = checkStatus(elem.contact.pic);

			if(checaFoto == 404){elem.contact.pic = 'images/Alsdk120asdj913jk.jpg';}

			DOM.chatList.innerHTML += `
			<div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom ${unreadClass}" onclick="generateMessageArea(this, ${index}, ${elem.contact.id})">
				<img src="${elem.isGroup ? elem.group.pic : elem.contact.pic}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
				<div class="w-50">
					<div class="name">${elem.name}</div>
					<div class="small last-message">${elem.isGroup ? contactList.find(contact => contact.id === elem.msg.sender).number + ": " : ""}${elem.msg.sender === user.id ? "<i class=\"" + statusClass + " fa-check-circle mr-1\"></i>" : ""} ${elem.msg.body}</div>
				</div>
				<div class="flex-grow-1 text-right">
					<div class="small time">${mDate(elem.msg.time).chatListFormat()}</div>
					${elem.unread ? "<div class=\"badge badge-success badge-pill small\" id=\"unread-count\">" + elem.unread + "</div>" : ""}
				</div>
			</div>
			`;

			console.log('passe por aqui')
		});
	}

	setTimeout(aguardar, 1000);
	
};

let generateChatList = async() => {
	await populateChatList();
	await viewChatList();
};

let addDateToMessageArea = (date) => {
	DOM.messages.innerHTML += `
	<div class="mx-auto my-2 bg-primary text-white small py-1 px-2 rounded">
		${date}
	</div>
	`;
};

let addMessageToMessageArea = async (msg) => {
	if (!contactList) contactList = await getContatos();
	let msgDate = mDate(msg.time).getDate();
	if (lastDate != msgDate) {
		addDateToMessageArea(msgDate);
		lastDate = msgDate;
	}

	let htmlForGroup = `
	<div class="small font-weight-bold text-primary">
		${contactList.find(contact => contact.id === msg.sender).number}
	</div>
	`;

	let sendStatus = `<i class="${msg.status < 2 ? "far" : "fas"} fa-check-circle"></i>`;

	DOM.messages.innerHTML += `
	<div class="align-self-${msg.sender === user.id ? "end self" : "start"} p-1 my-1 mx-3 rounded bg-white shadow-sm message-item">
		<div class="options">
			<a href="#"><i class="fas fa-angle-down text-muted px-2"></i></a>
		</div>
		${chat.isGroup ? htmlForGroup : ""}
		<div class="d-flex flex-row">
			<div class="body m-1 mr-2">${msg.body}</div>
			<div class="time ml-auto small text-right flex-shrink-0 align-self-end text-muted" style="width:75px;">
				${mDate(msg.time).getTime()}
				${(msg.sender === user.id) ? sendStatus : ""}
			</div>
		</div>
	</div>
	`;

	DOM.messages.scrollTo(0, DOM.messages.scrollHeight);
};

let generateMessageArea = async (elem, chatIndex, remetente) => {
	chat = chatList[chatIndex];

	//console.log('=============', remetente)

	mClassList(DOM.inputArea).contains("d-none", (elem) => elem.remove("d-none").add("d-flex"));
	mClassList(DOM.messageAreaOverlay).add("d-none");

	[...DOM.chatListItem].forEach((elem) => mClassList(elem).remove("active"));

	mClassList(elem).contains("unread", () => {
		 MessageUtils.changeStatusById({
			isGroup: chat.isGroup,
			id: chat.isGroup ? chat.group.id : chat.contact.id
		});
		mClassList(elem).remove("unread");
		console.log('clicou:', elem, chatIndex);
		mClassList(elem.querySelector("#unread-count")).add("d-none");
		$.get(`http://192.168.1.100:3333/status?remetente=${remetente}`);
	});

	if (window.innerWidth <= 575) {
		mClassList(DOM.chatListArea).remove("d-flex").add("d-none");
		mClassList(DOM.messageArea).remove("d-none").add("d-flex");
		areaSwapped = true;
	} else {
		mClassList(elem).add("active");
	}

	DOM.messageAreaName.innerHTML = chat.name;
	DOM.messageAreaPic.src = chat.isGroup ? chat.group.pic : chat.contact.pic;
	
	// Message Area details ("last seen ..." for contacts / "..names.." for groups)
	if (chat.isGroup) {
		let groupMembers = groupList.find(group => group.id === chat.group.id).members;
		let memberNames = contactList
				.filter(contact => groupMembers.indexOf(contact.id) !== -1)
				.map(contact => contact.id === user.id ? "You" : contact.name)
				.join(", ");
		
		DOM.messageAreaDetails.innerHTML = `${memberNames}`;
	} else {
		DOM.messageAreaDetails.innerHTML = `visto pela última vez ${mDate(chat.contact.lastSeen).lastSeenFormat()}`;
	}

	//console.log('-----------------')
	//console.log ('chat.contact.id', chat.contact.id);
	let msgs = chat.isGroup ? await MessageUtils.getByGroupId(chat.group.id) : await MessageUtils.getByContactId(chat.contact.id);
	DOM.messages.innerHTML = "";


	lastDate = "";
	//console.log('Msgs>>>>>:', msgs);
	msgs
	.sort((a, b) => mDate(a.time).subtract(b.time))
	.forEach((msg) => addMessageToMessageArea(msg));
};

let showChatList = () => {
	if (areaSwapped) {
		mClassList(DOM.chatListArea).remove("d-none").add("d-flex");
		mClassList(DOM.messageArea).remove("d-flex").add("d-none");
		areaSwapped = false;
	}
};

let sendMessage = () => {
	let value = DOM.messageInput.value;
	DOM.messageInput.value = "";
	if (value === "") return;

	let msg = {
		sender: user.id,
		body: value,
		time: mDate().toString(),
		status: 1,
		recvId: chat.isGroup ? chat.group.id : chat.contact.id,
		recvIsGroup: chat.isGroup
	};

	addMessageToMessageArea(msg);
	MessageUtils.addMessage(msg);
	generateChatList();
};

let showProfileSettings = () => {
	DOM.profileSettings.style.left = 0;
	DOM.profilePic.src = user.pic;
	DOM.inputName.value = user.name;
};

let hideProfileSettings = () => {
	DOM.profileSettings.style.left = "-110%";
	DOM.username.innerHTML = user.name;
};

window.addEventListener("resize", e => {
	if (window.innerWidth > 575) showChatList();
});

let init = async () => {
	if (!user) user = await getUsuario()
	DOM.username.innerHTML = user.name;
	DOM.displayPic.src = user.pic;
	DOM.profilePic.stc = user.pic;
	DOM.profilePic.addEventListener("click", () => DOM.profilePicInput.click());
	DOM.profilePicInput.addEventListener("change", () => console.log(DOM.profilePicInput.files[0]));
	DOM.inputName.addEventListener("blur", (e) => user.name = e.target.value);
	generateChatList();

	//console.log("Click the Image at top-left to open settings.");
};

init();