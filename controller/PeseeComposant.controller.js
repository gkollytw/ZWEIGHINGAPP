sap.ui.define(["sap/ui/core/mvc/Controller",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"./utilities",
		"sap/ui/core/routing/History",
		"com/ms/pp/Weighing/model/formatter",
		"com/ms/pp/Weighing/model/unitHelper"
	], function (BaseController, MessageToast, MessageBox, Filter, FilterOperator, Utilities, History, formatter, unitHelper) {
		"use strict";

		return BaseController.extend("com.ms.pp.Weighing.controller.PeseeComposant", {
			formatter: formatter,
			handleRouteMatched: function (oEvent) {
				//var sAppId = "App5d00e5cdc911d401164bdf7e";

				var sOrderContextIndex = "";
				var sComponentContextIndex = "";
				if (oEvent.getParameter("data").context) {
					var sContext = oEvent.getParameters().data.context;
					sOrderContextIndex = sContext.split("|")[0];
					sComponentContextIndex = sContext.split("|")[1];
				} else {
					return;
				}
				var sOrderContext = "/OrderHeader/" + sOrderContextIndex;
				var sComponentContext = sOrderContext + "/OrderComponentSet/results/" + sComponentContextIndex;
				this.getView().bindElement({
					path: sOrderContext,
					model: "orderHeaderModel"
				});
				this.getView().bindElement({
					path: sComponentContext,
					model: "orderComponentModel"
				});

				var scaleName = this.byId("idScale");
				if (scaleName !== null)
					scaleName.setValue("");
				var weight = this.byId("idWeight");
				if (weight !== null)
					weight.setValue("");

			},
			_onInterromprePeseePress: function (oEvent) {

				var oBindingContext = this.getView().getBindingContext("orderComponentModel");

				return new Promise(function (fnResolve) {

					this.doNavigate("ArretPeseeComposant", oBindingContext, fnResolve, "");
				}.bind(this)).catch(function (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});

			},
			_refreshWeight: function (oEvent) {
				var that = this;
				var scale = this.byId("idScale").getValue();

				var component = this.getOwnerComponent();

				var oModel = component.getModel();

				var aFilter = new Filter({
					filters: [
						new Filter("Action", FilterOperator.EQ, "GET_WEIGHT_FROM_SCALE"),
						new Filter("Param1", FilterOperator.EQ, scale)
					],
					and: true
				});

				//sap.ui.core.BusyIndicator.show();
				this.byId("busy").setVisible(true);
				oModel.read("/ExecuteProcessSet", {
					filters: aFilter.aFilters,
					success: function (oData) {
						that.byId("idWeight").setValue(Math.round(oData.results[0].ParamNum1 * 1000) / 1000);
						that.byId("idUnit").setValue(oData.results[0].Param1);
						that.byId("busy").setVisible(false);
						//sap.ui.core.BusyIndicator.hide();
					},
					error: function (err) {
						that.byId("busy").setVisible(false);
						MessageBox.show(err);
						//sap.ui.core.BusyIndicator.hide();
					}
				});

				/*var component = this.getOwnerComponent();

				var oModel = component.getModel();

				var aFilter = new Filter({
					filters: [
						new Filter("Action", FilterOperator.EQ, "GET_WEIGHT_FROM_SCALE"),
						new Filter("Param1", FilterOperator.EQ, scale)
					],
					and: true
				});

				oModel.read("/ExecuteProcessSet", {
					filters: aFilter.aFilters,
					success: function (oData) {
						that.byId("idWeight").setValue(Math.round(oData.results[0].ParamNum1 * 1000) / 1000);
						that.byId("idUnit").setValue(oData.results[0].Param1);
					}
				});*/

			},
			doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
				var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
				var oModel = (oBindingContext) ? oBindingContext.getModel("orderHeaderModel") : null;
				var sContext = "";

				var sEntityNameSet = null;
				if (sPath !== null && sPath !== "") {
					if (sPath.substring(0, 1) === "/") {
						sContext = sPath.split("/")[2] + "|" + sPath.split("/")[5];
						//sPath = sPath.substring(1);
					}
					sEntityNameSet = sPath.split("/")[3];
				}
				var sNavigationPropertyName = null;
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
			validateWeighing: function () {
				var continueWeighing = false;
				var scale = this.byId("idScale").getValue();
				if (!scale) {
					MessageBox.show("Veuillez saisir une balance.", {
						icon: MessageBox.Icon.ERROR,
						title: "Pesée incorrecte",
						actions: [MessageBox.Action.OK]
					});
					return;
				}

				var that = this;
				var oBindingContext = this.getView().getBindingContext("orderComponentModel");

				var component = this.getOwnerComponent();
				var oModel = component.getModel();

				var currentComponent = component.getCurrentComponent();
				var contextPath = this.getView().getBindingContext("orderComponentModel").getPath();
				var oComponentModel = this.getOwnerComponent().getModel("orderComponentModel");

				var quantity = this.byId("idWeight").getValue();
				quantity = Number(quantity.replace(",", "."));

				var huId = component.mCurrentPickingHu;
				var sourceHuId = component.mCurrentComponentBatch;
				var uom = this.byId("idUnit").getValue();
				if (!uom)
					uom = "G";
				var orderNumber = currentComponent.OrderNumber;
				//var operationNumber = component.mCurrentOrder.OrderNumber;
				var operationNumber = currentComponent.OperationNumber;
				var internalItemNumber = currentComponent.InternalItemNumber;
				var matnr = currentComponent.MaterialNumber;
				var quantityAlreadyPicked = currentComponent.QuantityAlreadyPicked;
				//var destinationLocation = component.mCurrentCage;

				var username = component.mCurrentUser;

				var toleranceLow = currentComponent.ToleranceLow;
				var toleranceHigh = currentComponent.ToleranceHigh;

				var deleteStock = false;

				var createHuProcess = "PICK_CREATE_HU";
				if (currentComponent.StockControlIndicator.startsWith(component.fridgeIndicator)) {
					createHuProcess = "PICK_CREATE_HU_FRIDGE";
				}

				var quantityInComponentUOM = unitHelper.convertUnit(uom, currentComponent.UOM, quantity);

				//Is a round is needed ?
				//quantityInComponentUOM = Number.parseFloat(quantityInComponentUOM).toFixed(3);

				var isWeighted = ((quantityInComponentUOM >= toleranceLow) && (quantityInComponentUOM < toleranceHigh)) ? 'X' : '';
				var actionList = null;
				//if (isWeighted) {
				//	actionList = ["Annuler", "Oui", "Non", "Destruction Composant"];
				//} else {
				actionList = ["Annuler", "Oui", "Non", "Destruction Composant", "Continuer Pesée"];
				//}

				if (quantityInComponentUOM === 0) {
					that.showErrorMessage("Pesée incorrecte", "Poids vide, veuillez actualiser le poids.");
					return;
				}

				if (quantityInComponentUOM > toleranceHigh) {
					that.showErrorMessage("Pesée incorrecte", "Le poids est trop grand, retirez du composant du bac de prélèvement.");
					return;
				}

				if (quantityInComponentUOM > currentComponent.HUQuantity) {
					that.showErrorMessage("Pesée incorrecte", "Le poids est plus grand que le poids disponible dans l'UM du composant.");
					return;
				}

				MessageBox.show("Reste-t-il du composant dans l'UM ?", {
					icon: MessageBox.Icon.INFORMATION,
					styleClass: "popupWeighingChoice sapUiSizeCozy",
					title: "Quantité Composant",
					actions: actionList,
					onClose: function (sAction) {
						switch (sAction) {
						case "Oui":
							if (quantityInComponentUOM < toleranceLow) {
								MessageBox.show("Le poids est trop petit, ajoutez du composant dans le bac de prélèvement.", {
									icon: MessageBox.Icon.ERROR,
									title: "Pesée incorrecte",
									actions: [MessageBox.Action.OK]
								});
								return;
							}
							break;
						case "Continuer Pesée":
							continueWeighing = true;
							//isWeighted = false;
							break;
						case "Non":
						case "Destruction Composant":
							deleteStock = true;
							break;
						case "Annuler": // Exit weighing
							return;

						}
						var aFilter = new Filter({
							filters: [
								new Filter("Action", FilterOperator.EQ, "VALIDATE_WEIGHING_CANCEL_TO"),
								new Filter("Param1", FilterOperator.EQ, sourceHuId),
								new Filter("Param2", FilterOperator.EQ, orderNumber),
								new Filter("Param3", FilterOperator.EQ, internalItemNumber)
							],
							and: true
						});

						oModel.read("/ExecuteProcessSet", {
							filters: aFilter.aFilters,
							success: function (oData) {
								if (oData.results !== null && oData.results.length > 0) {
									var entry = oData.results[0];
									var errorMessage = entry.Param1;

									if (errorMessage) {
										that.showErrorMessage("Erreur lors de l'exécution", errorMessage);
										return;
									}

									//var destinationLocation = entry.Param1;
									var docid = entry.Param2;
									var itemid = entry.Param3;
									var destinationLocation2 = entry.Param4;
									//var destinationLocation2 = component.mCurrentDestinationBin;

									aFilter = new Filter({
										filters: [
											new Filter("Action", FilterOperator.EQ, "VALIDATE_WEIGHING_OK"),
											new Filter("Param1", FilterOperator.EQ, orderNumber),
											new Filter("Param2", FilterOperator.EQ, currentComponent.UOM),
											new Filter("Param3", FilterOperator.EQ, matnr),
											new Filter("Param4", FilterOperator.EQ, huId), //Picking HU - Param4
											new Filter("Param5", FilterOperator.EQ, sourceHuId), //Batch ID - Param5
											new Filter("Param6", FilterOperator.EQ, operationNumber), //OperationNumber - Param6
											new Filter("Param7", FilterOperator.EQ, internalItemNumber), //InternalItemNumber - Param7
											new Filter("Param8", FilterOperator.EQ, isWeighted), //IsWeighted - Param8
											new Filter("Param9", FilterOperator.EQ, username), //UserName - Param9
											new Filter("Param10", FilterOperator.EQ, itemid), //DestinationLocation - Param7
											new Filter("Param11", FilterOperator.EQ, destinationLocation2), //DestinationLocation - Param7
											new Filter("Param12", FilterOperator.EQ, scale), //Scale - Param7
											new Filter("ParamNum1", FilterOperator.EQ, quantityInComponentUOM), //Quantity - ParamNum1
											new Filter("ParamNum2", FilterOperator.EQ, -1), //Quantity - ParamNum1
											new Filter("AppParameter", FilterOperator.EQ, component.appStartupParameter)
										],
										and: true
									});

									oModel.read("/ExecuteProcessSet", {
										filters: aFilter.aFilters,
										success: function (oDataValidateWeight) {
											if (oDataValidateWeight.results !== null && oDataValidateWeight.results.length > 0) {
												entry = oDataValidateWeight.results[0];
												errorMessage = "";

												if (entry.Param2)
													errorMessage += entry.Param2 + "\n";
												if (entry.Param3)
													errorMessage += entry.Param3 + "\n";
												if (entry.Param4)
													errorMessage += entry.Param4 + "\n";
												if (entry.Param5)
													errorMessage += entry.Param5 + "\n";
												if (entry.Param6)
													errorMessage += entry.Param6 + "\n";
												if (entry.Param7)
													errorMessage += entry.Param7 + "\n";

												if (errorMessage) {
													that.showErrorMessage("Erreur lors de l'exécution", errorMessage);
												} else {
													//oBindingContext
													currentComponent.QuantityAlreadyPicked = quantityAlreadyPicked + quantityInComponentUOM;
													currentComponent.IsWeighted = isWeighted;
													var weightedQuantity = quantityAlreadyPicked + quantityInComponentUOM;
													var quantityToWeight = currentComponent.QuantityToWeight - quantityInComponentUOM;
													var quantityAvailable = currentComponent.QuantityAvailableNoOF - quantityInComponentUOM;
													currentComponent.QuantityAvailableNoOF = quantityAvailable;
													oComponentModel.setProperty(contextPath + "/QuantityToWeight", quantityToWeight);
													oComponentModel.setProperty(contextPath + "/QuantityAlreadyPicked", weightedQuantity);
													oComponentModel.setProperty(contextPath + "/IsWeighted", isWeighted);

													toleranceLow -= quantityInComponentUOM;
													toleranceHigh -= quantityInComponentUOM;

													oComponentModel.setProperty(contextPath + "/ToleranceHigh", toleranceHigh);
													oComponentModel.setProperty(contextPath + "/ToleranceLow", toleranceLow);

													MessageToast.show("Pesée enregistrée", {
														closeOnBrowserNavigation: false,
														width: "15em",
														offset: "0 -100",
														at: "center bottom"
													});
													if (deleteStock) {
														aFilter = new Filter({
															filters: [
																new Filter("Action", FilterOperator.EQ, "DELETE_STOCK_HU"),
																new Filter("Param1", FilterOperator.EQ, sourceHuId)
															],
															and: true
														});

														oModel.read("/ExecuteProcessSet", {
															filters: aFilter.aFilters,
															success: function (oDataDeleteHU) {

																if (oDataDeleteHU.results !== null && oDataDeleteHU.results.length > 0) {
																	entry = oDataDeleteHU.results[0];
																	if (entry.Param1) {
																		that.showErrorMessage("Erreur lors de l'exécution", entry.Param1);
																	} else {
																		if (!isWeighted && quantityAvailable > toleranceLow) {
																			that.doNavigate("SaisieHuComposant", oBindingContext, "", "");
																		} else {
																			var newBindingContext = component.moveToNextItem();
																			if (newBindingContext !== null) {
																				that.doNavigate("SaisieHuComposant", newBindingContext, "", "");
																			} else {
																				that.doNavigate("ListeOf", null, "", "");
																			}
																		}
																	}
																}
															}
														});
													} else {
														if (continueWeighing && isWeighted == "") {
															aFilter = new Filter({
																filters: [
																	new Filter("Action", FilterOperator.EQ, createHuProcess),
																	new Filter("Param2", FilterOperator.EQ, component.packingMaterialNumber),
																	new Filter("Param3", FilterOperator.EQ, orderNumber)
																],
																and: true
															});
															oModel.read("/ExecuteProcessSet", {
																filters: aFilter.aFilters,
																success: function (oDataCreate) {
																	if (oDataCreate.results[0].Param1 !== null && oDataCreate.results[0].Param1 !== "") {
																		MessageBox.error(oDataCreate.results[0].Param1);
																	} else {
																		var huBacPrelevement = oDataCreate.results[0].Param2;

																		component.mCurrentPickingHu = huBacPrelevement;
																		oComponentModel.setProperty(contextPath + "/PickingHU", huBacPrelevement);
																		that.byId("idWeight").setValue("");
																		that.byId("idWeight").focus();
																	}
																}
															});
														} else {
															if (!isWeighted && quantityAvailable > toleranceLow) {
																that.doNavigate("SaisieHuComposant", oBindingContext, "", "");
															} else {
																var newBindingContext = component.moveToNextItem();
																if (newBindingContext !== null) {
																	that.doNavigate("SaisieHuComposant", newBindingContext, "", "");
																} else {
																	that.doNavigate("ListeOf", null, "", "");
																}
															}
														}
													}
												}
											}
										}
									});
								}
							}
						});
					}
				});
			},
			_onValidateAndContinuePress: function (oEvent) {
				this.validateWeighing(true);
			},
			_onValiderPoidsPress: function (oEvent) {
				this.validateWeighing(false);
			},
			showErrorMessage: function (sTitle, sMessage) {
				MessageBox.show(sMessage, {
					icon: MessageBox.Icon.ERROR,
					title: sTitle,
					actions: [MessageBox.Action.OK]
				});
			},
			onInit: function () {
				this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				this.oRouter.getTarget("PeseeComposant").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
				this.getView().setModel(this.getOwnerComponent().getModel("orderHeaderModel"), "orderHeaderModel");
			}
		});
	},
	/* bExport= */
	true);