/***
*
*	Shado inventory main CLIENT JavaScript file
*
*/

	async function addItem()	{
		
		var name = document.getElementById("article_name").value;
		var price = document.getElementById("article_price").value;
		var quantity = document.getElementById("article_quantity").value;
		var artiste = document.getElementById("article_artiste").value;
		var description = document.getElementById("article_description").value;
		
		price = Number(price).toFixed(2);
		
		if (name != "" && price != "" && quantity != "")	{
			
			const data = { name, price, quantity, artiste, description };
		
			const options = {
				method: 'POST',
				headers: {
					"Content-type": "application/json"
				},
				body: JSON.stringify(data)
			};
			
			const response = await fetch('/addArticle', options);	
			const json = await response.json();


			document.getElementById("article_name").value = "";
			document.getElementById("article_price").value = "";
			document.getElementById("article_quantity").value = "";
			document.getElementById("article_artiste").value = "";
			document.getElementById("article_description").value = "";
			
			showMessage(`${json.message} le ${new Date(json.time)}`);
			
			showAllData();
		
		} else	{
			showMessage(`Veuillez remplir les cases demandées`, "error");
		}
			
	}
	
	async function showAllData()	{
		
		const DIV = document.getElementById("all_articles");
		DIV.innerHTML = `<br />
			<input type="button" value="Exporter et tétécharger" class="blue3" title="Exporter à un fichier excel" OnClick="exportToCSV(\'inventory\');" />
			<input type="file" value="Importer des données" class="blue3" title="Importer des fichier .CSV à l\'inventaire" OnChange="sendCSVtoServer(this, \'inventory\');" />
				<br />
				<br />`;

		
		const response = await fetch('/getAllArticles');
		const json = await response.json();		
		
		// Sort array in alphaitical order
		json.sort(function(a, b)	{
		  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
		  if (b.name.toLowerCase() > a.name.toLowerCase()) return -1;
		  return 0;
		});
		
		// Show data to user
		var str = `<table id="articles_table"><tr>`;
			
			if (checkboxChecked("show_articles"))	{
				str += `<th>Article</th>`;
			}
			
			if (checkboxChecked("show_quantity"))	{
				str += `<th>Quantité</th>`;
			}
			
			if (checkboxChecked("show_price"))	{
				str += `<th>Prix ch. ($)</th>`;
			}
			
			if (checkboxChecked("show_totalPrice"))	{
				str += `<th>total ($)</th>`;
			}
			
			if (checkboxChecked("show_artiste"))	{
				str += `<th>Artiste</th>`;
			}
			
			if (checkboxChecked("show_date"))	{
				str += `<th>Data d'ajout</th>`;
			}
			
			if (checkboxChecked("show_id"))	{
				str += `<th>id</th>`;
			}
			
			if (checkboxChecked("show_description"))	{
				str += `<th>Description</th>`;
			}
			
			if (checkboxChecked("show_options"))	{
				str += `<th>Options</th>`;
			}

		str += `</tr>`;
						
		var sum = 0;
		
		for (var temp of json)	{
			
			str += `<tr>`;
			
			if (checkboxChecked("show_articles"))	{
				str += `<td id="${temp._id}_name">${temp.name}</td>`;
			}
			
			if (checkboxChecked("show_quantity"))	{
				str += `<td id="${temp._id}_quantity">${temp.quantity}</td>`;
			}
			
			if (checkboxChecked("show_price"))	{
				str += `<td id="${temp._id}_price">${Number(temp.price).toFixed(2)}</td>`;
			}
			
			if (checkboxChecked("show_totalPrice"))	{
				str += `<td>${(Number(temp.price) * Number(temp.quantity)).toFixed(2)}</td>`;
			}
			
			if (checkboxChecked("show_artiste"))	{
				str += `<td id="${temp._id}_artiste">${temp.artiste}</td>`;
			}
			
			if (checkboxChecked("show_date"))	{
				str += `<td>${formateDate(new Date(temp.time))}</td>`;
			}
			
			if (checkboxChecked("show_id"))	{
				str += `<td>${temp._id}</td>`;
			}
			
			if (checkboxChecked("show_description"))	{
				str += `<td id="${temp._id}_description">${temp.description}</td>`;
			}
			
			if (checkboxChecked("show_options"))	{
				str += `<td id="${temp._id}_options">
							<img class="edit_image" src="edit_img.png" title="Modifier ${temp.name}" OnClick="modifyArticle('${temp._id}');" id="${temp._id}_edit_button" />
							<img class="delete_image" src="delete_img.png" title="Ajouter 1 ${temp.name} à la liste des articles vendus" OnClick="deleteArticle('${temp._id}');" />
						</td>`;
			}

			str += `</tr>`;
					
			sum += Number(temp.price) * Number(temp.quantity);
			
		}
		
		str += `<tr><td><b>Total</b></td><td>${sum.toFixed(2)}$</td></tr>`;
		
		str += `</table>`;
		
		DIV.innerHTML += str;
		
	}

	async function showAllSold()	{
		
		const DIV = document.getElementById("sold_articles");
		DIV.innerHTML = `<br />
					<input type="button" value="Exporter et tétécharger" class="blue3" title="Exporter à un fichier excel" OnClick="exportToCSV(\'sales\');" />
					<input type="file" value="Importer des données de vente" class="blue3" title="Importer des fichier .CSV aux données de ventes" OnChange="sendCSVtoServer(this, \'sales\');" />
					<br />
					<br />`;
		
		const response = await fetch('/getSoldArticles');
		const json = await response.json();		
		
		// Sort array in alphaitical order
		json.sort(function(a, b)	{
		  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
		  if (b.name.toLowerCase() > a.name.toLowerCase()) return -1;
		  return 0;
		});
		
		// Show data to user
		var sum = 0;
		
		var str = `<table id="articles_table">
						<tr>
							<th>Article</th>
							<th>Quantité vendue</th>
							<th>Prix ch. ($)</th>
							<th>total ($)</th>
							<th>Artiste</th>
							<th>Date(s) de vente</th>
							<th>id</th>
							<th>Description</th>
						</tr>`;

		for (var temp of json)	{
			
			str += `<tr>
						<td>${temp.name}</td>
						<td>${temp.quantity}</td>
						<td>${Number(temp.price).toFixed(2)}</td>
						<td>${(Number(temp.price) * Number(temp.quantity)).toFixed(2)}</td>
						<td>${temp.artiste}</td>
						<td>`;
						
						for (var tempDate of temp.time)	{
							str += formateDate(new Date(tempDate)) + "<br />";
						}
						
						
			str += `</td>
						<td>${temp._id}</td>
						<td>${temp.description}</td>
					</tr>`;
					
			sum += Number(temp.price) * Number(temp.quantity);
			
		}
		
		str += `<tr><td><b>Total</b></td><td>${sum.toFixed(2)}$</td></tr>`;
		
		str += `</table>`;
		
		DIV.innerHTML += str;
		
	}

	async function deleteArticle(article_id)	{
		
		const data = {id: article_id};
		
		const options = {
			method: 'POST',
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify(data)
		};
			
		const response = await fetch('/deleteArticle', options);
		const json = await response.json();
		
		showMessage(json.message, json.status);
		
		showAllData();
		showAllSold();
		
	}
	
	async function search()	{
		
		var keywords = document.getElementById("search_input").value;
		keywords = keywords.toLowerCase();
		
		if (keywords != "")	{
			
			const data = {keywords};
			
			const options = {
				method: 'POST',
				headers: {
					"Content-type": "application/json"
				},
				body: JSON.stringify(data)
			};
				
			const response = await fetch('/searchArticle', options);
			const json = await response.json();			
			
			// Display results			
			/*if (json.stat.toLowerCase == "error")	{
				showMessage(json.message, json.status);
			}*/
			
			const DIV = document.getElementById("search_result");
			
			DIV.innerHTML = "";
			showDiv("search_result");			
			hideDiv("add_item");
			hideDiv("settings");
	
			var results = json.results;
			
			// Sort array in alphaitical order
			results.sort(function(a, b)	{
				if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
				if (b.name.toLowerCase() > a.name.toLowerCase()) return -1;
				return 0;
			});
			
			// Show data to user
			var str = `<img src="minus.svg" class="hideImg" width="50" OnClick="hideDiv('search_result');" />
						<h1>${json.results.length} Résultat(s) de recherche</h1>
						<br />
						<table>
							<tr>`;
				
				if (checkboxChecked("show_articles"))	{
					str += `<th>Article</th>`;
				}
				
				if (checkboxChecked("show_quantity"))	{
					str += `<th>Quantité</th>`;
				}
				
				if (checkboxChecked("show_price"))	{
					str += `<th>Prix ch. ($)</th>`;
				}
				
				if (checkboxChecked("show_totalPrice"))	{
					str += `<th>total ($)</th>`;
				}
				
				if (checkboxChecked("show_artiste"))	{
					str += `<th>Artiste</th>`;
				}
				
				if (checkboxChecked("show_date"))	{
					str += `<th>Data d'ajout</th>`;
				}
				
				if (checkboxChecked("show_id"))	{
					str += `<th>id</th>`;
				}
				
				if (checkboxChecked("show_description"))	{
					str += `<th>Description</th>`;
				}
				
				if (checkboxChecked("show_options"))	{
					str += `<th>Options</th>`;
				}

			str += `</tr>`;
			
			for (var temp of results)	{
				
				str += `<tr>`;
				
				if (checkboxChecked("show_articles"))	{
					str += `<td>${temp.name}</td>`;
				}
				
				if (checkboxChecked("show_quantity"))	{
					str += `<td>${temp.quantity}</td>`;
				}
				
				if (checkboxChecked("show_price"))	{
					str += `<td>${Number(temp.price).toFixed(2)}</td>`;
				}
				
				if (checkboxChecked("show_totalPrice"))	{
					str += `<td>${(Number(temp.price) * Number(temp.quantity)).toFixed(2)}</td>`;
				}
				
				if (checkboxChecked("show_artiste"))	{
					str += `<td>${temp.artiste}</td>`;
				}
				
				if (checkboxChecked("show_date"))	{
					str += `<td>${formateDate(new Date(temp.time))}</td>`;
				}
				
				if (checkboxChecked("show_id"))	{
					str += `<td>${temp._id}</td>`;
				}
				
				if (checkboxChecked("show_description"))	{
					str += `<td>${temp.description}</td>`;
				}
				
				if (checkboxChecked("show_options"))	{
					str += `<td>
						<a href="#${temp._id}_name">
							<img class="jump_image" src="jump_image.png" title="Localiser dans le tableau principal" />
						</a>
						<img class="delete_image" src="delete_img.png" title="Ajouter 1 ${temp.name} à la liste des articles vendus" OnClick="deleteArticle('${temp._id}');" />
						</td>`;
				}

				str += `</tr>`;

				
			}
		
			str += `</table>`;
			
			DIV.innerHTML = str;	
			
		}	
	}
	
	function modifyArticle(id)	{
		
		// Make the values inputs
		document.getElementById("show_options").checked = true;
		//showAllData();

		var newName = document.getElementById(id + "_name");
		var newQuantity = document.getElementById(id + "_quantity");
		var newPrice = document.getElementById(id + "_price");
		var newArtist = document.getElementById(id + "_artiste");
		var newDes = document.getElementById(id + "_description");

		if (newName)	{
			newName.innerHTML = `<input type="text" value="${newName.innerHTML}" id="${id}_name_mod" />`;
		}

		if (newQuantity)	{
			newQuantity.innerHTML = `<input type="number" value="${newQuantity.innerHTML}" id="${id}_quantity_mod" />`;
		}

		if (newPrice)	{
			newPrice.innerHTML = `<input type="number" value="${newPrice.innerHTML}" id="${id}_price_mod" />`;
		}

		if (newArtist)	{
			newArtist.innerHTML = `<input type="text" value="${newArtist.innerHTML}" id="${id}_artiste_mod" />`;
		}

		if (newDes)	{
			newDes.innerHTML = `<input type="text" value="${newDes.innerHTML}" id="${id}_description_mod" />`;
		}

		document.getElementById(id + "_options").innerHTML += `<img src="checkmark_image.png" class="edit_image" OnClick="updateArticle('${id}');" title="Enregistrer les modifications" />`
		
		document.getElementById(id + "_edit_button").style.display = "none";
		
	}
	
	async function updateArticle(id)	{

		const data = {};

		var name = document.getElementById(id + "_name_mod");
		if (name)	{
			data.name = name.value;
		}

		var quantity = document.getElementById(id + "_quantity_mod");
		if (quantity)	{
			data.quantity = Number(quantity.value);
		}

		var price = document.getElementById(id + "_price_mod");
		if (price)	{
			data.price = Number(price.value).toFixed(2);
		}

		var artiste = document.getElementById(id + "_artiste_mod");
		if (artiste)	{
			data.artiste = artiste.value;
		}

		var description = document.getElementById(id + "_description_mod");
		if (description)	{
			data.description = description.value;
		}

		data.id = id;
			
		const options = {
			method: 'POST',
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify(data)
		};
				
		const response = await fetch('/updateArticle', options);
		const json = await response.json();
		
		
		showAllData();
	
		
	}

	async function exportToCSV(requestedFile)	{

		const toSend = { database: requestedFile };

		const options = {
			method: 'POST',
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify(toSend)
		};

		const response = await fetch('/exportToCSV', options);
		const json = await response.json();

		var data = json.file;
		var rows = data.split("\n");

		for (let i = 0; i < rows.length; i++)	{

			rows[i] = rows[i].replace(/{|}|"/g, "");

			var cells = rows[i].split(",");

			for (let j = 0; j < cells.length; j++)	{
				var temp = cells[j].split(":");

				if (temp[0] == "time")	{

					// For the sales database "time": is an array not a string/Number
					if (Array.isArray(eval(temp[1])) )	{

						var tempArray = eval(temp[1]);
						cells[j] = "";

						for (var ele of tempArray)	{
							cells[j] = cells[j] + new Date(Number(ele)) + "/";
						}

					} else	{
						cells[j] = new Date(Number(temp[1]));
					}
					
				} else	{
					cells[j] = temp[1];
				}
				
				

			}

			cells = cells.join(";");
			rows[i] = cells;

		}

		rows.unshift("name;price;quantity;artist;description;add date;id");
		rows = rows.join("\n");
		rows = '\ufeff' + rows;

		showMessage(json.message, json.status);

		if (requestedFile == "sales")	{
			writeToFile(rows, 'ventes.csv');
		} else	{
			writeToFile(rows, 'inventaire.csv');
		}
		
	}

	async function sendCSVtoServer(dom, databaseName)	{

		var files = dom.files;
		var file = files[0];

		// Make sure `file.name` matches our extensions criteria
		if ( /\.csv/i.test(file.name) ) {
			var reader = new FileReader();
	 
			reader.addEventListener("load", async function (e) {
				console.log(this.result);

				const toSend = { database: databaseName, data: this.result};

				const options = {
					method: 'POST',
					headers: {
						"Content-type": "application/json"
					},
					body: JSON.stringify(toSend)
				};
		
				const response = await fetch('/importCSVtoDB', options);
				const json = await response.json();

				showMessage(json.message, json.status);
				showAllData();

			}, false);
		 
			reader.readAsBinaryString(file);
		} else	{
			showMessage("Seulement les fichiers séparés par des virgules (.CSV) sont acceptés", "error");
		}
	}

	function writeToFile(data, filename)	{
		var file = new Blob([data], {type: 'text/plain'});
		if (window.navigator.msSaveOrOpenBlob) // IE10+
		    window.navigator.msSaveOrOpenBlob(file, filename);
		else { // Others
		    var a = document.createElement("a"),
				url = URL.createObjectURL(file);
		    a.href = url;
		    a.download = filename;
		    document.body.appendChild(a);
		    a.click();
		    setTimeout(function() {
			  document.body.removeChild(a);
			  window.URL.revokeObjectURL(url);  
		    }, 0); 
		}
	}
	
	function showMessage(msg, type)	{

		type = type || "success";
		msg = msg || "";
		
		if (type.toLowerCase() == "error" || type.toLowerCase() == "err")	{
			document.getElementById("message").style.borderColor = "red";
			document.getElementById("message").style.backgroundColor = "pink";
			document.getElementById("message").innerHTML = msg;
			showDiv("message");
		} else	{
			document.getElementById("message").innerHTML = msg;
			showDiv("message");	
		}
	}
	
	function toggleDiv(id)	{
		
		var DIV = document.getElementById(id);
		
		if (getComputedStyle(DIV).opacity == "0")	{
			showDiv(id);
		} else	{
			hideDiv(id);
		}
		
	}
	
	function showDiv(id)	{
		
		var ele;
		
		if (typeof id == "string")	{
			ele = document.getElementById(id);
		} else	{
			ele = id;
		}
		
		ele.style.maxHeight = "1000px";
		ele.style.overflow = "auto";
		ele.style.opacity = "1";
		ele.style.padding = "20px";
	}
	
	function hideDiv(id)	{
		
		var ele;
		
		if (typeof id == "string")	{
			ele = document.getElementById(id);
		} else	{
			ele = id;
		}
		
		ele.style.maxHeight = "0px";
		ele.style.opacity = "0";
		ele.style.padding = "0px";
	}
	
	function openTab(tabName) {
		
		var x = document.getElementsByClassName("tab");
		for (var i = 0; i < x.length; i++) {
			hideDiv(x[i]);
		}
		
		var x = document.getElementsByClassName("tab_btn");
		for (var i = 0; i < x.length; i++) {
			x[i].style.borderColor = "lightgray"; 
		}
		
		showDiv(tabName);
		
		document.getElementById(tabName + "_button").style.borderColor = "rgb(19,47,87)";//"rgb(34,139,34)";
		
	}

	function formateDate(date)	{
		
		var tempDate = date;		
		tempDate = tempDate.toString().split(" ");
		tempDate.splice(5);
		tempDate = tempDate.join(" ");
		
		var days = [{en: "Mon", fr: "Lundi"},{en: "Tue", fr: "Mardi"},{en: "Wed", fr: "Mercredi"},{en: "Thu", fr: "Jeudi"},{en: "Fri", fr: "Vendredi"},{en: "Sat", fr: "Samedi"},{en: "Sun", fr: "Dimanche"}];
		
		var months = [{en: "Jan", fr: "janvier"},{en: "Feb", fr: "février"},{en: "Mar", fr: "mars"},{en: "Apr", fr: "avril"},{en: "May", fr: "mai"},{en: "Jun", fr: "juin"},{en: "Jul", fr: "juillet"},{en: "Aug", fr: "août"},{en: "Sep", fr: "septembre"},{en: "Oct", fr: "Octobre"},{en: "Nov", fr: "Novembre"},{en: "Dec", fr: "Décembre"}];
		
		for (var day of days)	{			
			tempDate = tempDate.replace(day.en, day.fr);			
		}
		for (var month of months)	{			
			tempDate = tempDate.replace(' ' + month.en, ' ' + month.fr);			
		}			
		
		return tempDate;
	}
	
	function checkboxChecked(id)	{
		return document.getElementById(id).checked;
	}
	
	window.onload = function()	{
		
		if (window.innerWidth <= 750)	{
			document.getElementById("show_description").checked = false;
			document.getElementById("show_artiste").checked = false;
			showAllData();
		}
		
		// Load database on file open
		showAllData();
		showAllSold();
		
		openTab("all_articles");

		// Allow The SEARCH INPUT to search when Enter is pressed
		document.getElementById("search_input").addEventListener("keypress", function()	{
			if (event.keyCode == 13)	{
				search();
			}
		});
		
	}

	window.onresize = function()	{

		if (window.innerWidth <= 750)	{
			document.getElementById("show_description").checked = false;
			document.getElementById("show_artiste").checked = false;
			showAllData();
		}

	}