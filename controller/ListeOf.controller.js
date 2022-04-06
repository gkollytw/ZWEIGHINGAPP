sap.ui.define(["sap/ui/core/mvc/Controller",
		"sap/m/MessageBox",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"./utilities",
		"sap/ui/core/routing/History",
		"com/ms/pp/Weighing/model/formatter",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageToast",
		"com/ms/pp/Weighing/model/unitHelper"
	], function (BaseController, MessageBox, Filter, FilterOperator, Utilities, History, formatter, JSONModel, MessageToast, unitHelper) {
		"use strict";

		return BaseController.extend("com.ms.pp.Weighing.controller.ListeOf", {
			formatter: formatter,
			unitHelper: unitHelper,
			orderHeaderModel: null,

			handleRouteMatched: function (oEvent) {
				//var sAppId = "App5d00e5cdc911d401164bdf7e";
				sap.ui.core.BusyIndicator.show(0);
				this.loadOrderData();
			},

			loadOrderData: function () {
				var that = this;
				var oModel = this.getOwnerComponent().getModel();
				var oComponent = this.getOwnerComponent();
				oComponent.mCurrentDestinationBin = ""; //Reinit Destination Bin.
				oComponent.materialStocks = [];

				this.getView().setModel(oComponent.getModel("orderHeaderModel"), "orderHeaderModel");
				this.getView().setModel(oComponent.getModel("orderComponentModel"), "orderComponentModel");
				this.getView().attachAfterRendering(null, this.afterRendering, null);

				//oComponent.appStartupParameter = "CH21";

				var filterArray = new Array();
				filterArray.push(new Filter("AppParameter", FilterOperator.EQ, oComponent.appStartupParameter));
				//filterArray.push(new Filter("OrderComponentSet/AppParameter", FilterOperator.EQ, oComponent.appStartupParameter));
				var aFilter = new Filter({
					filters: filterArray,
					and: false
				});
				oModel.read("/PictogramIconSet", {
					success: function (dataPictograms) {
						oComponent.mPictogramArray = dataPictograms.results;
						oModel.read("/OrderHeaderSet", {
							filters: aFilter.aFilters,
							urlParameters: {
								"$expand": "OrderComponentSet"
							},
							success: function (data) {
								var orderHeaderModel = oComponent.getModel("orderHeaderModel");
								var orderComponentModel = oComponent.getModel("orderComponentModel");
								var materialNumberArray = new Array();
								var filterArray = new Array();
								for (var orderIndex in data.results) {
									var order = data.results[orderIndex];
									for (var componentIndex in order.OrderComponentSet.results) {
										var orderComponent = order.OrderComponentSet.results[componentIndex];
										if (materialNumberArray.indexOf(orderComponent.MaterialNumber) === -1) {
											materialNumberArray.push(orderComponent.MaterialNumber);
											filterArray.push(new Filter("MaterialNumber", FilterOperator.EQ, orderComponent.MaterialNumber));
										}
									}
								}
								var aFilter = new Filter({
									filters: filterArray,
									and: true
								});

								oModel.read("/MaterialStockSet", {
									filters: aFilter.aFilters,
									success: function (oData) {
										var physicalStock = [];
										var qualityStock = [];
										var quantityMaterial;
										orderHeaderModel.setProperty("/Component", oData.results);
										//oComponent.mStock = oData.results;
										for (var stockIndexInit in oData.results) {
											var stockInit = oData.results[stockIndexInit];
											stockInit.AvailableQuantity = Number(stockInit.AvailableQuantity);
											stockInit.PhysicalQuantity = Number(stockInit.PhysicalQuantity);
											stockInit.QualityQuantity = Number(stockInit.QualityQuantity);
											stockInit.AvailableQuantityInit = stockInit.AvailableQuantity;
											stockInit.PhysicalQuantityInit = stockInit.PhysicalQuantity;
											stockInit.QualityQuantityInit = stockInit.QualityQuantity;
											if (stockInit.AvailableQuantity > 0) {
												quantityMaterial = unitHelper.convertUnit(stockInit.UOM, "KG", stockInit.AvailableQuantity);
												if (!oComponent.materialStocks[stockInit.MaterialNumber]) {
													oComponent.materialStocks[stockInit.MaterialNumber] = quantityMaterial;
												} else {
													oComponent.materialStocks[stockInit.MaterialNumber] = Number(oComponent.materialStocks[stockInit.MaterialNumber]) +
														quantityMaterial;
												}
											}
											if (stockInit.PhysicalQuantity > 0) {
												quantityMaterial = unitHelper.convertUnit(stockInit.UOM, "KG", stockInit.PhysicalQuantity);
												if (!physicalStock[stockInit.MaterialNumber]) {
													physicalStock[stockInit.MaterialNumber] = quantityMaterial;
												} else {
													physicalStock[stockInit.MaterialNumber] = Number(physicalStock[stockInit.MaterialNumber]) + quantityMaterial;
												}
											}
											if (stockInit.QualityQuantity > 0) {
												quantityMaterial = unitHelper.convertUnit(stockInit.UOM, "KG", stockInit.QualityQuantity);
												if (!qualityStock[stockInit.MaterialNumber]) {
													qualityStock[stockInit.MaterialNumber] = quantityMaterial;
												} else {
													qualityStock[stockInit.MaterialNumber] = Number(qualityStock[stockInit.MaterialNumber]) + quantityMaterial;
												}
											}
										}
										for (var orderModelIndex in data.results) {
											//var orderModel = oModel.getProperty("/OrderHeaderSet('" + data.results[orderModelIndex].OrderNumber + "')");
											var orderModel = data.results[orderModelIndex];
											var components = 0;
											var availableStockComponents = 0;
											var physicalStockComponents = 0;
											var qualityStockComponents = 0;
											var alreadyPickedComponents = 0;
											orderModel.OrderQuantity = Number(orderModel.OrderQuantity);

											for (stockIndexInit in oData.results) {
												stockInit = oData.results[stockIndexInit];
												stockInit.AvailableQuantityTemp = stockInit.AvailableQuantityInit;
												stockInit.PhysicalQuantityTemp = stockInit.PhysicalQuantityInit;
												stockInit.QualityQuantityTemp = stockInit.QualityQuantityInit;
											}

											//for (var componentPathIndex in orderModel.OrderComponentSet.__list) {
											for (var componentPathIndex in orderModel.OrderComponentSet.results) {

												components++;

												//orderComponentModel = oModel.getProperty("/" + orderModel.OrderComponentSet.__list[componentPathIndex]);
												var orderComponentObject = orderModel.OrderComponentSet.results[componentPathIndex];

												orderComponentObject.QuantityRequired = Number(orderComponentObject.QuantityRequired);
												orderComponentObject.QuantityAlreadyPicked = Number(orderComponentObject.QuantityAlreadyPicked);
												orderComponentObject.QuantityAvailable = 0;
												orderComponentObject.QuantityPhysical = 0;
												orderComponentObject.QuantityQuality = 0;
												orderComponentObject.QuantityToWeight = (orderComponentObject.IsWeighted) ? 0 : orderComponentObject.QuantityRequired -
													orderComponentObject.QuantityAlreadyPicked;

												//remove negative quantity (should not happen)
												orderComponentObject.QuantityToWeight = (orderComponentObject.QuantityToWeight < 0) ? 0 : orderComponentObject.QuantityToWeight;

												if (orderComponentObject.IsWeighted) {
													/*orderHeaderModel.setProperty("/OrderHeader/" + orderModelIndex + "/OrderComponentSet/results/" + componentPathIndex +
														"/progressionStatus", "Success");*/
													orderComponentObject.progressionStatusNoOF = "Success";
													orderComponentObject.progressionStatus = "Success";
													alreadyPickedComponents++;
													continue;
												}

												orderComponentObject.PictogramsArray = [];
												//Translate pictogram characteristics in icon
												if (orderComponentObject.PictogramsList) {
													var pictoCharArray = orderComponentObject.PictogramsList.split(" ");
													for (var iPictoChar = 0; iPictoChar < pictoCharArray.length; iPictoChar++) {
														var pictoChar = pictoCharArray[iPictoChar];
														for (var iPictoIcon = 0; iPictoIcon < oComponent.mPictogramArray.length; iPictoIcon++) {
															if (oComponent.mPictogramArray[iPictoIcon].Characteristic == pictoChar) {
																var icon = oComponent.mPictogramArray[iPictoIcon].Icon;
																icon = icon.replace(/ /g, "_").replace("é", "e").replace("è", "e").replace(/-/g, "_").replace(/'/g, "_");
																orderComponentObject.PictogramsArray.push(icon);
																break;
															}
														}
													}
												}

												//Available Stock
												if (orderComponentObject.QuantityAlreadyPicked >= orderComponentObject.QuantityRequired) {
													orderComponentObject.QuantityAvailable = orderComponentObject.QuantityRequired;
												} else {
													for (var stockIndex in oData.results) {
														var stock = oData.results[stockIndex];
														if (stock.MaterialNumber === orderComponentObject.MaterialNumber) {
															var quantityRequired = orderComponentObject.QuantityRequired - orderComponentObject.QuantityAvailable -
																orderComponentObject.QuantityAlreadyPicked;
															if (stock.AvailableQuantity > 0 && quantityRequired > 0) {
																var quantityStock = unitHelper.convertUnit(stock.UOM, orderComponentObject.UOM, stock.AvailableQuantity);
																var quantityToUse = (quantityStock > quantityRequired) ? quantityRequired : quantityStock;

																orderComponentObject.QuantityAvailable += quantityToUse;

																quantityStock = unitHelper.convertUnit(orderComponentObject.UOM, stock.UOM, quantityToUse);
																stock.AvailableQuantity -= quantityStock;
																if (orderComponentObject.QuantityAvailable >= quantityRequired) {
																	break;
																}
															}
														}
													}
												}

												if (!(oComponent.materialStocks[orderComponentObject.MaterialNumber]))
													oComponent.materialStocks[orderComponentObject.MaterialNumber] = 0;
												orderComponentObject.QuantityAvailableNoOF = unitHelper.convertUnit("KG", orderComponentObject.UOM, oComponent.materialStocks[
													orderComponentObject.MaterialNumber]);
												/*orderComponentObject.QuantityAvailableNoOF = orderComponentObject.QuantityAvailable;
												if (orderComponentObject.QuantityAvailable < orderComponentObject.QuantityRequired) {
													orderComponentObject.QuantityAvailableNoOF = 0;
													for (stockIndex in oData.results) {
														stock = oData.results[stockIndex];
														if (stock.MaterialNumber === orderComponentObject.MaterialNumber) {
															quantityRequired = orderComponentObject.QuantityRequired - orderComponentObject.QuantityAvailableNoOF -
																orderComponentObject.QuantityAlreadyPicked;
															if (stock.AvailableQuantityTemp > 0 && quantityRequired > 0) {
																quantityStock = unitHelper.convertUnit(stock.UOM, orderComponentObject.UOM, stock.AvailableQuantityTemp);
																quantityToUse = (quantityStock > quantityRequired) ? quantityRequired : quantityStock;

																orderComponentObject.QuantityAvailableNoOF += quantityToUse;

																quantityStock = unitHelper.convertUnit(orderComponentObject.UOM, stock.UOM, quantityToUse);
																stock.AvailableQuantityTemp -= quantityStock;
																if (orderComponentObject.QuantityAvailableNoOF >= quantityRequired) {
																	break;
																}
															}
														}
													}
												}*/

												//Physical Stock
												if (!(physicalStock[orderComponentObject.MaterialNumber]))
													physicalStock[orderComponentObject.MaterialNumber] = 0;
												orderComponentObject.QuantityPhysical = unitHelper.convertUnit("KG", orderComponentObject.UOM, physicalStock[
													orderComponentObject.MaterialNumber]);
												/*if (orderComponentObject.QuantityAvailable < (orderComponentObject.QuantityRequired - orderComponentObject.QuantityAvailable -
														orderComponentObject.QuantityAlreadyPicked)) {
													for (stockIndex in oData.results) {
														stock = oData.results[stockIndex];
														if (stock.MaterialNumber === orderComponentObject.MaterialNumber) {
															quantityRequired = orderComponentObject.QuantityRequired - orderComponentObject.QuantityAvailable -
																orderComponentObject.QuantityPhysical - orderComponentObject.QuantityAlreadyPicked;
															if (stock.PhysicalQuantity > 0 && quantityRequired > 0) {
																quantityToUse = (stock.PhysicalQuantity > quantityRequired) ? quantityRequired : stock.PhysicalQuantity;

																orderComponentObject.QuantityPhysical += quantityToUse;
																stock.PhysicalQuantity -= quantityToUse;
															}
														}
													}
												}*/
												//Quality Stock
												if (!(qualityStock[orderComponentObject.MaterialNumber]))
													qualityStock[orderComponentObject.MaterialNumber] = 0;
												orderComponentObject.QuantityQuality = unitHelper.convertUnit("KG", orderComponentObject.UOM, qualityStock[
													orderComponentObject.MaterialNumber]);
												/*if (orderComponentObject.QuantityAvailable < (orderComponentObject.QuantityRequired - orderComponentObject.QuantityAvailable -
														orderComponentObject.QuantityAlreadyPicked - orderComponentObject.QuantityQuality)) {
													for (stockIndex in oData.results) {
														stock = oData.results[stockIndex];
														if (stock.MaterialNumber === orderComponentObject.MaterialNumber) {
															quantityRequired = orderComponentObject.QuantityRequired - orderComponentObject.QuantityAvailable -
																orderComponentObject.QuantityPhysical - orderComponentObject.QuantityQuality - orderComponentObject.QuantityAlreadyPicked;
															if (stock.QualityQuantity > 0 && quantityRequired > 0) {
																quantityToUse = (stock.QualityQuantity > quantityRequired) ? quantityRequired : stock.QualityQuantity;

																orderComponentObject.QuantityQuality += quantityToUse;
																stock.QualityQuantity -= quantityToUse;
															}
														}
													}
												}*/
												if (orderComponentObject.QuantityAlreadyPicked > 0) {
													if (orderComponentObject.QuantityAvailable + orderComponentObject.QuantityAlreadyPicked >= orderComponentObject.QuantityRequired) {
														orderComponentObject.progressionStatus = "InProcess";
														availableStockComponents++;
													} else {
														orderComponentObject.progressionStatus = "Error";
													}
												} else if (orderComponentObject.QuantityAvailable >= orderComponentObject.QuantityRequired) {
													orderComponentObject.progressionStatus = "None";
													availableStockComponents++;
												} else {
													orderComponentObject.progressionStatus = "Error";

													if (orderComponentObject.QuantityAvailable + orderComponentObject.QuantityPhysical + orderComponentObject.QuantityAlreadyPicked >=
														orderComponentObject.QuantityRequired)
														physicalStockComponents++;
													else if (orderComponentObject.QuantityAvailable + orderComponentObject.QuantityPhysical + orderComponentObject.QuantityQuality +
														orderComponentObject.QuantityAlreadyPicked >= orderComponentObject.QuantityRequired)
														qualityStockComponents++;

												}
												/*if (orderComponentModel.QuantityAlreadyPicked >= orderComponentModel.QuantityRequired) {
													orderComponentModel.progressionStatusNoOF = "Success";
												} else */
												if (orderComponentObject.QuantityAlreadyPicked > 0) {
													if (orderComponentObject.QuantityAvailableNoOF + orderComponentObject.QuantityAlreadyPicked >=
														orderComponentObject.QuantityRequired) {
														orderComponentObject.progressionStatusNoOF = "InProcess";
													} else {
														orderComponentObject.progressionStatusNoOF = "Error";
													}
												} else if (orderComponentObject.QuantityAvailableNoOF >= orderComponentObject.QuantityRequired) {
													orderComponentObject.progressionStatusNoOF = "None";
												} else {
													orderComponentObject.progressionStatusNoOF = "Error";
												}

											}
											orderModel.AlreadyPickedComponents = Math.round(alreadyPickedComponents / components * 100);
											orderModel.AvailableStock = Math.round(availableStockComponents / (components - alreadyPickedComponents) * 100);
											orderModel.PhysicalStock = Math.round(physicalStockComponents / (components - alreadyPickedComponents) * 100);
											orderModel.QualityStock = Math.round(qualityStockComponents / (components - alreadyPickedComponents) * 100);

											if (orderModel.AlreadyPickedComponents > 0) {
												if (orderModel.AvailableStock >= 100)
													orderModel.progressionStatus = "InProcess";
												else
													orderModel.progressionStatus = "Error";
											} else if (orderModel.AvailableStock >= 100) {
												orderModel.progressionStatus = "None";
											} else {
												orderModel.progressionStatus = "Error";
											}
										}

										orderHeaderModel.setProperty("/OrderHeader", data.results);
										orderComponentModel.setProperty("/OrderHeader", data.results);

										var list = orderHeaderModel.getProperty("/OrderHeader");
										var listItems = that.byId("iconTabBar").getAggregation("_header").getItems();
										var count = 0;
										listItems[0].setCount(list.length);
										var result = list.filter(function (element) {
											return (element.AvailableStock >= 100 && element.AlreadyPickedComponents > 0);
										});
										count = result.length;
										listItems[1].setCount(count);
										result = list.filter(function (element) {
											return (element.AvailableStock >= 100);
										});
										count = result.length;
										listItems[2].setCount(count);
										result = list.filter(function (element) {
											return (element.AvailableStock < 100);
										});
										count = result.length;
										listItems[3].setCount(count);

										sap.ui.core.BusyIndicator.hide();
									}
								});
							}

						});
					}
				});

			},

			applyFilters: function (sKey) {
				// Array to combine filters
				var aFilters = [],
					oAvailableStockFilter,
					oAlreadyPickedComponentsFilter;

				if (sKey === "PeseeIncomplete") {
					oAvailableStockFilter = new Filter("AvailableStock", FilterOperator.GE, 100);
					oAlreadyPickedComponentsFilter = new Filter("AlreadyPickedComponents", "GT", 0);
					aFilters.push(new Filter([oAvailableStockFilter, oAlreadyPickedComponentsFilter], true));
				} else if (sKey === "DispoComplete") {
					oAvailableStockFilter = new Filter("AvailableStock", "GE", 100);
					aFilters.push(new Filter([oAvailableStockFilter], false));
				} else if (sKey === "DispoIncomplete") {
					oAvailableStockFilter = new Filter("AvailableStock", FilterOperator.LT, 50);
					aFilters.push(new Filter([oAvailableStockFilter], false));
				}
				return aFilters;
			},
			handleIconTabBarSelect: function (oEvent) {
				var oBinding = this.byId("table").getBinding("items"),
					sKey = oEvent.getParameter("key");
				var aFilters = this.applyFilters(sKey);
				oBinding.filter(aFilters);
			},

			_onRowPress: function (oEvent) {

				var oBindingContext = oEvent.getSource().getBindingContext();

				return new Promise(function (fnResolve) {

					this.doNavigate("ListeComposants", oBindingContext, fnResolve, "");
				}.bind(this)).catch(function (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});

			},
			doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
				var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
				var oModel = (oBindingContext) ? oBindingContext.getModel("orderHeaderModel") : null;
				var sContext = "";

				var sEntityNameSet;
				if (sPath !== null && sPath !== "") {
					if (sPath.substring(0, 1) === "/") {
						sContext = sPath.split("/")[2];
					}
					sEntityNameSet = sPath.split("/")[1];
				}
				var sNavigationPropertyName;
				var sMasterContext = this.sMasterContext ? this.sMasterContext : sContext;

				if (sEntityNameSet !== null) {
					sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
						sRouteName);
				}
				if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
					if (sNavigationPropertyName === "") {
						this.oRouter.navTo(sRouteName, {
							context: sContext,
							masterContext: sMasterContext
						}, false);
					} else {
						oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function (bindingContext) {
							if (bindingContext) {
								sPath = bindingContext.getPath();
								if (sPath.substring(0, 1) === "/") {
									sPath = sPath.substring(1);
								}
							} else {
								sPath = "undefined";
							}

							// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
							if (sPath === "undefined") {
								this.oRouter.navTo(sRouteName);
							} else {
								this.oRouter.navTo(sRouteName, {
									context: sPath,
									masterContext: sMasterContext
								}, false);
							}
						}.bind(this));
					}
				} else {
					this.oRouter.navTo(sRouteName);
				}

				if (typeof fnPromiseResolve === "function") {
					fnPromiseResolve();
				}

			},
			_onRowPress1: function (oEvent) {

				var oBindingContext = oEvent.getSource().getBindingContext();

				return new Promise(function (fnResolve) {

					this.doNavigate("ListeComposants", oBindingContext, fnResolve, "");
				}.bind(this)).catch(function (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});

			},
			_onRowPress2: function (oEvent) {

				var oBindingContext = oEvent.getSource().getBindingContext();

				return new Promise(function (fnResolve) {

					this.doNavigate("ListeComposants", oBindingContext, fnResolve, "");
				}.bind(this)).catch(function (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});

			},
			_onRowPress3: function (oEvent) {

				var oBindingContext = oEvent.getSource().getBindingContext("orderHeaderModel");

				/*MessageToast.show("Pesée enregistrée", {
					duration: 20000,
					closeOnBrowserNavigation: false,
					width: "15em",
					offset: "0 -100",
					at: "center bottom"
				});*/
				this.doNavigate("ListeComposants", oBindingContext, "", "");

			},
			onInit: function () {
				this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				//var that = this;
				this.oRouter.getTarget("ListeOf").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			},
			afterRendering: function (oEvent) {
				$(".sapTntToolHeader").css("height", "6rem");
				//document.getElementsByClassName("sapTntToolHeader")[0].style.height = "6rem";
			},
			onExit: function () {

				// to destroy templates for bound aggregations when templateShareable is true on exit to prevent duplicateId issue
				var aControls = [{
					"controlId": "sap_Worklist_Page_0-content-sap_m_IconTabBar-1-items-sap_m_IconTabFilter-1-content-build_simple_Table-1",
					"groups": ["items"]
				}];
				for (var i = 0; i < aControls.length; i++) {
					var oControl = this.getView().byId(aControls[i].controlId);
					if (oControl) {
						for (var j = 0; j < aControls[i].groups.length; j++) {
							var sAggregationName = aControls[i].groups[j];
							var oBindingInfo = oControl.getBindingInfo(sAggregationName);
							if (oBindingInfo) {
								var oTemplate = oBindingInfo.template;
								oTemplate.destroy();
							}
						}
					}
				}

			}
		});
	},
	/* bExport= */
	true);