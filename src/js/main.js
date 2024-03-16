
let started = false;
let move = 1;
let progress = 1;
let computer = 1;
let player = 2;
let show_poss = 1;
let show_values = 1;
let fld = new Array(64);
let tmp_fld = new Array(64);
let poss = [];
let tmp_poss = [];
let score = { black : 0, white : 0 };
let value = new Array(50, -1, 5, 2, 2, 5, -1, 50,
					  -1, -10, 1, 1, 1, 1, -10, -1,
					   5, 1, 1, 1, 1, 1, 1, 5,
					   2, 1, 1, 0, 0, 1, 1, 2,
					   2, 1, 1, 0, 0, 1, 1, 2,
					   5, 1, 1, 1, 1, 1, 1, 5,
					  -1, -10, 1, 1, 1, 1, -10, -1,
					  50, -1, 5, 2, 2, 5, -1, 50);

// default settings
const defaultSettings = {
	"sound-fx": "on",
	"game-option": "possibilities-values",
	"game-theme": "modern",
};

const othello = {
	el: {},
	init() {
		// fast references
		this.el.content = window.find("content");
		this.el.gameBoard = window.find(".game-board");
		this.el.board = window.find(".board");
		this.el.gameOver = window.find(".game-over");
		this.el.blackScore = window.find(".toolbar-score .black b");
		this.el.whiteScore = window.find(".toolbar-score .white b");

		// get settings, if any
		this.settings = window.settings.getItem("settings") || defaultSettings;

		console.log( this.settings );

		// apply settings
		for (let type in this.settings) {
			let arg = this.settings[type];
			// update menu
			window.bluePrint.selectNodes(`//Menu[@check-group="${type}"]`).map(xMenu => {
				switch (type) {
					case "sound-fx":
						if (arg === "on") {
							xMenu.setAttribute("is-checked", 1);
							this.dispatch({ type: "toggle-sound", checked: 1 });
						} else {
							xMenu.removeAttribute("is-checked");
							this.dispatch({ type: "toggle-sound", checked: -1 });
						}
						break;
					default:
						let xArg = xMenu.getAttribute("arg");
						xMenu.removeAttribute("is-checked");;
						if (xArg === arg) {
							// update menu item
							xMenu.setAttribute("is-checked", 1);
							// call dispatch
							type = xMenu.getAttribute("click");
							this.dispatch({ type, arg});
						}
				}
			});
		}

		let str = [`<table cellpadding="0" cellspacing="0">`];
		for (let y=0; y<8; y++) {
			str.push(`<tr>`);
			for (let x=0; x<8; x++) {
				str.push(`<td y="${y}" x="${x}">&nbsp;</td>`);
			}
			str.push(`</tr>`);
		}
		str.push(`</table>`);
		// append board html
		this.el.board.html(str.join(""));
		// reference to cells
		this.el.cells = this.el.board.find("td");

		let pgn = window.settings.getItem("pgn");
		if (pgn) {
			this.dispatch({ type: "game-from-pgn", pgn });
		}
	},
	dispatch(event) {
		let Self = othello,
			cell,
			state;
		switch (event.type) {
			// system events
			case "window.close":
				// save settings
				window.settings.setItem("settings", Self.settings);

				if (Self.el.gameBoard.hasClass("playing") && !Self.el.gameBoard.hasClass("game-won")) {
					state = Self.serialize();
					window.settings.setItem("pgn", state);
				}
				break;
			// custom events
			case "reset-game":
				Self.el.gameBoard.prop({"className": "game-board"});
				started = false;
				progress = 1;

				Self.el.cells.html("");
				Self.el.cells.removeClass("black white");

				// reset toolbar score
				Self.el.blackScore.html(0);
				Self.el.whiteScore.html(0);
				// clear settings
				window.settings.clear();
				break;
			case "set-theme":
				Self.el.content.data({ theme: event.arg });
				// update settings
				Self.settings["game-theme"] = event.arg;
				break;
			case "output-pgn":
				state = Self.serialize();
				console.log(state);
				break;
			case "game-from-pgn":
				Self.startGame(event.pgn);
				break;
			case "toggle-sound":
				window.audio.mute = event.checked < 0;
				// update settings
				Self.settings["sound-fx"] = window.audio.mute ? "off" : "on";
				break;
			case "close-congratulations":
				Self.dispatch({ type: "reset-game" });
				break;
			case "new-game":
				Self.startGame();
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
			case "make-move":
				cell = event.target;
				if (progress == 0) {
					Self.put((cell.parentNode.rowIndex * 8) + cell.cellIndex);
				}
				break;
			case "set-options":
				switch (event.arg) {
					case "no-helpers":           show_poss = 0; show_values = 0; break;
					case "possibilities":        show_poss = 1; show_values = 0; break;
					case "possibilities-values": show_poss = 1; show_values = 1; break;
				}
				Self.toggle();
				// update settings
				Self.settings["game-option"] = event.arg;
				break;
		}
	},
	serialize() {
		let board = this.el.cells.map(el =>(["white", "black"].indexOf(el.className.split(" ")[0]) + 1))
						.join("").replace(/-1/g, "0");
		return { move, board };
	},
	startGame(pgn) {
		if (started) return;
		started = true;

		this.el.gameBoard.removeClass("finished game-won").addClass("playing");

		for (let i=0; i<64; i++) {
			this.putPiece(0,i);
			fld[i] = 0;
			poss[i] = [];
			poss[i]["number"] = 0;
			poss[i]["flips"] = "";
			tmp_poss[i] = [];
			tmp_poss[i]["number"] = 0;
			tmp_poss[i]["flips"] = "";
		}
		if (pgn) {
			pgn.board.split("").map((piece, i) => {
				this.putPiece(+piece, i);
			});
			move = pgn.move;
		} else {
			this.putPiece(1, 27);
			this.putPiece(2, 28);
			this.putPiece(2, 35);
			this.putPiece(1, 36);
			move = 0;
		}
		this.checkPossibilities(2);

		if (computer == 2) this.KI();
		else {
			progress = 0;
			for (let i=0; i<64; i++) {
				if (poss[i]["number"] > 0) this.putPiece(5,i);
			}
		}
	},
	updateScore() {
		score.white = 0;
		score.black = 0;
		for (var j=0; j<64; j++) {
			if (fld[j] == 1) score.white++;
			if (fld[j] == 2) score.black++;
		}
		this.el.blackScore.html(score.black);
		this.el.whiteScore.html(score.white);
	},
	gameOver() {
		let str = "Egalite";

		progress = 1;
		started = false;
		
		if (score.white > score.black) {
			// game finished
			this.el.gameBoard.removeClass("playing").addClass("finished");

			// play sound
		 	window.audio.play("loose");

			str = "Computer wins!";
		} else if (score.white < score.black) {
			// game finished
			this.el.gameBoard.addClass("game-won");

			// play sound
		 	window.audio.play("win");

			str = "You win!";
		} else {
			// game finished
			this.el.gameBoard.removeClass("playing").addClass("finished");

			// play sound
		 	window.audio.play("win");
		 	
			str = "Draw!";
		}

		this.el.gameOver.find(".winner").html(str);
		this.el.gameOver.find(".black-score").html(score.black);
		this.el.gameOver.find(".white-score").html(score.white);
		// clear settings
		window.settings.clear();
	},
	toggle() {
		if (!started) return;
		for (let i=0; i<64; i++) {
			if (poss[i]["number"] > 0) this.putPiece(5, i);
		}
	},
	checkMove() {
		let i=0, j=0;
		for (; i<64; i++) {
			j += poss[i]["number"];
		}
		return j;
	},
	fakeFlip(color, field) {
		let temp = [];
		temp = tmp_poss[field]["flips"].split("|");
		for (let i=0; i<temp.length-1; i++) {
			fld[(temp[i])] = color;
		}
	},
	flip(color, field) {
		let temp = [];
		temp = poss[field]["flips"].split("|");
		for (let i=0; i<temp.length-1; i++) {
			this.putPiece(color, temp[i]);
		}
	},
	put(field) {
		if (fld[field] != 0) return false;
		if (poss[field]["number"] == 0) return false;
		progress = 1;
		this.putPiece(player, field);
		this.flip(player, field);
		
		for (let i=0; i<64; i++) {
			if (fld[i] != 1 && fld[i] != 2) this.putPiece(0,i);
		}
		this.checkPossibilities(computer);
		
		// play sound
	 	window.audio.play("jingle-on");

		if (this.checkMove() != 0) {
			setTimeout(() => this.KI(), 1500);
		} else {
			progress = 0;
			this.checkPossibilities(player);
			if (this.checkMove() == 0) setTimeout(() => this.gameOver(), 1500);
			else {
				for (let i=0; i<64; i++) {
					if (poss[i]["number"] > 0) this.putPiece(5,i);
				}
			}
		}
		return true;
	},
	putPiece(color, field) {
		if (color == 5 && progress == 0) {
			this.el.cells[field].className = "";
			this.el.cells[field].innerHTML = "&#160;";
			
			this.el.cells[field].className = (show_poss == 1 && show_values == 0)? "hole" : "";
			if (show_values == 1) {
				this.el.cells[field].className = "hole";
				this.el.cells[field].innerHTML = poss[field]["number"];
			}
		} else if (color == 0 || (color == 5 && progress == 1)) {
			this.el.cells[field].className = "";
			this.el.cells[field].innerHTML = "&#160;";
		} else {
			if (fld[field] != 0) {
				progress = 1;
				this.el.cells[field].className = (color == 1) ? "black black-flip" : "white white-flip";
			} else {
				this.el.cells.get(field).prop({"className": (color == 1) ? "white" : "black"});
			}
			this.el.gameBoard.cssSequence("flipping", "transitionend", el => {
				if (!el.hasClass("flipping")) return;
				el.removeClass("flipping");
				el.find(".black.black-flip").prop({ className: "white" });
				el.find(".white.white-flip").prop({ className: "black" });
			});

			fld[field] = color;
			this.el.cells[field].innerHTML = "&#160;";
			this.updateScore();
			move++;
		}
	},
	checkPossibilities(color) {
		let row, column,
			flips = "",
			number = 0,
			opponent,
			i, j, k;
		
		for (i=0; i<64; i++) {
			poss[i]["number"] = 0;
			poss[i]["flips"] = "";
		}

		// Color of the opponent
		opponent = (color == 1) ? 2 : 1;
		for (i=0; i<64; i++) {
			if (fld[i] == color) {
				row = Math.floor(i/8);
				column = i%8;

				for (j=0; j<8; j++) {
					if (j == column || j == column-1 || j == column+1) continue;
					if (fld[(row*8+j)] == 0) {
						if (column > j) {
							for (k = 1; k < column-j; k++) {
								if (fld[i-k] == opponent) {
									number++;
									flips = flips.concat((i-k) + "|");
								} else {
									number = 0;
									flips = "";
									break;
								}
							}
							poss[(row*8+j)]["number"] += number;
							poss[(row*8+j)]["flips"] = poss[(row*8+j)]["flips"].concat(flips);
							number = 0;
							flips = "";
						} else {
							for (k=1; k<j-column; k++) {
								if (fld[i+k] == opponent) {
									number++;
									flips = flips.concat((i+k) + "|");
								} else {
									number = 0;
									flips = "";
									break;
								}
							}
							poss[(row*8+j)]["number"] += number;
							poss[(row*8+j)]["flips"] = poss[(row*8+j)]["flips"].concat(flips);
							number = 0;
							flips = "";
						}
					}
				}

				for (j=0; j<8; j++) {
					if (j == row || j == row-1 || j == row+1) continue;
					if (fld[(j*8+column)] == 0) {
						if (row > j) {
							for (k=1; k<row-j; k++) {
								if (fld[(i-k*8)] == opponent) {
									number++;
									flips = flips.concat((i-k*8) + "|");
								} else {
									number = 0;
									flips = "";
									break;
								}
							}
							poss[(j*8+column)]["number"] += number;
							poss[(j*8+column)]["flips"] = poss[(j*8+column)]["flips"].concat(flips);
							number = 0;
							flips = "";
						} else {
							for (k=1; k<j-row; k++) {
								if (fld[(i+k*8)] == opponent) {
									number++;
									flips = flips.concat((i+k*8) + "|");
								} else {
									number = 0;
									flips = "";
									break;
								}
							}
							poss[(j*8+column)]["number"] += number;
							poss[(j*8+column)]["flips"] = poss[(j*8+column)]["flips"].concat(flips);
							number = 0;
							flips = "";
						}
					}
				}
	      
				for (j=2; j<8; j++) {
					if (j <= row && j <= column && fld[(i-j*9)] == 0) {
						for (k=1; k<j; k++) {
							if (fld[(i-k*9)] == opponent) {
								number++;
								flips = flips.concat((i-k*9) + "|");
							} else {
								number = 0;
								flips = "";
								break;
							}
						}
						poss[(i-j*9)]["number"] += number;
						poss[(i-j*9)]["flips"] = poss[(i-j*9)]["flips"].concat(flips);
						number = 0;
						flips = "";
					}

					if (j <= row && j < 8-column && fld[(i-j*7)] == 0) {
						for (k=1; k<j; k++) {
							if (fld[i-k*7] == opponent) {
								number++;
								flips = flips.concat((i-k*7) + "|");
							} else {
								number = 0;
								flips = "";
								break;
							}
						}
						poss[(i-j*7)]["number"] += number;
						poss[(i-j*7)]["flips"] = poss[(i-j*7)]["flips"].concat(flips);
						number = 0;
						flips = "";
					}

					if (j < 8-row && j <= column && fld[(i+j*7)] == 0) {
						for (k=1; k<j; k++) {
							if (fld[i+k*7] == opponent) {
								number++;
								flips = flips.concat((i+k*7) + "|");
							} else {
								number = 0;
								flips = "";
								break;
							}
						}
						poss[(i+j*7)]["number"] += number;
						poss[(i+j*7)]["flips"] = poss[(i+j*7)]["flips"].concat(flips);
						number = 0;
						flips = "";
					}

					if (j < 8-row && j < 8-column && fld[(i+j*9)] == 0) {
						for (k=1; k<j; k++) {
							if (fld[i+k*9] == opponent) {
								number++;
								flips = flips.concat((i+k*9) + "|");
							} else {
								number = 0;
								flips = "";
								break;
							}
						}
						poss[(i+j*9)]["number"] += number;
						poss[(i+j*9)]["flips"] = poss[(i+j*9)]["flips"].concat(flips);
						number = 0;
						flips = "";
					}
				}
			}
		}
	},
	KI() {
		let i, j, k, l, diff,
			blah, blah2, nimm,
			temp  = [],
			temp2 = [],
			temp3 = [];

		for (i=0; i<64; i++) {
			tmp_poss[i]["number"] = poss[i]["number"];
			tmp_poss[i]["flips"]  = poss[i]["flips"];
			tmp_fld[i] = fld[i];
		}    
		for (i=0; i<64; i++) {
			if (tmp_poss[i]["number"] > 0) {
				fld[i] = computer;
				this.fakeFlip(computer, i);
			} else continue;
			
			this.checkPossibilities(player);
			if (this.checkMove() == 0) temp2.push(i);
			
			for (j=0; j<64; j++) fld[j] = tmp_fld[j];
		}
		for (i=0; i<64; i++) {
			poss[i]["number"] = tmp_poss[i]["number"];
			poss[i]["flips"] = tmp_poss[i]["flips"];
			fld[i] = tmp_fld[i];
		}
		if (typeof(temp2[0]) == "undefined") {
			if (poss[0]["number"] > 0) temp2.push(0);
			if (poss[7]["number"] > 0) temp2.push(7);
			if (poss[56]["number"] > 0) temp2.push(56);
			if (poss[63]["number"] > 0) temp2.push(63);
			if (typeof(temp2[0]) == "undefined") {
				for (i=2; i<6; i++) {
					if (poss[i]["number"] > 0) temp2.push(i);
					if (poss[(i*8)]["number"] > 0) temp2.push(i*8);
					if (poss[(i*8+7)]["number"] > 0) temp2.push(i*8+7);
					if (poss[(56+i)]["number"] > 0) temp2.push(56+i);
				}
				if (fld[0] == computer && poss[1]["number"] > 0) temp2.push(1);
				if (fld[0] == computer && poss[8]["number"] > 0) temp2.push(8);
				if (fld[7] == computer && poss[6]["number"] > 0) temp2.push(6);
				if (fld[7] == computer && poss[15]["number"] > 0) temp2.push(15);
				if (fld[56] == computer && poss[48]["number"] > 0) temp2.push(48);
				if (fld[56] == computer && poss[57]["number"] > 0) temp2.push(57);
				if (fld[63] == computer && poss[55]["number"] > 0) temp2.push(55);
				if (fld[63] == computer && poss[62]["number"] > 0) temp2.push(62);
				if (typeof(temp2[0]) == "undefined") {
					for (i = 2; i < 6; i++) {
						if (poss[(16+i)]["number"] > 0) temp2.push(16+i);
						if (poss[(i*8+2)]["number"] > 0) temp2.push(i*8+2);
						if (poss[(i*8+5)]["number"] > 0) temp2.push(i*8+5);
						if (poss[(40+i)]["number"] > 0) temp2.push(40+i);
					}
					if (fld[0] == computer && poss[9]["number"] > 0) temp2.push(9);
					if (fld[7] == computer && poss[14]["number"] > 0) temp2.push(14);
					if (fld[56] == computer && poss[49]["number"] > 0) temp2.push(49);
					if (fld[63] == computer && poss[54]["number"] > 0) temp2.push(54);
					if (typeof(temp2[0]) == "undefined") {
						for (i=2; i<6; i++) {
							if (poss[(8+i)]["number"] > 0) temp2.push(8+i);
							if (poss[(i*8+1)]["number"] > 0) temp2.push(i*8+1);
							if (poss[(i*8+6)]["number"] > 0) temp2.push(i*8+6);
							if (poss[(48+i)]["number"] > 0) temp2.push(48+i);
						}
						if (typeof(temp2[0]) == "undefined") {
							if (poss[1]["number"] > 0) temp2.push(1);
							if (poss[6]["number"] > 0) temp2.push(6);
							if (poss[8]["number"] > 0) temp2.push(8);
							if (poss[15]["number"] > 0) temp2.push(15);
							if (poss[48]["number"] > 0) temp2.push(48);
							if (poss[55]["number"] > 0) temp2.push(55);
							if (poss[57]["number"] > 0) temp2.push(57);
							if (poss[62]["number"] > 0) temp2.push(62);
							if (typeof(temp2[0]) == "undefined") {
								if (poss[9]["number"] > 0) temp2.push(9);
								if (poss[14]["number"] > 0) temp2.push(14);
								if (poss[49]["number"] > 0) temp2.push(49);
								if (poss[54]["number"] > 0) temp2.push(54);
							}
						}
					}
				}
			}
		}

		if (score.white + score.black < 25) {
			for (i=0; i<temp2.length; i++) temp3[i] = temp2[i];
		} else {
			diff = -1000;
			if (temp2.length > 1) {
				for (i=0; i<64; i++) {
					tmp_poss[i]["number"] = poss[i]["number"];
					tmp_poss[i]["flips"] = poss[i]["flips"];
					tmp_fld[i] = fld[i];
				}
				
				for (i=0; i<temp2.length; i++) {
					temp = poss[(temp2[i])]["flips"].split("|");
					blah = 0;
					for (j=0; j<temp.length-1; j++) blah += value[(temp[j])];

					fld[(temp2[i])] = computer;
					this.fakeFlip(computer, (temp2[i]));
					this.checkPossibilities(player);

					for (j=0; j<64; j++) {
						temp = poss[j]["flips"].split("|");
						blah2 = 0;
						for (k=0; k<temp.length-1; k++) blah2 += value[(temp[k])];
					}
					for (j=0; j<64; j++) {
						poss[j]["number"] = tmp_poss[j]["number"];
						poss[j]["flips"]  = tmp_poss[j]["flips"];
						fld[j] = tmp_fld[j];
					}
					if (blah - blah2 > diff) {
						while (typeof(temp3[0]) != "undefined") {
							temp3.pop()
						}
						temp3.push(temp2[i]);
						diff = blah - blah2;
					} else if (diff == blah - blah2) {
						temp3.push(temp2[i]);
					}
				}
			} else temp3[0] = temp2[0];
		}
		blah = Math.floor((Math.random() * 1000) % temp3.length);
		nimm = temp3[blah];
		this.putPiece(computer, nimm);
		this.flip(computer, nimm);
		progress = 0;
		this.checkPossibilities(player);

		if (this.checkMove() == 0) {
			this.checkPossibilities(computer);
			
			if (this.checkMove() == 0) setTimeout(() => this.gameOver(), 1500);
			else setTimeout(() => this.KI(), 1500);

		} else {
			for (i=0; i<64; i++) {
				if (poss[i]["number"] > 0) this.putPiece (5,i);
				else if (fld[i] == 0) this.putPiece(0,i);
			}
			// play sound
		 	window.audio.play("jingle-off");
		}
	}
};

window.exports = othello;
