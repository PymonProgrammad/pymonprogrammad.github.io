// ===================== CONSTANTS ======================

// ----------------------- Colors -----------------------
let TOKEN_COLOR = "lightcoral";
let TOKEN_HOVER_COLOR = "lightpink";
let TOKEN_CONFLICT_COLOR = "orange";
let CELL_COLOR = "white";
let CELL_HOVER_COLOR = "lightgray";
let CELL_CONFLICT_COLOR = "lightyellow";
// ------------------ Default Data ----------------------
let INIT_POINTS = [
	[-6, 9, -2,  5],
	[ 8, 2, -7, -6],
	[-8, 2, -4, -3],
	[-3, 3, -4,  7]
];
// ----------------- Cell Parameters --------------------
let CELL_HIDE_THRESHOLD = 35;
// ------------------------------------------------------


// ================== HTML ELEMENTS =====================

// ------------------ "scroll" Div ----------------------
let scrollDiv = document.getElementById("scroll");
// --- Created
let grilleTbl = document.createElement("table");
// ------------------- "controle" Div -------------------
let controleDiv = document.getElementById("controle");
// --- Gotten
let nInput = document.getElementById("n");
let xInput = document.getElementById("x");
let pInput = document.getElementById("p");
let minInput = document.getElementById("val_min");
let maxInput = document.getElementById("val_max");
let cellInput = document.getElementById("cell_size");
let generBtn = document.getElementById("random");
let colorCheck = document.getElementById("color");
let modifCheck = document.getElementById("modif");
let clearBtn = document.getElementById("clear");
// -------------------- "partie" Div --------------------
let partieDiv = document.getElementById("partie");
// --- Created
let scorePar = document.createElement("p");
let tokenNbPar = document.createElement("p");
// ------------------------------------------------------


// =================== GLOBAL VARIABLES =================

// --------------------- Problem Data -------------------
let n = 4;
let x = 4;
let p = 10;

let val_min = -10;
let val_max = 10;

let score = 0;
let tokenCount = 0;

let hoveredCell = null;

let points_backup = null;
// ------------------------------------------------------


// ===================== FUNCTIONS ======================

// ----------------------- Utils ------------------------
function clamp(value, min, max)
{
	return (value < min) ? min : ((value > max) ? max : value);
}
// --------------- "Grille" Computations ----------------
function conflict(cell1, cell2)
{
	if (cell1.x == cell2.x && cell1.y == cell2.y) return false;
	
	var diffx = cell1.x - cell2.x;
	var diffy = cell1.y - cell2.y;
	return (cell1.x == cell2.x || cell1.y == cell2.y || diffx == diffy || diffx == -diffy);
}

function conflictCount(cell)
{
	var count = 0;
	for (var i=0; i < n; ++i)
	{
		for (var j=0; j < n; ++j)
		{
			var otherCell = grilleTbl.childNodes[i].childNodes[j];
			if (taken(otherCell) && conflict(cell, otherCell)) ++count;
		}
	}
	return count;
}
// ------------------------------------------------------


// =================== I/O FUNCTIONS ====================

// ------------------ Input Functions -------------------
function getInput(inputElement)
{
	var value = parseInt(inputElement.value);
	var min = parseInt(inputElement.min);
	var max = parseInt(inputElement.max);
	value = clamp(value, min, max);
	return !isNaN(value) ? value : parseInt(inputElement.defaultValue);
}

