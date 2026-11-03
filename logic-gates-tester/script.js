// Store the selected gate and the current input values.
let currentGate = "AND";
let inputA = 0;
let inputB = 0;

// Select a gate, update its button and diagram, then refresh the page.
function selectGate(gateName) {
    currentGate = gateName;

    // Apply the active style to only the selected gate button.
    const gateButtons = document.querySelectorAll(".gate-btn");
    for (let i = 0; i < gateButtons.length; i++) {
        gateButtons[i].classList.remove("active");
    }
    document.getElementById("btn-" + gateName).classList.add("active");

    // Refresh the drawn gate and its accessible description.
    document.getElementById("gateImage").innerHTML = getGatePicture(gateName);
    document.getElementById("gateImage").setAttribute("aria-label", gateName + " gate diagram");

    // Update the lamp, inputs, and table for the selected gate.
    updatePage();
}

// Flip the selected input between zero and one, then refresh the page.
function toggleInput(which) {
    if (which === "A") {
        inputA = inputA === 0 ? 1 : 0;
    } else if (which === "B") {
        inputB = inputB === 0 ? 1 : 0;
    }

    // Recalculate the displayed output and update the truth table.
    updatePage();
}

// Return a simple inline SVG drawing for the selected gate.
function getGatePicture(gateName) {
    // Use SVG paths and lines so the picture needs no external image file.
    const wire = '<path d="M12 32 H52 M12 88 H52" stroke="#50627d" stroke-width="4" fill="none"/>';
    const gateShape = '<path d="M52 22 H88 C150 22 150 98 88 98 H52 Z" stroke="#1F3864" stroke-width="4" fill="#eaf3ff"/>';
    const notShape = '<path d="M52 22 L132 60 L52 98 Z" stroke="#1F3864" stroke-width="4" fill="#eaf3ff"/><circle cx="140" cy="60" r="8" stroke="#1F3864" stroke-width="4" fill="#fff"/>';
    const orShape = '<path d="M52 22 Q82 60 52 98 Q98 98 136 60 Q98 22 52 22 Z" stroke="#1F3864" stroke-width="4" fill="#eaf3ff"/>';
    let drawing = gateShape;

    // Use a different outline for NOT and XOR-family gate diagrams.
    if (gateName === "NOT") {
        drawing = notShape;
    } else if (gateName === "XOR" || gateName === "XNOR") {
        drawing = '<path d="M42 22 Q73 60 42 98 M52 22 Q82 60 52 98 Q98 98 136 60 Q98 22 52 22 Z" stroke="#1F3864" stroke-width="4" fill="#eaf3ff"/>';
        if (gateName === "XNOR") {
            drawing += '<circle cx="148" cy="60" r="8" stroke="#1F3864" stroke-width="4" fill="#fff"/>';
        }
    } else if (gateName === "OR" || gateName === "NOR") {
        drawing = orShape;
        if (gateName === "NOR") {
            drawing += '<circle cx="148" cy="60" r="8" stroke="#1F3864" stroke-width="4" fill="#fff"/>';
        }
    } else if (gateName === "NAND") {
        drawing += '<circle cx="148" cy="60" r="8" stroke="#1F3864" stroke-width="4" fill="#fff"/>';
    }

    // NOT has one input wire; all other gates have two.
    let inputWires = wire;
    if (gateName === "NOT") {
        inputWires = '<path d="M12 60 H52 M148 60 H188" stroke="#50627d" stroke-width="4" fill="none"/>';
    }

    // Draw the output wire after any inversion bubble.
    let outputWire = '<path d="M136 60 H188" stroke="#50627d" stroke-width="4"/>';
    if (gateName === "NOT") {
        outputWire = '<path d="M148 60 H188" stroke="#50627d" stroke-width="4"/>';
    } else if (gateName === "OR" || gateName === "NOR" || gateName === "XOR" || gateName === "XNOR") {
        outputWire = gateName === "NOR" || gateName === "XNOR"
            ? '<path d="M156 60 H188" stroke="#50627d" stroke-width="4"/>'
            : '<path d="M136 60 H188" stroke="#50627d" stroke-width="4"/>';
    } else if (gateName === "NAND") {
        outputWire = '<path d="M156 60 H188" stroke="#50627d" stroke-width="4"/>';
    }

    return '<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        inputWires + drawing + outputWire +
        '<text x="20" y="25" fill="#233047" font-size="14">A</text>' +
        (gateName === "NOT" ? "" : '<text x="20" y="108" fill="#233047" font-size="14">B</text>') +
        '<text x="172" y="52" fill="#233047" font-size="14">Y</text></svg>';
}

