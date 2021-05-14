"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_VACCINE_SLOTS = exports.FETCH_DISTRICTS = exports.FETCH_STATES = void 0;
const axios_1 = __importDefault(require("axios"));
const baseURL = "https://www.cowin.gov.in/api/v2/";
exports.FETCH_STATES = () => {
    return axios_1.default.get(`admin/location/states`, {
        baseURL,
    });
};
exports.FETCH_DISTRICTS = (stateId) => {
    return axios_1.default.get(`admin/location/districts/${stateId}`, {
        baseURL,
    });
};
exports.GET_VACCINE_SLOTS = (districtId, date) => {
    return axios_1.default.get(`appointment/sessions/public/calendarByDistrict`, {
        baseURL,
        params: {
            date,
            district_id: districtId,
        },
    });
};
//# sourceMappingURL=services.js.map