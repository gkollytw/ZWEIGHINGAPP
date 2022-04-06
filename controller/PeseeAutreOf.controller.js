sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, History) {
	"use strict";

	return BaseController.extend("com.ms.pp.Weighing.controller.PeseeAutreOf", {
		handleRouteMatched: function(oEvent) {
			var sAppId = "App5d00e5cdc911d401164bdf7e";
			var sOrderContext = oEvent.getSource()._oViews._oViews["com.ms.pp.Weighing.view.ListeComposants"].getBindingContext("orderHeaderModel").getPath();
			this.getView().bindElement({
				path: sOrderContext + "/OrderComponentSet/results/" + oEvent.getParameter("data").context,
				model: "orderHeaderModel"
			});
		},
		_onPeserAutreOFPress: function(oEvent) {

			var oBindingContext = this.getView().getBindingContext("orderHeaderModel");

			return new Promise(function(fnResolve) {

				this.doNavigate("ListeOf", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel("orderHeaderModel") : null;
			var sContext = "";
			
			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sContext = sPath.split("/")[2];
					//sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("/")[1];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sContext;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet, sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sContext,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
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
		_onTerminerPeseePress: function(oEvent) {

			var oBindingContext = this.getView().getBindingContext("orderHeaderModel");

			return new Promise(function(fnResolve) {

				this.doNavigate("FinApplication_1", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("PeseeAutreOf").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.getView().setModel(this.getOwnerComponent().getModel("orderHeaderModel"), "orderHeaderModel");
		}
	});
}, /* bExport= */ true);