function read_file(file)
{
	if (file == null) { shootOut("Erreur en récupérant le fichier"); return; }

	if (file.size > 200000) { shootOut("Fichier trop lourd !"); return; }
	
	var reader = new FileReader();

	reader.onload = function() {
		var fileLines = reader.result.replaceAll("\r", "").split("\n");
		while (fileLines.slice(-1) == "" && fileLines.length > 0) fileLines.pop();

		for (var i=0; i < fileLines.length; ++i)
		{
			fileLines[i] = fileLines[i].split(" ");
			while (fileLines[i].slice(-1) == "" && fileLines[i].length > 0) fileLines[i].pop();
		}
		
		if (fileLines.length < 2) { shootOut("Fichier trop court"); return; }

		var typeFichier = "solution";

		if (fileLines.length == 2)
		{
			var firstLine = fileLines[0];
			var secondLine = fileLines[1];

			if (secondLine.length > 1 || isNaN(parseInt(secondLine[0]))) { shootOut("Score / Grille 1x1 corrompu"); return; }
			else if (firstLine.length == 3 && firstLine[0] == "1" && firstLine[1] == "1") typeFichier = "instance";
			else if (firstLine.length != x) { shootOut("Mauvais nombre de jetons"); return; }
			else
			{
				var values = new Set();
				for (var i=0; i < firstLine.length; ++i)
				{
					var val = parseInt(firstLine[i]);
					if (isNaN(val) || values.has(val) || val < 1 || val > n * n) { shootOut("Jeton n°"+(i+1)+" hors grille"); return; }
					values.add(firstLine[i]);
				}
			}
		}
		else
		{
			typeFichier = "instance";
			var firstLine = fileLines[0];

			if (firstLine.length != 3) { shootOut("Mauvais en-tête"); return; }
			var nData = parseInt(firstLine[0]);
			if (isNaN(nData) || nData < nInput.min || nData > nInput.max) { shootOut("Taille hors limites"); return; }
			var xData = parseInt(firstLine[1]);
			if (isNaN(xData) || xData < 1 || xData > nData * nData) { shootOut("Nombre de jetons hors limites"); return; }
			var pData = parseInt(firstLine[2]);
			if (isNaN(pData) || pData < 0) { shootOut("Pénalité non recevable"); return; }
			if (fileLines.length != nData + 1) { shootOut("Données de grille invalides ("+(fileLines.length-1)+" lignes)"); return; }

			for (var i=1; i <= nData; ++i)
			{
				var line = fileLines[i];
				if (line.length != nData) { shootOut("Données de grille invalides ("+(line.length)+" valeurs ligne "+i+")"); return; }
				for (var j=0; j < nData; ++j)
				{
					var value = parseInt(line[j]);
					if (isNaN(value) || value < minInput.min || value > maxInput.max) { shootOut("Valeur hors limites (ligne "+i+" colonne "+(j+1)+")"); return; }
				}
			}
		}

		if (typeFichier == "instance")
		{
			var newN = parseInt(fileLines[0][0]);
			var newX = parseInt(fileLines[0][1]);
			var newP = parseInt(fileLines[0][2]);
			clearGrille();
			resizeGrille(newN);
			fileLines.shift();
			fillGrille(fileLines);

			n = newN;
			x = newX;
			p = newP;
			updateInputValues();
		}

		if (typeFichier == "solution")
		{
			clearGrille();
			for (var i=0; i < x; ++i)
			{
				var index = parseInt(fileLines[0][i]) - 1;
				switchCell(grilleTbl.childNodes[Math.floor(index/n)].childNodes[index%n]);
			}
		}
	};

	reader.readAsText(file);	
}

function upload_file()
{
	const button = document.createElement('input');
	button.type = "file";
	button.onchange = function(){ read_file(button.files[0]); };
	document.body.appendChild(button);
	button.click();
	document.body.removeChild(button);
}
// ------------------ Output Functions ------------------
function updatePars()
{
	scorePar.textContent = "Score : " + score;
	tokenNbPar.textContent = "Jetons restants : " + (x - tokenCount);
	if (tokenCount == x) tokenNbPar.style.color = "red";
	else tokenNbPar.style.color = "black";
}

function updateInputState()
{
	var inputsToDisable = [nInput, xInput, pInput, minInput, maxInput, generBtn, modifCheck];
	for (var i=0; i < inputsToDisable.length; ++i)
		inputsToDisable[i].disabled = (tokenCount > 0);
	if (tokenCount > 0)
    {
        modifCheck.checked = false;
        scrollDiv.style.overflow = "auto";
    }
	if (cellInput.value < CELL_HIDE_THRESHOLD)
	{
		generBtn.disabled = true;
		modifCheck.disabled = true;
	}
}