// Refresh the input labels, output lamp, and truth table on the page.
function updatePage() {
    // Keep the visible input buttons synchronized with the stored values.
    document.getElementById("inputA").textContent = inputA;
    document.getElementById("inputB").textContent = inputB;

    // NOT gates use only input A, so hide input B and its table column.
    const isNotGate = currentGate === "NOT";
    document.getElementById("inputBContainer").hidden = isNotGate;

    // Get the current output value from the backend gate function.
    const output = getGateOutput(currentGate, inputA, inputB);
    const lamp = document.getElementById("lamp");
    lamp.classList.toggle("lamp-on", output === 1);
    lamp.classList.toggle("lamp-off", output !== 1);
    lamp.setAttribute("aria-label", output === 1 ? "Output is on" : "Output is off");
    document.getElementById("outputText").textContent = "Output: " + output;

    // Get backend table rows and prepare the table elements.
    const rows = buildTruthTable(currentGate);
    const tableHead = document.querySelector("#truthTable thead");
    const tableBody = document.querySelector("#truthTable tbody");
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // Show A and output for NOT, and A, B, and output for other gates.
    const headings = isNotGate ? ["A", "Output"] : ["A", "B", "Output"];
    const headingRow = document.createElement("tr");
    for (let i = 0; i < headings.length; i++) {
        const heading = document.createElement("th");
        heading.textContent = headings[i];
        headingRow.appendChild(heading);
    }
    tableHead.appendChild(headingRow);

    // Add each provided result row and highlight the current input combination.
    let lastNotInput = -1;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // NOT tables contain one row for each A value.
        if (isNotGate && row[0] === lastNotInput) {
            continue;
        }
        if (isNotGate) {
            lastNotInput = row[0];
        }

        const tableRow = document.createElement("tr");
        const isCurrentRow = row[0] === inputA && (isNotGate || row[1] === inputB);
        if (isCurrentRow) {
            tableRow.classList.add("current-row");
        }

        // Omit B from the visible NOT table while keeping the partner's row format unchanged.
        const values = isNotGate ? [row[0], row[2]] : [row[0], row[1], row[2]];
        for (let j = 0; j < values.length; j++) {
            const cell = document.createElement("td");
            cell.textContent = values[j];
            tableRow.appendChild(cell);
        }
        tableBody.appendChild(tableRow);
    }
}

// BACK END - gate logic

// Check that a value is the number zero or the number one.
function isValidBit(x) {
    return x === 0 || x === 1;
}

// Return the AND result as the number zero or one.
function andGate(a, b) {
    if (a === 1 && b === 1) {
        return 1;
    } else {
        return 0;
    }
}

// Return the OR result as the number zero or one.
function orGate(a, b) {
    if (a === 1 || b === 1) {
        return 1;
    } else {
        return 0;
    }
}

// Return the NOT result as the number zero or one.
function notGate(a) {
    if (a === 1) {
        return 0;
    } else {
        return 1;
    }
}

// Return the NAND result by inverting the AND result.
function nandGate(a, b) {
    if (andGate(a, b) === 1) {
        return 0;
    } else {
        return 1;
    }
}

// Return the NOR result by inverting the OR result.
function norGate(a, b) {
    if (orGate(a, b) === 1) {
        return 0;
    } else {
        return 1;
    }
}

