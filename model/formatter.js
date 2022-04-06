sap.ui.define([
	"sap/ui/core/format/DateFormat"
], function (DateFormat) {
	"use strict";
	return {
		removeZeros: function (sString) {
			if (sString !== null && sString !== undefined && sString.startsWith("0")) {
				for (var i = 0; sString[i] === "0"; i++);
				sString = sString.substring(i);
			}
			return sString;
		},
		isRefrigerated: function (sIsRefrigerated) {
			if (sIsRefrigerated)
				return true;
			return false;
		},
		percentage: function (sString) {
			return sString + "%";
		},
		stockVisibility: function (oObjectHeader) {
			if (oObjectHeader) {
				if (!(oObjectHeader.IsWeighted) && oObjectHeader.QuantityRequired > (oObjectHeader.QuantityAvailableNoOF + oObjectHeader.QuantityAlreadyPicked)) {
					return true;
				} else {
					return false;
				}
			}
			return false;
		},
		statusColor: function (sString) {
			var color = "";
			switch (sString) {
			case "Error":
				color = "red";
				break;
			case "InProcess":
				color = "#ffca00";
				break;
			case "Success":
				color = "green";
				break;
			default:
				color = "black";
			}
			return color;
		},
		statusIcon: function (sString) {
			var icon = "border";
			switch (sString) {
			case "Error":
				icon = "message-warning";
				break;
			case "InProcess":
				icon = "status-in-process";
				break;
			case "Success":
				icon = "message-success";
				break;
			}
			return icon;
		},
		statusColorClass: function (sString) {
			var color = "statusColorBlack";
			switch (sString) {
			case "Error":
				color = "statusColorRed";
				break;
			case "InProcess":
				color = "statusColorYellow";
				break;
			case "Success":
				color = "statusColorGreen";
				break;
			}
			return color;
		},
		valueState: function (sString) {
			var state = "None";
			switch (sString) {
			case "Error":
				state = "Error";
				break;
			case "InProcess":
				state = "Warning";
				break;
			case "Success":
				state = "Success";
				break;
			}
			return state;
		},
		backgroundDesignComponent: function (oObjectHeader) {
			if (oObjectHeader) {
				if (oObjectHeader.IsWeighted) {
					return "Solid";
				} else {
					return "Transparent";
				}
			}
			return "Transparent";
		},
		isWeightedToBool: function (sIsWeighted) {
			if (sIsWeighted) {
				return sIsWeighted !== "";
			}
			return false;
		}
	};
});