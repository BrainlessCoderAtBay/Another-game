let cookies = 0;

const upgrades = {
    clicker : 0, wizard : 0,
    nanny : 0,   space : 0,
    factory : 0, timeMachine : 0,
    temple : 0,  clones : 0
}

const prices = {
    clicker : 10,   wizard : 100000,
    nanny : 50,     space : 2500000,      
    factory : 1000, timeMachine : 10000000,        
    temple : 20000, clones : 50000000000
}

const cookieCount = document.getElementById("cookieCount");
const clickerPrice = document.getElementById("aClickerP"); const nannyPrice = document.getElementById("nannyP");
const factoryPrice = document.getElementById("factoryP"); const templePrice = document.getElementById("templeP");
const wizardPrice = document.getElementById("wizardP"); const spacePrice = document.getElementById("spaceP");
const timeMachinePrice = document.getElementById("timeMachineP"); const clonesPrice = document.getElementById("clonesP");
const clickerAmount = document.getElementById("aClickerA"); const nannyAmount = document.getElementById("nannyA");
const factoryAmount = document.getElementById("factoryA"); const templeAmount = document.getElementById("templeA");
const wizardAmount = document.getElementById("wizardA"); const spaceAmount = document.getElementById("spaceA");
const timeMachineAmount = document.getElementById("timeMachineA"); const clonesAmount = document.getElementById("clonesA");

//Standard Click
//Progression : 100%
function cookieAdd(){
    cookies++;
    cookieCount.textContent = cookies.toFixed(1);
}

//Auto Clicker
//Progression : 100%
function clickerAdd(button){
    const newClickerPrice = prices.clicker + ((upgrades.clicker + 1) * prices.clicker);
    if (cookies < (newClickerPrice - prices.clicker)) {
        button.classList.add('insufficient');
        setTimeout(() => button.classList.remove('insufficient'), 500);
        return;
    }
    upgrades.clicker++;
    cookies -= newClickerPrice - prices.clicker;
    clickerPrice.textContent = newClickerPrice;
    clickerAmount.textContent = upgrades.clicker;
};

//Nanny
//Progression : 100%
function nannyAdd(button){
    const newNannyPrice = prices.nanny + ((upgrades.nanny + 1) * prices.nanny)
    if (cookies < (newNannyPrice - prices.nanny)) {
        button.classList.add('insufficient');
        setTimeout(() => button.classList.remove('insufficient'), 500);
        return;
    }
    upgrades.nanny++;
    cookies -= newNannyPrice - prices.nanny;
    nannyPrice.textContent = newNannyPrice;
    nannyAmount.textContent = upgrades.nanny;
}

//Factory
//Progression : 100%
function factoryAdd(button){
    const newFactoryPrice = prices.factory + ((upgrades.factory + 1) * prices.factory);
    if (cookies < (newFactoryPrice - prices.factory)) {
        button.classList.add('insufficient');
        setTimeout(() => button.classList.remove('insufficient'), 500);
        return;
    }
    upgrades.factory++;
    cookies -= newFactoryPrice - prices.factory;
    factoryPrice.textContent = newFactoryPrice;
    factoryAmount.textContent = upgrades.factory;
}

//Temple
//Progression : 100%
function templeAdd(button){
    const newTemplePrice = prices.temple + ((upgrades.temple + 1) * prices.temple);
    if (cookies < (newTemplePrice - prices.temple)) {
        button.classList.add('insufficient');
        setTimeout(() => button.classList.remove('insufficient'), 500);
        return;
    }
    upgrades.temple++;
    cookies -= newTemplePrice - prices.temple;
    templePrice.textContent = newTemplePrice;
    templeAmount.textContent = upgrades.temple;
}

//Wizard
//Progression : 100%
function wizardAdd(button){
    const newWizardPrice = prices.wizard + ((upgrades.wizard + 1) * prices.wizard);
    if (cookies < (newWizardPrice - prices.wizard)) {
        button.classList.add('insufficient');
        setTimeout(() => button.classList.remove('insufficient'), 500);
        return;
    }
    upgrades.wizard++;
    cookies -= newWizardPrice - prices.wizard;
    wizardPrice.textContent = newWizardPrice;
    wizardAmount.textContent = upgrades.wizard;
}

//Space
//Progression : 100%
function spaceAdd(button){
    const newSpacePrice = prices.space + ((upgrades.space + 1) * prices.space);
    if (cookies < (newSpacePrice - prices.space)) {
        button.classList.add('insufficient');
        setTimeout(() => button.classList.remove('insufficient'), 500);
        return;
    }
    upgrades.space++;
    cookies -= newSpacePrice - prices.space;
    spacePrice.textContent = newSpacePrice;
    spaceAmount.textContent = upgrades.space;
}

//Time Machine
//Progression : 100%
function timeMachineAdd(button){
    const newTimeMachinePrice = prices.timeMachine + ((upgrades.timeMachine + 1) * prices.timeMachine);
    if (cookies < (newTimeMachinePrice - prices.timeMachine)) {
        button.classList.add('insufficient');
        setTimeout(() => button.classList.remove('insufficient'), 500);
        return;
    }
    upgrades.timeMachine++;
    cookies -= newTimeMachinePrice - prices.timeMachine;
    timeMachinePrice.textContent = newTimeMachinePrice;
    timeMachineAmount.textContent = upgrades.timeMachine;
}

//Clones
//Progression : 100%
function clonesAdd(button){
    const newClonesPrice = prices.clones + ((upgrades.clones + 1) * prices.clones);
    if (cookies < (newClonesPrice - prices.clones)) {
        button.classList.add('insufficient');
        setTimeout(() => button.classList.remove('insufficient'), 500);
        return;
    }
    upgrades.clones++;
    cookies -= newClonesPrice - prices.clones;
    clonesPrice.textContent = newClonesPrice;
    clonesAmount.textContent = upgrades.clones;
}

//Update module
//Progression : 100%
function update(){
    //Cookies being added
    cookies += (upgrades.clicker * 0.1) +
                (upgrades.nanny * 1) +
                (upgrades.factory * 8) +
                (upgrades.temple * 47) +
                (upgrades.wizard * 260) +
                (upgrades.space * 1400) +
                (upgrades.timeMachine * 7800) +
                (upgrades.clones * 44000);
    
    cookieCount.textContent = cookies.toFixed(1);
}

setInterval(update, 1000) //Runs per second

// Sidebar button functions
function showCredits() {
    window.location.href = 'credits.html';
}

function openLink() {
    window.location.href = '../index.html';
}