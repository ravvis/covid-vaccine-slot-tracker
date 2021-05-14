import chalk from "chalk";
import Table from "cli-table";
import inquirer from "inquirer";
import beep from "./beep";
import {FETCH_DISTRICTS, FETCH_STATES, GET_VACCINE_SLOTS} from "./services";
import {getCurrentDate} from "./utils";

let [states , districts , stateId , districtId , ageGroup , timeInterval] = [[], [], null, null, 18, null];
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
function ErrorMsg(message: string = "Oops, Some error occurred!") {
    console.log(chalk.red(message));
}
function inputAgeGroup() {
    return new Promise((resolve, reject) => {
        inquirer
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
                } else {
                    console.log(chalk.red("Please select a valid age group!"));
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
        inquirer
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
                } else {
                    console.log(chalk.red("Please select a valid state!"));
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
        inquirer
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
                } else {
                    console.log(chalk.red("Please select a valid district!"));
                    return inputDistrict();
                }
            })
            .catch((error) => {
                console.log({error});
                reject();
            });
    });
}

function init() {
    return new Promise(async (resolve, reject) => {
        await inputAgeGroup();

        console.log(chalk.yellow("Fetching states..."));
        await FETCH_STATES()
            .then((response) => {
                states = response.data.states;
            })
            .catch(() => {
                ErrorMsg();
                reject();
            });
        await inputState();

        console.log(chalk.yellow("Fetching districts..."));
        await FETCH_DISTRICTS(stateId)
            .then((response) => {
                districts = response.data.districts;
            })
            .catch(() => {
                ErrorMsg();
                reject();
            });
        await inputDistrict();
        resolve();
    });
}

function checkVaccineSlot() {
    console.log(chalk.yellow("Checking slot..."));

    GET_VACCINE_SLOTS(districtId, getCurrentDate())
        .then((response) => {
            const centers = availableSlots(response.data.centers);
            if (centers && centers.length) {
                console.log(chalk.green("Slots are available at these centers. Book a slot using CoWin app."));
                printCenters(centers);
                beep();
                clearInterval(timeInterval);
            } else {
                console.log(chalk.red("No slot available."));
            }
        })
        .catch((err) => {
            console.log("error", err);
        });
}

function availableSlots(centers = []) {
    return centers.reduce((arr, center) => {
        const sessions = center.sessions.filter((session) => session.min_age_limit === ageGroup);
        return sessions.length ? [ ...arr, Object.assign({}, center, { sessions })] : arr;
    }, []);
}

function printCenters(centers = []) {
    if (centers.length) {
        const centersFlatSessions = centers.reduce((arr, center) => {
            return [
                ...arr,
                ...center.sessions.map((session) => ({
                    ...center,
                    ...session,
                })),
            ];
        }, []);
        const table = new Table({
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
