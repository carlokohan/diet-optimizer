$(document).ready(function(){
		$("#dietsolver").hide();
		$("#functions").hide();
		$("#tableau").hide();

//hide major parts of the site
		$("#simplexButton").on('click',function(){
			$("#simplexsolver").slideDown();
			$("#dietsolver").slideUp();
		});

		$("#dietButton").on('click',function(){
			$("#simplexsolver").slideUp();
			$("#dietsolver").slideDown();
		});

//File Reading, nutritional_values.txt is of comma separated format
		var foodList;
		$.get('data/nutritional_values.txt', function(data){
			foodList = data.split('\n');
			for(var i = 0;i < foodList.length;i++){
				foodList[i] = foodList[i].split(',');
			}

			//include the food choices for diet
			var temp = '<td><input type="checkbox" id="';
			var temp2 = '"/><label for="';
			var str ='';
			for (var i = 1; i <= foodList.length; i++) {
				var inputid = "food";
				inputid = inputid.concat(i);

				str += temp + inputid + temp2 + inputid + '">' + foodList[i-1][0] + '</label></td>';

				if(i%4 == 0){
					var tr = '<tr>' + str + '</tr>';
					var finale = $(tr);
					$('#dietvars').append(finale);
					str='';
				}

			};
			//var x = $('#dietvars').find("tr").length;
			//console.log("x: "+x);
		});

//for ultimate solver

	$(".nextstep").on('click', function(){
		var str = $("#nVars").val();
		var nVars = +$("#nVars").val();
		if(str == ""){
			alert("Enter number of Variables.");
			return;
		}

		str = $("#nCons").val();
		var nCons = +$("#nCons").val();
		if(str == ""){
			alert("Enter number of Constraints.");
			return;
		}


		$(".simplexvars").hide();
		$("#functions").show();

		var str='';
		for (var i = 0; i < nVars; i++) {
			if(i==(nVars-1))
				str += '<input type="number" class="pure-u-1-8" id="vars'+(i)+'"/><button class="pure-button-disabled">X'+ (i+1) + '</button>';
			else
				str += '<input type="number" class="pure-u-1-8" id="vars'+(i)+'"/><button class="pure-button-disabled">X'+ (i+1) + '+</button>';

		};

		$("#varsNCons").append(str);
		str='';
		//we create the input fields dynamically based from the input
		for(var j = 0 ; j<nCons ; j++){
			for (var i = 0; i <= nVars; i++) { 
				if(i==nVars)
					str += '<select class="btn btn-default" id="equals'+(j)+'" name="equals"><option value="lessthan" ><=</option><option value="greaterthan">>=</option></select>'+'<input type="number" class="pure-u-1-8" id="vars'+(j)+'-'+(i+nCons+1)+'"/>';
				else if(i==(nVars-1))
					str += '<input type="number" class="pure-u-1-8" id="vars'+(j)+'-'+(i)+'"/><button class="pure-button-disabled">X'+ (i+1) + '</button>';
				else
					str += '<input type="number" class="pure-u-1-8" id="vars'+(j)+'-'+(i)+'"/><button class="pure-button-disabled">X'+ (i+1) + '+</button>';

			};
			str += '<br/>';
		};
		$("#consNCons").append(str);


	});

	$(".backstep").on('click', function(){
		$("#varsNCons").children().remove();
		$("#consNCons").children().remove();
		$("#functions").hide();
		$(".simplexvars").show();
	});

	$(".backstep2").on('click',function(){
		$("#functions").show();
		$("#tableau").hide();
		$("#printtable").children().remove();
	});

	//maximize or minimize the objective equation and constraints
	$(".simplexsolve").on('click',function(){
		$("#functions").hide();
		$("#tableau").show();

		var sss = $("input[name='category']:checked").val();
		var nVars = +$("#nVars").val();
		var nCons = +$("#nCons").val();

		var rows = nCons+1;//number of columns for the tablue
		var cols = nVars+nCons+2;//plus 2 for the answer column and the slack for objective function (Z)

		//setup the initial tableau
		if(sss == "max"){
			var tableau = createTableau(nCons,cols);
			printTableau(tableau);//initial tableau

			var basicSol = getBasicSolution(tableau);
			printBasicSolution(basicSol);//initial basic solution

			//now we start solving
			maxSimplex(tableau);

		} else if(sss == "min"){
			var tableau = createTableau(nCons,cols);
			printTableau(tableau);//initial tableau

			var basicSol = getBasicSolution(tableau);
			printBasicSolution(basicSol);//initial basic solution

			//now we start solving
			//minSimplex(tableau);
		}
	});


	/*
	@param 2D Array
	@return Array
	*/
	function getBasicSolution(tableau){
		var solutions = new Array();
		var rows = tableau.length;
		var cols = (+$("#nCons").val())+(+$("#nVars").val())+1;

		for(var i=0;i<cols;i++){//since creating 2D matrix is different in js, we inverted the usual implementation
			var count=0;
			var aOne = true;
			var index = 0;

			for(var j=0;j<rows;j++){//get each jth row then evaluate the ith column if it is '1' or not
				var temp = tableau[j];

				if(count>1)
					break;

				if(temp[i]>0){
					count++;
					index = j;

					if(temp[i]!=1) 
						aOne = false
				}
			}

			if(count == 1 && aOne){//there's only one 1s
				var temp = tableau[index];

				solutions.push(temp[temp.length-1]);//push the last element
				//console.log("temp[temp.length-1]: "+temp[temp.length-1]);
			}
			else
				solutions.push(0);

		}

		return solutions;
	}

	/*
	@param 2D Array
	*/
	function printTableau(tableau){
		var str = '<br/><table border="1"><tr>';
		var nVars = +$("#nVars").val();
		var nCons = +$("#nCons").val();

		for(var i=0;i<nVars;i++){
			str += '<td>X'+(i+1)+'</td>';
		}

		for(var i=0;i<nCons;i++){
			str += '<td>S'+(i+1)+'</td>';
		}
		str += '<td>Z</td><td>Answer</td></tr>';//print column headers

		//print values:
		for(var i=0;i<tableau.length;i++){
			var temp = tableau[i];
			str += '<tr>';

			for(var j=0;j<temp.length;j++){
				str += '<td>'+temp[j]+'</td>';
			}

			str += '</tr>';
		}

		str += '</table>';
		$("#printtable").append(str);
	}

	/*
	@param Array
	*/
	function printBasicSolution(basicSolution){
		var str = '<p>Basic Solution:</p><table border="1"><tr>';
		var index = 0;

		var nVars = +$("#nVars").val();
		var nCons = +$("#nCons").val();

		for(var i=0;i<nVars;i++){
			str += '<td>X' + (i+1) + ' = ' + basicSolution[index++] + '</td>';
		}

		for(var i=0;i<nCons;i++){
			str += '<td>S' + (i+1) + ' = ' + basicSolution[index++] + '</td>';
		}
		str += '<td>Z = '+ basicSolution[index]+'</td>';

		str += '</tr></table>';

		$("#printtable").append(str);

	}

	/*
	@param int, int
	@return 2D Array
	*/
	function createTableau(nCons,cols){
			var tableau = new Array();

			for(var i=0;i<nCons;i++){
				var temp = new Array();
				var k=0;

				for(var j=0;j<cols;j++){
					var id2 = "#equals"+i;
					var sign = $(id2).val();

					var id = '#vars'+i+'-'+j;
					var value = +$(id).val();

					if(!isNaN(value)){
						temp.push(value);
					}else if(isNaN(value)){
						if(k==i){
							//check if the sign is <= or >=
							if(sign == "lessthan")
								temp.push(1);
							else if(sign == "greaterthan")
								temp.push(-1);
						}
						else{
							temp.push(0);
						}
						k++;
					}
				};//for j
				//console.log("temp: "+temp);

				tableau.push(temp);
			};//for i

			
		//push the objective function last
			var temp = new Array();
			for(var j=0;j<cols;j++){
				var id = '#vars'+j;
				var value = +$(id).val();

				//isNaN in the else if part because there's no "id" in the html-dom with that name
				//so getting its value:  +$(id).val();  --> returns NaN
				if(!isNaN(value)){
					value = (-value);
					temp.push(value);
				}else if(isNaN(value)){
					if(j==(cols-2)){//push 1 for the z
						temp.push(1);
					} 
					else{
						temp.push(0);
					}
				}
			}
			tableau.push(temp);
			//console.log("temp: "+temp);
		return tableau;
	}

	/**
	Simplex - Maximize
	@param 2D Array
	*/
	function maxSimplex(tableau){
		var i = 0;
		var n = tableau.length;
		//only 100 iterations
		for(;i<100;i++){	
			//check if there are no more negative values on the last row
			if(checkLastRow(tableau[n-1]) == true){
				alert("Optimization is finished!");
				break;
			}
			else{
				//get the column with the greatest negative value based from last row
				var column = getPivotColumn(tableau[n-1]);

				//get the pivot row based from column
				var row = getPivotRow(tableau,column);
				console.log("row: "+row+" col: "+column);

				//we do Gauss-Jordan Elimination
				tableau = doGaussJordan(tableau,row,column);
				
				printTableau(tableau);
				printBasicSolution(getBasicSolution(tableau));
			}
		}
		if(i==100)
			alert("Not feasible");
	}

	/**
	Checks if last row has still a negative value (last element not included since it is the answer)
	@param Array
	@return boolean
	*/
	function checkLastRow(row){
		for(var i=0;i<row.length-1;i++){
			if(row[i]<0) 
				return false;
		}
		
		return true;
	}
	
	/**
	Returns the index with the greatest negative value (last element not included since it is the answer)
	@param Array
	@return int
	*/
	function getPivotColumn(row){
		var index=0;

		for(var i=0;i<row.length-1;i++){
			if(row[i]<row[index])
				index = i;
		}
		console.log("index: "+index);
		return index;
	}

	/**
	* Returns the pivot element
	* @param 2D Array, int
	* @return int
	*/
	function getPivotRow(tableau,column){
		var aOverB = new Array(); //will store a/b solutions

		for(var i=0;i<tableau.length;i++){
			var temp = tableau[i];
			
			//answer/pivot column
			if(temp[column]>0)
				aOverB.push(temp[temp.length-1] / temp[column]);
			else
				aOverB.push(-1);//we push 0 just for default value cause it's important on the next lines
		}

		//search the smallest one
		var index=0;
		for(var i=0;i<aOverB.length;i++){
			if(aOverB[i] >= 0){
				if(aOverB[i] < aOverB[index])
					index = i;

				if(aOverB[index] == -1)
					index = i;
			}

		}
		//index is the row
		return index;
	}

	/**
	* Returns the Gauss-Jordan-eliminated matrix
	*
	* @param 2D Array, int, int
	* @return 2D Array
	*/
	function doGaussJordan(tableau,row,column){

		var normalized = normalizeVector(tableau[row],tableau[row][column]);
		for(var i=0;i<tableau.length;i++){
			var temp = [];

				/*
				seems V8 just uses pointer if you do this: 
					temp = normalized
				so be careful. It took me hours to debug this
				*/

			for(var jj=0;jj<normalized.length;jj++){
				temp.push(normalized[jj]);
			}

			if(i != row){
				//console.log("tableau row: "+tableau[row]+" \ti:"+i+" row: "+row);
				var multiplier = tableau[i][column];
				var subtractingVector = getSubtractingVector(temp, multiplier );

				tableau[i] = subtractVectors(tableau[i],subtractingVector);
				//console.log("tableau[i]: "+tableau[i]+ " normalized: "+temp);
			}
			else if(i == row){
				tableau[i] = temp;
				//console.log("tableau[i]2: "+tableau[i]+ " temp: "+temp);
			}
		}

		return tableau;
	}


	/**
	* @param Array, int
	* @return Array
	*/
	function normalizeVector(vector,divisor){
		var n = vector.length;
		for(var i=0;i<n;i++){
			vector[i] = vector[i]/divisor;
		}

		return vector;
	}

	/**
	* @param Array, int
	* @return Array
	*/
	function getSubtractingVector(row,multiplier){
		for(var i=0;i<row.length;i++){
			row[i] = multiplier*row[i];
		}

		return row;
	}

	/**
	* @param Array, Array
	* @return Array
	*/
	function subtractVectors(vector1,vector2){
		for(var i=0; i<vector1.length;i++){
			vector1[i] = vector1[i] - vector2[i];
		}

		return vector1;
	}

});