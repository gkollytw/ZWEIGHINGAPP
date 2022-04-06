jQuery.sap.includeStyleSheet(sap.ui.resource("com.ms.pp.Weighing", "css/style.css"));
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/ms/pp/Weighing/model/models",
	"./model/errorHandling",
	"com/ms/pp/Weighing/model/unitHelper",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (UIComponent, Device, models, errorHandling, unitHelper, Filter, FilterOperator) {
	"use strict";

	var navigationWithContext = {
		"OrderHeader": {
			"ListeComposants": "",
			"LancementPeseeArticle": "",
			"SaisieHuComposant": ""
		},
		"OrderComponentSet": {
			"ListeComposants": "",
			"LancementPeseeArticle": "",
			"SaisieHuComposant": "",
			"SaisieBacPrelevement": "",
			"VerificationConformiteComposant": "",
			"PeseeComposant": "",
			"PeseeAutreOf": "",
			"FinHuComposant": "",
			"DestructionComposant": "",
			"ArretPeseeComposant": "",
			"SaisieUtilisateur": ""
		}
	};

	return UIComponent.extend("com.ms.pp.Weighing.Component", {

		metadata: {
			//includes: ["css/style.css"],
			manifest: "json"
				/*config: {
					fullWidth: true //Set your fullscreen parameter here!
				}*/
		},
		sCurrentOrder: "",
		mCurrentOrder: {},
		sCurrentItem: -1,
		mCurrentPickingHu: "",
		mCurrentComponentBatch: "",
		mCurrentComponent: null,
		mCurrentCage: "",
		mCurrentDestinationBin: "",
		orderHeaderModel: null,
		orderComponentModel: null,
		unitHelper: unitHelper,
		packingMaterialNumber: null,
		appStartupParameter: null,
		fridgeIndicator: null,
		mPictogramArray: null,
		HUQuantity: 0,
		mCurrentUser: "",

		//Material Stocks stored in KG
		materialStocks: [],

		hasMoreItem: function () {
			return this.mCurrentOrder.OrderComponentSet.results.length > (this.sCurrentItem + 1);
		},

		moveToNextItem: function () {
			this.sCurrentItem++;
			if (this.mCurrentOrder !== null) {
				if (this.mCurrentOrder.OrderComponentSet.results.length > this.sCurrentItem) {
					var oModel = this.getModel("orderHeaderModel");
					this.mCurrntPickingHu = "";
					this.currentComponentBatch = "";
					var newComponent = this.getCurrentComponent();
					if (newComponent.IsWeighted || Number(newComponent.QuantityRequired) >
						Number(newComponent.QuantityAlreadyPicked) + Number(newComponent.QuantityAvailableNoOF)) {
						return this.moveToNextItem();
					} else
						var quantityStock = this.materialStocks[newComponent.MaterialNumber];
					var componentModel = this.getModel("orderComponentModel");
					quantityStock = unitHelper.convertUnit("KG", newComponent.UOM, quantityStock);
					componentModel.setProperty("/OrderHeader/" + this.sCurrentOrder + "/OrderComponentSet/results/" + this.sCurrentItem +
						"/QuantityAvailableNoOF", quantityStock);
					return oModel.getContext("/OrderHeader/" + this.sCurrentOrder + "/OrderComponentSet/results/" + this.sCurrentItem);
				}
				return null;
			}
			return null;
		},

		getCurrentComponent: function () {
			return this.mCurrentOrder.OrderComponentSet.results[this.sCurrentItem];
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

			// set the dataSource model
			this.orderHeaderModel = new sap.ui.model.json.JSONModel({
				"OrderHeader": [],
				"Component": []
			});
			this.setModel(this.orderHeaderModel, "orderHeaderModel");

			// set the dataSource model
			this.orderComponentModel = new sap.ui.model.json.JSONModel({
				"OrderHeader": [],
				"Component": []
			});
			this.setModel(this.orderComponentModel, "orderComponentModel");

			// set application model
			var oApplicationModel = new sap.ui.model.json.JSONModel({});
			this.setModel(oApplicationModel, "applicationModel");

			var oRootPath = jQuery.sap.getModulePath("com.ms.pp.Weighing"); // your resource root

			var oImageModel = new sap.ui.model.json.JSONModel({
				path: oRootPath
			});

			this.setModel(oImageModel, "imageModel");
			var componentData = this.getComponentData();
			this.appStartupParameter = "CH21";
			if (componentData && componentData.startupParameters && componentData.startupParameters.SCENARIO) {
				this.appStartupParameter = componentData.startupParameters.SCENARIO[0];
			}
			var oModel = this.getModel();
			var filterArrayOrderSet = new Array();
			filterArrayOrderSet.push(new Filter("AppParameter", FilterOperator.EQ, this.appStartupParameter));
			var aFilterOrderSet = new Filter({
				filters: filterArrayOrderSet,
				and: true
			});

			var that = this;

			oModel.read("/AppConfigurationSet", {
				filters: aFilterOrderSet.aFilters,
				success: function (data) {
					for (var entry in data.results) {
						if (data.results[entry].ConfKey === 'PACK_MATNR') {
							that.packingMaterialNumber = data.results[entry].ValueChar;
						}
						if (data.results[entry].ConfKey === 'FRIDGE_IND') {
							that.fridgeIndicator = data.results[entry].ValueChar;
						}
					}
				}
			});

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// delegate error handling
			errorHandling.register(this);

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		createContent: function () {
			var app = new sap.m.App({
				id: "App"
			});
			var appType = "App";
			var appBackgroundColor = "#FFFFFF";
			if (appType === "App" && appBackgroundColor) {
				app.setBackgroundColor(appBackgroundColor);
			}

			return app;
		},

		getNavigationPropertyForNavigationWithContext: function (sEntityNameSet, targetPageName) {
			var entityNavigations = navigationWithContext[sEntityNameSet];
			return entityNavigations === null ? null : entityNavigations[targetPageName];
		}

	});

});