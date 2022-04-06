sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"com/ms/pp/Weighing/model/formatter"
], function (BaseController, MessageBox, Utilities, History, formatter) {
	"use strict";

	return BaseController.extend("com.ms.pp.Weighing.controller.ListeComposants", {
		formatter: formatter,

		handleRouteMatched: function (oEvent) {
			//var sAppId = "App5d00e5cdc911d401164bdf7e";

			this.getView().bindElement({
				path: "/OrderHeader/" + oEvent.getParameter("data").context,
				model: "orderHeaderModel"
			});
		},
		onIconHeaderChanged: function () {

			var headerOrder = this.byId("idHeaderOrder");
			var iconOrder = headerOrder.getBindingInfo("icon");
			headerOrder.focus();
			var valueStateOrder = iconOrder.binding.getBindings()[0].getValue();
			$(".sapMOHRIcon")[0].firstElementChild.className += " " + formatter.statusColorClass(valueStateOrder);
		},
		_onPageNavButtonPress: function () {
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
		onUpdateFinished: function (oEvent) {
			if (oEvent.getParameter("total") > 0) {
				var listComposants = this.byId("listComposants");
				for (var i = 0; i < listComposants.getItems().length; i++) {
					var icon = listComposants.getItems()[i].getContent()[0].getBindingInfo("icon");
					var valueState = icon.binding.getBindings()[0].getValue();
					//document.getElementsByClassName("sapMOHIcon")[i].firstElementChild.style.color = formatter.statusColor(valueState);
					//$(".sapMOHIcon")[i].firstElementChild.style.color = formatter.statusColor(valueState);
					$(".sapMOHRIcon")[i].firstElementChild.className += " " + formatter.statusColorClass(valueState);
				}
			}
		},
		/*onModelContextChange: function (oEvent) {
		
		},*/
		getQueryParameters: function (oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

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
		_onCommencerPress: function (oEvent) {
			var oBindingContext = this.getView().getBindingContext("orderHeaderModel");

			var oComponent = this.getOwnerComponent();
			var oModel = oComponent.getModel("orderHeaderModel");
			oComponent.mCurrentOrder = oModel.getProperty(oBindingContext.getPath());
			oComponent.sCurrentOrder = oBindingContext.getPath().split("/")[2];
			oComponent.sCurrentItem = -1;

			var newBindingContext = oComponent.moveToNextItem();
			if (newBindingContext !== null) {
				//this.doNavigate("SaisieHuComposant", newBindingContext, "", "");
				this.doNavigate("SaisieUtilisateur", newBindingContext, "", "");
			} else {
				this.doNavigate("ListeOf", null, "", "");
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
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("ListeComposants").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.getView().setModel(this.getOwnerComponent().getModel("orderHeaderModel"), "orderHeaderModel");
		},
		onExit: function () {

			// to destroy templates for bound aggregations when templateShareable is true on exit to prevent duplicateId issue
			var aControls = [{
				"controlId": "sap_m_Page_0-content-sap_m_ObjectList-1560939851003",
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
}, /* bExport= */ true);