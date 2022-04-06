sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./utilities",
	"sap/ui/core/routing/History",
	"com/ms/pp/Weighing/model/formatter"
], function (BaseController, MessageBox, Filter, FilterOperator, Utilities, History, formatter) {
	"use strict";

	return BaseController.extend("com.ms.pp.Weighing.controller.SaisieUtilisateur", {
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
			var userElement = this.byId("idUser");
			if (userElement !== null)
				userElement.setValue("");
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
		_onContinuerPress: function (oEvent) {
			var that = this;
			var oBindingContext = this.getView().getBindingContext("orderComponentModel");

			var user = this.byId("idUser").getValue();
			var oComponent = this.getOwnerComponent();
			oComponent.mCurrentUser = user;

			var aFilter = new Filter({
				filters: [
					new Filter("Action", FilterOperator.EQ, "GET_USER_NAME"),
					new Filter("Param1", FilterOperator.EQ, user),
				],
				and: true
			});
			var oModel = this.getOwnerComponent().getModel();
			oModel.read("/ExecuteProcessSet", {
				filters: aFilter.aFilters,
				success: function (oData) {
					var errorMessage = "";
					if (oData.results[0].Param1 !== null && oData.results[0].Param1 !== "") {
						var entry = oData.results[0];
						oComponent.mCurrentUser = entry.Param1;
						if (oBindingContext !== null) {
							that.doNavigate("SaisieHuComposant", oBindingContext, "", "");
						} else {
							that.doNavigate("ListeOf", null, "", "");
						}

					} else {
						errorMessage = "L'utilisateur n'a pas été trouvé.";
					}
					if (errorMessage) {
						MessageBox.error(errorMessage, {
							onClose: function () {
								that.byId("idUser").setValue("");
								that.byId("idUser").focus();
							}
						});
					}

				}
			});

		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("SaisieUtilisateur").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.getView().setModel(this.getOwnerComponent().getModel("orderHeaderModel"), "orderHeaderModel");
		}
	});
}, /* bExport= */ true);