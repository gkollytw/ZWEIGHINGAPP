sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./utilities",
	"sap/ui/core/routing/History",
	"com/ms/pp/Weighing/model/formatter",
	"sap/m/Dialog",
	"sap/m/Label",
	"sap/m/Input",
	"sap/m/Button",
	"sap/m/ButtonType"
], function (BaseController, MessageToast, MessageBox, Filter, FilterOperator, Utilities, History, formatter, Dialog, Label, Input,
	Button, ButtonType) {
	"use strict";

	return BaseController.extend("com.ms.pp.Weighing.VerificationConformiteComposant", {
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
		},
		_onNonConformePress: function (oEvent) {
			var that = this;

			var oBindingContext = this.getView().getBindingContext("orderComponentModel");

			var component = this.getOwnerComponent();
			var oModel = component.getModel();

			var currentComponent = component.getCurrentComponent();

			var quantity = -1;
			//var orderNumber = currentComponent.OrderNumber;
			var hUComponent = component.mCurrentComponentBatch;
			var material = currentComponent.MaterialNumber;
			var aFilter = new Filter({
				filters: [
					new Filter("Action", FilterOperator.EQ, "COMPONENT_NOT_OK"),
					new Filter("Param1", FilterOperator.EQ, hUComponent),
					new Filter("Param2", FilterOperator.EQ, material),
					new Filter("ParamNum1", FilterOperator.EQ, quantity) //Quantity - ParamNum1
				],
				and: true
			});

			oModel.read("/ExecuteProcessSet", {
				filters: aFilter.aFilters,
				success: function (oData) {
					if (oData.results !== null && oData.results.length > 0) {
						var entry = oData.results[0];

						if (entry.Param1) {
							MessageBox.show(
								entry.Param1, {
									icon: MessageBox.Icon.ERROR,
									title: "Erreur lors de l'exécution",
									actions: [MessageBox.Action.OK]
								}
							);
						} else {
							MessageToast.show("Tâche pour déplacement en Contrôle Qualité Créée", {
								closeOnBrowserNavigation: false,
								width: "15em",
								offset: "0 -100",
								at: "center bottom"
							});
							that.doNavigate("SaisieHuComposant", oBindingContext, "", "");
						}
					} else {
						that.doNavigate("SaisieHuComposant", oBindingContext, "", "");
					}

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
		_onConformePress: function (oEvent) {
			var oBindingContext = this.getView().getBindingContext("orderComponentModel");

			this.doNavigate("PeseeComposant", oBindingContext, "", "");
			/*var that = this;
			var component = this.getOwnerComponent();
			if (!component.mCurrentDestinationBin) {
				var oDialog = new Dialog({
					title: 'Bin de Destination',
					type: 'Message',
					content: [
						new Label({
							text: 'Saisie de la Bin de Destination',
							labelFor: 'destinationBinInput'
						}),
						new Input('destinationBinInput', {
							width: '100%',
							placeholder: ''
						})
					],
					endButton: new Button({
						type: ButtonType.Emphasized,
						text: 'Confirmer',
						press: function () {
							var sText = sap.ui.getCore().byId('destinationBinInput').getValue();
							if (!sText)
								return;
							component.mCurrentDestinationBin = sText;
							oDialog.close();

							that.doNavigate("PeseeComposant", oBindingContext, "", "");
							//var peseeComposantController = that.getOwnerComponent()._oViews._oViews["com.ms.pp.Weighing.view.PeseeComposant"];
							//peseeComposantController.byId("idComponentBatch").setText(that.getOwnerComponent().mCurrentComponentBatch);
							//peseeComposantController.byId("idPickingHu").setText(that.getOwnerComponent().mCurrentPickingHu);

						}
					}),
					beginButton: new Button({
						text: 'Annuler',
						press: function () {
							oDialog.close();
						}
					}),
					afterClose: function () {
						oDialog.destroy();
					}
				});

				oDialog.open();
			}*/
		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("VerificationConformiteComposant").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.getView().setModel(this.getOwnerComponent().getModel("orderHeaderModel"), "orderHeaderModel");
		}
	});
}, /* bExport= */ true);