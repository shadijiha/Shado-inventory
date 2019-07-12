/***
*
*	Shado inventory main SERVER JavaScript file
*
*/

	const fetch = require("node-fetch");
	const express = require("express");
	const server = express();
	const Datastore = require("nedb");
	const fs = require("fs");
	const {app, BrowserWindow, Menu, autoUpdater, dialog} = require('electron');
	const path = require('path');
	const url = require('url');
	const shell = require('electron').shell;
	
	server.listen(3000, () =>	console.log("Server is listening at 3000"));	
	server.use(express.static(__dirname + '/client'));
	server.use(express.json({limit: '900mb'}));
	
	// Database for inventory
	const database = new Datastore('inventory.db');
	database.loadDatabase();
	
	// Database for sales
	const sales = new Datastore('sales.db');
	sales.loadDatabase();
	
	// Post requests
	server.post('/addArticle', (request, response) =>	{
		
		const data = request.body;
		data.time = Date.now();
		
		database.insert(data);
		
		response.json({
			status: "success",
			message: "L\'article a été ajouté à l\'inventaire",
			time: data.time
		});
		response.end();	
		
	});

	server.post('/deleteArticle', (request, response) =>	{
		
		const data = request.body;
		const id = data.id;
		
		var message = "";
		var stat = "";
		
		// Remove the article from the inventory database
		var qt = 0;
		var allArticleInfo = undefined;
		
		database.find({ _id: id }, function (err, docs) {
			
			if (docs.length < 1)	{
				return;
			}
			
			qt = docs[0].quantity;
			
			allArticleInfo = docs[0];

			// Update if quantity < 0
			if (Number(qt) > 1)	{
				
				var upQT = Number(qt) - 1;
				allArticleInfo.quantity = upQT;
				
				database.update({ _id: id }, { $set: { quantity: upQT } }, { multi: true }, function (err, numReplaced) {
					
					if (err)	{
						message = "Error! " + err;
						stat = "Error";
						response.end();
						return;
					}
					
					stat = "success";
					message = `Nouvelle quantité de l'article ${id}: ${Number(upQT)}`;
					
					/*response.json({
						status: stat,
						message: message
					});*/

					
				});
			
			} else	{
			
				database.remove({ _id: id }, { multi: true }, function (err, numRemoved) {
					if (err)	{
						message = "Error! " + err;
						stat = "Error";
						response.end();
						return;
					}
					
					stat = "success";
					message = `${numRemoved} article(s) a(ont) été supprimé(s) de l'inventaire`;
					
							
					/*response.json({
						status: stat,
						message: message
					});*/

					
				});
			
			}
			
		});
		
		// Refresh inventory database (to delete stuff)
		database.persistence.compactDatafile();
		
		// Add sold items to sales database
		// See if the articles has been already sold
		sales.find({ _id: id }, function (err, docs) {
			
			if (allArticleInfo == undefined)	{
				response.json({
					status: "error",
					message: `L'article (${id}) que vous souhaitez supprimer n'existe pas`
				});
				return;
			}

			// Add articles of it doesn't exist
			if (err || docs.length < 1)	{
				
				allArticleInfo.quantity = 1;
				allArticleInfo.time = [];
				allArticleInfo.time.push(Date.now());
				sales.insert(allArticleInfo);				
				
			} else	{
				
				var upQT = Number(docs[0].quantity) + 1;
				
				sales.update({ _id: id }, { $set: { quantity: upQT }, $push: {time: Date.now()} }, { multi: true }, function (err, numReplaced) {
					
					if (err)	{
						message = "Error! " + err;
						stat = "Error";
						response.end();
						return;
					}
					
					stat = "success";
					message = `L'article ${allArticleInfo.name} (${allArticleInfo._id}) a été ajouté aux ventes. Il reste ${allArticleInfo.quantity} dans l'inventaire`;
					
					response.json({
						status: stat,
						message: message
					});
					//response.end();
					
				});							
				
			}
			
		});
		
		sales.persistence.compactDatafile();
		
	});

	server.post('/searchArticle', (request, response) =>	{
		
		const data = request.body;
		var keywords = data.keywords;

		var message = "";
		var stat = "";
		
		var results;
		
		// Refresh database (to delete stuff)
		//database.persistence.compactDatafile();
		
		// Take out spaces and replace with pipes
        keywords = keywords.split(' ').join('|');

        // Use searchString to build rest of regex
        // -> Note: 'i' for case insensitive
        var regex = new RegExp(keywords, 'i');

        // Build query, using regex for each searchable field
        var query = {
            $or: [
                {
                    "_id": {
                        "$regex": regex,
                    },
                },

                {
                    "name": {
                        "$regex": regex,
                    },
                },

                {
                    "price": {
                        "$regex": regex,
                    },
                },

                {
                    "quantity": {
                        "$regex": regex,
                    },
                },
				
				{
                    "artiste": {
                        "$regex": regex,
                    },
                },
				
				{
                    "description": {
                        "$regex": regex,
                    },
                },
            ]
        };
		
		// find the article quantity
		database.find(query, function (err, docs) {

			if (err)	{
				message = "Error! " + err;
				stat = "Error";	

				response.json({
					status: stat,
					message: message,
					results: []
				});
				
				response.end();	
				
			} else	{			
				results = docs;
				message = docs.length + " resultats";
				stat = "success";
				
						
				response.json({
					status: stat,
					message: message,
					results: results
				});
				
				response.end();	
			}
			
		});		
	});
	
	server.post('/updateArticle', (request, response) =>	{
		
		const data = request.body;

		const up = {$set: {}};

		if (data.name)	{
			up["$set"].name = data.name;
		}

		if (data.quantity)	{
			up["$set"].quantity = data.quantity;
		}

		if (data.price)	{
			up["$set"].price = data.price;
		}

		if (data.artiste)	{
			up["$set"].artiste = data.artiste;
		}

		if (data.description)	{
			up["$set"].description = data.description;
		}
		
		database.update( { _id: data.id }, up, { multi: false }, function (err, numReplaced) {

			if (err)	{
				message = "Error! " + err;
				stat = "Error";	

				response.json({
					status: stat,
					message: message
				});
				
				response.end();	
				
			} else	{			
			
				message = "L\'article a été modifé avec succès";
				stat = "success";				
						
				response.json({
					status: stat,
					message: message
				});
				
				response.end();	
			}

		});
		
	});
	
	server.post('/exportToCSV', (request, response) =>	{

		const filename = request.body.database;

		fs.readFile('./' + filename + '.db', 'utf8', function(err, contents) {

			if (err)	{
				response.json({
					status: "error",
					message: "Error!" + err,
					file: ""
				});
				response.end();
				return;
			}
			
			const data = {
				status: "seccuss",
				message: "Le fichier a été exporté avec succès",
				file: contents
			}

			response.json(data);
			response.end();
			
		});

	});

	server.post('/importCSVtoDB', (request, response) =>	{

		const received = request.body;

		var table = received.data;
		var rows = table.split("\n");
		var message = "";

		for (let i = 0; i < rows.length; i++)	{

			var obj = {};
			var cells = rows[i].split(/\,|\;/);
			obj.name = cells[0];
			obj.price = cells[1];
			obj.quantity = cells[2];
			obj.artiste = cells[3];
			obj.description = cells[4] || "";

			if (received.database == "inventory")	{
				if (cells.length <= 5)	{
					obj.time = Date.now();
				} else	{
					obj.time = cells[5];
				}
			} else if (received.database == "sales")	{

				if (cells[5] != undefined && cells[5] != null)	{
					var allDates = cells[5].split("/");
					obj.time = allDates;
				}			
				
			}

			if (received.database == "sales")	{

				// If no ID don't enter the product to database
				if (cells[6] != undefined && cells[6] != null)	{
					obj.id = cells[6];
				} else	{
					message += `Erreur! L\'élement ${i + 1} n\'a pas d'ID. Il faut spécifier un ID pour entrer un produit dans la base de données des VENTES.\n\n`;
					status = "error";
					continue;						
				}		
				
			}

			// Look for invalid inputs
			if (!obj.name || !obj.price)	{
				message += `L\'element ${i + 1} n\'a pas été rentré dans l\'inventaire car le nom ou le prix est(sont) indéfini(s) (Nom: ${obj.name}, prix: ${obj.price}).\n\n`;
			} else	{

				// Insert data to proper database
				if (received.database == "inventory")	{
					database.insert(obj);	
				} /*else if (received.database == "sales")	{

					// Search for existing products
					sales.find({ _id: obj.id }, function (err, docs) {
			
						if (obj == undefined)	{
							response.json({
								status: "error",
								message: `L'article (${id}) que vous souhaitez ajouter n'existe pas`
							});
							return;
						}
			
						// Add articles of it doesn't exist
						if (err || docs.length < 1)	{							
							sales.insert(obj);							
						} else	{
							
							var upQT = Number(docs[0].quantity) + Number(obj.quantity);
							
							sales.update({ _id: obj.id }, { $set: { quantity: upQT }, $push: { time: { $each: obj.time } } }, { multi: true }, function (err, numReplaced) {
								
								if (err)	{
									message += `Error! à l\'article ${i + 1} ` + err;
									stat = "Error";
									continue;
								}
								
								stat = "success";
								message = `L'article ${obj.name} (${obj._id}) a été ajouté aux ventes. Il reste ${obj.quantity} dans l'inventaire`;
								
								response.json({
									status: stat,
									message: message
								});
								//response.end();
								
							});							
							
						}
						
					});
				}*/
				
			}
		}

		// Refresh database
		database.persistence.compactDatafile();

		response.json({
			message: message,
			status: "success"
		});
		response.end();		

	});
	
	// Get requests
	server.get('/getAllArticles', (request, response) =>	{

		database.find({}, (err, data)	=>	{
			
			if (err)	{
				response.json({ status: "error", message: "Error @ fetch get '/getDatabase'" + err });
				response.end();	
				return;
			}
			response.json(data);
		});			
	});
	
	server.get('/getSoldArticles', (request, response) =>	{

		sales.find({}, (err, data)	=>	{
			
			if (err)	{
				response.json({ status: "error", message: "Error @ fetch get '/getDatabase'" + err });
				response.end();	
				return;
			}
			response.json(data);
		});
		
	});

	// Set up the window
	let win;

	function createWindow()	{

		win = new BrowserWindow({width: 1000, height: 800, frame: true});

		/*win.loadURL(url.format({
			pathname: "http://localhost:3000",
			protocol: 'file:',
			slashes: true
		}));*/

		win.loadURL("http://localhost:3000/");

		//win.webContents.openDevTools();

		win.on('closed', () =>	{
			win = null;
		});

		var menu = Menu.buildFromTemplate([
			{
				label: 'Fichier',
				submenu: [
					{
						label: "Rafraîchir le programme",
						click()	{
							win.reload();
						}
					},
					{
						label: "Ouvrir dans le navigateur",
						click()	{
							shell.openExternal('http://localhost:3000/');
						}
					},
					{type: "separator"},
					{
						label: 'Quitter',
						click()	{
							app.quit();
						}
					}
				]
			},
			{
				label: 'Aide',
				submenu: [
					{
						label: 'Open developper tool',
						enabled: false,
						click()	{
							win.webContents.openDevTools()
						}
					},
					{type: "separator"},
					{label: 'À propos', enabled: false}
				]
			}
		]);

		Menu.setApplicationMenu(menu);

	}

	app.on('ready', createWindow);
	app.on('window-all-closed', () =>{
		if (process.platform !== 'darwin')	{
			app.quit();
		}
	});
	app.on('activate', () =>	{
		if (win === null)	{
			createWindow();
		}
	});
	app.on('certificate-error', function(event, webContents, url, error, certificate, callback) {
		event.preventDefault();
		callback(true);
	});
	
