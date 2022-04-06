sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./utilities",
	"sap/ui/core/routing/History",
	"com/ms/pp/Weighing/model/formatter"
], function (BaseController, MessageBox, Filter, FilterOperator, Utilities, History, formatter) {
	"use strict";

	return BaseController.extend("com.ms.pp.Weighing.controller.SaisieBacPrelevement", {
		formatter: formatter,
		handleRouteMatched: function (oEvent) {
			//var sAppId = "App5d00e5cdc911d401164bdf7e";
			/*var sOrderContext = oEvent.getSource()._oViews._oViews["com.ms.pp.Weighing.view.ListeComposants"].getBindingContext(
				"orderHeaderModel").getPath();*/
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
			var huNumberElement = this.byId("idPickHuNumber");
			if (huNumberElement !== null)
				huNumberElement.setValue("");

		},
		_onArretPeseePress: function (oEvent) {

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
		_onContinuerPress: function (oEvent) {
			var that = this;
			var oBindingContext = this.getView().getBindingContext("orderComponentModel");
			var oComponent = this.getOwnerComponent();
			var huId = this.byId("idPickHuNumber").getValue();
			var oModel = this.getOwnerComponent().getModel();
			oComponent.mCurrentPickingHu = this.byId("idPickHuNumber").getValue();
			var oComponentModel = this.getOwnerComponent().getModel("orderComponentModel");
			var contextPath = this.getView().getBindingContext("orderComponentModel").getPath();
			oComponentModel.setProperty(contextPath + "/PickingHU", huId);
			var aFilter = new Filter({
				filters: [
					new Filter("Action", FilterOperator.EQ, "PICK_CHECK_HU"),
					new Filter("Param1", FilterOperator.EQ, huId)
				],
				and: true
			});
			oModel.read("/ExecuteProcessSet", {
				filters: aFilter.aFilters,
				success: function (oDataCheckHU) {
					if (oDataCheckHU.results[0].Param1 !== null && oDataCheckHU.results[0].Param1 !== "") {
						//var saisieHuController = that.getOwnerComponent()._oViews._oViews["com.ms.pp.Weighing.view.SaisieHuComposant"];
						//saisieHuController.byId("idPickingHu").setText(that.getOwnerComponent().mCurrentPickingHu);

						if (oDataCheckHU.results[0].ParamNum1 > 0) {
							MessageBox.error("Le bac de prélèvement n'est pas vide. Veuillez en choisir un autre.");
						} else {
							that.doNavigate("SaisieHuComposant", oBindingContext, "", "");
						}
					} else {
						aFilter = new Filter({
							filters: [
								new Filter("Action", FilterOperator.EQ, "PICK_CREATE_HU"),
								new Filter("Param1", FilterOperator.EQ, huId),
								new Filter("Param2", FilterOperator.EQ, "000000000001012120")
							],
							and: true
						});
						oModel.read("/ExecuteProcessSet", {
							filters: aFilter.aFilters,
							success: function (oDataCreate) {
								if (oDataCreate.results[0].Param1 !== null && oDataCreate.results[0].Param1 !== "") {
									MessageBox.error(oDataCreate.results[0].Param1);
								} else {
									that.doNavigate("SaisieHuComposant", oBindingContext, "", "");
								}
							}
						});
					}
				}
			});

			/*oModel.read("/ExecuteProcessSet", {filters : aFilter.aFilters,
			success:function(oData){
				if (oData.results[0].Param1 !== null && oData.results[0].Param1 != ""){
					that.doNavigate("SaisieHuComposant", oBindingContext,"", "");
					var saisieHuController = that.getOwnerComponent()._oViews._oViews["com.ms.pp.Weighing.view.SaisieHuComposant"];
					saisieHuController.byId("idPickingHu").setText(that.getOwnerComponent().mCurrentPickingHu);
				}
			}});*/

		},
		onAfterRendering: function (oEvent) {

			/*var iconOrder = this.byId("idHeaderOrder").getContent()[0].getBindingInfo("icon");
			var valueStateOrder = iconOrder.binding.getBindings()[0].getValue();
			$(".sapMOHRIcon")[0].firstElementChild.className += " " + formatter.statusColorClass(valueStateOrder);

			var iconComponent = this.byId("idHeaderComponent").getContent()[0].getBindingInfo("icon");
			var valueState = iconComponent.binding.getBindings()[0].getValue();
			$(".sapMOHIcon")[0].firstElementChild.className += " " + formatter.statusColorClass(valueState);*/
		},
		onInit: function () {
			//this.getView().attachAfterRendering(null, this.afterRendering, null);
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("SaisieBacPrelevement").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.getView().setModel(this.getOwnerComponent().getModel("orderHeaderModel"), "orderHeaderModel");
		}
	});
}, /* bExport= */ true);