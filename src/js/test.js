
let Test = {
	init(APP) {

		// setTimeout(() => window.find(`.toolbar-tool_[data-click="toggle-music"]`).trigger("click"), 500);
		// setTimeout(() => APP.dispatch({ type: "toggle-music" }), 500);

		return;
		let pgn = {
			    "move": 30,
			    "board": "0000000000000000002222000012110000111100002111000000000000000000"
			};
		APP.dispatch({ type: "game-from-pgn", pgn });
	}
};
