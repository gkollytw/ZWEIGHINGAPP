sap.ui.define([], function () {
	"use strict";
	return {

		convertUnit: function (sUnitSrc, sUnitDest, dQuantity) {
			if (typeof sUnitSrc !== "string" || typeof sUnitDest !== "string")
				return dQuantity;
			sUnitSrc = sUnitSrc.toUpperCase();
			sUnitDest = sUnitDest.toUpperCase();
			if (sUnitSrc === sUnitDest)
				return dQuantity;

			switch (sUnitDest) {
			case "MG": //milligram
				switch (sUnitSrc) {
				case "G":
					dQuantity = dQuantity * 1000;
					break;
				case "KG":
					dQuantity = dQuantity * 1000000;
					break;
				}
				break;
			case "G": //Grammes
				switch (sUnitSrc) {
				case "KG":
					dQuantity = dQuantity * 1000;
					break;
				case "MG":
					dQuantity = dQuantity / 1000;
					break;
				}
				break;
			case "KG": //Grammes
				switch (sUnitSrc) {
				case "G":
					dQuantity = dQuantity / 1000;
					break;
				case "MG":
					dQuantity = dQuantity / 1000000;
					break;
				}
				break;
			}

			return dQuantity;
		}

	};
});