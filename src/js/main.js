
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

const othello = {
	el: {},
	init() {
		// fast references
		this.el.gameBoard = window.find(".game-board");
		this.el.board = window.find(".board");
		this.el.gameOver = window.find(".game-over");
		this.el.blackScore = window.find(".toolbar-score .black b");
		this.el.whiteScore = window.find(".toolbar-score .white b");

		let str = "<table cellpadding=\"0\" cellspacing=\"0\">";
		for (let i=0; i<8; i++) {
			str += "<tr>";
			for (let j=0; j<8; j++) {
				str += "<td align=\"center\" valign=\"middle\">&nbsp;</td>";
			}
			str += "</tr>";
		}
		str += "</table>";
		// append board html
		this.el.board.html(str);
		// reference to cells
		this.el.cells = this.el.board.find("td");
	},
	dispatch(event) {
		let cell;
		switch (event.type) {
			// custom events
			case "reset-game":
				othello.el.gameBoard.prop({"className": "game-board"});
				started = false;
				progress = 1;
				break;
			case "new-game":
				this.startGame();
				break;
			case "make-move":
				cell = event.target;
				if (progress == 0) {
					this.put((cell.parentNode.rowIndex * 8) + cell.cellIndex);
				}
				break;
			case "option-no-helpers":
				show_poss = 0;
				show_values = 0;
				this.toggle();
				break;
			case "option-possibilities":
				show_poss = 1;
				show_values = 0;
				this.toggle();
				break;
			case "option-possibilities-values":
				show_poss = 1;
				show_values = 1;
				this.toggle();
				break;
		}
	},
	startGame() {
		if (started) return;
		started = true;

		this.el.gameBoard.removeClass("finished").addClass("playing");

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
		this.putPiece(1, 27);
		this.putPiece(2, 28);
		this.putPiece(2, 35);
		this.putPiece(1, 36);
		move = 0;
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
	resetGame() {
		started = false;
	},
	gameOver() {
		let str = "Egalite";

		// game finished
		this.el.gameBoard.removeClass("playing").addClass("finished");
		progress = 1;
		started = false;
		
		if (score.white > score.black) {
			str = "Computer wins!";
		} else if (score.white < score.black) {
			str = "You win!";
		}

		this.el.gameOver.find(".winner").html(str);
		this.el.gameOver.find(".black-score").html(score.black);
		this.el.gameOver.find(".white-score").html(score.white);
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
		
		if (this.checkMove() != 0) {
			setTimeout(() => this.KI(), 1200);
		} else {
			progress = 0;
			this.checkPossibilities(player);
			if (this.checkMove() == 0) setTimeout(() => this.gameOver(), 1200);
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
			
			if (this.checkMove() == 0) setTimeout(() => this.gameOver(), 1200);
			else setTimeout(() => this.KI(), 1200);

		} else for (i=0; i<64; i++) {
			if (poss[i]["number"] > 0) this.putPiece (5,i);
			else if (fld[i] == 0) this.putPiece(0,i);
		}
	}
};

window.exports = othello;
