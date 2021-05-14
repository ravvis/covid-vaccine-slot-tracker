"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const cli_table_1 = __importDefault(require("cli-table"));
const inquirer_1 = __importDefault(require("inquirer"));
const beep_1 = __importDefault(require("./beep"));
const services_1 = require("./services");
const utils_1 = require("./utils");
let [states, districts, stateId, districtId, ageGroup, timeInterval] = [[], [], null, null, 18, null];
const ageGroups = [
    {
        min_age: 18,
        title: "18 to 44",
    },
    {
        min_age: 45,
        title: "45+",
    },
];
// Helper
function ErrorMsg(message = "Oops, Some error occurred!") {
    console.log(chalk_1.default.red(message));
}
function inputAgeGroup() {
    return new Promise((resolve, reject) => {
        inquirer_1.default
            .prompt([
            {
                choices: ageGroups.map((s) => s.title),
                default: ageGroup,
                message: "Select your age group.",
                name: "ageGroup",
                type: "list",
            },
        ])
            .then((answers) => {
            const a = ageGroups.find((s) => s.title === answers.ageGroup);
            if (answers.ageGroup && a) {
                ageGroup = a.min_age;
                resolve();
            }
            else {
                console.log(chalk_1.default.red("Please select a valid age group!"));
                return inputAgeGroup();
            }
        })
            .catch((error) => {
            console.log({ error });
            reject();
        });
    });
}
function inputState() {
    return new Promise((resolve, reject) => {
        inquirer_1.default
            .prompt([
            {
                choices: states.map((s) => s.state_name),
                message: "Select your state.",
                name: "state",
                type: "list",
            },
        ])
            .then((answers) => {
            const st = states.find((s) => s.state_name === answers.state);
            if (answers.state && st) {
                stateId = st.state_id;
                resolve();
            }
            else {
                console.log(chalk_1.default.red("Please select a valid state!"));
                return inputState();
            }
        })
            .catch((error) => {
            console.log({ error });
            reject();
        });
    });
}
function inputDistrict() {
    return new Promise((resolve, reject) => {
        inquirer_1.default
            .prompt([
            {
                choices: districts.map((s) => s.district_name),
                message: "Select your district.",
                name: "district",
                type: "list",
            },
        ])
            .then((answers) => {
            const st = districts.find((s) => s.district_name === answers.district);
            if (answers.district && st) {
                districtId = st.district_id;
                resolve();
            }
            else {
                console.log(chalk_1.default.red("Please select a valid district!"));
                return inputDistrict();
            }
        })
            .catch((error) => {
            console.log({ error });
            reject();
        });
    });
}
function init() {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        yield inputAgeGroup();
        console.log(chalk_1.default.yellow("Fetching states..."));
        yield services_1.FETCH_STATES()
            .then((response) => {
            states = response.data.states;
        })
            .catch(() => {
            ErrorMsg();
            reject();
        });
        yield inputState();
        console.log(chalk_1.default.yellow("Fetching districts..."));
        yield services_1.FETCH_DISTRICTS(stateId)
            .then((response) => {
            districts = response.data.districts;
        })
            .catch(() => {
            ErrorMsg();
            reject();
        });
        yield inputDistrict();
        resolve();
    }));
}
function checkVaccineSlot() {
    console.log(chalk_1.default.yellow("Checking slot..."));
    services_1.GET_VACCINE_SLOTS(districtId, utils_1.getCurrentDate())
        .then((response) => {
        const centers = availableSlots(response.data.centers);
        if (centers && centers.length) {
            console.log(chalk_1.default.green("Slots are available at these centers. Book a slot using CoWin app."));
            printCenters(centers);
            beep_1.default();
            clearInterval(timeInterval);
        }
        else {
            console.log(chalk_1.default.red("No slot available."));
        }
    })
        .catch((err) => {
        console.log("error", err);
    });
}
function availableSlots(centers = []) {
    return centers.reduce((arr, center) => {
        const sessions = center.sessions.filter((session) => session.min_age_limit === ageGroup);
        return sessions.length ? [...arr, Object.assign({}, center, { sessions })] : arr;
    }, []);
}
function printCenters(centers = []) {
    if (centers.length) {
        const centersFlatSessions = centers.reduce((arr, center) => {
            return [
                ...arr,
                ...center.sessions.map((session) => (Object.assign(Object.assign({}, center), session))),
            ];
        }, []);
        const table = new cli_table_1.default({
            head: [
                "Center name",
                "Pin code",
                "Fee type",
                "Date",
                "Available capacity",
                "Vaccine",
                "Time Slots",
            ],
        });
        table.push(...centersFlatSessions.map((center) => [
            center.name,
            center.pincode,
            center.fee_type,
            center.date,
            center.available_capacity,
            center.vaccine,
            JSON.stringify(center.slots),
        ]));
        console.log(table.toString());
    }
}
// Driver code
init()
    .then(() => {
    checkVaccineSlot();
    timeInterval = setInterval(() => {
        checkVaccineSlot();
    }, 60000);
});
//# sourceMappingURL=index.js.map