function updateInputValues()
{
	nInput.value = n;
	xInput.value = x;
	pInput.value = p;
	minInput.value = val_min;
	maxInput.value = val_max;

	xInput.max = n * n;
	minInput.max = val_max;
	maxInput.min = val_min;
}

function colorConflicts(cell, cellColor, tokenColor)
{
	var otherCell;
	
	for (var i=0; i < n; ++i)
	{
		otherCell = grilleTbl.childNodes[cell.y].childNodes[i];
		if (i != cell.x)
		{
			otherCell.style.backgroundColor = taken(otherCell) ? tokenColor : cellColor;
		}
		otherCell = grilleTbl.childNodes[i].childNodes[cell.x];
		if (i != cell.y)
			otherCell.style.backgroundColor = taken(otherCell) ? tokenColor : cellColor;
	}
	
	var i, j;
	
	i = cell.y; j = cell.x;
	while (i > 0 && j > 0) { --i; --j; }
	while (i < n && j < n)
	{
		otherCell = grilleTbl.childNodes[i].childNodes[j];
		if (i != cell.y)
			otherCell.style.backgroundColor = taken(otherCell) ? tokenColor : cellColor;
		++i; ++j;
	}
	
	i = cell.y; j = cell.x;
	while (i > 0 && j < n - 1) { --i; ++j; }
	while (i < n && j >= 0)
	{
		otherCell = grilleTbl.childNodes[i].childNodes[j];
		if (i != cell.y)
			otherCell.style.backgroundColor = taken(otherCell) ? tokenColor : cellColor;
		++i; --j;
	}
}

function shootOut(text)
{
	console.log(text);
	alert(text);
}

