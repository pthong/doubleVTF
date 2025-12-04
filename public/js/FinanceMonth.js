function FinanceMonth({
    startDate = new Date(),
    endDate = new Date(),
    incomes = [],
    fixedCosts = [],
    variableCosts = []
} = {}) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.incomes = incomes;
    this.fixedCosts = fixedCosts;
    this.variableCosts = variableCosts;

    this.log = function () {
        console.log(this);
    };

    this.totalFixedCost = function () {
        const items = Array.isArray(this.fixedCosts) ? this.fixedCosts : [];
        const sum = items.reduce((acc, it) => acc + (Number(it?.amount) || 0), 0);
        return Number(sum.toFixed(2));
    };

    this.totalVariableCost = function () {
        const items = Array.isArray(this.variableCosts) ? this.variableCosts : [];
        const sum = items.reduce((acc, it) => acc + (Number(it?.amount) || 0), 0);
        return Number(sum.toFixed(2));
    };

    this.totalIncome = function () {
        const items = Array.isArray(this.incomes) ? this.incomes : [];
        const sum = items.reduce((acc, it) => acc + (Number(it?.amount) || 0), 0);
        return Number(sum.toFixed(2));
    };

    this.addIncome = function (name, amount) {
        const value = Number(amount) || 0;
        if (!Array.isArray(this.incomes)) this.incomes = [];
        this.incomes.push({ name: String(name), amount: value });
        return this.totalIncome();
    };

    this.addFixedCost = function (name, amount) {
        const value = Number(amount) || 0;
        if (!Array.isArray(this.fixedCosts)) this.fixedCosts = [];
        this.fixedCosts.push({ name: String(name), amount: value });
        return this.totalFixedCost();
    };

    this.addVariableCost = function (name, amount) {
        const value = Number(amount) || 0;
        if (!Array.isArray(this.variableCosts)) this.variableCosts = [];
        this.variableCosts.push({ name: String(name), amount: value });
        return this.totalVariableCost();
    };


    // Remove by index helpers
    this.removeIncome = function (index) {
        if (!Array.isArray(this.incomes)) this.incomes = [];
        if (Number.isInteger(index) && index >= 0 && index < this.incomes.length) {
            this.incomes.splice(index, 1);
        }
        return this.totalIncome();
    };

    this.removeFixedCost = function (index) {
        if (!Array.isArray(this.fixedCosts)) this.fixedCosts = [];
        if (Number.isInteger(index) && index >= 0 && index < this.fixedCosts.length) {
            this.fixedCosts.splice(index, 1);
        }
        return this.totalFixedCost();
    };

    this.removeVariableCost = function (index) {
        if (!Array.isArray(this.variableCosts)) this.variableCosts = [];
        if (Number.isInteger(index) && index >= 0 && index < this.variableCosts.length) {
            this.variableCosts.splice(index, 1);
        }
        return this.totalVariableCost();
    };

    // Generic remover (optional convenience)
    this.removeItem = function (type, index) {
        const key = String(type);
        const map = {
            incomes: () => this.removeIncome(index),
            fixedCosts: () => this.removeFixedCost(index),
            variableCosts: () => this.removeVariableCost(index)
        };
        if (map[key]) return map[key]();
        return 0;
    };

    this.estimatedSavings = function () {
        const incomes = this.totalIncome();
        const fixed = this.totalFixedCost();
        const variable = this.totalVariableCost();
        const savings = incomes - fixed - variable;
        return Number(savings.toFixed(2));
    };

}

