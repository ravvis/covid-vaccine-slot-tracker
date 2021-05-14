import axios from "axios";
const baseURL = "https://www.cowin.gov.in/api/v2/";
export const FETCH_STATES = () => {
    return axios.get(`admin/location/states`, {
        baseURL,
    });
};

export const FETCH_DISTRICTS = (stateId: number) => {
    return axios.get(`admin/location/districts/${stateId}`, {
        baseURL,
    });
};

export const GET_VACCINE_SLOTS = (districtId: number, date: string) => {
    return axios.get(`appointment/sessions/public/calendarByDistrict`, {
        baseURL,
        params: {
            date,
            district_id: districtId,
        },
    });
};