function download_instance() 
{
	const a = document.createElement('a');
	var nomf = prompt("Nom du fichier : ", "probleme_"+n+".txt");
	if (nomf == null) return;
	a.download = nomf ? nomf : "probleme_"+n+".txt";
	var url = "data:text/plain," + n + " " + x + " " + p + "%0A" ;
	for (var i = 0 ; i < n ; ++i)
	{
		for (var j = 0 ; j < n ; ++j)
		{
			url += grilleTbl.childNodes[i].childNodes[j].points + " ";
		}
		url += "%0A";
	}
	a.href = url ;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function download_solution() 
{
	if (tokenCount != x) { alert("Vous n'avez pas posé tous les jetons !"); return ; }
	const a = document.createElement('a');
	var nomf = prompt("Nom du fichier : ", "probleme_"+n+"_solution.txt");
	if (nomf == null) return;
	a.download = nomf ? nomf : "probleme_"+n+"_solution.txt";
	var url = "data:text/plain,";
	for (var i = 0 ; i < n ; ++i)
	{
		for (var j = 0 ; j < n ; ++j)
		{
			if(taken(grilleTbl.childNodes[i].childNodes[j])) url += i*n+j+1 + " ";
		}
	}
	url += "%0A";
	url += score ;
	a.href = url ;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}
// ------------------------------------------------------


// ================== EVENT FUNCTIONS ===================

// -------------------- Cell Events ---------------------
function cellClicked(event)
// Add / Remove token on that cell
{
	switchCell(event.target);
}

function cellHovered(event)
{
	var cell = event.target;
	if (taken(cell))
		cell.style.backgroundColor = TOKEN_HOVER_COLOR;
	else
		cell.style.backgroundColor = CELL_HOVER_COLOR;
	if (colorCheck.checked)
		colorConflicts(cell, CELL_CONFLICT_COLOR, TOKEN_CONFLICT_COLOR);
	hoveredCell = cell;
}

function cellLeft(event)
{
	var cell = event.target;
	if (taken(cell))
		cell.style.backgroundColor = TOKEN_COLOR;
	else
		cell.style.backgroundColor = CELL_COLOR;
	colorConflicts(cell, CELL_COLOR, TOKEN_COLOR);
	hoveredCell = null;
}

function cellWheeled(event)
// Changes Cell's value
{
	var cell = event.target;
	
	if (tokenCount > 0 || !modifCheck.checked) return;
	
	var range = val_max - val_min + 1;
	var delta = (event.deltaY == 0) ? 0 : event.deltaY / Math.abs(event.deltaY);
	var newValue = cell.points;
	newValue -= val_min;
	newValue += range - delta;
	newValue = (newValue % range) + val_min;
	setCellValue(cell, newValue);
}
// -------------------- Inputs Events -------------------
function generate(event)
{
	if (tokenCount > 0) return;
	
	var range = val_max - val_min + 1;
	for (var i=0; i < n; ++i)
	{
		for (var j=0; j < n; ++j)
		{
			setCellValue(grilleTbl.childNodes[i].childNodes[j], Math.floor(Math.random() * range + val_min));
		}
	}
}

function updateN(event)
{
	resizeGrille(getInput(nInput));
}

function updateX(event)
{
	x = getInput(xInput);
	xInput.value = x;
	updatePars();
}

function updateP(event)
{
	p = getInput(pInput);
	pInput.value = p;
}

function updateMin(event)
{
	val_min = getInput(minInput);
	minInput.value = val_min;
	maxInput.min = val_min;
	for (var i=0; i < n; ++i)
	{
		for (var j=0; j < n; ++j)
		{
			if (grilleTbl.childNodes[i].childNodes[j].points < val_min)
			{
				setCellValue(grilleTbl.childNodes[i].childNodes[j], val_min);
			}
		}
	}
}

function updateMax(event)
{
	val_max = getInput(maxInput);
	maxInput.value = val_max;
	minInput.max = val_max;
	for (var i=0; i < n; ++i)
	{
		for (var j=0; j < n; ++j)
		{
			if (grilleTbl.childNodes[i].childNodes[j].points > val_max)
			{
				setCellValue(grilleTbl.childNodes[i].childNodes[j], val_max);
			}
		}
	}
}

function updateColor(event)
{
	if (hoveredCell == null) return;
	if (event.target.checked)
		colorConflicts(hoveredCell, CELL_CONFLICT_COLOR, TOKEN_CONFLICT_COLOR);
	else
		colorConflicts(hoveredCell, CELL_COLOR, TOKEN_COLOR);
}

function updateModif(event)
{
    if (event.target.checked) scrollDiv.style.overflow = "hidden";
    else scrollDiv.style.overflow = "auto";
}

function updateCellSize(event)
{
	var currentCellSize;
	currentCellSize = grilleTbl.firstChild.firstChild.style.minWidth;
	currentCellSize = currentCellSize.substr(0, currentCellSize.length-2);
	currentCellSize = parseInt(currentCellSize);
	var hideText = (cellInput.value < CELL_HIDE_THRESHOLD && currentCellSize >= CELL_HIDE_THRESHOLD);
	var showText = (cellInput.value >= CELL_HIDE_THRESHOLD && currentCellSize < CELL_HIDE_THRESHOLD);
	for (var i=0; i < n; ++i)
	{
		for (var j=0; j < n; ++j)
		{
			if (hideText)
			{
				grilleTbl.childNodes[i].childNodes[j].textContent = "";
				grilleTbl.childNodes[i].childNodes[j].speak = false;
				grilleTbl.childNodes[i].childNodes[j].style.backgroundImage = "url()";
				generBtn.disabled = true;
				modifCheck.disabled = true;
				modifCheck.checked = false;
			}
			setCellSize(grilleTbl.childNodes[i].childNodes[j]);
			if (showText)
			{
				grilleTbl.childNodes[i].childNodes[j].textContent = grilleTbl.childNodes[i].childNodes[j].points;
				grilleTbl.childNodes[i].childNodes[j].speak = true;
				if (taken(grilleTbl.childNodes[i].childNodes[j])) grilleTbl.childNodes[i].childNodes[j].style.backgroundImage = "url(pngwing.com_en_free-png-kzzqu.png)";
				if (tokenCount == 0) {
					generBtn.disabled = false;
					modifCheck.disabled = false;
				}
			}
		}
	}
	setGrilleSize();
	document.getElementById("cell_sizeV").textContent = cellInput.value;
}

// -------------- Files Drag & Drop Events --------------
function fileDrop(event)
{
    event.preventDefault();

    var file = null;
    if (event.dataTransfer.items)
    {
        for (var i=0; i < event.dataTransfer.items.length; ++i)
        {
            if (event.dataTransfer.items[i].kind === 'file')
            {
                file = event.dataTransfer.items[i].getAsFile();
                break;
            }
        }
    }
    else if (event.dataTransfer.files)
    {
        file = event.dataTransfer.files[0];
    }

	read_file(file);
}

function dragStop(event)
{
	event.stopPropagation();
	event.preventDefault();

	event.dataTransfer.dropEffet = "copy";
}
// ------------------------------------------------------


// ================ "GRILLE" FUNCTIONS ==================

// ------------------ Cell Functions --------------------
function createCell(x, y, value=Math.round((val_max+val_min)/2))
{
	var newCell = document.createElement("td");
	
	newCell.speak = (cellInput.value >= CELL_HIDE_THRESHOLD);
	setCellValue(newCell, value);
	newCell.x = x;
	newCell.y = y;
	
	newCell.style.backgroundColor = CELL_COLOR;
	newCell.style.backgroundRepeat = "no-repeat";
	newCell.style.backgroundPosition = "center";
	setCellSize(newCell);
	
	newCell.addEventListener("click", cellClicked);
	newCell.addEventListener("mouseover", cellHovered);
	newCell.addEventListener("mouseleave", cellLeft);
	newCell.addEventListener("wheel", cellWheeled);
	
	return newCell;
}

function setCellSize(cell)
{
	cell.style.minWidth = cellInput.value + "px";
	cell.style.maxWidth = cellInput.value + "px";
	cell.style.minHeight = cellInput.value + "px";
	cell.style.maxHeight = cellInput.value + "px";
}

function setCellValue(cell, value)
{
	cell.points = parseInt(value);
	if (cell.speak) cell.textContent = value;
}

function taken(cell)
{
	var bgColor = cell.style.backgroundColor;
	return (bgColor == TOKEN_COLOR || bgColor == TOKEN_HOVER_COLOR || bgColor == TOKEN_CONFLICT_COLOR);
}

function switchCell(cell)
{
	if (taken(cell))
	{
		score -= cell.points;
		score += conflictCount(cell) * p;
		cell.style.backgroundColor = CELL_COLOR;
		cell.style.backgroundImage = "url()";
		cell.style.color = "black" ;
		--tokenCount;
	}
	else if (tokenCount < x)
	{
		score += cell.points;
		score -= conflictCount(cell) * p;
		cell.style.backgroundColor = TOKEN_COLOR;
		if (cell.speak) cell.style.backgroundImage = "url(pngwing.com_en_free-png-kzzqu.png)";
		cell.style.backgroundSize = "contain";
		cell.style.color = "white";
		++tokenCount;
	}
	updatePars();
	updateInputState();
}
// ----------------- Table Functions --------------------
function initGrille()
{
	grilleTbl.id = "grille";
	
	for (var i=0; i < n; ++i)
	{
		var row = document.createElement("tr");
		grilleTbl.appendChild(row);
		for (var j=0; j < n; ++j)
		{
			var cell = createCell(j, i, INIT_POINTS[i][j]);
			row.appendChild(cell);
		}
	}
	
	setGrilleSize();
	grilleTbl.style.margin = "auto";
}

function setGrilleSize()
{
	var grilleSize = n * cellInput.value;
	grilleTbl.style.minWidth = grilleSize + "px";
	grilleTbl.style.maxWidth = grilleSize + "px";
	grilleTbl.style.minHeight = grilleSize + "px";
	grilleTbl.style.maxHeight = grilleSize + "px";
}

function clearGrille()
{
	for (var i=0; i < n; ++i)
	{
		for (var j=0; j < n; ++j)
		{
			var cell = grilleTbl.childNodes[i].childNodes[j];
			if (taken(cell))
			{
				cell.style.backgroundColor = (cell.style.backgroundColor == TOKEN_CONFLICT_COLOR) ? CELL_CONFLICT_COLOR : CELL_COLOR;
				cell.style.backgroundImage = "url()";
				cell.style.color = "black" ;
			}
		}
	}
	if (hoveredCell != null && hoveredCell.style.backgroundColor == CELL_COLOR)
		hoveredCell.style.backgroundColor = CELL_HOVER_COLOR;
	score = 0;
	tokenCount = 0;
	updatePars();
	updateInputState();
}

function fillGrille(newValues)
{
	for (var i=0; i < n; ++i)
	{
		for (var j=0; j < n; ++j)
		{
			var value = parseInt(newValues[i][j]);
			setCellValue(grilleTbl.childNodes[i].childNodes[j], newValues[i][j]);
			if (value < val_min) val_min = value;
			if (value > val_max) val_max = value;
		}
	}
}

function resizeGrille(newN)
{
	if (newN == n) return;
	if (newN > n)
	{
		for (var i=0; i < (newN - n); ++i)
		{
			grilleTbl.appendChild(document.createElement("tr"));
			for (var j=0; j < n; ++j)
			{
				grilleTbl.childNodes[j].appendChild(createCell(n+i, j));
				grilleTbl.childNodes[n+i].appendChild(createCell(j, n+i));
			}
			for (var j=0; j < (newN - n); ++j)
			{
				grilleTbl.childNodes[n+i].appendChild(createCell(n+j, n+i));
			}
		}
	}
	else if (newN < n)
	{
		for (var i=0; i < (n - newN); ++i)
		{
			for (var j=0; j < newN; ++j)
			{
				grilleTbl.childNodes[j].removeChild(grilleTbl.childNodes[j].childNodes[newN]);
			}
		}
		for (var i=0; i < (n - newN); ++i)
		{
			grilleTbl.removeChild(grilleTbl.childNodes[newN]);
		}
	}
	n = newN;
	nInput.value = n;
	xInput.max = n * n;
	if (xInput.value == xInput.defaultValue) x = n;
	xInput.defaultValue = n;
	
	x = clamp(x, xInput.min, xInput.max);
	xInput.value = x;
	
	updatePars();
	setGrilleSize();
}
//-------------------------------------------------------


// ================ *** MAIN SCRIPT *** =================

// Appending Childs
scrollDiv.appendChild(grilleTbl);

partieDiv.appendChild(scorePar);
partieDiv.appendChild(tokenNbPar);

// Initialisation
updatePars();

initGrille();

nInput.defaultValue = n;
xInput.defaultValue = x;
pInput.defaultValue = p;
minInput.defaultValue = val_min;
maxInput.defaultValue = val_max;

updateInputValues();
updateCellSize();

scrollDiv.style.overflow = modifCheck.checked ? "hidden" : "auto";

// Event Listeners

generBtn.addEventListener("click", generate);
clearBtn.addEventListener("click", function (event) { clearGrille() });

nInput.addEventListener("change", updateN);
xInput.addEventListener("change", updateX);
pInput.addEventListener("change", updateP);
minInput.addEventListener("change", updateMin);
maxInput.addEventListener("change", updateMax);
cellInput.addEventListener("change", updateCellSize);

colorCheck.addEventListener("click", updateColor);
modifCheck.addEventListener("click", updateModif);

scrollDiv.addEventListener("drop", fileDrop);
scrollDiv.addEventListener("dragover", dragStop);
scrollDiv.addEventListener("dropover", dragStop);
