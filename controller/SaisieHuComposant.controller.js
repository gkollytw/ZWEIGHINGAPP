sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./utilities",
	"sap/ui/core/routing/History",
	"com/ms/pp/Weighing/model/formatter"
], function (BaseController, MessageBox, Filter, FilterOperator, Utilities, History, formatter) {
	"use strict";

	return BaseController.extend("com.ms.pp.Weighing.controller.SaisieHuComposant", {
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
			var huNumberElement = this.byId("idHuComponent");
			if (huNumberElement !== null)
				huNumberElement.setValue("");
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
		doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel("orderHeaderModel") : null;
			var sContext = "";

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sContext = sPath.split("/")[2] + "|" + sPath.split("/")[5];
					//sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("/")[3];
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
		_onButtonPress1: function (oEvent) {

			var oBindingContext = this.getView().getBindingContext("orderComponentModel");

			return new Promise(function (fnResolve) {

				this.doNavigate("SaisieHuArticleIncorrect", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onContinuerPress: function (oEvent) {
			var that = this;
			var oBindingContext = this.getView().getBindingContext("orderComponentModel");

			var huId = this.byId("idHuComponent").getValue();
			var oComponent = this.getOwnerComponent();
			oComponent.mCurrentComponentBatch = huId;

			var currentComponent = oComponent.getCurrentComponent();

			var oComponentModel = this.getOwnerComponent().getModel("orderComponentModel");
			var contextPath = this.getView().getBindingContext("orderComponentModel").getPath();
			oComponentModel.setProperty(contextPath + "/ComponentHU", huId);

			var createHuProcess = "PICK_CREATE_HU";
			if (currentComponent.StockControlIndicator.startsWith(oComponent.fridgeIndicator)) {
				createHuProcess = "PICK_CREATE_HU_FRIDGE";
			}

			var aFilter = new Filter({
				filters: [
					new Filter("Action", FilterOperator.EQ, "COMPONENT_CHECK_HU_TOL"),
					new Filter("Param1", FilterOperator.EQ, huId),
					new Filter("Param2", FilterOperator.EQ, currentComponent.OrderNumber),
					new Filter("Param3", FilterOperator.EQ, currentComponent.MaterialNumber),
					new Filter("Param4", FilterOperator.EQ, currentComponent.InternalItemNumber)
				],
				and: true
			});
			var oModel = this.getOwnerComponent().getModel();
			oModel.read("/ExecuteProcessSet", {
				filters: aFilter.aFilters,
				success: function (oDataCheckHU) {
					var errorMessage = "";
					if (oDataCheckHU.results[0].Param1 !== null && oDataCheckHU.results[0].Param1 !== "") {
						var entry = oDataCheckHU.results[0];

						if (entry.Param5 === 'X') {
							errorMessage = "Cet UM n'est pas disponible.";
						} else if (currentComponent.MaterialNumber !== entry.Param2) {
							errorMessage = "Le numéro d'UM ne correspond pas au composant.";
						} else if (entry.Param4 === 'X') {
							errorMessage = "Scannez l'UM la plus proche du composant.";
						} else {
							var toleranceLow = currentComponent.QuantityToWeight - (currentComponent.QuantityRequired * Number(oDataCheckHU.results[0].ParamNum2) /
								100);
							var toleranceHigh = currentComponent.QuantityToWeight + (currentComponent.QuantityRequired * Number(oDataCheckHU.results[0].ParamNum1) /
								100);
							currentComponent.HUQuantity = oDataCheckHU.results[0].ParamNum3;
							oComponentModel.setProperty(contextPath + "/ToleranceHigh", toleranceHigh);
							oComponentModel.setProperty(contextPath + "/ToleranceLow", toleranceLow);

							aFilter = new Filter({
								filters: [
									new Filter("Action", FilterOperator.EQ, createHuProcess),
									//new Filter("Param1", FilterOperator.EQ, huId),
									new Filter("Param2", FilterOperator.EQ, oComponent.packingMaterialNumber),
									new Filter("Param3", FilterOperator.EQ, currentComponent.OrderNumber)
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

										oComponent.mCurrentPickingHu = huBacPrelevement;
										oComponentModel.setProperty(contextPath + "/PickingHU", huBacPrelevement);

										that.doNavigate("VerificationConformiteComposant", oBindingContext, "", "");
									}
								}
							});

						}

					} else {
						errorMessage = "Cette UM n'existe pas. Veuillez scanner l'UM du composant.";
					}
					if (errorMessage) {
						MessageBox.error(errorMessage, {
							onClose: function () {
								that.byId("idHuComponent").setValue("");
								that.byId("idHuComponent").focus();
							}
						});
					}

				}
			});

		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("SaisieHuComposant").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.getView().setModel(this.getOwnerComponent().getModel("orderHeaderModel"), "orderHeaderModel");
		}
	});
}, /* bExport= */ true);