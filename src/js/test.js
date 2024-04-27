
let Test = {
	init(APP) {

		return;
		let pgn = {
			    "move": 30,
			    "board": "0000000000000000002222000012110000111100002111000000000000000000"
			};
		APP.dispatch({ type: "game-from-pgn", pgn });
	}
};