// Return one when exactly one input is one.
function xorGate(a, b) {
    if (a !== b) {
        return 1;
    } else {
        return 0;
    }
}

// Return the XNOR result by inverting the XOR result.
function xnorGate(a, b) {
    if (xorGate(a, b) === 1) {
        return 0;
    } else {
        return 1;
    }
}

// Validate the inputs and select the requested gate function.
function getGateOutput(gateName, a, b) {
    // Show an error and return zero if either input is not a valid bit.
    if (!isValidBit(a) || !isValidBit(b)) {
        document.getElementById("errorMsg").textContent = "Inputs must be 0 or 1.";
        return 0;
    }

    // Clear an old input error after receiving valid input values.
    document.getElementById("errorMsg").textContent = "";

    // Return the result from the function for the selected gate.
    switch (gateName) {
        case "AND":
            return andGate(a, b);
        case "OR":
            return orGate(a, b);
        case "NOT":
            return notGate(a);
        case "NAND":
            return nandGate(a, b);
        case "NOR":
            return norGate(a, b);
        case "XOR":
            return xorGate(a, b);
        case "XNOR":
            return xnorGate(a, b);
        default:
            document.getElementById("errorMsg").textContent = "Unknown gate: " + gateName;
            return 0;
    }
}

// Make the selected gate's truth table in [A, B, output] row format.
function buildTruthTable(gateName) {
    // Store each truth table row before returning all rows.
    const rows = [];

    // Check each possible value of input A.
    for (let a = 0; a <= 1; a++) {
        // Check each possible value of input B.
        for (let b = 0; b <= 1; b++) {
            // NOT uses one row per A value, so skip the duplicate A row.
            if (gateName === "NOT" && b === 1) {
                continue;
            }

            // Add each row using the same output function as the live display.
            rows.push([a, b, getGateOutput(gateName, a, b)]);
        }
    }

    // Return two rows for NOT and four rows for every two-input gate.
    return rows;
}

// Run two standard truth-table checks for each gate and report the results.
function runTests() {
    // List 14 expected results from the standard logic-gate truth tables.
    const tests = [
        { gate: "AND", a: 1, b: 1, expected: 1 },
        { gate: "AND", a: 0, b: 1, expected: 0 },
        { gate: "OR", a: 0, b: 0, expected: 0 },
        { gate: "OR", a: 1, b: 0, expected: 1 },
        { gate: "NOT", a: 0, b: 0, expected: 1 },
        { gate: "NOT", a: 1, b: 0, expected: 0 },
        { gate: "NAND", a: 1, b: 1, expected: 0 },
        { gate: "NAND", a: 0, b: 1, expected: 1 },
        { gate: "NOR", a: 0, b: 0, expected: 1 },
        { gate: "NOR", a: 1, b: 0, expected: 0 },
        { gate: "XOR", a: 0, b: 0, expected: 0 },
        { gate: "XOR", a: 1, b: 0, expected: 1 },
        { gate: "XNOR", a: 0, b: 0, expected: 1 },
        { gate: "XNOR", a: 1, b: 0, expected: 0 }
    ];

    // Count each test whose actual result matches its expected result.
    let passed = 0;

    // Run each test and print its inputs, expected result, actual result, and status.
    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const actual = getGateOutput(test.gate, test.a, test.b);
        let status = "FAIL";

        // Mark matching results as passed and increase the total.
        if (actual === test.expected) {
            status = "PASS";
            passed++;
        }

        // Print one line with all information for this test.
        console.log(test.gate + " inputs (" + test.a + ", " + test.b + ")" +
            " expected: " + test.expected + ", actual: " + actual + " - " + status);
    }

    // Print the final number of passing tests out of 14.
    console.log("Tests passed: " + passed + " out of 14");
}

// Draw the initial gate and render the initial page when the script loads.
document.getElementById("gateImage").innerHTML = getGatePicture(currentGate);
updatePage();
