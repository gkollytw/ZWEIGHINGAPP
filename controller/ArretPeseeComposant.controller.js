sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function (BaseController, MessageBox, Utilities, History) {
	"use strict";

	return BaseController.extend("com.ms.pp.Weighing.controller.ArretPeseeComposant", {
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
		_onListeOFPress: function (oEvent) {
			this.doNavigate("ListeOf", "", "", "");
		},
		_onArticleSuivantPress: function (oEvent) {

			var oComponent = this.getOwnerComponent();
			var newBindingContext = oComponent.moveToNextItem();
			if (newBindingContext !== null) {
				this.doNavigate("SaisieHuComposant", newBindingContext, "", "");
			} else {
				this.doNavigate("ListeOf", "", "", "");
			}
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
		_onAnnulerPress: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			var oQueryParams = this.getQueryParameters(window.location);

			if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("default", true);
			}

		},
		getQueryParameters: function (oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("ArretPeseeComposant").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.getView().setModel(this.getOwnerComponent().getModel("orderHeaderModel"), "orderHeaderModel");
		}
	});
}, /* bExport= */ true);