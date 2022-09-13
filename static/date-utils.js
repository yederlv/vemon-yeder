
const mDate = (dateString) => {
	
	let date = dateString ? new Date(dateString) : new Date();

	let dualize = (x) => x < 10 ? "0" + x : x; // 2 digitos horas
	let getTime = () => dualize(date.getHours()) + ":" + dualize(date.getMinutes());//Monta a hora:minutos
	let getDate = () => dualize(date.getDate()) + "/" + dualize((date.getMonth()+1)) + "/" + dualize(date.getFullYear());// dd/mm/aaaa

	return {
		subtract: (otherDateString) => {
			return date - new Date(otherDateString);
		},
		lastSeenFormat: () => {
			let dateDiff = Math.round((new Date() - date) / (1000 * 60 * 60 * 24));
			let value = (dateDiff === 0) ? "hoje" : (dateDiff === 1) ? "ontem" : getDate();
			
			return value + " às " + getTime();
			
		},
		chatListFormat: () => {//dia da msg mais antiga
			let dateDiff = Math.round((new Date() - date) / (1000 * 60 * 60 * 24));
			if (dateDiff === 0) {
				return getTime();
			} else if (dateDiff === 1) {
				return "Ontem";
			} else {
				return getDate();
			}
		},
		getDate: () => {
			return getDate();
		},
		getTime: () => {
			return getTime();
		},
		toString:() => {
			return date.toString().substr(4, 20);
		},
	};
};